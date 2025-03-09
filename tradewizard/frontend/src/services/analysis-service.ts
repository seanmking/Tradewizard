/**
 * Analysis Service
 * 
 * This service provides methods to interact with the analysis API endpoints
 * from the export_intelligence backend.
 */

import axios from 'axios';
import { handleApiError } from '../utils/error-handler';

// Export a centralized API configuration
export const API_ENDPOINTS = {
  // Backend API
  BACKEND_BASE: process.env.REACT_APP_API_URL || 'http://localhost:5002',
  
  // Analysis API endpoints
  MARKET_POTENTIAL: '/api/market/potential',
  MARKET_TRENDS: '/api/market/trends',
  EXPORT_READINESS: '/api/export-readiness',
  REGULATORY_REQUIREMENTS: '/api/regulatory/requirements',
  TIMELINE_OPTIONS: '/api/timeline/options',
  TIMELINE_ESTIMATE: '/api/timeline/estimate',
  RESOURCE_ESTIMATE: '/api/resources/estimate',
  ROI_ESTIMATE: '/api/resources/roi',
  FUNDING_OPTIONS: '/api/resources/funding',
  
  // Assessment API endpoints
  INITIAL_QUESTION: '/api/assessment/initial-question',
  PROCESS_RESPONSE: '/api/assessment/process-response',
  
  // Full URLs (for easier use)
  getFullUrl(endpoint: string): string {
    // If endpoint already starts with /api, don't modify it
    if (endpoint.startsWith('/api/')) {
      return `${this.BACKEND_BASE}${endpoint}`;
    }
    // Otherwise add /api/ prefix to ensure consistency
    return `${this.BACKEND_BASE}/api${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }
};

// Common interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

export interface MarketData {
  country: string;
  marketSize: number;
  growthRate: number;
  competitorCount: number;
  entryBarriers: string[];
  consumptionPatterns: string[];
  pricingTrends: string[];
  score: number;
}

export interface MarketPotentialResult {
  market_size: number;
  growth_rate: number;
  risk_score: number;
  analysis_date: string;
}

export interface MarketTrendsResult {
  trends: string[];
}

export interface ExportReadinessReport {
  company_name: string;
  target_market: string;
  analysis_date: string;
  market_fit_score: number;
  regulatory_readiness: number;
  strengths: string[];
  areas_for_improvement: string[];
  key_trends: string[];
  regulatory_requirements: string[];
}

export interface Document {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  estimatedCost: number;
  estimatedTimeInWeeks: number;
  details: string;
}

export interface RegulatoryRequirementsResult {
  markets: {
    [key: string]: {
      documents: Document[];
    };
  };
}

export interface Milestone {
  label: string;
  duration: string;
}

export interface TimelineOption {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  milestones: Milestone[];
  image?: string;
}

export interface TimelineOptionsResult {
  options: TimelineOption[];
}

export interface ResourceEstimateResult {
  cost_estimate: {
    currency: string;
    min: number;
    max: number;
    breakdown: {
      product_adaptation: number;
      certification: number;
      logistics: number;
      marketing: number;
      other: number;
    };
  };
  timeline_estimate: {
    timeline_option: string;
    total_weeks: number;
    start_date: string;
    estimated_completion_date: string;
  };
  team_requirements: Array<{
    role: string;
    commitment: string;
  }>;
}

export interface MarketTrend {
  trend: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  timeframe: string;
  relevance: number;
}

export interface RegulatoryRequirement {
  category: string;
  requirements: string[];
  complexity: 'High' | 'Medium' | 'Low';
  timeToObtain: string;
  estimatedCost: number;
}

export interface ComplianceStatus {
  requirement: string;
  status: 'Complete' | 'In Progress' | 'Not Started';
  progress: number;
  nextSteps?: string[];
}

export interface ROIEstimate {
  investmentAmount: number;
  projectedReturns: number;
  projectedROI: number; // percentage
  paybackPeriod: number; // months
  breakEvenPoint: {
    units: number;
    revenue: number;
  };
  riskAssessment: 'High' | 'Medium' | 'Low';
}

export interface FundingOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  suitability: 'High' | 'Medium' | 'Low';
  applicationProcess: string;
}

/**
 * Analysis service for interacting with the export intelligence backend
 */
class AnalysisService {
  private baseUrl = API_ENDPOINTS.BACKEND_BASE;

  /**
   * Analyze market potential for a given market
   * @param marketData Market data for analysis
   * @returns Market potential analysis result
   */
  async analyzeMarketPotential(marketData: MarketData): Promise<MarketPotentialResult> {
    try {
      const response = await axios.post<ApiResponse<MarketPotentialResult>>(
        `${API_ENDPOINTS.getFullUrl('/market/potential')}`, 
        { market_data: marketData }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error analyzing market potential:', error);
      throw error;
    }
  }
  
  /**
   * Identify key trends in a target market
   * @param marketData Market data for analysis
   * @returns List of key market trends
   */
  async identifyMarketTrends(marketData: MarketData): Promise<string[]> {
    try {
      const response = await axios.post<ApiResponse<MarketTrendsResult>>(
        `${API_ENDPOINTS.getFullUrl('/market/trends')}`, 
        { market_data: marketData }
      );
      
      return response.data.data.trends;
    } catch (error) {
      console.error('Error identifying market trends:', error);
      throw error;
    }
  }
  
  /**
   * Generate a comprehensive export readiness report
   * @param userData User profile and business data
   * @param market Target market for export
   * @returns Export readiness report
   */
  async getExportReadinessReport(
    userData: Record<string, any>, 
    market: string
  ): Promise<ExportReadinessReport> {
    try {
      console.log('\n        \n        \n       Fetching from:', `${API_ENDPOINTS.getFullUrl('/api/export-readiness')}`);
      const response = await axios.post(`${API_ENDPOINTS.getFullUrl('/api/export-readiness')}`, {
        userData,
        market
      });
      return response.data as ExportReadinessReport;
    } catch (error) {
      console.error('Error generating export readiness report:', error);
      
      // Return a fallback report in case of error
      return {
        company_name: userData.business_name || 'Your Company',
        target_market: market,
        analysis_date: new Date().toISOString().split('T')[0],
        market_fit_score: 75,
        regulatory_readiness: 60,
        strengths: ['Quality products', 'Established domestic presence', 'Strong brand values'],
        areas_for_improvement: ['International certifications needed', 'Export documentation experience', 'International marketing strategy'],
        key_trends: [],
        regulatory_requirements: []
      };
    }
  }
  
  /**
   * Get regulatory requirements for specified markets
   * @param industry Industry category
   * @param markets List of target markets
   * @returns Regulatory requirements for each market
   */
  async getRegulatoryRequirements(
    industry: string, 
    markets: string[]
  ): Promise<RegulatoryRequirementsResult> {
    try {
      const response = await axios.post<ApiResponse<RegulatoryRequirementsResult>>(
        `${API_ENDPOINTS.getFullUrl('/regulatory/requirements')}`, 
        { 
          industry,
          markets
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching regulatory requirements:', error);
      throw error;
    }
  }
  
  /**
   * Get export timeline options
   * @param industry Industry category
   * @param markets List of target markets
   * @returns Timeline options
   */
  async getTimelineOptions(
    industry: string, 
    markets: string[]
  ): Promise<TimelineOption[]> {
    try {
      const response = await axios.post<ApiResponse<TimelineOptionsResult>>(
        `${API_ENDPOINTS.getFullUrl('/timeline/options')}`, 
        { 
          industry,
          markets
        }
      );
      
      return response.data.data.options;
    } catch (error) {
      console.error('Error fetching timeline options:', error);
      throw error;
    }
  }
  
  /**
   * Get resource requirement estimates
   * @param industry Industry category
   * @param markets List of target markets
   * @param timelineOption Selected timeline option (standard, accelerated, conservative)
   * @returns Resource estimate details
   */
  async getResourceEstimate(
    industry: string, 
    markets: string[],
    timelineOption: string = 'standard'
  ): Promise<ResourceEstimateResult> {
    try {
      const response = await axios.post<ApiResponse<ResourceEstimateResult>>(
        `${API_ENDPOINTS.getFullUrl('/resources/estimate')}`, 
        { 
          industry,
          markets,
          timeline_option: timelineOption
        }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error estimating resources:', error);
      throw error;
    }
  }

  public async getMarketPotential(industry: string, markets: string[]): Promise<MarketData[]> {
    try {
      const response = await axios.post(`${API_ENDPOINTS.getFullUrl('/api/market/potential')}`, {
        industry,
        markets
      });
      return response.data as MarketData[];
    } catch (error) {
      handleApiError(error, 'Error fetching market potential data');
      return []; // This line will never be reached due to handleApiError throwing an error
    }
  }

  public async getMarketTrends(industry: string, markets: string[]): Promise<MarketTrend[]> {
    try {
      const response = await axios.post(`${API_ENDPOINTS.getFullUrl('/api/market/trends')}`, {
        industry,
        markets
      });
      return response.data as MarketTrend[];
    } catch (error) {
      handleApiError(error, 'Error fetching market trends data');
      return [];
    }
  }

  public async getComplianceStatus(industry: string, markets: string[]): Promise<ComplianceStatus[]> {
    try {
      const response = await axios.post(`${API_ENDPOINTS.getFullUrl('/api/export-readiness')}`, {
        industry,
        markets
      });
      const data = response.data as any;
      return (data.complianceStatus || []) as ComplianceStatus[];
    } catch (error) {
      handleApiError(error, 'Error fetching compliance status');
      return [];
    }
  }

  public async getTimelineEstimate(industry: string, markets: string[], timelineOption: string): Promise<any> {
    try {
      const response = await axios.post(`${API_ENDPOINTS.getFullUrl('/api/timeline/estimate')}`, {
        industry,
        markets,
        timelineOption
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error fetching timeline estimate');
      return null;
    }
  }

  public async getROIEstimate(industry: string, markets: string[], timelineOption: string): Promise<ROIEstimate> {
    try {
      const response = await axios.post(`${API_ENDPOINTS.getFullUrl('/api/resources/roi')}`, {
        industry,
        markets,
        timelineOption
      });
      return response.data as ROIEstimate;
    } catch (error) {
      handleApiError(error, 'Error fetching ROI estimates');
      return {} as ROIEstimate;
    }
  }

  public async getFundingOptions(industry: string, markets: string[]): Promise<FundingOption[]> {
    try {
      const response = await axios.post(`${API_ENDPOINTS.getFullUrl('/api/resources/funding')}`, {
        industry,
        markets
      });
      return response.data as FundingOption[];
    } catch (error) {
      handleApiError(error, 'Error fetching funding options');
      return [];
    }
  }
}

const analysisService = new AnalysisService();
export default analysisService; 