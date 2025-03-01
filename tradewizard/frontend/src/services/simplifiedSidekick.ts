import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Types for the simplified SideKick implementation
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

export interface SimplifiedDashboard {
  company_info: SimplifiedCompanyInfo;
  market_intelligence: {
    potential_markets: SimplifiedMarket[];
  };
  regulatory_requirements: SimplifiedRegulatoryRequirements;
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

// Response types for API calls
interface ProcessInitialInputResponse {
  dashboard: SimplifiedDashboard;
}

interface GenerateExportPlanResponse {
  plan: SimplifiedExportPlanType;
}

// Service for the simplified SideKick implementation
export const SimplifiedSideKickService = {
  processInitialInput: async (companyName: string, businessType: string): Promise<SimplifiedDashboard> => {
    try {
      const response = await axios.post<ProcessInitialInputResponse>(`${API_BASE_URL}/sidekick/process-initial-input`, {
        company_name: companyName,
        business_type: businessType
      });
      return response.data.dashboard;
    } catch (error) {
      console.error('Error processing initial input:', error);
      throw error;
    }
  },

  generateExportPlan: async (dashboard: SimplifiedDashboard): Promise<SimplifiedExportPlanType> => {
    try {
      const response = await axios.post<GenerateExportPlanResponse>(`${API_BASE_URL}/sidekick/generate-export-plan`, {
        dashboard
      });
      return response.data.plan;
    } catch (error) {
      console.error('Error generating export plan:', error);
      throw error;
    }
  }
}; 