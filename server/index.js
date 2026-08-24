/**
 * Gandharva Backend - AI Music Retrieval Engine
 * Production-ready server for Anti Gravity AI projects.
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const ngrok = require('ngrok');
const logger = require('./src/utils/logger');
const musicRoutes = require('./src/routes/musicRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const albumRoutes = require('./src/routes/albumRoutes');
const vocalRoutes = require('./src/routes/vocalRoutes');
const authRoutes = require('./src/routes/authRoutes');
const connectedServicesRoutes = require('./src/routes/connectedServicesRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Optimization Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: '*'
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static fallback audio files
app.use('/fallback', express.static(path.join(__dirname, 'public/fallback'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Content-Type', 'audio/mpeg');
  }
}));

// Serve other public assets
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  }
}));

// Root Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Gandharva Music Retrieval Engine',
    timestamp: new Date().toISOString()
  });
});

// Primary API Routes
app.use('/api', authRoutes);
app.use('/api', musicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', albumRoutes);
app.use('/api', vocalRoutes);
app.use('/api', connectedServicesRoutes);

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
  app.listen(PORT, '0.0.0.0', async () => {
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
      // Silently ignore Ngrok errors so it doesn't print a scary error when Kaggle is using the tunnel.
    }
    logger.info(`Server initialized in ${process.env.NODE_ENV || 'production'} mode`);
  });
}

startServer();
