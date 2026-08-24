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
  if (!options.silent) {
    console.log(`[API Request] ${options.method || 'GET'} -> ${url}`);
    if (options.body) console.log('[API Body]', options.body);
  }

  // Attach Supabase Auth Bearer Token if available
  let authHeader = {};
  try {
    const { supabase } = require('./supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeader['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (authErr) {
    // Auth token check warning
  }

  const controller = new AbortController();
  const timeoutMs = options.timeout || CONFIG.TIMEOUT_MS;
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        'ngrok-skip-browser-warning': 'true',
        ...authHeader,
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
        if (!options.silent) {
          console.error(`[API Error] ${endpoint}: Failed to parse JSON.`);
          console.error(`[Raw Response]: ${text.substring(0, 200)}...`); // Show first 200 chars
        }
        throw new Error('Server returned an invalid response. If using Localtunnel, please open the URL in your browser first.');
      }
    }

    // Debug Response Log
    if (!options.silent) {
      console.log(`[API Response] ${response.status} <- ${endpoint}`);
    }

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || data?.detail || `Error: ${response.status}`;
      throw new Error(errorMsg);
    }

    if (data && typeof data === 'object' && !('data' in data)) {
      Object.defineProperty(data, 'data', {
        get() { return this; },
        configurable: true,
        enumerable: false
      });
    }

    return data;
  } catch (error) {
    clearTimeout(id);
    
    // Handle Network Errors vs Timeouts
    if (error.name === 'AbortError') {
      if (!options.silent) {
        console.warn('[API Timeout]', endpoint);
      }
      throw new Error('Request timed out. The AI is taking a bit too long.');
    }

    if (error.message && error.message.includes('Network request failed')) {
      if (!options.silent) {
        console.warn('[API Network Error]', endpoint);
      }
      throw new Error('Network unreachable. Ensure your server or ngrok is running.');
    }

    if (!options.silent) {
      console.warn(`[API Error] ${endpoint}:`, error.message);
    }
    throw error;
  }
};

apiClient.get = (endpoint, options = {}) => 
  apiClient(endpoint, { ...options, method: 'GET' });

apiClient.post = (endpoint, body, options = {}) => {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const formattedBody = isFormData ? body : (typeof body === 'string' ? body : JSON.stringify(body));
  return apiClient(endpoint, { ...options, method: 'POST', body: formattedBody });
};

apiClient.put = (endpoint, body, options = {}) => {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const formattedBody = isFormData ? body : (typeof body === 'string' ? body : JSON.stringify(body));
  return apiClient(endpoint, { ...options, method: 'PUT', body: formattedBody });
};

apiClient.delete = (endpoint, options = {}) => 
  apiClient(endpoint, { ...options, method: 'DELETE' });

export default apiClient;

