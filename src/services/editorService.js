import apiClient from './apiClient';

/**
 * Send editing request to backend audio processor
 * @param {object} payload 
 * @returns {promise<object>}
 */
export const editMusic = async (payload) => {
  return await apiClient.post('/edit-music', payload);
};

/**
 * Fetch waveform peaks array from server for real visualization
 * @param {string} audioUrl 
 * @returns {promise<object>}
 */
export const getWaveform = async (audioUrl) => {
  return await apiClient.post('/waveform', { audioUrl });
};

