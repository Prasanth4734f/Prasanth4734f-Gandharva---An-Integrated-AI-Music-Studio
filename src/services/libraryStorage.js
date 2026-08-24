import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const STORAGE_KEY = '@gandharva_library_projects_v2';

/**
 * Get all saved projects from AsyncStorage & Supabase Cloud
 */
export const getSavedProjects = async () => {
  let localProjects = [];
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      localProjects = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[LibraryStorage] Failed to read local storage:', e);
  }

  // Try fetching from Supabase if online
  try {
    const { data: cloudProjects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (cloudProjects && cloudProjects.length > 0) {
      // Merge cloud and local projects without duplicates
      const map = new Map();
      localProjects.forEach(p => map.set(p.id, p));
      cloudProjects.forEach(p => map.set(p.id, p));
      const merged = Array.from(map.values()).sort((a, b) => 
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      // Update local cache
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (e) {
    console.log('[LibraryStorage] Cloud sync skipped/offline');
  }

  return localProjects;
};

/**
 * Save a new project (Music, Lyrics, or Recording) to local storage & Supabase
 */
export const saveProjectToLibrary = async (project) => {
  const newProj = {
    id: project.id || `proj-${Date.now()}`,
    name: project.name || project.title || 'Untitled Composition',
    genre: project.genre || 'Ambient',
    mood: project.mood || 'Creative',
    prompt: project.prompt || '',
    music: project.music || (project.audio_url ? [{ audio_url: project.audio_url, variation_name: 'Main Track' }] : []),
    lyrics: project.lyrics || (project.lyrics_text ? [{ lyrics_text: project.lyrics_text, title: project.name }] : []),
    recordings: project.recordings || [],
    created_at: project.created_at || new Date().toISOString(),
  };

  // 1. Save to Local Storage immediately
  try {
    const existing = await getSavedProjects();
    const updated = [newProj, ...existing.filter(p => p.id !== newProj.id)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('[LibraryStorage] Failed to write local storage:', e);
  }

  // 2. Try saving to Supabase Cloud
  try {
    await supabase.from('projects').insert([{
      id: newProj.id,
      name: newProj.name,
      genre: newProj.genre,
      mood: newProj.mood,
      prompt: newProj.prompt,
      created_at: newProj.created_at
    }]);
  } catch (e) {
    console.log('[LibraryStorage] Supabase insert skipped/offline');
  }

  return newProj;
};

/**
 * Delete a project from local storage & Supabase
 */
export const deleteProjectFromLibrary = async (projectId) => {
  try {
    const existing = await getSavedProjects();
    const filtered = existing.filter(p => p.id !== projectId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('[LibraryStorage] Failed to delete local item:', e);
  }

  try {
    await supabase.from('projects').delete().eq('id', projectId);
  } catch (e) {
    console.log('[LibraryStorage] Supabase delete skipped');
  }
};
