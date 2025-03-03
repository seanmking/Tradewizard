import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Interface definitions for SideKick API responses
export interface CompanyInfo {
  company_id: string;
  website_url: string;
  company_name: string;
  business_type: string;
  products: Array<{
    name: string;
    category: string;
    description: string;
  }>;
  capabilities: {
    production_capacity?: string;
    certifications?: string[];
    current_markets?: string[];
    current_retailers?: string[];
    [key: string]: any;
  };
  confidence_scores: {
    [key: string]: number;
  };
}

export interface MarketIntelligence {
  market_id: string;
  country: string;
  population: string;
  gdp_per_capita: string;
  market_overview: string;
  distribution_channels: string[];
  tariffs: {
    [key: string]: string;
  };
  consumer_preferences: string[];
  competitors: Array<{
    name: string;
    origin: string;
    market_share: string;
    strengths: string[];
  }>;
  confidence_scores: {
    [key: string]: number;
  };
}

export interface RegulatoryRequirements {
  regulation_id: string;
  country: string;
  product_category: string;
  documentation_requirements: Array<{
    document: string;
    issuing_authority: string;
    description: string;
  }>;
  labeling_requirements: string[];
  import_procedures: string[];
  confidence_scores: {
    [key: string]: number;
  };
}

export interface Dashboard {
  dashboard_id: string;
  company_info: CompanyInfo;
  market_intelligence: {
    [country: string]: MarketIntelligence;
  };
  regulatory_requirements: {
    [country: string]: RegulatoryRequirements;
  };
  generated_at: string;
}

export interface VerifiedDashboard {
  dashboard_id: string;
  verified_info: any;
  status: string;
  verified_at: string;
}

export interface ExportPlan {
  plan_id: string;
  dashboard_id: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  generated_at: string;
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

// SideKick API functions
export async function analyzeSite(
  websiteUrl: string,
  targetMarkets: string[],
  productInfo?: any
): Promise<Dashboard> {
  const response = await fetch(`${API_BASE_URL}/sidekick/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      website_url: websiteUrl,
      target_markets: targetMarkets,
      product_info: productInfo,
    }),
  });
  
  return handleResponse<Dashboard>(response);
}

export async function verifyInformation(
  dashboardId: string,
  verifiedInfo: any
): Promise<VerifiedDashboard> {
  const response = await fetch(`${API_BASE_URL}/sidekick/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dashboard_id: dashboardId,
      verified_info: verifiedInfo,
    }),
  });
  
  return handleResponse<VerifiedDashboard>(response);
}

