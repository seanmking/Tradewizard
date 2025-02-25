import axios from 'axios';

// Base URL will always be relative in development
const API_URL = '/api';
console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Don't throw on non-2xx responses
  validateStatus: function (status) {
    return status < 500;
  }
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
      url: endpoint,
      data,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId ? { 'X-Session-ID': sessionId } : {})
      }
    };

    const response = await api.request(config);
    
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
      // Generate a new session ID if one doesn't exist
      const sessionId = localStorage.getItem('assessmentSessionId') || `session_${Date.now()}`;
      localStorage.setItem('assessmentSessionId', sessionId);
      
      const result = await makeRequest('POST', '/start');
      return result;
    } catch (error) {
      // If server error, create mock session
      if (error.response?.status === 500) {
        const mockSessionId = `mock_${Date.now()}`;
        localStorage.setItem('assessmentSessionId', mockSessionId);
        return {
          sessionId: mockSessionId,
          status: 'mock'
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
      return await makeRequest('POST', '/start_assessment', { business_data: businessData });
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