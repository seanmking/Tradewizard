// Market Intelligence Types
export interface MarketInfo {
  id: string;
  name: string;
  description: string;
  confidence: number;
  marketSize?: string;
  growthRate?: string | number;
  entryBarriers?: string;
  regulatoryComplexity?: string;
  strengths?: string[];
}

export interface TradeFlowData {
  exporterCountry: string;
  importerCountry: string;
  hsCode: string;
  year: number;
  value: number;
  quantity?: number;
  unit?: string;
  growth?: number;
  marketShare?: number;
}

// Report Types
export interface MarketReport {
  businessName: string;
  productCategories: string[];
  targetMarket: string;
  marketSize: string;
  growthRate: string;
  entryBarriers: string;
  regulatoryRequirements: any[]; // Reference to RegulatoryRequirement from regulatory.ts
  competitorAnalysis: {
    topCompetitors: string[];
    marketShare: Record<string, number>;
    strengthsWeaknesses: Record<string, string[]>;
  };
  opportunityTimeline: {
    months: number;
    milestones: Record<string, string>;
  };
  recommendations: string[];
  generatedDate: string;
}

// Market assessment types
export interface MarketAssessment {
  marketAccessScore: number;
  regulatoryBarriers: number;
  competitivePosition: string;
  tariffRates: {
    average: number;
    specific: Record<string, number>;
  };
  nonTariffBarriers: string[];
  marketTrends: {
    growthRate: number;
    demandForecast: string;
    priceVolatility: string;
  };
} 