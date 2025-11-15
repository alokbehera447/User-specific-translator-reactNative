import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =========================
// 🌐 API BASE URL
// =========================
//
// 🧩 Use the correct base URL based on your environment:
//
// 1️⃣ For Android Emulator: use 10.0.2.2
// 2️⃣ For iOS Simulator: use 127.0.0.1
// 3️⃣ For Physical Device: use your system IP (e.g., http://192.168.1.5:8000)
//
// const BASE_URL = 'http://10.0.2.2:8000'; // ✅ Android Emulator
// const BASE_URL = 'http://127.0.0.1:8000'; // ✅ iOS Simulator
// const BASE_URL = 'http://192.168.0.115:8000'; // ✅ Physical Device (replace with your IP)
const BASE_URL = 'http://192.168.0.147:8000';


// =========================
// ⚙️ AXIOS INSTANCE
// =========================
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout for requests
});

// =========================
// 🧠 REQUEST INTERCEPTOR
// =========================
//
// This will attach the JWT token to every outgoing request.
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Error reading token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =========================
// 🚨 RESPONSE INTERCEPTOR
// =========================
//
// This can be extended to automatically refresh tokens
// or redirect to login when a token expires.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized request - possible expired token.');

      // Optional: Add automatic token refresh logic here
      // Example:
      // const refreshToken = await AsyncStorage.getItem('refresh_token');
      // if (refreshToken) {
      //   const newToken = await refreshAccessToken(refreshToken);
      //   await AsyncStorage.setItem('access_token', newToken);
      //   error.config.headers.Authorization = `Bearer ${newToken}`;
      //   return api.request(error.config);
      // }

      // If refresh is not implemented, just reject
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// =========================
// 🚀 EXPORT DEFAULT
// =========================
export default api;
