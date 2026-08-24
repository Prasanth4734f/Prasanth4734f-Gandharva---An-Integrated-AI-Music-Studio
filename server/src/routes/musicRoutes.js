/**
 * musicRoutes.js
 * Definitions for all music-related endpoints.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer memory storage for forwarding files
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

const { 
  handleGenerateMusic, 
  handleGenerateLyrics, 
  handleVocalUpload, 
  handleHealthCheck, 
  handleEnhancePrompt, 
  handleMixInstruments, 
  handleWaveform, 
  handleDenoise, 
  handleExtractStems, 
  handleGetProjects, 
  handleCreateProject, 
  handleDeleteProject, 
  handleSynthesizeVoice,
  handleEditMusic
} = require('../controllers/musicController');

/**
 * @route POST /api/synthesize-voice
 */
router.post('/synthesize-voice', handleSynthesizeVoice);

/**
 * @route GET /api/projects
 */
router.get('/projects', handleGetProjects);

/**
 * @route POST /api/projects
 */
router.post('/projects', handleCreateProject);

/**
 * @route DELETE /api/projects/:id
 */
router.delete('/projects/:id', handleDeleteProject);

/**
 * @route POST /api/generate-music
 */
router.post('/generate-music', handleGenerateMusic);

/**
 * @route POST /api/generate-lyrics
 */
router.post('/generate-lyrics', handleGenerateLyrics);

/**
 * @route POST /api/vocal-upload
 */
router.post('/vocal-upload', handleVocalUpload);

/**
 * @route GET /api/musicgen-health
 */
router.get('/musicgen-health', handleHealthCheck);

/**
 * @route POST /api/enhance-prompt
 */
router.post('/enhance-prompt', handleEnhancePrompt);

/**
 * @route POST /api/mix-instruments
 */
router.post('/mix-instruments', handleMixInstruments);

/**
 * @route POST /api/waveform
 */
router.post('/waveform', handleWaveform);

/**
 * @route POST /api/denoise
 */
router.post('/denoise', handleDenoise);

/**
 * @route POST /api/extract-stems
 */
router.post('/extract-stems', handleExtractStems);

/**
 * @route POST /api/edit-music
 */
router.post('/edit-music', upload.single('customAudioFile'), handleEditMusic);

module.exports = router;

