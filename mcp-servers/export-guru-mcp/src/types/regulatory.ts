// Regulatory Types
export interface RegulatoryRequirement {
  country: string;
  productCategory: string;
  hsCode?: string;
  requirementType: string;
  description: string;
  agency?: string;
  url?: string;
  lastUpdated?: string;
  confidence: number;
}

// Enhanced regulatory requirement as described in the implementation plan
export interface EnhancedRegulatoryRequirement extends Omit<RegulatoryRequirement, 'agency'> {
  confidenceLevel: number;  // 0-1 scale indicating confidence in the data
  frequency: "once-off" | "ongoing" | "periodic";  // How often requirement needs attention
  updateFrequency: {
    recommendedSchedule: string;  // e.g., "Quarterly", "Biannually"
    sourcesToMonitor: string[];   // URLs to monitor for changes
    countrySpecificNotes: string; // Country-specific update considerations
  };
  requirementType: string;  // Categorized requirement type
  agency: {
    name: string;
    country: string;
    contactEmail?: string;
    contactPhone?: string;
    website: string;
  };
}

// Compliance assessment types
export interface ComplianceAssessment {
  overallScore: number;
  weightedScore: number;
  satisfiedRequirements: EnhancedRegulatoryRequirement[];
  missingRequirements: EnhancedRegulatoryRequirement[];
  partiallyCompliantRequirements: EnhancedRegulatoryRequirement[];
} 