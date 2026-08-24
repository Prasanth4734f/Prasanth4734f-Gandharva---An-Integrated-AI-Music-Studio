import apiClient from './apiClient';

/**
 * Album Service SDK for Story to Album (Album Builder)
 */

/**
 * Stage 1: Analyze Story using Narrative Intelligence Engine (NIE)
 */
export const analyzeStory = async (story, language = 'English', numLyrics = 5, numBgms = 10, preferredGenre = '') => {
  return await apiClient('/album/analyze', {
    method: 'POST',
    body: JSON.stringify({
      story,
      language,
      numLyrics,
      numBgms,
      preferredGenre
    })
  });
};

/**
 * Stage 2: Start Album Generation Engine (AGE) Job
 */
export const createAlbumJob = async (blueprint) => {
  return await apiClient('/album/create', {
    method: 'POST',
    body: JSON.stringify({ blueprint })
  });
};

/**
 * Poll AGE Job Status (0-100%)
 */
export const getJobStatus = async (jobId) => {
  return await apiClient(`/job/${jobId}`, {
    method: 'GET'
  });
};

/**
 * Fetch Completed Album Details
 */
export const getAlbum = async (albumId) => {
  return await apiClient(`/album/${albumId}`, {
    method: 'GET'
  });
};

/**
 * Regenerate Single Track
 */
export const regenerateTrack = async (albumId, trackId) => {
  return await apiClient(`/album/${albumId}/regenerate-track`, {
    method: 'POST',
    body: JSON.stringify({ trackId })
  });
};

/**
 * Regenerate Cover Art
 */
export const regenerateCover = async (albumId) => {
  return await apiClient(`/album/${albumId}/regenerate-cover`, {
    method: 'POST'
  });
};
