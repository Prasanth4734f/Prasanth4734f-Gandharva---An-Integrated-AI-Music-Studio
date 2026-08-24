import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getServerBaseUrl = () => {
  // 1. Web browser: Use current hostname
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:3000`;
  }
  // 2. Dynamic Expo hostUri (auto-detects PC LAN IP on physical mobile devices)
  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.expoGoConfig?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'undefined' && !ip.includes('ngrok') && !ip.includes('expo')) {
        return `http://${ip}:3000`;
      }
    }
  } catch (e) {}
  // 3. EXPO_PUBLIC_API_URL if set
  if (process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // 4. Default active LAN IP
  return 'http://192.168.1.16:3000';
};

const SUPABASE_URL = "https://ooojsesybzkjlaylxiij.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vb2pzZXN5YnpramxheWx4aWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MzE4ODEsImV4cCI6MjA5NjIwNzg4MX0.G74IXhK2EVJYtSfx27nV6HNQtBas99ClUn2YqP1AcrM";

// Custom Cross-Platform Storage Adapter for Web & Mobile
export const customStorage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {}
  },
  removeItem: async (key) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {}
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  }
});

// Helper function to check if a user is an admin by userId or email ID
export const checkIsAdmin = async (userId, userEmail = '') => {
  const ADMIN_EMAILS = [
    'admin@gandharva.com',
    'admin@gandharvasound.com',
    'admin@studio.com',
    'prasanthm4734h@gmail.com'
  ];

  if (userEmail) {
    const cleanEmail = userEmail.trim().toLowerCase();
    if (ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.startsWith('admin@')) {
      return true;
    }
  }

  if (!userId) return false;
  
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (data && !error) {
      return true;
    }
  } catch (error) {
    // console.log('Exception checking admin status:', error);
  }

  return false;
};

// Local storage helper for resilient real-time registration
const LOCAL_USERS_KEY = 'gandharva_registered_users_db';
const LOCAL_SESSION_KEY = 'gandharva_active_session';

export const getLocalUsers = async () => {
  try {
    const raw = await customStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveLocalUser = async (userObj) => {
  try {
    const users = await getLocalUsers();
    const index = users.findIndex(u => u.email.toLowerCase() === userObj.email.toLowerCase());
    if (index >= 0) {
      users[index] = { ...users[index], ...userObj };
    } else {
      users.push(userObj);
    }
    await customStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('saveLocalUser error:', e);
  }
};

// Unified Resilient Register User Service
export const registerUser = async (email, password, fullName = '') => {
  const cleanEmail = email.trim().toLowerCase();
  const userName = fullName.trim() || cleanEmail.split('@')[0];
  const role = (cleanEmail === 'prasanthm4734h@gmail.com' || cleanEmail.startsWith('admin@')) ? 'admin' : 'artist';
  const userId = 'usr_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();

  const localUser = {
    id: userId,
    email: cleanEmail,
    password: password,
    full_name: userName,
    role: role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 1. Always save to local database immediately
  await saveLocalUser(localUser);

  const sessionObj = {
    user: {
      id: userId,
      email: cleanEmail,
      user_metadata: { full_name: userName },
    },
    role: role,
  };
  await customStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionObj));

  // 2. Try Supabase cloud register in background
  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: { data: { full_name: userName } }
    });

    if (data?.user) {
      localUser.id = data.user.id;
      await saveLocalUser(localUser);
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: cleanEmail,
          full_name: userName,
          role: role,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (pe) {}
    }
  } catch (cloudErr) {
    console.log('[Supabase Cloud Offline] Registered locally:', cleanEmail);
  }

  return { success: true, user: localUser, session: sessionObj };
};

