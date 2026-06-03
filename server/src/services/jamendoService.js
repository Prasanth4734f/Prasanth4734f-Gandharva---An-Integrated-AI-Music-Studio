/**
 * jamendoService.js - Version 5.0 (Guaranteed Variety)
 */
const axios = require('axios');
const logger = require('../utils/logger');

// Using multiple rotation IDs for better reliability
const CLIENT_IDS = ['56d30c11', 'b6747d04', '6e9f5e1b'];
let currentIdIdx = 0;

const searchJamendo = async (tags) => {
  const cid = CLIENT_IDS[currentIdIdx];
  currentIdIdx = (currentIdIdx + 1) % CLIENT_IDS.length;

  // Level 1: Try Specific Prompt Search (using namesearch for better results)
  const query = tags.slice(0, 2).join(' ');
  try {
    const URL = `https://api.jamendo.com/v3.0/tracks/?client_id=${cid}&format=json&limit=20&namesearch=${encodeURIComponent(query)}&include=musicinfo&order=relevance`;
    logger.info(`[v5.0 Jamendo] Search: "${query}"`);
    
    const res = await axios.get(URL, { timeout: 6000 });
    if (res.data.results && res.data.results.length > 0) {
      const track = res.data.results[Math.floor(Math.random() * res.data.results.length)];
      logger.info(`[v5.0 Jamendo] SUCCESS: Found "${track.name}"`);
      return { title: track.name, audioUrl: track.audio };
    }
  } catch (err) {
    logger.warn(`[v5.0 Jamendo] Search failed for "${query}"`);
  }

  // Level 2: GLOBAL RANDOM FALLBACK (Ensures different music even if search fails)
  try {
    logger.info(`[v5.0 Jamendo] Search failed. Fetching Global Random Track...`);
    const RANDOM_URL = `https://api.jamendo.com/v3.0/tracks/?client_id=${cid}&format=json&limit=50&order=random&boost=popularity`;
    const res = await axios.get(RANDOM_URL, { timeout: 6000 });
    if (res.data.results && res.data.results.length > 0) {
      const track = res.data.results[Math.floor(Math.random() * res.data.results.length)];
      logger.info(`[v5.0 Jamendo] GLOBAL RANDOM SUCCESS: "${track.name}"`);
      return { title: track.name, audioUrl: track.audio };
    }
  } catch (err) {
    logger.error(`[v5.0 Jamendo] Global Random failed: ${err.message}`);
  }

  return null;
};

module.exports = { searchJamendo };
