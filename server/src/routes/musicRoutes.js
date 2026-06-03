/**
 * musicRoutes.js
 * Definitions for all music-related endpoints.
 */
const express = require('express');
const router = express.Router();
const { handleGenerateMusic, handleGenerateLyrics, handleVocalUpload } = require('../controllers/musicController');

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

module.exports = router;