export async function generateExportPlan(dashboardId: string): Promise<ExportPlan> {
  const response = await fetch(`${API_BASE_URL}/sidekick/generate-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dashboard_id: dashboardId,
    }),
  });
  
  return handleResponse<ExportPlan>(response);
}

// SideKick state management with Zustand
interface SideKickState {
  dashboard: Dashboard | null;
  verifiedDashboard: VerifiedDashboard | null;
  exportPlan: ExportPlan | null;
  isLoading: boolean;
  error: string | null;
}

interface SideKickStore extends SideKickState {
  setDashboard: (dashboard: Dashboard | null) => void;
  setVerifiedDashboard: (verifiedDashboard: VerifiedDashboard | null) => void;
  setExportPlan: (exportPlan: ExportPlan | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearState: () => void;
  
  // Async actions
  analyzeSite: (websiteUrl: string, targetMarkets: string[], productInfo?: any) => Promise<void>;
  verifyInformation: (dashboardId: string, verifiedInfo: any) => Promise<void>;
  generateExportPlan: (dashboardId: string) => Promise<void>;
}

export const useSideKickStore = create<SideKickStore>((set) => ({
  dashboard: null,
  verifiedDashboard: null,
  exportPlan: null,
  isLoading: false,
  error: null,
  
  setDashboard: (dashboard) => set({ dashboard }),
  setVerifiedDashboard: (verifiedDashboard) => set({ verifiedDashboard }),
  setExportPlan: (exportPlan) => set({ exportPlan }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearState: () => set({
    dashboard: null,
    verifiedDashboard: null,
    exportPlan: null,
    error: null,
  }),
  
  // Async actions
  analyzeSite: async (websiteUrl, targetMarkets, productInfo) => {
    set({ isLoading: true, error: null });
    try {
      const dashboard = await analyzeSite(websiteUrl, targetMarkets, productInfo);
      set({ dashboard, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
    }
  },
  
  verifyInformation: async (dashboardId, verifiedInfo) => {
    set({ isLoading: true, error: null });
    try {
      const verifiedDashboard = await verifyInformation(dashboardId, verifiedInfo);
      set({ verifiedDashboard, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
    }
  },
  
  generateExportPlan: async (dashboardId) => {
    set({ isLoading: true, error: null });
    try {
      const exportPlan = await generateExportPlan(dashboardId);
      set({ exportPlan, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
    }
  },
}));

// New types and service
export interface Competitor {
  name: string;
  market_share: string;
}

export interface Market {
  name: string;
  market_size: string;
  growth_rate: string;
  competitors: Competitor[];
  confidence_score: number;
  selected?: boolean;
}

export interface SimpleRegulatoryRequirements {
  certifications: string[];
  import_duties: string;
  documentation: string[];
  confidence_score: number;
}

export interface ExportPlanSections {
  executive_summary: string;
  company_overview: string;
  market_analysis: string;
  entry_strategy: string;
  regulatory_compliance: string;
  financial_projections: string;
  risk_assessment: string;
  implementation_timeline: string;
}

export interface ExportPlanType {
  title: string;
  generated_at: string;
  sections: ExportPlanSections;
}

// Service
export const SideKickService = {
  processInitialInput: async (companyName: string, businessType: string): Promise<Dashboard> => {
    try {
      const response = await axios.post<{dashboard: Dashboard}>(`${API_BASE_URL}/sidekick/process-initial-input`, {
        company_name: companyName,
        business_type: businessType
      });
      return response.data.dashboard;
    } catch (error) {
      console.error('Error processing initial input:', error);
      throw error;
    }
  },

  generateExportPlan: async (dashboard: Dashboard): Promise<ExportPlanType> => {
    try {
      const response = await axios.post<{plan: ExportPlanType}>(`${API_BASE_URL}/sidekick/generate-export-plan`, {
        dashboard
      });
      return response.data.plan;
    } catch (error) {
      console.error('Error generating export plan:', error);
      throw error;
    }
  }
};

// New types and service for the simplified SideKick implementation
export interface SimplifiedCompanyInfo {
  name: string;
  business_type: string;
  products: string[];
  capabilities: string[];
  confidence_score: number;
}

export interface SimplifiedCompetitor {
  name: string;
  market_share: string;
}

export interface SimplifiedMarket {
  name: string;
  market_size: string;
  growth_rate: string;
  competitors: SimplifiedCompetitor[];
  confidence_score: number;
  selected?: boolean;
}

export interface SimplifiedRegulatoryRequirements {
  certifications: string[];
  import_duties: string;
  documentation: string[];
  confidence_score: number;
}

export interface SimplifiedDashboardData {
  company_info: CompanyInfo;
  market_intelligence: {
    potential_markets: Market[];
  };
  regulatory_requirements: SimpleRegulatoryRequirements;
}

export interface SimplifiedExportPlanSections {
  executive_summary: string;
  company_overview: string;
  market_analysis: string;
  entry_strategy: string;
  regulatory_compliance: string;
  financial_projections: string;
  risk_assessment: string;
  implementation_timeline: string;
}

export interface SimplifiedExportPlanType {
  title: string;
  generated_at: string;
  sections: SimplifiedExportPlanSections;
}

// Service for the simplified SideKick implementation
export const SimplifiedSideKickService = {
  processInitialInput: async (companyName: string, businessType: string): Promise<any> => {
    try {
      const response = await axios.post<{dashboard: any}>(`${API_BASE_URL}/sidekick/process-initial-input`, {
        company_name: companyName,
        business_type: businessType
      });
      return response.data.dashboard;
    } catch (error) {
      console.error('Error processing initial input:', error);
      throw error;
    }
  },

  generateExportPlan: async (dashboard: any): Promise<any> => {
    try {
      const response = await axios.post<{plan: any}>(`${API_BASE_URL}/sidekick/generate-export-plan`, {
        dashboard
      });
      return response.data.plan;
    } catch (error) {
      console.error('Error generating export plan:', error);
      throw error;
    }
  }
}; 