import { Platform } from 'react-native';
import { supabase, customStorage, saveLocalUser, getServerBaseUrl } from './supabase';

const getApiBase = () => `${getServerBaseUrl()}/api`;

/**
 * Parses and decodes a JWT ID Token payload (client-side base64 decode)
 */
export const decodeJwtResponse = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

/**
 * Handles OAuth callback when redirected back from Google / Supabase
 */
export const handleOAuthRedirect = async () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      // 1. Check if Supabase already extracted the session from URL
      const { data: currentData } = await supabase.auth.getSession();
      let session = currentData?.session;

      if (!session) {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        const code = url.searchParams.get('code');
        const hash = url.hash.startsWith('#') ? url.hash.substring(1) : url.hash;
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error && data?.session) {
            session = data.session;
          }
        } else if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error && data?.session) {
            session = data.session;
          }
        }
      }

      if (session?.user) {
        const cleanEmail = session.user.email?.toLowerCase() || '';
        const role = (cleanEmail === 'prasanthm4734h@gmail.com' || cleanEmail.startsWith('admin@') || cleanEmail.includes('admin'))
          ? 'admin'
          : 'artist';

        const userObj = {
          id: session.user.id,
          email: cleanEmail,
          name: session.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url || null,
          role: role,
        };

        await saveLocalUser(userObj);
        await customStorage.setItem('gandharva_active_session', JSON.stringify({
          user: userObj,
          role: role,
          timestamp: Date.now()
        }));

        // Clean up URL parameters
        try {
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (e) {}

        return session;
      }
    } catch (err) {
      console.warn('OAuth redirect exchange error:', err);
    }
  }
  return null;
};

/**
 * Public Production Google Sign-In Handler
 * Connects directly to Google Cloud OAuth via Supabase Client
 */
export const signInWithGoogle = async () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const redirectUrl = window.location.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        console.warn('[Supabase Google OAuth] Direct trigger warning:', error.message);
        return { success: false, requireModal: true, error: error.message };
      }
      return { success: true, redirected: true, data };
    } catch (e) {
      console.warn('[Supabase Google OAuth] Error triggering cloud OAuth:', e.message);
      return { success: false, requireModal: true, error: e.message };
    }
  }
  return { success: true, requireModal: true };
};

/**
 * Complete Google User Login on Backend and Local Storage
 */
export const finalizeGoogleLogin = async ({ email, name, picture, sub }) => {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const displayName = name || cleanEmail.split('@')[0];

    // 1. Call Backend Google Auth Endpoint
    const res = await fetch(`${getApiBase()}/auth/google-signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, name: displayName, picture, sub }),
    });

    const data = await res.json();
    if (data.success) {
      // 2. Persist local user & session
      await saveLocalUser(data.user);
      await customStorage.setItem('gandharva_active_session', JSON.stringify({
        user: data.user,
        role: data.role,
        timestamp: Date.now()
      }));

      return {
        success: true,
        user: data.user,
        role: data.role
      };
    } else {
      return { success: false, error: data.error || 'Google login failed' };
    }
  } catch (err) {
    console.error('finalizeGoogleLogin error:', err);
    // Offline / local fallback
    const cleanEmail = email.trim().toLowerCase();
    const role = (cleanEmail === 'prasanthm4734h@gmail.com' || cleanEmail.includes('admin')) ? 'admin' : 'artist';
    const fallbackUser = {
      id: sub || `google_${Date.now()}`,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      provider: 'google',
      role
    };

    await saveLocalUser(fallbackUser);
    await customStorage.setItem('gandharva_active_session', JSON.stringify({
      user: fallbackUser,
      role,
      timestamp: Date.now()
    }));

    return {
      success: true,
      user: fallbackUser,
      role
    };
  }
};
