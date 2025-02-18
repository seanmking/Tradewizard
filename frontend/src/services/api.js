import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
console.log('API URL:', API_URL); // Debug log

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log('Making request:', config.method.toUpperCase(), config.url);
    const sessionId = localStorage.getItem('assessmentSessionId');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Response:', response.data);
    return response;
  },
  error => {
    console.error('Response error:', error.response?.data || error.message);
    if (error.response?.status === 400 && error.response?.data?.error === 'Invalid session') {
      localStorage.removeItem('assessmentSessionId');
    }
    return Promise.reject(error);
  }
);

export const assessmentApi = {
  startSession: async () => {
    const sessionId = `session_${Date.now()}`;
    localStorage.setItem('assessmentSessionId', sessionId);
    
    try {
      const response = await api.post('/api/start', null, {
        headers: { 'X-Session-ID': sessionId }
      });
      return response.data;
    } catch (error) {
      localStorage.removeItem('assessmentSessionId');
      throw error;
    }
  },

  sendMessage: async (message) => {
    if (!message || !message.trim()) {
      throw new Error('Message cannot be empty');
    }

    const sessionId = localStorage.getItem('assessmentSessionId');
    if (!sessionId) {
      throw new Error('No active session');
    }

    try {
      const response = await api.post('/api/respond', { message: message.trim() });
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Invalid request');
      }
      throw error;
    }
  },

  clearSession: () => {
    localStorage.removeItem('assessmentSessionId');
  },

  getSessionId: () => {
    return localStorage.getItem('assessmentSessionId');
  }
}; 