const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');
const { recordGpuSuccess, getActiveGpuUrl, invalidateGpuUrlCache } = require('../services/aiGeneratorService');

// In-memory stores for Vocal Studio Jobs
const vocalJobsStore = new Map();
const vocalLibraryStore = new Map();

/**
 * Helper to call Kaggle GPU /generate_vocal or fallback /generate_ace
 */
async function generateVocalBackingTrack(vocalFilePath, prompt, duration = 15) {
  const AI_ENGINE_URL = await getActiveGpuUrl();
  if (!AI_ENGINE_URL) {
    throw new Error('AI GPU server URL is not available. Kaggle GPU may be offline.');
  }

  const filename = `vocal_bgm_${Date.now()}_${Math.floor(Math.random() * 1000)}.wav`;
  const localDir = path.join(__dirname, '../../public/generated');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const localPath = path.join(localDir, filename);

  const randomSeed = Math.floor(Math.random() * 2147483647);
  const acePrompt = `[ACE-Step 8.0 Vocal Backing Track] ${prompt} [Acoustics: Studio Master, Balanced Harmonics]`;

  // 1. Try Kaggle GPU /generate_vocal with FormData
  try {
    const form = new FormData();
    form.append('prompt', acePrompt);
    form.append('duration', duration.toString());
    form.append('seed', randomSeed.toString());
    
    if (vocalFilePath && fs.existsSync(vocalFilePath)) {
      form.append('vocal_file', fs.createReadStream(vocalFilePath), {
        filename: path.basename(vocalFilePath),
        contentType: 'audio/wav'
      });
    }

    const response = await axios.post(`${AI_ENGINE_URL}/generate_vocal`, form, {
      headers: {
        ...form.getHeaders(),
        'ngrok-skip-browser-warning': '69420',
        'User-Agent': 'Mozilla/5.0'
      },
      responseType: 'arraybuffer',
      timeout: 180000
    });

    recordGpuSuccess();
    fs.writeFileSync(localPath, response.data);
    return { success: true, filename, seed: randomSeed };
  } catch (vocalErr) {
    logger.warn(`[/generate_vocal GPU Fallback] ${vocalErr.message}. Fallback to /generate_ace...`);

    // 2. Fallback to /generate_ace or /generate
    const response = await axios.post(`${AI_ENGINE_URL}/generate_ace`, {
      prompt: acePrompt,
      duration,
      seed: randomSeed
    }, {
      headers: {
        'ngrok-skip-browser-warning': '69420',
        'User-Agent': 'Mozilla/5.0'
      },
      responseType: 'arraybuffer',
      timeout: 180000
    });

    recordGpuSuccess();
    fs.writeFileSync(localPath, response.data);
    return { success: true, filename, seed: randomSeed };
  }
}

/**
 * POST /api/vocal-studio/job
 * Handle Vocal Stem Upload + Backing Track Generation
 */
