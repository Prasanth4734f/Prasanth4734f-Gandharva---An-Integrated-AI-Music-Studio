const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * AI Generation Service - Version 7.0
 * Connects the local Express server to the Kaggle GPU engine.
 */
const generateCinematicMusic = async (userPrompt, duration = 10) => {
  // 1. Get the latest URL from environment variables
  const AI_ENGINE_URL = process.env.AI_ENGINE_URL;
  
  if (!AI_ENGINE_URL || AI_ENGINE_URL.includes('your-url-here')) {
    throw new Error('AI_ENGINE_URL is not configured in .env');
  }

  try {
    // 2. SALT & ENHANCE: Use subtle modifiers to ensure uniqueness without overriding the user's prompt
    const creativeModifiers = ['high fidelity', 'atmospheric', 'cinematic', 'detailed', 'stereo', 'studio master'];
    const salt = creativeModifiers[Math.floor(Math.random() * creativeModifiers.length)];
    const enhancedPrompt = `${userPrompt}, ${salt}`;
    
    // Truly random seed for every single request
    const randomSeed = Math.floor(Math.random() * 2147483647);
    
    const filename = `gen_${Date.now()}_${Math.floor(Math.random() * 1000)}.wav`;
    const localDir = path.join(__dirname, '../../public/generated');
    
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    
    const localPath = path.join(localDir, filename);

    logger.info(`[AI Bridge] Requesting: "${enhancedPrompt}"`);
    logger.info(`[AI Bridge] Engine: ${AI_ENGINE_URL}`);
    
    // 3. POST to Kaggle
    const response = await axios.post(`${AI_ENGINE_URL}/generate`, {
      prompt: enhancedPrompt,
      duration: duration,
      seed: randomSeed
    }, {
      timeout: 180000, // 3 minutes max for long tracks
      responseType: 'arraybuffer'
    });

    // 4. Save the buffer to a local WAV file
    fs.writeFileSync(localPath, response.data);
    
    logger.info(`[AI Bridge] Success! Saved to: ${filename}`);

    return {
      success: true,
      filename: filename,
      promptUsed: enhancedPrompt,
      seed: randomSeed
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`Could not connect to Kaggle. Check if your Ngrok URL in .env is correct.`);
    }
    throw error;
  }
};

module.exports = { generateCinematicMusic };
