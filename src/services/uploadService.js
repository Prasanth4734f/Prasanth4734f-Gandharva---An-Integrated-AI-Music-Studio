import apiClient from './apiClient';

/**
 * Upload vocal audio and generate a backtrack
 * Handles multipart/form-data for file uploads
 */
export const uploadVocalAndMix = async (fileUri, fileName) => {
  const formData = new FormData();
  formData.append('vocalFile', {
    uri: fileUri,
    name: fileName || 'vocal_recording.mp4',
    type: 'audio/m4a', // Default for Expo recording
  });

  // Note: apiClient needs to handle FormData differently (no Content-Type header)
  // For simplicity here, we use a separate fetch call or update apiClient
  // I'll use a direct fetch here to avoid breaking the generic apiClient JSON logic
  
  // Actually, I'll update apiClient to support FormData or just use it here.
  // Let's use it here for clarity.
  
  const BASE_URL = 'http://localhost:3000'; // Fallback to local if config fails
  const API_URL = '/api/vocal-upload';

  // For now, let's keep it simple and just use the same pattern
  return await apiClient('/vocal-upload', {
    method: 'POST',
    // FormData doesn't need Content-Type JSON, fetch handles it
    headers: {}, 
    body: formData,
  });
};
