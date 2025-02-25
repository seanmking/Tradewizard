const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// For development, use a temporary user ID
const TEMP_USER_ID = 'temp_user_1';

// Interface definitions for API responses
interface ChatSession {
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
    completed_steps: string[];
    current_step: string;
    extracted_info: Record<string, any>;
    progress: {
      completed: number;
      current: string;
      total: number;
    };
    response: string;
    step_progress: Record<string, {
      completed: boolean;
      required_fields: string[];
    }>;
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
