import * as FileSystem from 'expo-file-system';
import CONFIG from '../config/api.config';

/**
 * Returns the local filename for a given remote audio URL
 */
export const getLocalFilename = (audioUrl) => {
  if (!audioUrl || typeof audioUrl !== 'string') return null;
  return audioUrl.split('/').pop().split('?')[0];
};

/**
 * Returns the local file path (URI) for a remote audio URL
 */
export const getLocalUri = (audioUrl) => {
  if (!audioUrl || typeof audioUrl !== 'string') return null;
  const filename = getLocalFilename(audioUrl);
  if (!filename) return null;
  return `${FileSystem.documentDirectory}${filename}`;
};

/**
 * Checks if an audio track is cached locally on the device.
 * Returns the local URI if cached, or null.
 */
export const getCachedUri = async (audioUrl) => {
  try {
    if (!audioUrl || typeof audioUrl !== 'string') return null;
    if (audioUrl.startsWith('blob:') || audioUrl.startsWith('data:') || audioUrl.startsWith('file:')) {
      return audioUrl;
    }
    const localUri = getLocalUri(audioUrl);
    if (!localUri) return null;
    
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists) {
      return localUri;
    }
  } catch (err) {
    console.warn('[AudioCache] Check failed', err);
  }
  return null;
};

/**
 * Downloads a remote audio track to local device storage.
 * Returns the local URI.
 */
export const cacheAudioTrack = async (audioUrl) => {
  try {
    if (!audioUrl || typeof audioUrl !== 'string') return null;
    const localUri = getLocalUri(audioUrl);
    if (!localUri) return null;
    
    // Check if already exists
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists) {
      return localUri;
    }
    
    // Remote URL formatting
    const targetUrl = audioUrl.startsWith('http') ? audioUrl : `${CONFIG.BASE_URL}${audioUrl}`;
    console.log(`[AudioCache] Downloading track to cache: ${targetUrl} -> ${localUri}`);
    
    const { uri } = await FileSystem.downloadAsync(targetUrl, localUri);
    return uri;
  } catch (err) {
    console.warn('[AudioCache] Download failed', err);
    return null;
  }
};

/**
 * Returns the correct playback URI (local if cached, remote fallback)
 */
export const getPlaybackUri = async (audioUrl) => {
  if (!audioUrl || typeof audioUrl !== 'string') return null;
  if (audioUrl.startsWith('blob:') || audioUrl.startsWith('data:') || audioUrl.startsWith('file:')) {
    return audioUrl;
  }
  
  // Try local cache first
  const cachedUri = await getCachedUri(audioUrl);
  if (cachedUri) {
    console.log(`[AudioCache] Cache hit: ${cachedUri}`);
    return cachedUri;
  }
  
  // Fallback to remote URL
  const targetUrl = audioUrl.startsWith('http') ? audioUrl : `${CONFIG.BASE_URL}${audioUrl}`;
  console.log(`[AudioCache] Cache miss, using remote URL: ${targetUrl}`);
  return targetUrl;
};
