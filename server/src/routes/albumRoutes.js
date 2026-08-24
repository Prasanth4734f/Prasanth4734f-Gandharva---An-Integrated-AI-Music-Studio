/**
 * albumRoutes.js
 * Endpoints for Narrative Intelligence Engine (NIE) and Album Generation Engine (AGE)
 */
const express = require('express');
const router = express.Router();
const {
  handleAnalyzeStory,
  handleCreateAlbumJob,
  handleGetJobStatus,
  handleGetAlbum,
  handleRegenerateTrack,
  handleRegenerateCover
} = require('../controllers/albumController');

/**
 * @route POST /api/album/analyze
 * Stage 1: Narrative Intelligence Engine (NIE) Story Analysis & Blueprint
 */
router.post('/album/analyze', handleAnalyzeStory);

/**
 * @route POST /api/album/create
 * Stage 2: Album Generation Engine (AGE) Job Worker Launch
 */
router.post('/album/create', handleCreateAlbumJob);

/**
 * @route GET /api/job/:id
 * Check Job Worker Progress Status (0-100%)
 */
router.get('/job/:id', handleGetJobStatus);

/**
 * @route GET /api/album/:id
 * Fetch Completed Album Details
 */
router.get('/album/:id', handleGetAlbum);

/**
 * @route POST /api/album/:id/regenerate-track
 * Regenerate Single Track Lyrics & BGM
 */
router.post('/album/:id/regenerate-track', handleRegenerateTrack);

/**
 * @route POST /api/album/:id/regenerate-cover
 * Regenerate Album Cover Art
 */
router.post('/album/:id/regenerate-cover', handleRegenerateCover);

module.exports = router;
