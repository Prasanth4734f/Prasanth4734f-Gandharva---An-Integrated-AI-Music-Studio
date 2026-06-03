import apiClient from './apiClient';

/**
 * Generate 3 lyric draft variations based on a prompt and configuration
 */
export const generateLyrics = async (prompt, genre = 'Pop', mood = 'Melancholic', language = 'English', model_preference = 'auto') => {
  return await apiClient('/generate-lyrics', {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      genre,
      mood,
      language,
      model_preference
    }),
  });
};

/**
 * Fetch all saved projects from the SQLite database
 */
export const getProjects = async () => {
  return await apiClient('/projects', {
    method: 'GET',
  });
};

/**
 * Delete a saved project and all associated files from the database
 */
export const deleteProject = async (projectId) => {
  return await apiClient(`/projects/${projectId}`, {
    method: 'DELETE',
  });
};
