// Type declarations for import.meta.env
interface ImportMetaEnv {
  VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface ValidationResult {
  is_valid: boolean;
  suggestions: string[];
  confidence: number;
  field_type: string;
  value: string;
  metadata: Record<string, any>;
}

export interface AssessmentStep {
  id: string;
  name: string;
  description: string;
  required_fields: string[];
  validation_rules: Record<string, any>;
}

export interface AssessmentProgress {
  current_step: string;
  total_steps: number;
  current_step_index: number;
  is_complete: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface BusinessInfo {
  company_name?: string;
  registration_number?: string;
  tax_number?: string;
  contact_details?: {
    email: string;
    [key: string]: any;
  };
  sector?: string;
  subcategory?: string;
  [key: string]: any;
}

// API Client
class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    // Get API URL from environment or use default
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    this.client = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true // Important for session handling
    });
    
    // Add response interceptor for debugging
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }
  
  // Helper method for making requests
  protected async makeRequest<T>(
    method: string,
    url: string,
    data?: any
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request({
        method,
        url,
        data
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || error.response.data.error);
      }
      throw error;
    }
  }
}

// Assessment API
export class AssessmentApi extends ApiClient {
  /**
   * Start a new assessment session
   */
  async startAssessment(): Promise<{
    session_id: string;
    current_step: AssessmentStep;
    progress: AssessmentProgress;
  }> {
    return this.makeRequest('POST', '/api/assessment/start');
  }
  
  /**
   * Validate a single field
   */
  async validateField(field: string, value: any): Promise<ValidationResult> {
    return this.makeRequest('POST', '/api/assessment/validate', {
      field,
      value
    });
  }
  
  /**
   * Validate all fields in current step
   */
  async validateStep(): Promise<{
    is_valid: boolean;
    field_results: Record<string, ValidationResult>;
    missing_fields: string[];
  }> {
    return this.makeRequest('POST', '/api/assessment/step/validate');
  }
  
  /**
   * Advance to next step
   */
  async nextStep(): Promise<{
    success: boolean;
    current_step: AssessmentStep;
    progress: AssessmentProgress;
    is_complete: boolean;
  }> {
    return this.makeRequest('POST', '/api/assessment/step/next');
  }
  
  /**
   * Get current assessment progress
   */
  async getProgress(): Promise<{
    current_step: AssessmentStep;
    progress: AssessmentProgress;
    business_info: BusinessInfo;
    validation_status: {
      is_valid: boolean;
      errors: string[];
      warnings: string[];
      suggestions: string[];
    };
  }> {
    return this.makeRequest('GET', '/api/assessment/progress');
  }
}

// Create and export instance
export const assessmentApi = new AssessmentApi(); 