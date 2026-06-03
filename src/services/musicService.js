import apiClient from './apiClient';

/**
 * Generate music based on a text prompt and optional variations count
 * @param {string} prompt 
 * @param {number} duration 
 * @param {number} numVariations Number of tracks to generate (1 to 3)
 */
export const generateMusic = async (prompt, duration = 10, numVariations = 1) => {
  return await apiClient('/generate-music', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      duration,
      num_variations: numVariations,
    }),
  });
};

/**
 * Perform a quick connection check to verify if the external GPU backend is reachable
 */
export const checkMusicGenHealth = async () => {
  return await apiClient(`/musicgen-health?t=${Date.now()}`, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
};
