/**
 * tagExtractionService.js
 * Advanced Semantic Prompt Understanding for Gandharva AI.
 */
const logger = require('../utils/logger');

// Mapping natural language concepts to technical musical genres and fallback categories
const SEMANTIC_MAP = {
  // Moods & Emotions
  calm: { tags: ['ambient', 'chillout'], fallback: 'ambient' },
  peaceful: { tags: ['ambient', 'relaxing'], fallback: 'meditation' },
  sad: { tags: ['melancholic', 'piano'], fallback: 'piano' },
  romantic: { tags: ['cinematic', 'piano'], fallback: 'piano' },
  happy: { tags: ['upbeat', 'pop'], fallback: 'chill' },
  energetic: { tags: ['fast', 'electronic'], fallback: 'gaming' },
  epic: { tags: ['cinematic', 'orchestral'], fallback: 'cinematic' },
  
  // Environments
  forest: { tags: ['nature', 'ambient'], fallback: 'meditation' },
  midnight: { tags: ['dark', 'ambient'], fallback: 'ambient' },
  space: { tags: ['cosmic', 'synth'], fallback: 'cinematic' },
  stars: { tags: ['dreamy', 'piano'], fallback: 'piano' },
  rain: { tags: ['rain', 'ambient'], fallback: 'meditation' },
  
  // Activities
  meditation: { tags: ['meditation', 'zen'], fallback: 'meditation' },
  gaming: { tags: ['electronic', 'synthwave'], fallback: 'gaming' },
  coding: { tags: ['lofi', 'focus'], fallback: 'chill' },
  focus: { tags: ['ambient', 'downtempo'], fallback: 'chill' },
  battle: { tags: ['epic', 'orchestral'], fallback: 'cinematic' },
  gym: { tags: ['workout', 'hard'], fallback: 'gaming' },
  
  // Genres
  lofi: { tags: ['lofi', 'chillhop'], fallback: 'chill' },
  cyberpunk: { tags: ['synthwave', 'techno'], fallback: 'gaming' },
};

/**
 * Performs semantic analysis of the prompt.
 * @param {string} prompt 
 * @returns {Object} { tags: string[], fallbackCategory: string }
 */
const analyzePrompt = (prompt) => {
  logger.info(`[Brain] Understanding user mood and context...`);
  
  const words = prompt.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  const tags = new Set();
  let detectedFallback = 'chill'; // Default fallback

  words.forEach(word => {
    if (SEMANTIC_MAP[word]) {
      SEMANTIC_MAP[word].tags.forEach(t => tags.add(t));
      detectedFallback = SEMANTIC_MAP[word].fallback;
    }
  });

  // If no semantic match, try word-based tags
  if (tags.size === 0) {
    words.forEach(word => {
      if (word.length > 3) tags.add(word);
    });
  }

  const result = {
    tags: Array.from(tags).slice(0, 3), // Limit to 3 strong tags for better API accuracy
    fallbackCategory: detectedFallback
  };

  logger.info(`[Brain] Mapping emotional context: ${result.tags.join(', ')}`);
  logger.info(`[Brain] Smart Fallback assigned: ${result.fallbackCategory}`);
  
  return result;
};

module.exports = { analyzePrompt };
