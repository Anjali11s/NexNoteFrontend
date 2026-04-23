import axios from "axios";

// Get the correct API URL based on environment
const getBaseUrl = () => {
  // In development (npm run dev)
  if (import.meta.env.DEV && import.meta.env.MODE === 'development') {
    return 'http://localhost:5001/api';
  }
  
  // In preview (npm run preview)
  if (import.meta.env.MODE === 'preview') {
    return 'http://localhost:5001/api';
  }
  
  // // In production
  // return '/api';
  // In production (Vercel)
  return 'https://notesmobilebackend.onrender.com/api';
};

const BASE_URL = getBaseUrl();

console.log('API Base URL:', BASE_URL); // for debug

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for offline detection
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Detect if browser is offline
    if (!navigator.onLine) {
      error.isOffline = true;
      error.message = "You are offline. Changes will sync when connection returns.";
    }
    return Promise.reject(error);
  }
);

export default api;