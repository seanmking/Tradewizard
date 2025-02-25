const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

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

interface MessageResponse {
  message: string;
  chat_id: string;
}

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
export async function startChat(businessContext: Record<string, any> = {}): Promise<ChatSession> {
  const response = await fetch(`${API_BASE_URL}/chat/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ business_context: businessContext }),
  });
  
  return handleResponse<ChatSession>(response);
}

// Send a message in an existing chat session
export async function sendChatMessage(chatId: string, message: string): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ chat_id: chatId, message }),
  });
  
  return handleResponse<MessageResponse>(response);
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
