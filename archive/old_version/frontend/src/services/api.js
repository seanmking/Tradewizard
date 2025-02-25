import axios from 'axios';

// Base URL will always be relative in development
const API_URL = '';
console.log('API URL:', API_URL);

// Creating mock session
const mockSession = {
  id: 'mock-session-' + Math.random().toString(36).substr(2, 9)
};

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Session-ID': mockSession.id
  },
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
  withCredentials: true  // Required for CORS with credentials
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
    if (response.status >= 400) {
      console.warn('Response error:', response.data);
      return Promise.reject(response);
    }
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

const makeRequest = async (method, endpoint, data = null) => {
  try {
    const sessionId = localStorage.getItem('assessmentSessionId');
    const config = {
      method,
      url: endpoint.startsWith('/') ? `/api/assessment${endpoint}` : `/api/assessment/${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId ? { 'X-Session-ID': sessionId } : {})
      }
    };

    const response = await api(config);
    
    if (response.status >= 400) {
      throw new Error(response.data?.error || 'Request failed');
    }
    
    return response.data;
  } catch (error) {
    console.error('API Error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config
    });
    
    // If we get a 500 error during session start, create a mock session
    if (endpoint === '/start' && error.response?.status === 500) {
      console.log('Creating mock session due to server error');
      return {
        sessionId: `mock_${Date.now()}`,
        status: 'mock'
      };
    }
    
    throw error;
  }
};

export const assessmentApi = {
  startSession: async () => {
    try {
      console.log('Starting new session...');
      // Generate a new session ID if one doesn't exist
      const sessionId = localStorage.getItem('assessmentSessionId') || `session_${Date.now()}`;
      localStorage.setItem('assessmentSessionId', sessionId);
      
      const result = await makeRequest('POST', '/start');
      console.log('Session start API response:', result);
      
      // If we get a successful response, return it
      if (result && !result.error) {
        return {
          ...result,
          message: result.message || 'Welcome to the TradeKing Export Assessment. I will help you evaluate your business\'s export readiness. Let\'s begin by understanding your business better.',
          requires_action: true,
          action_type: 'start_assessment'
        };
      }
      
      // If server error, create mock session
      if (result?.error || result?.status === 500) {
        const mockSessionId = `mock_${Date.now()}`;
        localStorage.setItem('assessmentSessionId', mockSessionId);
        return {
          sessionId: mockSessionId,
          status: 'mock',
          message: 'Welcome to the TradeKing Export Assessment. I will help you evaluate your business\'s export readiness. Let\'s begin by understanding your business better.',
          requires_action: true,
          action_type: 'start_assessment'
        };
      }
      
      throw new Error('Failed to start session');
    } catch (error) {
      console.error('Session start error:', error);
      throw error;
    }
  },
  
  getProgress: async () => {
    try {
      console.log('Fetching assessment progress...');
      const result = await makeRequest('GET', '/progress');
      console.log('Progress response:', result);
      return result;
    } catch (error) {
      console.error('Progress fetch error:', error);
      // If no active session, return empty state
      if (error.response?.status === 404) {
        return {
          current_step: null,
          progress: null,
          business_info: {},
          validation_status: {
            is_valid: false,
            errors: [],
            warnings: [],
            suggestions: []
          }
        };
      }
      throw error;
    }
  },
  
  startQuestions: () => makeRequest('POST', '/start_questions'),
  
  respond: (data) => makeRequest('POST', '/respond', data),
  
  validateBusiness: (registrationNumber) =>
    makeRequest('POST', '/validate/business', { registrationNumber }),
  
  validateTax: (taxNumber) =>
    makeRequest('POST', '/validate/tax', { taxNumber }),
    
  extractWebsiteInfo: (url) =>
    makeRequest('POST', '/extract_website_info', { url }),

  startAssessment: async (businessData) => {
    const sessionId = localStorage.getItem('assessmentSessionId');
    if (!sessionId) {
      throw new Error('No active session');
    }

    try {
      return await makeRequest('POST', '/start_assessment', businessData);
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

export default api; 