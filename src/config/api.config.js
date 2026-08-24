import Constants from 'expo-constants';

let cachedWorkingBaseUrl = null;

export const setWorkingBaseUrl = (url) => {
  if (url) cachedWorkingBaseUrl = url;
};

/**
 * Dynamically resolves all potential candidate URLs for the backend.
 * Works seamlessly across web, Android, iOS, local Wi-Fi, and cellular data.
 */
export const getCandidateUrls = () => {
  const candidates = [];

  // 1. Web origin host (when running in web browser)
  if (typeof window !== 'undefined' && window && window.location && window.location.hostname) {
    candidates.push(`http://${window.location.hostname}:3000`);
  }

  // 2. Explicit env override
  if (process.env.EXPO_PUBLIC_API_URL) {
    candidates.push(process.env.EXPO_PUBLIC_API_URL);
  }

  // 3. Auto-detected IP from Expo dev server hostUri (dynamic for physical devices)
  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest?.debuggerHost ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'undefined' && !ip.includes('ngrok') && !ip.includes('expo')) {
        candidates.push(`http://${ip}:3000`);
      }
    }
  } catch (e) {}

  // 4. Current machine WiFi IP & common LAN addresses
  candidates.push('http://192.168.1.8:3000');
  candidates.push('http://192.168.1.16:3000');
  candidates.push('http://localhost:3000');
  candidates.push('http://127.0.0.1:3000');
  candidates.push('http://10.0.2.2:3000');

  // Filter unique
  return [...new Set(candidates)];
};

export const getBaseUrl = () => {
  if (cachedWorkingBaseUrl) return cachedWorkingBaseUrl;
  const urls = getCandidateUrls();
  return urls[0] || 'http://localhost:3000';
};

const CONFIG = {
  get BASE_URL() {
    return getBaseUrl();
  },
  TIMEOUT_MS: 600000,
  API_PREFIX: '/api',
};

export default CONFIG;