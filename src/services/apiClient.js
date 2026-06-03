import CONFIG from '../config/api.config';

/**
 * Enhanced Fetch Wrapper for Gandharva
 */
const apiClient = async (endpoint, options = {}) => {
  const url = `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}${endpoint}`;
  
  const isFormData = options.body instanceof FormData;
  
  const defaultOptions = {
    headers: isFormData ? {} : {
      'Content-Type': 'application/json',
    },
    ...options,
  };


  // Debug Request Log
  console.log(`[API Request] ${options.method || 'GET'} -> ${url}`);
  if (options.body) console.log('[API Body]', options.body);

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        'ngrok-skip-browser-warning': 'true',
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });

    
    clearTimeout(id);

    const text = await response.text();
    let data = null;
    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error(`[API Error] ${endpoint}: Failed to parse JSON.`);
        console.error(`[Raw Response]: ${text.substring(0, 200)}...`); // Show first 200 chars
        throw new Error('Server returned an invalid response. If using Localtunnel, please open the URL in your browser first.');
      }
    }

    // Debug Response Log
    console.log(`[API Response] ${response.status} <- ${endpoint}`);

    if (!response.ok) {
      const errorMsg = data.message || data.error || `Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    clearTimeout(id);
    
    // Handle Network Errors vs Timeouts
    if (error.name === 'AbortError') {
      console.error('[API Timeout]', endpoint);
      throw new Error('Request timed out. The AI is taking a bit too long.');
    }

    if (error.message.includes('Network request failed')) {
      console.error('[API Network Error]', endpoint);
      throw new Error('Network unreachable. Ensure your server or ngrok is running.');
    }

    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
};

export default apiClient;
