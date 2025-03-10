/**
 * Streamlined state model for the TradeWizard AI Agent.
 * Focuses on essential business attributes that impact regulatory requirements.
 */

export interface StreamlinedBusinessState {
  businessId: string;
  profile: {
    name: string;
    industry: string;
    size: string;
    products: Array<{
      id: string;
      name: string;
      category: string;
    }>;
    certifications: Array<{
      id: string;
      name: string;
      issueDate: Date;
      expiryDate: Date;
      status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
    }>;
  };
  exportJourney: {
    stage: 'INITIAL' | 'ASSESSMENT' | 'MARKET_RESEARCH' | 'COMPLIANCE_PLANNING' | 'MARKET_ENTRY';
    targetMarkets: Array<{
      country: string;
      status: 'NEW' | 'RESEARCHING' | 'COMPLIANT' | 'ACTIVE';
    }>;
    completedSteps: Array<{
      type: string;
      completedAt: Date;
    }>;
  };
  preferences: {
    notificationPreferences: Array<{
      type: string;
      enabled: boolean;
    }>;
  };
  lastUpdated: Date;
}

/**
 * Streamlined market report structure focusing on essential data only.
 */
export interface StreamlinedMarketReport {
  country: string;
  marketSize: number; // Annual market value in USD
  growthRate: number; // 3-year trend percentage
  entryRequirements: string[]; // 3-5 bullet points
  competitiveCategory: 'HIGH' | 'MODERATE' | 'EMERGING';
  tariffPercentage: number; // Primary product category
  generatedDate: Date;
}

/**
 * Simplified regulatory requirement with timeline data.
 */
export interface StreamlinedRequirement {
  id: string;
  market: string;
  name: string;
  description: string;
  issuingAuthority: {
    name: string;
    website?: string;
    contactInfo?: string;
  };
  processingTime: number; // In days
  estimatedCost: {
    amount: number;
    currency: string;
  };
  prerequisiteIds: string[]; // IDs of requirements that must be completed first
  isMandatory: boolean;
}

/**
 * Action-oriented notification template.
 */
export interface ActionNotification {
  id: string;
  businessId: string;
  title: string;
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actions: Array<{
    label: string;    // Clear action description
    action: string;   // Action identifier
    data: any;        // Action parameters
  }>;
  read: boolean;
  createdAt: Date;
}

/**
 * Streamlined regulatory event types.
 */
export enum CoreEventType {
  // Essential business events
  BUSINESS_PROFILE_UPDATED = 'BUSINESS_PROFILE_UPDATED',
  MARKET_SELECTED = 'MARKET_SELECTED',
  
  // Core regulatory events
  REGULATORY_REQUIREMENT_DETECTED = 'REGULATORY_REQUIREMENT_DETECTED',
  CERTIFICATION_EXPIRING = 'CERTIFICATION_EXPIRING',
  
  // Essential notification events
  NOTIFICATION_CREATED = 'NOTIFICATION_CREATED',
  NOTIFICATION_ACTION_TAKEN = 'NOTIFICATION_ACTION_TAKEN'
}

export type PartialStreamlinedBusinessState = Partial<StreamlinedBusinessState>; 