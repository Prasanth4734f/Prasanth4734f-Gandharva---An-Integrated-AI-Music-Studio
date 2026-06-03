/**
 * Gandharva API Configuration
 * 
 * Configured to connect directly to the FastAPI Python Backend (Port 8001).
 * To use a physical device, update BASE_URL with your local computer IP or ngrok.
 */

const CONFIG = {
  // FastAPI Backend Server URL
  BASE_URL: 'http://192.168.1.12:8001',
  TIMEOUT_MS: 180000, // 3-minute timeout for high-quality AI generation
  API_PREFIX: '/api',
};

export default CONFIG;