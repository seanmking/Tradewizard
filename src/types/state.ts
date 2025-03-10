export interface BusinessState {
  businessId: string;
  profile: BusinessProfile;
  exportJourney: ExportJourney;
  preferences: UserPreferences;
  metrics: BusinessMetrics;
  history: BusinessHistory;
  temporalTriggers: TemporalTriggers;
  created: Date;
  lastUpdated: Date;
  lastInteraction: Date;
}

export interface BusinessProfile {
  name: string;
  website: string;
  industry: string;
  size: string;
  exportExperience: string;
  products: Product[];
  certifications: Certification[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  created: Date;
}

export interface Certification {
  id: string;
  name: string;
  type: string;
  issuer: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
}

export interface ExportJourney {
  stage: ExportStage;
  targetMarkets: TargetMarket[];
  completedSteps: CompletedStep[];
  currentFocus: string[];
  challenges: Challenge[];
  opportunities?: MarketOpportunity[];
}

export interface TargetMarket {
  country: string;
  addedAt: Date;
  status: 'NEW' | 'RESEARCHING' | 'COMPLIANT' | 'ACTIVE';
  marketSize?: number;
  growthRate?: number;
}

export interface CompletedStep {
  type: string;
  completedAt: Date;
  score?: number;
}

export interface Challenge {
  type: string;
  details: any;
  impact: any;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: Date;
}

export interface MarketOpportunity {
  market: string;
  product: string;
  score: number;
  reasons: string[];
  detectedAt: Date;
  status: 'NEW' | 'VIEWED' | 'ACCEPTED' | 'REJECTED';
}

export interface UserPreferences {
  notificationPreferences: NotificationPreference[];
  autonomySettings: AutonomySetting[];
  feedbackHistory: Feedback[];
}

export interface NotificationPreference {
  type: string;
  channel: 'EMAIL' | 'IN_APP' | 'SMS';
  enabled: boolean;
}

export interface AutonomySetting {
  behaviorType: string;
  enabled: boolean;
  approvalRequired: boolean;
}

export interface Feedback {
  type: string;
  rating: number;
  comment?: string;
  timestamp: Date;
}

export interface BusinessMetrics {
  assessmentCompleteness: number;
  exportReadiness: number;
  complianceStatus: ComplianceStatus[];
  marketResearchDepth: number;
}

export interface ComplianceStatus {
  market: string;
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' | 'UNKNOWN';
  lastChecked: Date;
}

export interface BusinessHistory {
  interactions: Interaction[];
  significantEvents: SignificantEvent[];
  stateChanges: StateChange[];
}

export interface Interaction {
  type: string;
  timestamp: Date;
  request: any;
  success: boolean;
}

export interface SignificantEvent {
  type: string;
  description: string;
  timestamp: Date;
}

export interface StateChange {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
}

export interface TemporalTriggers {
  certificationExpirations: ExpirationTrigger[];
  regulatoryDeadlines: DeadlineTrigger[];
  marketEvents: EventTrigger[];
}

export interface ExpirationTrigger {
  certificationType: string;
  expiryDate: Date;
  notifiedAt: Date;
  status: 'PENDING' | 'NOTIFIED' | 'RENEWED';
}

export interface DeadlineTrigger {
  requirementId: string;
  deadline: Date;
  notifiedAt: Date;
  status: 'PENDING' | 'NOTIFIED' | 'COMPLETED';
}

export interface EventTrigger {
  eventType: string;
  eventDate: Date;
  notifiedAt: Date;
  status: 'PENDING' | 'NOTIFIED';
}

export type PartialBusinessState = Partial<BusinessState>;

export type ExportStage = 
  | 'INITIAL' 
  | 'ASSESSMENT' 
  | 'MARKET_RESEARCH' 
  | 'COMPLIANCE_PLANNING' 
  | 'MARKET_ENTRY' 
  | 'SCALING'; 