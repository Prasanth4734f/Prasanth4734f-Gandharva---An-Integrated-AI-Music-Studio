const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  handleCreateVocalJob,
  handleGetVocalJobStatus,
  handleAcceptVocalCandidate,
  handleRegenerateVocalCandidate
} = require('../controllers/vocalController');

// Multer Storage Configuration
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.wav';
    cb(null, `vocal_stem_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max file size
});

// Routes matching VocalUploadScreen.js frontend API calls
router.post('/vocal-studio/job', upload.single('vocalFile'), handleCreateVocalJob);
router.get('/vocal-studio/job/:id', handleGetVocalJobStatus);
router.post('/vocal-studio/job/:id/accept', upload.none(), handleAcceptVocalCandidate);
router.post('/vocal-studio/job/:id/regenerate', upload.none(), handleRegenerateVocalCandidate);

module.exports = router;
