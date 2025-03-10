# State Manager Implementation

The State Manager maintains persistent business context across interactions, enabling the agent to provide personalized and contextually relevant assistance.

## Implementation Steps

### 1. Create State Types

First, create `src/types/state.ts` with the following state definitions:

```typescript
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
```

### 2. Create State Manager

Next, create `src/agent/state-manager.ts` with the following implementation:

```typescript
import { Database } from '../database/connection';
import { BusinessState, PartialBusinessState } from '../types/state';

export class StateManager {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  async getBusinessState(businessId: string): Promise<BusinessState> {
    try {
      // Retrieve business state from database
      const state = await this.db.businessStates.findOne({ businessId });
      
      if (!state) {
        // Return empty state if not found
        return this.createEmptyBusinessState(businessId);
      }
      
      return state;
    } catch (error) {
      console.error(`Error retrieving business state: ${error.message}`);
      // Return empty state as fallback
      return this.createEmptyBusinessState(businessId);
    }
  }
  
  async updateBusinessState(
    businessId: string, 
    updates: PartialBusinessState
  ): Promise<void> {
    try {
      // Update business state in database
      await this.db.businessStates.updateOne(
        { businessId },
        { $set: updates },
        { upsert: true }
      );
      
      // Record state change in history
      await this.recordStateChange(businessId, updates);
    } catch (error) {
      console.error(`Error updating business state: ${error.message}`);
      throw error;
    }
  }
  
  private createEmptyBusinessState(businessId: string): BusinessState {
    return {
      businessId,
      profile: {
        name: '',
        website: '',
        industry: '',
        size: '',
        exportExperience: '',
        products: [],
        certifications: []
      },
      exportJourney: {
        stage: 'INITIAL',
        targetMarkets: [],
        completedSteps: [],
        currentFocus: [],
        challenges: []
      },
      preferences: {
        notificationPreferences: [],
        autonomySettings: [
          { 
            behaviorType: 'REGULATORY_MONITORING', 
            enabled: true, 
            approvalRequired: false 
          },
          { 
            behaviorType: 'CERTIFICATION_MONITORING', 
            enabled: true, 
            approvalRequired: false 
          },
          { 
            behaviorType: 'MARKET_OPPORTUNITY_DETECTION', 
            enabled: true, 
            approvalRequired: true 
          }
        ],
        feedbackHistory: []
      },
      metrics: {
        assessmentCompleteness: 0,
        exportReadiness: 0,
        complianceStatus: [],
        marketResearchDepth: 0
      },
      history: {
        interactions: [],
        significantEvents: [],
        stateChanges: []
      },
      temporalTriggers: {
        certificationExpirations: [],
        regulatoryDeadlines: [],
        marketEvents: []
      },
      created: new Date(),
      lastUpdated: new Date(),
      lastInteraction: new Date()
    };
  }
  
  private async recordStateChange(
    businessId: string, 
    changes: PartialBusinessState
  ): Promise<void> {
    await this.db.stateHistory.insertOne({
      businessId,
      changes,
      timestamp: new Date()
    });
  }
  
  async getAllBusinessIds(): Promise<string[]> {
    const businesses = await this.db.businessStates
      .find({}, { projection: { businessId: 1 } })
      .toArray();
      
    return businesses.map(b => b.businessId);
  }
}
```

### 3. Create Database Indexes

Add the following to `src/database/setup.ts` to create indexes for efficient state retrieval:

```typescript
// Create indexes for business state
await db.businessStates.createIndex({ businessId: 1 }, { unique: true });
await db.businessStates.createIndex({ 'profile.industry': 1 });
await db.businessStates.createIndex({ 'exportJourney.stage': 1 });
await db.businessStates.createIndex({ lastInteraction: 1 });

// Create indexes for state history
await db.stateHistory.createIndex({ businessId: 1 });
await db.stateHistory.createIndex({ timestamp: 1 });
``` 