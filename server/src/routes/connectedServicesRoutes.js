/**
 * connectedServicesRoutes.js
 * Definitions for connected services (Google, Google Drive) endpoints.
 */
const express = require('express');
const router = express.Router();
const {
  handleGetConnectedServices,
  handleGetDriveAuthUrl,
  handleDriveOAuthCallback,
  handleConnectService,
  handleDisconnectService,
  handleSyncDrive
} = require('../controllers/connectedServicesController');

router.get('/connected-services', handleGetConnectedServices);
router.get('/connected-services/drive/auth-url', handleGetDriveAuthUrl);
router.get('/connected-services/drive/callback', handleDriveOAuthCallback);
router.post('/connected-services/connect', handleConnectService);
router.post('/connected-services/disconnect', handleDisconnectService);
router.post('/connected-services/sync-drive', handleSyncDrive);

module.exports = router;
