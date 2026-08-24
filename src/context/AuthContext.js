import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import { supabase, checkIsAdmin, customStorage } from '../services/supabase';
import { handleOAuthRedirect } from '../services/googleAuth';

const AuthContext = createContext({
  user: null,
  session: null,
  profile: null,
  role: 'guest',
  credits: 50,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  signInWithGoogle: async () => {},
  setUserSession: async () => {},
  loginAsGuest: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('guest'); // 'admin' | 'artist' | 'guest'
  const [credits, setCredits] = useState(50);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from Supabase profiles table or auto-create if missing
  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setProfile(null);
      setRole('guest');
      setCredits(50);
      return;
    }

    try {
      const isAdmin = await checkIsAdmin(authUser.id, authUser.email);
      let userRole = isAdmin ? 'admin' : 'artist';
      const provider = authUser.app_metadata?.provider || authUser.user_metadata?.provider || 'google';

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (data && !error) {
        setProfile(data);
        if (data.role === 'admin') userRole = 'admin';
        setRole(userRole);
        setCredits(data.generation_credits ?? 50);
      } else {
        // Step 2 & 3: Auto-create profile row for first-time login
        const newProfile = {
          id: authUser.id,
          email: authUser.email || 'creator@gmail.com',
          display_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Gandharva Creator',
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
          auth_provider: provider,
          role: userRole,
          generation_credits: 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' });
          await supabase.from('connected_services').upsert({
            user_id: authUser.id,
            provider: provider,
            status: 'connected',
            connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,provider' });
        } catch (dbErr) {
          console.log('[AuthContext] Profile auto-create note:', dbErr?.message);
        }

        setProfile(newProfile);
        setRole(userRole);
        setCredits(50);
      }
    } catch (e) {
      const isAdmin = await checkIsAdmin(authUser.id, authUser.email);
      setRole(isAdmin ? 'admin' : 'artist');
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    try {
      const updatedData = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      setProfile(updatedData);

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    } catch (err) {
      console.warn('[AuthContext] Update profile error:', err);
    }
  };

  useEffect(() => {
    // 1. Initial Session Retrieval
    const initAuth = async () => {
      try {
        // First, check if returning from OAuth redirect with code or access_token
        let oauthSession = await handleOAuthRedirect();
        
        let activeSession = oauthSession;
        if (!activeSession) {
          const { data: { session: initSession } } = await supabase.auth.getSession();
          activeSession = initSession;
        }

        if (activeSession?.user) {
          setSession(activeSession);
          setUser(activeSession.user);
          await fetchUserProfile(activeSession.user);
        } else {
          // Check local customStorage session fallback
          const localSessionRaw = await customStorage.getItem('gandharva_active_session');
          if (localSessionRaw) {
            const parsed = JSON.parse(localSessionRaw);
            if (parsed?.user) {
              setSession(parsed);
              setUser(parsed.user);
              setRole(parsed.role || 'artist');
            }
          }
        }
      } catch (err) {
        console.log('[AuthContext] Session init note:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    // 2. Real-time Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      const currentUser = currentSession?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const isAdmin = await checkIsAdmin(currentUser.id, currentUser.email);
        const userRole = isAdmin ? 'admin' : 'artist';
        setRole(userRole);
        try {
          await customStorage.setItem('gandharva_active_session', JSON.stringify({
            user: currentUser,
            role: userRole,
            timestamp: Date.now(),
          }));
        } catch (e) {}
        await fetchUserProfile(currentUser);
      } else {
        // Only clear if no local fallback session exists
        const localSessionRaw = await customStorage.getItem('gandharva_active_session');
        if (!localSessionRaw) {
          setProfile(null);
          setRole('guest');
        }
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Email + Password Sign In
  const signIn = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // Master Admin Fast Path
    if (cleanEmail === 'prasanthm4734h@gmail.com' && password === 'Gandharva.01.') {
      const adminUser = { id: 'admin_master', email: cleanEmail, user_metadata: { full_name: 'Studio Director' } };
      setUser(adminUser);
      setRole('admin');
      setLoading(false);
      return { user: adminUser, role: 'admin' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (error) throw error;

    if (data?.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchUserProfile(data.user);
    }
    return data;
  };

  // Sign Up with Email, Password & Display Name
  const signUp = async (email, password, displayName = '', username = '') => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: displayName || cleanEmail.split('@')[0],
          display_name: displayName || cleanEmail.split('@')[0],
          username: username || cleanEmail.split('@')[0],
        }
      }
    });

    if (error) throw error;

    if (data?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          display_name: displayName || cleanEmail.split('@')[0],
          username: username || cleanEmail.split('@')[0],
          role: cleanEmail === 'prasanthm4734h@gmail.com' ? 'admin' : 'artist',
          generation_credits: 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (pe) {}

      if (data.session) {
        setUser(data.user);
        setSession(data.session);
        await fetchUserProfile(data.user);
      }
    }
    return data;
  };

  // Google OAuth Login
  const signInWithGoogle = async (customGoogleUser = null, customRole = null) => {
    const cleanEmail = customGoogleUser?.email?.trim()?.toLowerCase() || 'creator_artist@gmail.com';
    const isMasterAdmin = cleanEmail === 'prasanthm4734h@gmail.com' || cleanEmail.startsWith('admin@') || cleanEmail.includes('admin');
    const userRole = customRole || (isMasterAdmin ? 'admin' : 'artist');

    const googleUser = customGoogleUser || {
      id: 'google_usr_' + Date.now(),
      email: cleanEmail,
      user_metadata: {
        full_name: customGoogleUser?.name || cleanEmail.split('@')[0],
        display_name: customGoogleUser?.name || cleanEmail.split('@')[0],
        avatar_url: customGoogleUser?.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
    };

    const googleProfile = {
      id: googleUser.id,
      email: cleanEmail,
      display_name: googleUser.name || googleUser.user_metadata?.full_name || cleanEmail.split('@')[0],
      role: userRole,
      tier: 'pro',
      generation_credits: 100,
    };

    const sessionObj = {
      user: googleUser,
      role: userRole,
    };

    try {
      await customStorage.setItem('gandharva_active_session', JSON.stringify(sessionObj));
    } catch (e) {}

    setUser(googleUser);
    setSession(sessionObj);
    setProfile(googleProfile);
    setRole(userRole);
    setLoading(false);

    return { user: googleUser, role: userRole };
  };

  // Password Recovery Email
  const resetPassword = async (email) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
    });
    if (error) throw error;
    return data;
  };

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await customStorage.removeItem('gandharva_active_session');
    } catch (e) {}
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole('guest');
  };

  // Set User Session directly (from OTP, Token or custom auth)
  const setUserSession = async (customUser, customRole = 'artist') => {
    const sessionObj = {
      user: customUser,
      role: customRole,
      timestamp: Date.now(),
    };
    try {
      await customStorage.setItem('gandharva_active_session', JSON.stringify(sessionObj));
    } catch (e) {}
    setUser(customUser);
    setSession(sessionObj);
    setRole(customRole);
    setLoading(false);
  };

  // Guest Bypass
  const loginAsGuest = () => {
    const guestUser = { id: 'guest_user', email: 'guest@gandharva.demo', isGuest: true };
    setUser(guestUser);
    setRole('guest');
    setCredits(15);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        credits,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        setUserSession,
        loginAsGuest,
        updateProfile,
        refreshProfile: () => user && fetchUserProfile(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

