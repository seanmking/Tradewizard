// Tool Types
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}

// LLM Types
export interface LLM {
  complete: (options: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
  }) => Promise<string>;
}

// Integration Types
export interface AssessmentIntegration {
  exportReadiness: {
    overallScore: number;
    dimensionScores: Record<string, number>;
    regulatoryCompliance: number;
  };
  marketIntelligence: {
    marketAccessScore: number;
    regulatoryBarriers: number;
    competitivePosition: string;
  };
  regulatoryCompliance: {
    complianceScore: number;
    missingRequirements: number;
    timeline: number;
    estimatedCost: string;
  };
} 