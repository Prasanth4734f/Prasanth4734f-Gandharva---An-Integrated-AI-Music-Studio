/**
 * preferencesService.js
 * Production-ready User Preferences Service backed by Supabase PostgreSQL (Source of Truth)
 * with optimistic local caching in AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const PREFS_STORAGE_KEY = '@gandharva_user_preferences_v1';

export const DEFAULT_PREFERENCES = {
  audio_format: 'mp3_320', // 'mp3_320' | 'wav_24'
  lyrics_language: 'te',    // 'te' (Telugu - Production Default) | 'hi' | 'ta' | 'en'
  notifications_enabled: true,
};

export const LANGUAGE_LABELS = {
  te: 'Telugu 🇮🇳',
  hi: 'Hindi',
  ta: 'Tamil',
  en: 'English',
};

export const AUDIO_FORMAT_LABELS = {
  mp3_320: 'High MP3 (320 kbps)',
  wav_24: 'Uncompressed WAV (24-bit)',
};

/**
 * Fetch User Preferences from Supabase with Local Cache Fallback
 */
export const getUserPreferences = async (userId) => {
  let localPrefs = { ...DEFAULT_PREFERENCES };

  try {
    const cached = await AsyncStorage.getItem(PREFS_STORAGE_KEY);
    if (cached) {
      localPrefs = { ...localPrefs, ...JSON.parse(cached) };
    }
  } catch (e) {}

  if (!userId || userId === 'guest_user') {
    return localPrefs;
  }

  try {
    if (supabase && typeof supabase.from === 'function') {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        const merged = { ...localPrefs, ...data };
        await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      } else if (error && error.code === 'PGRST116') {
        // Row doesn't exist yet -> insert default preferences
        await supabase
          .from('user_preferences')
          .insert([{ user_id: userId, ...DEFAULT_PREFERENCES }]);
      }
    }
  } catch (err) {
    console.log('[Preferences] Using cached local preferences:', err?.message);
  }

  return localPrefs;
};

/**
 * Update User Preferences in Supabase and Local Cache
 */
export const saveUserPreferences = async (userId, updates = {}) => {
  try {
    const current = await getUserPreferences(userId);
    const updated = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // 1. Optimistic Local Cache Update
    await AsyncStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));

    // 2. Persist to Supabase if logged in
    if (userId && userId !== 'guest_user' && supabase && typeof supabase.from === 'function') {
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...updates,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }

    return updated;
  } catch (err) {
    console.warn('[Preferences] Update error:', err?.message);
    return updates;
  }
};
