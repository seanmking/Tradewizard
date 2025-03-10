import { Database } from '../database/connection';
import { BusinessState, PartialBusinessState } from '../types/state';

/**
 * The StateManager maintains persistent business context across interactions,
 * enabling the agent to provide personalized and contextually relevant assistance.
 */
export class StateManager {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  /**
   * Retrieves the business state for a given business ID.
   * If no state exists, creates an empty state.
   */
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
  
  /**
   * Updates the business state with the provided updates.
   * Records the state change in history.
   */
  async updateBusinessState(
    businessId: string, 
    updates: PartialBusinessState
  ): Promise<void> {
    try {
      // Update lastUpdated timestamp
      const updatesWithTimestamp = {
        ...updates,
        lastUpdated: new Date()
      };
      
      // Update business state in database
      await this.db.businessStates.updateOne(
        { businessId },
        { $set: updatesWithTimestamp },
        { upsert: true }
      );
      
      // Record state change in history
      await this.recordStateChange(businessId, updates);
    } catch (error) {
      console.error(`Error updating business state: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Creates an empty business state with default values.
   */
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
  
  /**
   * Records a state change in the history collection.
   */
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
  
  /**
   * Retrieves all business IDs in the system.
   */
  async getAllBusinessIds(): Promise<string[]> {
    const businesses = await this.db.businessStates
      .find({}, { projection: { businessId: 1 } })
      .toArray();
      
    return businesses.map(b => b.businessId);
  }
  
  /**
   * Records a significant event in the business history.
   */
  async recordSignificantEvent(
    businessId: string,
    type: string,
    description: string
  ): Promise<void> {
    const business = await this.getBusinessState(businessId);
    
    await this.updateBusinessState(businessId, {
      history: {
        ...business.history,
        significantEvents: [
          ...business.history.significantEvents,
          {
            type,
            description,
            timestamp: new Date()
          }
        ]
      }
    });
  }
  
  /**
   * Records an interaction in the business history.
   */
  async recordInteraction(
    businessId: string,
    type: string,
    request: any,
    success: boolean
  ): Promise<void> {
    const business = await this.getBusinessState(businessId);
    
    await this.updateBusinessState(businessId, {
      history: {
        ...business.history,
        interactions: [
          ...business.history.interactions,
          {
            type,
            request,
            success,
            timestamp: new Date()
          }
        ]
      },
      lastInteraction: new Date()
    });
  }
} 