import { assessmentService } from './AssessmentService';
import { API_ENDPOINTS } from './analysis-service';

export interface MarketOption {
  id: string;
  name: string;
  description: string;
  confidence: number;
}

export interface AssessmentStep {
  id: string;
  prompt: string;
  type: 'text' | 'market_selection' | 'final';
  marketOptions?: MarketOption[];
}

export interface AssessmentResponse {
  next_step: string | {
    id: string;
    prompt: string;
    type: string;
    market_options?: MarketOption[];
    marketOptions?: MarketOption[];
  };
  user_data: Record<string, any>;
  dashboard_updates?: Record<string, any>;
  response?: string;
}

export interface SarahFlowResponse {
  chat_id: string;
  response: string;
  next_step: string | null;
  type?: string;
  market_options?: MarketOption[];
  extracted_info?: Record<string, any>;
  show_account_creation?: boolean;
}

// Get the full URL for an API endpoint
function getFullUrl(endpoint: string): string {
  return `${API_ENDPOINTS.BACKEND_BASE}${endpoint}`;
}

/**
 * Fetches the initial question to start the assessment flow
 */
export async function getInitialQuestion(): Promise<{ step_id: string; question: string }> {
  try {
    const url = getFullUrl('/api/assessment/initial-question');
    console.log('Fetching initial question from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('Error response from server:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error('Failed to fetch initial question');
    }
    
    const data = await response.json();
    console.log('Initial question data:', data);
    return data;
  } catch (error) {
    console.error('Error in getInitialQuestion:', error);
    throw error;
  }
}

/**
 * Processes a user response in the assessment flow
 */
export async function processAssessmentResponse(
  step_id: string,
  response: string,
  user_data: Record<string, any> = {}
): Promise<AssessmentResponse> {
  try {
    console.log(`Processing assessment response for step ${step_id}:`, response.substring(0, 50) + '...');
    
    const url = getFullUrl('/api/assessment/process-response');
    const requestData = { step_id, response, user_data };
    
    console.log('Making request to:', url);
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!apiResponse.ok) {
      console.error('Error response from server:', apiResponse.status, apiResponse.statusText);
      const errorText = await apiResponse.text();
      console.error('Error details:', errorText);
      throw new Error('Failed to process response');
    }
    
    const data = await apiResponse.json();
    console.log('Response data:', data);
    
    // Ensure user_data exists
    if (!data.user_data) {
      data.user_data = {};
    }
    
    // Handle next_step being an object with market options
    if (data.next_step && typeof data.next_step === 'object') {
      // Ensure next_step has all required fields
      if (!data.next_step.id) data.next_step.id = 'unknown';
      if (!data.next_step.prompt) data.next_step.prompt = '';
      if (!data.next_step.type) data.next_step.type = 'text';
      
      // Convert market_options to marketOptions for consistency
      if (data.next_step.market_options) {
        console.log('Market options received from API:', data.next_step.market_options);
        data.next_step.marketOptions = data.next_step.market_options;
      }
      
      // Ensure we have marketOptions if this is a market_selection step
      if (data.next_step.type === 'market_selection' && 
          (!data.next_step.marketOptions || !Array.isArray(data.next_step.marketOptions))) {
        console.warn('Market selection step without valid marketOptions, creating empty array');
        data.next_step.marketOptions = [];
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error in processAssessmentResponse:', error);
    throw error;
  }
}

/**
 * Start the Sarah-guided assessment flow
 */
export async function startSarahFlow(): Promise<SarahFlowResponse> {
  try {
    const url = getFullUrl('/api/chat/start');
    console.log('Starting Sarah flow at:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 'anonymous' })
    });
    
    if (!response.ok) {
      console.error('Error starting Sarah flow:', response.status, response.statusText);
      throw new Error('Failed to start Sarah flow');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in startSarahFlow:', error);
    throw error;
  }
}

/**
 * Process a user response in the Sarah-guided assessment flow
 */
export async function processSarahResponse(
  chat_id: string,
  message: string
): Promise<SarahFlowResponse> {
  try {
    const url = getFullUrl('/api/chat/message');
    console.log(`Processing Sarah response for chat ${chat_id}:`, message.substring(0, 50) + '...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        message
      })
    });
    
    if (!response.ok) {
      console.error('Error processing Sarah response:', response.status, response.statusText);
      throw new Error('Failed to process Sarah response');
    }
    
    const data = await response.json();
    console.log('Sarah response data:', data);
    
    // Extract relevant data
    return {
      chat_id: data.chat_id,
      response: data.response.response,
      next_step: data.response.current_step,
      extracted_info: data.response.extracted_info || {}
    };
  } catch (error) {
    console.error('Error in processSarahResponse:', error);
    throw error;
  }
}

/**
 * Analyze a website URL to extract business intelligence
 */
export async function analyzeWebsite(url: string): Promise<Record<string, any>> {
  try {
    const apiUrl = getFullUrl('/api/website/analyze');
    console.log('Analyzing website:', url, 'at endpoint:', apiUrl);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      console.error('Error analyzing website:', response.status, response.statusText);
      throw new Error('Failed to analyze website');
    }
    
    const data = await response.json();
    console.log('Website analysis data:', data);
    return data;
  } catch (error) {
    console.error('Error in analyzeWebsite:', error);
    throw error;
  }
}

/**
 * Get market intelligence for a specific market
 */
export async function getMarketIntelligence(
  market_name: string,
  product_categories: string[]
): Promise<Record<string, any>> {
  try {
    const url = getFullUrl('/api/market/intelligence');
    console.log('Getting market intelligence for:', market_name, 'with categories:', product_categories);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        market_name,
        product_categories
      })
    });
    
    if (!response.ok) {
      console.error('Error getting market intelligence:', response.status, response.statusText);
      throw new Error('Failed to get market intelligence');
    }
    
    const data = await response.json();
    console.log('Market intelligence data:', data);
    return data;
  } catch (error) {
    console.error('Error in getMarketIntelligence:', error);
    throw error;
  }
}

/**
 * Get market options based on product categories
 */
export async function getMarketOptions(
  product_categories: string[],
  userData?: Record<string, any>
): Promise<MarketOption[]> {
  try {
    const url = getFullUrl('/api/market/options');
    console.log('Getting market options for categories:', product_categories);
    
    // Get user data from localStorage if not provided
    if (!userData) {
      const savedData = localStorage.getItem('assessmentUserData');
      if (savedData) {
        userData = JSON.parse(savedData);
      }
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_categories,
        user_data: userData
      })
    });
    
    if (!response.ok) {
      console.error('Error getting market options:', response.status, response.statusText);
      throw new Error('Failed to get market options');
    }
    
    const data = await response.json();
    console.log('Market options data:', data);
    return data.market_options || [];
  } catch (error) {
    console.error('Error in getMarketOptions:', error);
    throw error;
  }
}

// Add a utility function to reset all assessment-related state
export const resetAssessmentState = () => {
  console.log('Resetting all assessment state');
  // Clear localStorage items that might interfere with assessment restart
  localStorage.removeItem('assessmentResponses');
  localStorage.removeItem('currentStep');
  localStorage.removeItem('assessmentData');
  
  // Return the user to assessment tab
  localStorage.setItem('activeTab', 'assessment');
  
  // Reset hasCompletedAssessment flag for demo purposes
  localStorage.setItem('hasCompletedAssessment', 'false');
  
  return true;
}; 