// src/lib/axios.js
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

console.log('API Base URL:', BASE_URL); // This helps debug

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

export default api;