// Unified Resilient Sign In User Service
export const authenticateUser = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Direct Admin Verification
  if (cleanEmail === 'prasanthm4734h@gmail.com' && password === 'Gandharva.01.') {
    const adminSession = {
      user: { id: 'admin_master', email: cleanEmail, user_metadata: { full_name: 'Studio Director' } },
      role: 'admin',
    };
    await customStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(adminSession));
    return { success: true, user: adminSession.user, role: 'admin' };
  }

  // 2. Try Supabase Cloud Sign In
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password,
    });

    if (data?.session?.user && !error) {
      const user = data.session.user;
      const isAdmin = await checkIsAdmin(user.id, user.email);
      const sessionObj = { user, role: isAdmin ? 'admin' : 'artist' };
      await customStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionObj));
      return { success: true, user, role: sessionObj.role };
    }
  } catch (e) {
    console.log('[Supabase Cloud Offline] Attempting local verification...');
  }

  // 3. Check Local Registered Users Database
  const localUsers = await getLocalUsers();
  const foundUser = localUsers.find(u => u.email.toLowerCase() === cleanEmail);

  if (foundUser) {
    if (foundUser.password === password) {
      const sessionObj = {
        user: {
          id: foundUser.id,
          email: foundUser.email,
          user_metadata: { full_name: foundUser.full_name },
        },
        role: foundUser.role || 'artist',
      };
      await customStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionObj));
      return { success: true, user: sessionObj.user, role: sessionObj.role };
    } else {
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }
  }

  return { success: false, error: 'User not found. Please register as a new user.' };
};

// Local in-memory OTP verification code cache
const activeOtpCodes = new Map();

// 1. Send Email Verification Code (OTP) to User's Mail
// 1. Send Authentic Email Verification Code (OTP) to User's Gmail
export const sendEmailVerificationCode = async (email, name = '') => {
  const cleanEmail = email.trim().toLowerCase();
  const baseUrl = getServerBaseUrl();

  // 1. Dispatch through Node.js Gmail SMTP Backend
  try {
    const response = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, name })
    });

    const data = await response.json();
    if (data.success) {
      console.log(`[Email Dispatch] Real OTP email dispatched to ${cleanEmail}`);
      return { success: true, email: cleanEmail };
    } else {
      throw new Error(data.error || 'Failed to dispatch verification email');
    }
  } catch (backendErr) {
    console.error('[Email Dispatch Error]:', backendErr.message);
    // Also attempt Supabase direct OTP as secondary fallback
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: { shouldCreateUser: true }
      });
      if (!error) {
        return { success: true, email: cleanEmail };
      }
    } catch (e) {}

    throw new Error(backendErr.message || 'Unable to send verification code. Please check your internet connection.');
  }
};

// 2. Verify Authentic Email OTP Code Received in Gmail
export const verifyEmailVerificationCode = async (email, enteredCode, fullName = '') => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = (enteredCode || '').trim();
  const baseUrl = getServerBaseUrl();

  // 1. Verify with Backend OTP Service
  try {
    const response = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: cleanCode, name: fullName })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      const userName = fullName.trim() || cleanEmail.split('@')[0];
      const result = await registerUser(cleanEmail, 'OTP_Verified_Session_2026', userName);
      return { success: true, user: result.user, role: data.role || result.user.role, session: result.session };
    } else if (data.error) {
      return { success: false, error: data.error };
    }
  } catch (beErr) {
    console.log(`[Backend Verify Note] ${beErr.message}`);
  }

  // 2. Try Supabase OTP verification
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanCode,
      type: 'email'
    });
    if (data?.session && !error) {
      const userName = fullName.trim() || cleanEmail.split('@')[0];
      const result = await registerUser(cleanEmail, 'OTP_Verified_Session_2026', userName);
      return { success: true, user: result.user, role: result.user.role, session: result.session };
    }
  } catch (e) {}

  return { success: false, error: 'Incorrect verification code. Please check the code sent to your Gmail inbox.' };
};

// 3. Realtime Google OAuth Sign In (redirects to Google Accounts chooser with consent prompt)
export const signInWithGoogleOAuth = async () => {
  const redirectUrl = Platform.OS === 'web' && typeof window !== 'undefined' 
    ? window.location.origin 
    : undefined;

  try {
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
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.warn('[Google OAuth]:', err.message);
    // If Supabase OAuth provider is not configured in dashboard, open Google Accounts directly
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open('https://accounts.google.com/signin/v2/usernamerecovery', '_blank');
    }
    throw err;
  }
};


