/**
 * Gandharva Backend - AI Music Retrieval Engine
 * Production-ready server for Anti Gravity AI projects.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const ngrok = require('ngrok');
const logger = require('./src/utils/logger');
const musicRoutes = require('./src/routes/musicRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Optimization Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static fallback audio files
app.use('/fallback', express.static(path.join(__dirname, 'public/fallback'), {
  setHeaders: (res) => {
    res.set('Content-Type', 'audio/mpeg');
  }
}));

// Serve other public assets
app.use('/public', express.static(path.join(__dirname, 'public')));

// Root Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Gandharva Music Retrieval Engine',
    timestamp: new Date().toISOString()
  });
});

// Primary API Routes
app.use('/api', musicRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled System Error', err);
  res.status(500).json({
    success: false,
    message: 'A critical system error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

async function startServer() {
  app.listen(PORT, async () => {
    console.log('\n===========================================');
    console.log(`🚀 LOCAL SERVER ACTIVE ON PORT ${PORT}`);
    
    // START NGROK TUNNEL FOR SERVER
    try {
      const url = await ngrok.connect({
        proto: 'http',
        addr: PORT,
        authtoken: process.env.NGROK_AUTH_TOKEN
      });
      console.log(`📡 PUBLIC SERVER URL (Use this in api.config.js):`);
      console.log(`👉 ${url}`);
      console.log('===========================================\n');
    } catch (err) {
      console.error('❌ Ngrok failed to start:', err.message);
      console.log('Check your NGROK_AUTH_TOKEN in .env');
    }
    logger.info(`Server initialized in ${process.env.NODE_ENV || 'production'} mode`);
  });
}

startServer();