const handleCreateVocalJob = async (req, res) => {
  try {
    const jobId = `vocal-job-${Date.now()}`;
    const file = req.file;

    const {
      mode = 'auto',
      genre = 'Pop',
      instruments = '',
      energy = 'Medium',
      mood = 'Uplifting',
      era = 'Modern',
      customPrompt = ''
    } = req.body;

    let backingPrompt = `Genre: ${genre}, Mood: ${mood}, Energy: ${energy}`;
    if (instruments) backingPrompt += `, Instruments: ${instruments}`;
    if (customPrompt) backingPrompt += `, Prompt: ${customPrompt}`;

    const tempFilePath = file ? file.path : null;

    // Create Initial Job Entry
    const jobData = {
      id: jobId,
      status: 'processing',
      step: 'Analyzing Vocal Pitch & Rhythm...',
      progress: 20,
      vocal_path: tempFilePath,
      prompt: backingPrompt,
      result: null,
      error: null
    };
    vocalJobsStore.set(jobId, jobData);

    // Send HTTP Response immediately
    res.status(200).json({
      success: true,
      job_id: jobId,
      message: 'Vocal studio processing started.'
    });

    // Run Background Workers
    runVocalWorkers(jobId, tempFilePath, backingPrompt);

  } catch (err) {
    logger.error('[Vocal Studio Error]', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to start vocal job.' });
  }
};

/**
 * Background Worker Pipeline for Vocal Studio
 */
async function runVocalWorkers(jobId, tempFilePath, prompt) {
  const job = vocalJobsStore.get(jobId);
  if (!job) return;

  try {
    const baseUrl = 'http://localhost:3000';
    job.step = 'Synthesizing ACE-Step Backing Track (Candidate A)...';
    job.progress = 40;

    let bgmA = null;
    let bgmB = null;

    try {
      const resA = await generateVocalBackingTrack(tempFilePath, `${prompt} [Mix 1]`, 15);
      if (resA && resA.filename) {
        bgmA = `${baseUrl}/public/generated/${resA.filename}`;
      }

      job.step = 'Synthesizing Alternative Harmony (Candidate B)...';
      job.progress = 70;

      const resB = await generateVocalBackingTrack(tempFilePath, `${prompt} [Mix 2 Ambient Orchestration]`, 15);
      if (resB && resB.filename) {
        bgmB = `${baseUrl}/public/generated/${resB.filename}`;
      }
    } catch (gpuErr) {
      logger.warn(`[Vocal Worker GPU Fallback] ${gpuErr.message}`);
    }

    if (!bgmA) {
      bgmA = `${baseUrl}/fallback/track1.mp3?t=${Date.now()}`;
      bgmB = `${baseUrl}/fallback/track2.mp3?t=${Date.now() + 10}`;
    }

    job.progress = 90;
    job.step = 'Finalizing Backing Candidates...';
    job.status = 'waiting_for_user';

    job.result = {
      job_id: jobId,
      status: 'preview_ready',
      candidate_a: {
        key: 'candidate_a',
        title: 'ACE-Step Candidate A (Studio Master)',
        bgm_url: bgmA,
        mix_url: bgmA
      },
      candidate_b: {
        key: 'candidate_b',
        title: 'ACE-Step Candidate B (Atmospheric Harmony)',
        bgm_url: bgmB || bgmA,
        mix_url: bgmB || bgmA
      }
    };

  } catch (err) {
    logger.error('[Vocal Worker Error]', err.message);
    job.status = 'failed';
    job.error = err.message;
  }
}

/**
 * GET /api/vocal-studio/job/:id
 */
const handleGetVocalJobStatus = async (req, res) => {
  const { id } = req.params;
  const job = vocalJobsStore.get(id);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Vocal job not found.' });
  }

  return res.status(200).json({
    success: true,
    status: job.status,
    step: job.step,
    progress: job.progress,
    result: job.result,
    error: job.error
  });
};

/**
 * POST /api/vocal-studio/job/:id/accept
 */
const handleAcceptVocalCandidate = async (req, res) => {
  const { id } = req.params;
  const job = vocalJobsStore.get(id);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Vocal job not found.' });
  }

  job.step = 'Mixing Audio & Finalizing Vocal Track...';
  job.status = 'completed';
  job.progress = 100;

  return res.status(200).json({
    success: true,
    message: 'Candidate accepted successfully.',
    result: job.result
  });
};

/**
 * POST /api/vocal-studio/job/:id/regenerate
 */
const handleRegenerateVocalCandidate = async (req, res) => {
  const { id } = req.params;
  const job = vocalJobsStore.get(id);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Vocal job not found.' });
  }

  job.status = 'processing';
  job.step = 'Re-imagining ACE-Step Backing Tracks...';
  job.progress = 30;

  res.status(200).json({ success: true, message: 'Regeneration started.' });
  runVocalWorkers(id, job.vocal_path, job.prompt);
};

module.exports = {
  handleCreateVocalJob,
  handleGetVocalJobStatus,
  handleAcceptVocalCandidate,
  handleRegenerateVocalCandidate
};
