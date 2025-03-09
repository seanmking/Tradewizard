// Business Analysis Types
export interface BusinessCategory {
  mainSector: string;
  subSector: string;
  attributes: string[];
  confidence: number;
}

export interface BusinessAnalysis {
  businessName: string;
  website: string;
  categories: BusinessCategory[];
  products: ProductInfo[];
  markets: {
    current: string[];
    confidence: number;
  };
  certifications: {
    items: string[];
    confidence: number;
  };
  businessDetails: {
    estimatedSize: string;
    yearsOperating: string;
    confidence: number;
  };
}

export interface ProductInfo {
  name: string;
  description?: string;
  hsCode?: string;
  price?: string;
}

// HS Code Types
export interface HSCodeMapping {
  product: string;
  hsCode: string;
  description: string;
  confidence: number;
  metadata: Record<string, any>;
}

// Website analysis types
export interface WebsiteAnalysis {
  businessProfile: {
    products: {
      name: string;
      description: string;
      category: string;
      estimatedHsCode: string;
    }[];
    certifications: string[];
    marketFocus: string[];
  };
  regulatoryImplications: {
    suggestedRequirements: string[];
    potentialCompliance: string[];
    riskAreas: string[];
  };
}

// Export readiness assessment types
export interface ExportReadinessAssessment {
  overallScore: number;
  dimensionScores: Record<string, number>;
  regulatoryCompliance: number;
  recommendations: string[];
  timeline: {
    readinessEstimate: string;
    keyMilestones: string[];
  };
} 