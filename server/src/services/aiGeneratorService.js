const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { supabase } = require('./supabase');

// Track last successful GPU contact timestamp (0 = initial cold state)
let lastGpuContactTime = 0;

const getLastGpuContactTime = () => lastGpuContactTime;
const recordGpuSuccess = () => { lastGpuContactTime = Date.now(); };
const recordGpuFailure = () => { 
  lastGpuContactTime = 0; 
  invalidateGpuUrlCache(); 
};

// ============================================================
// DYNAMIC GPU URL RESOLVER (Supabase Registry + Cache + Fallback)
// ============================================================
let _cachedGpuUrl = null;
let _cachedGpuUrlTimestamp = 0;
const GPU_URL_CACHE_TTL_MS = 20000; // Cache for 20 seconds (responsive to shutdowns)

/**
 * Dynamically resolves the active Kaggle GPU URL.
 * Priority: 1) In-memory cache (20s) → 2) Supabase gpu_registry (heartbeat < 90s) → 3) .env fallback
 */
const getActiveGpuUrl = async () => {
  // 1. Check in-memory cache
  if (_cachedGpuUrl && (Date.now() - _cachedGpuUrlTimestamp) < GPU_URL_CACHE_TTL_MS) {
    return _cachedGpuUrl;
  }

  // 2. Query Supabase gpu_registry for the latest live heartbeat
  try {
    const { data, error } = await supabase
      .from('gpu_registry')
      .select('ngrok_url, status, updated_at')
      .eq('id', 'kaggle-primary')
      .single();

    if (!error && data && data.ngrok_url && data.ngrok_url !== 'none') {
      // Must be updated within the last 90 seconds (heartbeat is 60s)
      const updatedAt = new Date(data.updated_at).getTime();
      const isFresh = (Date.now() - updatedAt) < 90000;

      if (data.status === 'online' && isFresh) {
        _cachedGpuUrl = data.ngrok_url.replace(/\/$/, '');
        _cachedGpuUrlTimestamp = Date.now();
        logger.info(`[GPU Registry] Resolved live URL from Supabase: ${_cachedGpuUrl}`);
        return _cachedGpuUrl;
      } else {
        logger.warn(`[GPU Registry] Supabase entry is offline or stale (status=${data.status}, age=${Math.round((Date.now() - updatedAt) / 1000)}s)`);
      }
    }
  } catch (supaErr) {
    logger.warn(`[GPU Registry] Supabase query failed: ${supaErr.message}`);
  }

  // 3. Fallback to .env value
  const envUrl = process.env.AI_ENGINE_URL || process.env.MUSICGEN_API_URL || process.env.MAGIC_BOX_API_URL;
  if (envUrl && !envUrl.includes('your-url-here')) {
    _cachedGpuUrl = envUrl.replace(/\/$/, '');
    _cachedGpuUrlTimestamp = Date.now();
    return _cachedGpuUrl;
  }

  logger.error('[GPU Registry] No GPU URL available from Supabase or .env');
  return null;
};

/**
 * Force-refresh the cached GPU URL (call after a connection failure to try Supabase again)
 */
const invalidateGpuUrlCache = () => {
  _cachedGpuUrl = null;
  _cachedGpuUrlTimestamp = 0;
};

/**
 * AI Generation Service - Standard Prompt to Music (MusicGen Medium)
 * Connects the "Prompt to Music" tab to the standard MusicGen /generate endpoint.
 */
