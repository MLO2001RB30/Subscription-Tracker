import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// TODO: Remember to change this to your actual backend IP address or domain in production
// If running on Expo Go on a physical device, 'localhost' will not work.
// Use your local network IP (e.g., 'http://192.168.1.XX:8000') or your ngrok/Expo tunnel URL.
// For development, if running on an emulator on the same machine, 'localhost' might work.
const BACKEND_BASE_URL = 'http://192.168.0.5:8080/api'; 

const api = axios.create({
  baseURL: BACKEND_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token to headers
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

export async function loginWithSocialToken(provider, token) {
  const res = await fetch('http://192.168.0.5:8080/api/auth/social-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, token }),
  });
  if (!res.ok) throw new Error('Social login failed');
  const data = await res.json();
  // Gem evt. JWT-token i AsyncStorage hvis nødvendigt
  return data;
} 