import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
// Update the mock data path to point to our mock server
const MOCK_DATA_PATH = 'http://localhost:3001';
// For development, use a temporary user ID
const TEMP_USER_ID = 'temp_user_1';

// Interface definitions for API responses
export interface ChatSession {
  chat_id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  created_at: number;
}

export interface ChatResponse {
  chat_id: string;
  response: {
    response: string;
    current_step: string;
    completed_steps: string[];
    progress: {
      completed: number;
      total: number;
    };
    extracted_info: Record<string, any>;
    should_show_verification_form: boolean;
  };
}

export interface MessageResponse extends ChatResponse {}

interface HistoryResponse {
  chat_id: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

// API error handling
class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Simulate API delay for a more realistic experience
const simulateNetworkDelay = (minMs = 300, maxMs = 800) => {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Generic API call handler with error handling
const apiCall = async <T>(
  method: 'get' | 'post' | 'put' | 'delete',
  endpoint: string,
  data?: any,
  config?: any,
  useMock = false
): Promise<T> => {
  try {
    // For development/demo purposes, we might want to use mock data
    if (useMock) {
      await simulateNetworkDelay();
      // Use a proxy server or direct file access for mock data
      const mockEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      const response = await axios[method]<T>(`${MOCK_DATA_PATH}/mock-data${mockEndpoint}`, data, config);
      return response.data;
    }
    
    // Real API call
    const response = await axios[method]<T>(`${API_BASE_URL}${endpoint}`, data, config);
    return response.data;
  } catch (error) {
    console.error(`API ${method.toUpperCase()} request failed:`, error);
    throw error;
  }
};

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new ApiError(errorData.error || `HTTP error ${response.status}`, response.status);
  }
  
  return response.json() as Promise<T>;
}

// Start a new chat session
export async function startChat(): Promise<ChatSession> {
  const response = await fetch(`${API_BASE_URL}/chat/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: TEMP_USER_ID }),
  });
  
  return handleResponse<ChatSession>(response);
}

// Send a message in an existing chat session
export async function sendChatMessage(chatId: string, message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      chat_id: chatId, 
      message,
      user_id: TEMP_USER_ID 
    }),
  });
  
  return handleResponse<ChatResponse>(response);
}

// Get conversation history for a chat
export async function getChatHistory(chatId: string): Promise<HistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/history/${chatId}`);
  
  return handleResponse<HistoryResponse>(response);
}

// Simple health check
export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  return handleResponse<{ status: string }>(response);
}

// Market intelligence API functions
export const marketIntelligenceApi = {
  getMarketData: async (marketKey: string) => {
    console.log(`getMarketData called with market key: "${marketKey}"`);
    
    // In a real implementation, this would call the backend API
    // For now, we're using mock data files
    // Map market keys to actual filenames
    const marketFileMap: Record<string, string> = {
      'usa': 'usa',
      'uk': 'uk',
      'uae': 'uae'
    };
    
    const fileName = marketFileMap[marketKey] || marketKey;
    console.log(`Mapped to filename: ${fileName}`);
    
    try {
      const result = await apiCall<any>('get', `/market_intelligence/${fileName}.json`, null, null, true);
      console.log(`Successfully fetched data for ${fileName}`);
      return result;
    } catch (error) {
      console.error(`Error fetching market data for ${fileName}:`, error);
      // If usa.json fails, try usa_market.json as a fallback
      if (fileName === 'usa') {
        console.log("Trying usa_market.json as fallback");
        return apiCall<any>('get', `/market_intelligence/usa_market.json`, null, null, true);
      }
      throw error;
    }
  },
  
  // Additional market intelligence endpoints would go here
};

// Assessment API functions
export const assessmentApi = {
  submitAssessment: async (assessmentData: any) => {
    // In production, this would send data to the backend
    // For now, simulate a successful response
    await simulateNetworkDelay();
    return {
      success: true,
      message: 'Assessment submitted successfully',
      assessmentId: `ASSESSMENT-${Math.floor(Math.random() * 10000)}`,
      data: assessmentData
    };
  },
  
  getAssessmentResults: async (assessmentId: string) => {
    // In production, this would fetch from the backend
    // For now, simulate a successful response with mock data
    await simulateNetworkDelay();
    return {
      success: true,
      assessmentId,
      results: {
        score: Math.floor(Math.random() * 100),
        recommendations: [
          'Complete export documentation training',
          'Obtain necessary certifications',
          'Develop market entry strategy'
        ],
        readiness: 'Medium'
      }
    };
  }
};

// User API functions
export const userApi = {
  // User-related API endpoints would go here
};

export default {
  marketIntelligenceApi,
  assessmentApi,
  userApi,
  startChat,
  sendChatMessage,
  getChatHistory,
  checkHealth
};
