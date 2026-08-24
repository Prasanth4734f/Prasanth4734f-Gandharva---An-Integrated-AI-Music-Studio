const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');
const logger = require('../utils/logger');
const PromptEnhancer = require('./promptEnhancer');

// Ensure environment variables are loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Load system prompt from system_prompt.txt
const SYSTEM_PROMPT_PATH = path.join(__dirname, 'system_prompt.txt');
let GANDHARVA_SYSTEM_PROMPT = '';
try {
  GANDHARVA_SYSTEM_PROMPT = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf-8');
} catch (e) {
  logger.warn(`[Prompt Director] Could not read system_prompt.txt: ${e.message}`);
}

class PromptDirector {
  static async enhance(userPrompt) {
    if (!userPrompt || typeof userPrompt !== 'string' || !userPrompt.trim()) {
      return userPrompt || '';
    }

    const cleanPrompt = userPrompt.trim();
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (geminiApiKey) {
      const candidateModels = [
        'gemini-2.5-flash',
        'gemini-3.5-flash',
        'gemini-3.6-flash',
        'gemini-flash-latest'
      ];

      const payload = {
        systemInstruction: {
          parts: [{ text: GANDHARVA_SYSTEM_PROMPT }]
        },
        contents: [{
          parts: [{ 
            text: `User Music Idea to Enhance:\n"${cleanPrompt}"\n\nInstructions: Preserving the exact meaning and story details of the user's idea, expand it into ONE continuous, highly descriptive, cinematic music generation prompt (150-220 words). Return ONLY the final paragraph with no titles, quotes, headings, or bullet points.`
          }]
        }],
        generationConfig: {
          temperature: 0.75,
          maxOutputTokens: 2048,
        }
      };

      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
          const response = await axios.post(url, payload, { timeout: 15000 });

          if (response.data && response.data.candidates && response.data.candidates.length > 0) {
            const candidateText = response.data.candidates[0].content?.parts?.[0]?.text;
            if (candidateText && candidateText.trim().length > 30) {
              let enhancedResult = candidateText.trim();
              
              // Remove surrounding quotes, backticks, or markdown blocks
              enhancedResult = enhancedResult.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '');
              enhancedResult = enhancedResult.replace(/^["'`]|["'`]$/g, '');
              enhancedResult = enhancedResult.replace(/^(Enhanced Prompt|Output|Prompt):\s*/i, '');
              
              // Ensure it is one continuous paragraph (collapse multi-line gaps or bullet points)
              enhancedResult = enhancedResult.split('\n').map(line => line.trim().replace(/^[-*•]\s*/, '')).filter(Boolean).join(' ');
              
              logger.info(`[Prompt Director] ✅ Gemini enhanced prompt successfully using ${model}! (${enhancedResult.split(/\s+/).length} words)`);
              return enhancedResult;
            }
          }
        } catch (err) {
          logger.warn(`[Prompt Director] ${model} enhancement warning: ${err.message}. Trying next candidate model...`);
        }
      }
    } else {
      logger.warn('[Prompt Director] GEMINI_API_KEY missing in environment.');
    }

    logger.info(`[Prompt Director] Falling back to rule-based PromptEnhancer.`);
    return PromptEnhancer.enhance(cleanPrompt);
  }
}

module.exports = PromptDirector;
