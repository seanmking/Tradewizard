import { assessmentService } from './AssessmentService';

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
  next_step: {
    id: string;
    prompt: string;
    type: string;
    market_options?: MarketOption[];
  };
  user_data: Record<string, any>;
  dashboard_updates: Record<string, any>;
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

/**
 * Get the initial question to start the assessment flow
 */
export async function getInitialQuestion(): Promise<{ step_id: string; question: string }> {
  try {
    console.log('Fetching initial question from:', '/api/assessment/initial-question');
    const response = await fetch('/api/assessment/initial-question');
    
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
 * Process a user response in the assessment flow
 */
export async function processAssessmentResponse(
  step_id: string,
  response: string,
  user_data: Record<string, any> = {}
): Promise<AssessmentResponse> {
  const apiResponse = await fetch('/api/assessment/process-response', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      step_id,
      response,
      user_data
    })
  });
  
  if (!apiResponse.ok) {
    throw new Error('Failed to process assessment response');
  }
  
  const data = await apiResponse.json();
  
  // Convert market_options to marketOptions for consistency
  if (data.next_step.market_options) {
    console.log('Market options received from API:', data.next_step.market_options);
    data.next_step.marketOptions = data.next_step.market_options;
  }
  
  return data;
}

/**
 * Start the Sarah-guided assessment flow
 */
export async function startSarahFlow(): Promise<SarahFlowResponse> {
  const response = await fetch('/api/assessment/start-sarah-flow');
  if (!response.ok) {
    throw new Error('Failed to start Sarah assessment flow');
  }
  return await response.json();
}

/**
 * Process a user response in the Sarah-guided assessment flow
 */
export async function processSarahResponse(
  chat_id: string,
  message: string
): Promise<SarahFlowResponse> {
  const apiResponse = await fetch('/api/assessment/sarah-process-response', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id,
      message
    })
  });
  
  if (!apiResponse.ok) {
    throw new Error('Failed to process Sarah response');
  }
  
  const data = await apiResponse.json();
  
  // Convert market_options to marketOptions for consistency
  if (data.market_options) {
    data.marketOptions = data.market_options;
    delete data.market_options;
  }
  
  return data;
}

/**
 * Analyze a website URL to extract business intelligence
 */
export async function analyzeWebsite(url: string): Promise<Record<string, any>> {
  const response = await fetch('/api/assessment/analyze-website', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url })
  });
  
  if (!response.ok) {
    throw new Error('Failed to analyze website');
  }
  
  const data = await response.json();
  return data.analysis;
}

/**
 * Get market intelligence for a specific market
 */
export async function getMarketIntelligence(
  market_name: string,
  product_categories: string[]
): Promise<Record<string, any>> {
  const response = await fetch('/api/assessment/get-market-intelligence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      market_name,
      product_categories
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to get market intelligence');
  }
  
  const data = await response.json();
  return data.intelligence;
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