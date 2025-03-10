import { Database } from '../database/connection';
import { StreamlinedBusinessState, PartialStreamlinedBusinessState } from '../types/streamlined-state';

/**
 * The StreamlinedStateManager maintains persistent business context across interactions,
 * focusing only on critical business attributes that impact regulatory requirements.
 */
export class StreamlinedStateManager {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  /**
   * Retrieves the business state for a given business ID.
   * If no state exists, creates an empty state.
   */
  async getBusinessState(businessId: string): Promise<StreamlinedBusinessState> {
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
   */
  async updateBusinessState(
    businessId: string, 
    updates: PartialStreamlinedBusinessState
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
    } catch (error) {
      console.error(`Error updating business state: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Creates an empty business state with default values.
   */
  private createEmptyBusinessState(businessId: string): StreamlinedBusinessState {
    return {
      businessId,
      profile: {
        name: '',
        industry: '',
        size: '',
        products: [],
        certifications: []
      },
      exportJourney: {
        stage: 'INITIAL',
        targetMarkets: [],
        completedSteps: []
      },
      preferences: {
        notificationPreferences: []
      },
      lastUpdated: new Date()
    };
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
   * Adds a certification to a business profile.
   */
  async addCertification(
    businessId: string,
    certification: {
      id: string;
      name: string;
      issueDate: Date;
      expiryDate: Date;
      status: 'ACTIVE' | 'EXPIRED' | 'PENDING';
    }
  ): Promise<void> {
    const business = await this.getBusinessState(businessId);
    const certifications = [...business.profile.certifications, certification];
    
    await this.updateBusinessState(businessId, {
      profile: {
        ...business.profile,
        certifications
      }
    });
  }
  
  /**
   * Updates a certification status.
   */
  async updateCertificationStatus(
    businessId: string,
    certificationId: string,
    status: 'ACTIVE' | 'EXPIRED' | 'PENDING'
  ): Promise<void> {
    const business = await this.getBusinessState(businessId);
    const certifications = business.profile.certifications.map(cert => 
      cert.id === certificationId ? { ...cert, status } : cert
    );
    
    await this.updateBusinessState(businessId, {
      profile: {
        ...business.profile,
        certifications
      }
    });
  }
  
  /**
   * Adds a target market to a business's export journey.
   */
  async addTargetMarket(
    businessId: string,
    country: string
  ): Promise<void> {
    const business = await this.getBusinessState(businessId);
    
    // Check if market already exists
    if (business.exportJourney.targetMarkets.some(m => m.country === country)) {
      return;
    }
    
    const targetMarkets = [
      ...business.exportJourney.targetMarkets,
      {
        country,
        status: 'NEW' as const
      }
    ];
    
    await this.updateBusinessState(businessId, {
      exportJourney: {
        ...business.exportJourney,
        targetMarkets
      }
    });
  }
  
  /**
   * Updates a target market status.
   */
  async updateTargetMarketStatus(
    businessId: string,
    country: string,
    status: 'NEW' | 'RESEARCHING' | 'COMPLIANT' | 'ACTIVE'
  ): Promise<void> {
    const business = await this.getBusinessState(businessId);
    const targetMarkets = business.exportJourney.targetMarkets.map(market => 
      market.country === country ? { ...market, status } : market
    );
    
    await this.updateBusinessState(businessId, {
      exportJourney: {
        ...business.exportJourney,
        targetMarkets
      }
    });
  }
  
  /**
   * Records a completed step in the export journey.
   */
  async recordCompletedStep(
    businessId: string,
    type: string
  ): Promise<void> {
    const business = await this.getBusinessState(businessId);
    const completedSteps = [
      ...business.exportJourney.completedSteps,
      {
        type,
        completedAt: new Date()
      }
    ];
    
    await this.updateBusinessState(businessId, {
      exportJourney: {
        ...business.exportJourney,
        completedSteps
      }
    });
  }
} 