const generateCinematicMusic = async (userPrompt, duration = 10) => {
  const AI_ENGINE_URL = await getActiveGpuUrl();
  
  if (!AI_ENGINE_URL) {
    throw new Error('AI GPU server URL is not available. Kaggle GPU may be offline.');
  }

  try {
    const creativeModifiers = ['high fidelity', 'atmospheric', 'cinematic', 'detailed', 'stereo', 'studio master'];
    const salt = creativeModifiers[Math.floor(Math.random() * creativeModifiers.length)];
    const enhancedPrompt = `${userPrompt}, ${salt}`;
    
    const randomSeed = Math.floor(Math.random() * 2147483647);
    const filename = `gen_${Date.now()}_${Math.floor(Math.random() * 1000)}.wav`;
    const localDir = path.join(__dirname, '../../public/generated');
    
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    
    const localPath = path.join(localDir, filename);

    logger.info(`[Prompt to Music] Requesting MusicGen Medium track: "${enhancedPrompt}"`);
    logger.info(`[Prompt to Music] Engine: ${AI_ENGINE_URL}/generate`);
    
    let response;
    try {
      // Standard Prompt to Music calls MusicGen Medium (/generate endpoint)
      response = await axios.post(`${AI_ENGINE_URL}/generate`, {
        prompt: enhancedPrompt,
        duration: duration,
        seed: randomSeed
      }, {
        timeout: 180000,
        responseType: 'arraybuffer',
        headers: {
          'ngrok-skip-browser-warning': '69420',
          'User-Agent': 'Mozilla/5.0'
        }
      });
    } catch (firstErr) {
      if (firstErr.response && (firstErr.response.status === 503 || firstErr.response.status === 502 || firstErr.response.status === 504)) {
        logger.warn(`[Prompt to Music] Kaggle GPU returned status ${firstErr.response.status}. Retrying generation in 2.5 seconds...`);
        await new Promise(r => setTimeout(r, 2500));
        response = await axios.post(`${AI_ENGINE_URL}/generate`, {
          prompt: enhancedPrompt,
          duration: duration,
          seed: randomSeed
        }, {
          timeout: 180000,
          responseType: 'arraybuffer',
          headers: {
            'ngrok-skip-browser-warning': '69420',
            'User-Agent': 'Mozilla/5.0'
          }
        });
      } else {
        // Connection failed — invalidate cache so next call re-queries Supabase
        invalidateGpuUrlCache();
        throw firstErr;
      }
    }

    recordGpuSuccess();

    // Save audio buffer to local WAV file
    fs.writeFileSync(localPath, response.data);
    
    // Upload to Supabase Storage (Optional background sync)
    let finalAudioUrl = null;
    try {
      logger.info(`[Supabase] Syncing cloud storage...`);
      const { data: storageData, error: storageError } = await supabase.storage
        .from('nusic-assets')
        .upload(`generated/${filename}`, Buffer.from(response.data), {
          contentType: 'audio/wav',
          upsert: true
        });

      if (!storageError) {
        const { data: urlData } = supabase.storage
          .from('nusic-assets')
          .getPublicUrl(`generated/${filename}`);
        finalAudioUrl = urlData.publicUrl;
      }
    } catch (sErr) {
      logger.warn(`[Supabase] Cloud storage sync skipped: ${sErr.message}`);
    }

    // Save record to DB (Optional)
    try {
      await supabase.from('tracks').insert([{
        title: userPrompt.substring(0, 50),
        style: 'Cinematic',
        final_audio_url: finalAudioUrl
      }]);
    } catch (dbErr) {
      logger.warn(`[Supabase] DB record insert skipped: ${dbErr.message}`);
    }

    logger.info(`[Prompt to Music] Success! Saved to: ${finalAudioUrl || filename}`);

    return {
      success: true,
      filename: filename,
      publicUrl: finalAudioUrl,
      promptUsed: enhancedPrompt,
      seed: randomSeed
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      invalidateGpuUrlCache();
      throw new Error(`Could not connect to Kaggle GPU. The GPU backend may be offline or the URL has changed.`);
    }
    throw error;
  }
};

/**
 * ACE-Step 8.0 AI Generation Engine for Story-to-Album & Cinematic BGMs
 * Connects the Story-to-Album pipeline to the dedicated /generate_ace endpoint on Kaggle GPU.
 */
const generateAceStepMusic = async (acePrompt, duration = 10) => {
  const AI_ENGINE_URL = await getActiveGpuUrl();
  
  if (!AI_ENGINE_URL) {
    throw new Error('AI GPU server URL is not available. Kaggle GPU may be offline.');
  }

  try {
    const randomSeed = Math.floor(Math.random() * 2147483647);
    const filename = `ace_${Date.now()}_${Math.floor(Math.random() * 1000)}.wav`;
    const localDir = path.join(__dirname, '../../public/generated');
    
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    
    const localPath = path.join(localDir, filename);

    logger.info(`[ACE-Step Engine] Requesting Story BGM: "${acePrompt.substring(0, 90)}..."`);
    logger.info(`[ACE-Step Engine] Engine: ${AI_ENGINE_URL}/generate_ace`);
    
    let response;
    try {
      response = await axios.post(`${AI_ENGINE_URL}/generate_ace`, {
        prompt: acePrompt,
        duration: duration,
        seed: randomSeed
      }, {
        timeout: 180000,
        responseType: 'arraybuffer',
        headers: {
          'ngrok-skip-browser-warning': '69420',
          'User-Agent': 'Mozilla/5.0'
        }
      });
    } catch (firstErr) {
      // Fallback to /generate if /generate_ace endpoint is not present
      try {
        response = await axios.post(`${AI_ENGINE_URL}/generate`, {
          prompt: acePrompt,
          duration: duration,
          seed: randomSeed
        }, {
          timeout: 180000,
          responseType: 'arraybuffer',
          headers: {
            'ngrok-skip-browser-warning': '69420',
            'User-Agent': 'Mozilla/5.0'
          }
        });
      } catch (fallbackErr) {
        invalidateGpuUrlCache();
        throw firstErr;
      }
    }

    recordGpuSuccess();

    // Save audio buffer to local WAV file
    fs.writeFileSync(localPath, response.data);

    logger.info(`[ACE-Step Engine] Success! Saved Story BGM to: ${filename}`);

    return {
      success: true,
      filename: filename,
      promptUsed: acePrompt,
      seed: randomSeed
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      invalidateGpuUrlCache();
      throw new Error(`Could not connect to Kaggle GPU ACE-Step Engine.`);
    }
    throw error;
  }
};

module.exports = { generateCinematicMusic, generateAceStepMusic, getLastGpuContactTime, recordGpuSuccess, recordGpuFailure, getActiveGpuUrl, invalidateGpuUrlCache };
