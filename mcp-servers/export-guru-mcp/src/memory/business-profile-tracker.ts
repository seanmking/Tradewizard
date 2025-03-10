import { BusinessProfile } from '../types';
import { EventSystem } from '../agent/event-system';

/**
 * Profile change type
 */
export enum ProfileChangeType {
  ADDITION = 'ADDITION',
  REMOVAL = 'REMOVAL',
  MODIFICATION = 'MODIFICATION'
}

/**
 * Profile change structure
 */
export interface ProfileChange {
  field: string;
  type: ProfileChangeType;
  previousValue?: any;
  newValue?: any;
  timestamp: Date;
}

/**
 * Profile changes structure
 */
export interface ProfileChanges {
  businessId: string;
  timestamp: Date;
  changes: ProfileChange[];
  significanceScore: number;
}

/**
 * Profile snapshot structure
 */
export interface ProfileSnapshot {
  businessId: string;
  profile: BusinessProfile;
  timestamp: Date;
  changes?: ProfileChanges;
}

/**
 * History options for retrieving profile history
 */
export interface HistoryOptions {
  since?: Date;
  until?: Date;
  limit?: number;
  includeSnapshots?: boolean;
  onlySignificantChanges?: boolean;
  significanceThreshold?: number;
}

/**
 * BusinessProfileTracker tracks business profile changes over time
 */
export class BusinessProfileTracker {
  private db: any; // Database connection
  private eventSystem: EventSystem;
  private significanceThresholds: Record<string, number> = {
    'products': 0.8,
    'certifications': 0.7,
    'size': 0.5,
    'targetMarkets': 0.9,
    'website': 0.3,
    'description': 0.2
  };
  
  constructor(db: any, eventSystem: EventSystem) {
    this.db = db;
    this.eventSystem = eventSystem;
    
    // Register for profile update events
    this.eventSystem.subscribe('BUSINESS_PROFILE_UPDATE', this.handleProfileUpdate.bind(this));
  }
  
  /**
   * Handle profile update event
   */
  async handleProfileUpdate(event: any): Promise<void> {
    try {
      const { businessId, updatedProfile, previousProfile } = event.payload;
      
      if (!businessId || !updatedProfile) {
        console.warn('Invalid profile update event payload');
        return;
      }
      
      // Compare profiles to identify changes
      const changes = this.identifyProfileChanges(businessId, previousProfile, updatedProfile);
      
      // Record profile snapshot
      await this.recordProfileSnapshot(businessId, updatedProfile, changes);
      
      // Trigger appropriate events based on changes
      await this.triggerChangeEvents(businessId, changes);
      
      // Update derived state based on changes
      await this.updateDerivedState(businessId, changes);
      
      console.log(`Processed profile update for business ${businessId}`);
    } catch (error) {
      console.error(`Error handling profile update: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get profile history for a business
   */
  async getProfileHistory(
    businessId: string,
    options: HistoryOptions = {}
  ): Promise<ProfileSnapshot[]> {
    try {
      // Build query
      const query: any = { businessId };
      
      if (options.since) {
        query.timestamp = { $gte: options.since };
      }
      
      if (options.until) {
        query.timestamp = { ...query.timestamp, $lte: options.until };
      }
      
      if (options.onlySignificantChanges) {
        query['changes.significanceScore'] = { 
          $gte: options.significanceThreshold || 0.5 
        };
      }
      
      // Execute query
      let snapshots = await this.db.profileHistory
        .find(query)
        .sort({ timestamp: -1 })
        .limit(options.limit || 10)
        .toArray();
      
      // Filter out snapshot data if not requested
      if (!options.includeSnapshots) {
        snapshots = snapshots.map(snapshot => ({
          businessId: snapshot.businessId,
          timestamp: snapshot.timestamp,
          changes: snapshot.changes
        }));
      }
      
      return snapshots;
    } catch (error) {
      console.error(`Error getting profile history: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Get profile evolution trends for a business
   */
  async getProfileEvolutionTrends(
    businessId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<any> {
    try {
      // Get profile history
      const history = await this.getProfileHistory(businessId, {
        since: timeRange.start,
        until: timeRange.end,
        includeSnapshots: true
      });
      
      if (history.length < 2) {
        return {
          trends: [],
          message: 'Insufficient history to determine trends'
        };
      }
      
      // Analyze trends
      const trends = this.analyzeTrends(history);
      
      return {
        trends,
        timeRange,
        snapshotCount: history.length
      };
    } catch (error) {
      console.error(`Error getting profile evolution trends: ${error instanceof Error ? error.message : String(error)}`);
      return {
        trends: [],
        error: 'Failed to analyze trends'
      };
    }
  }
  
  /**
   * Compare two profiles to identify changes
   */
  private identifyProfileChanges(
    businessId: string,
    previousProfile: BusinessProfile | null,
    currentProfile: BusinessProfile
  ): ProfileChanges {
    const changes: ProfileChange[] = [];
    
    // If no previous profile, treat all fields as additions
    if (!previousProfile) {
      // Add changes for each field in current profile
      for (const field in currentProfile) {
        if (field !== 'id' && field !== 'createdAt' && field !== 'updatedAt') {
          changes.push({
            field,
            type: ProfileChangeType.ADDITION,
            newValue: currentProfile[field as keyof BusinessProfile],
            timestamp: new Date()
          });
        }
      }
    } else {
      // Compare each field in the profiles
      for (const field in currentProfile) {
        if (field !== 'id' && field !== 'createdAt' && field !== 'updatedAt') {
          const currentValue = currentProfile[field as keyof BusinessProfile];
          const previousValue = previousProfile[field as keyof BusinessProfile];
          
          // Check if field exists in previous profile
          if (previousValue === undefined) {
            // Field was added
            changes.push({
              field,
              type: ProfileChangeType.ADDITION,
              newValue: currentValue,
              timestamp: new Date()
            });
          } else if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
            // Field was modified
            changes.push({
              field,
              type: ProfileChangeType.MODIFICATION,
              previousValue,
              newValue: currentValue,
              timestamp: new Date()
            });
          }
        }
      }
      
      // Check for removed fields
      for (const field in previousProfile) {
        if (
          field !== 'id' && 
          field !== 'createdAt' && 
          field !== 'updatedAt' && 
          currentProfile[field as keyof BusinessProfile] === undefined
        ) {
          // Field was removed
          changes.push({
            field,
            type: ProfileChangeType.REMOVAL,
            previousValue: previousProfile[field as keyof BusinessProfile],
            timestamp: new Date()
          });
        }
      }
    }
    
    // Calculate significance score
    const significanceScore = this.calculateSignificanceScore(changes);
    
    return {
      businessId,
      timestamp: new Date(),
      changes,
      significanceScore
    };
  }
  
  /**
   * Calculate significance score for changes
   */
  private calculateSignificanceScore(changes: ProfileChange[]): number {
    if (changes.length === 0) {
      return 0;
    }
    
    let totalSignificance = 0;
    
    for (const change of changes) {
      // Get significance threshold for the field
      const threshold = this.significanceThresholds[change.field] || 0.1;
      
      // Adjust significance based on change type
      let significance = threshold;
      if (change.type === ProfileChangeType.ADDITION) {
        significance *= 1.2; // Additions are slightly more significant
      } else if (change.type === ProfileChangeType.REMOVAL) {
        significance *= 1.5; // Removals are more significant
      }
      
      totalSignificance += significance;
    }
    
    // Normalize to 0-1 range
    return Math.min(totalSignificance, 1);
  }
  
  /**
   * Record profile snapshot
   */
  private async recordProfileSnapshot(
    businessId: string,
    profile: BusinessProfile,
    changes: ProfileChanges
  ): Promise<void> {
    try {
      // Create snapshot
      const snapshot: ProfileSnapshot = {
        businessId,
        profile,
        timestamp: new Date(),
        changes
      };
      
      // Store in database
      await this.db.profileHistory.insertOne(snapshot);
    } catch (error) {
      console.error(`Error recording profile snapshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Trigger events based on changes
   */
  private async triggerChangeEvents(
    businessId: string,
    changes: ProfileChanges
  ): Promise<void> {
    try {
      // Check if changes are significant enough to trigger events
      if (changes.significanceScore < 0.3) {
        return; // Not significant enough
      }
      
      // Check for specific changes that should trigger events
      for (const change of changes.changes) {
        switch (change.field) {
          case 'products':
            if (change.type === ProfileChangeType.ADDITION || change.type === ProfileChangeType.MODIFICATION) {
              // Trigger product change event
              await this.eventSystem.publish('BUSINESS_PRODUCT_CHANGE', {
                businessId,
                changeType: change.type,
                previousProducts: change.previousValue,
                newProducts: change.newValue,
                timestamp: change.timestamp
              });
            }
            break;
            
          case 'targetMarkets':
            if (change.type === ProfileChangeType.ADDITION || change.type === ProfileChangeType.MODIFICATION) {
              // Trigger target market change event
              await this.eventSystem.publish('BUSINESS_TARGET_MARKET_CHANGE', {
                businessId,
                changeType: change.type,
                previousMarkets: change.previousValue,
                newMarkets: change.newValue,
                timestamp: change.timestamp
              });
            }
            break;
            
          case 'certifications':
            if (change.type === ProfileChangeType.ADDITION || change.type === ProfileChangeType.MODIFICATION) {
              // Trigger certification change event
              await this.eventSystem.publish('BUSINESS_CERTIFICATION_CHANGE', {
                businessId,
                changeType: change.type,
                previousCertifications: change.previousValue,
                newCertifications: change.newValue,
                timestamp: change.timestamp
              });
            }
            break;
        }
      }
      
      // Trigger overall profile change event
      await this.eventSystem.publish('BUSINESS_PROFILE_SIGNIFICANT_CHANGE', {
        businessId,
        changes,
        timestamp: changes.timestamp
      });
    } catch (error) {
      console.error(`Error triggering change events: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update derived state based on changes
   */
  private async updateDerivedState(
    businessId: string,
    changes: ProfileChanges
  ): Promise<void> {
    try {
      // Implementation depends on what derived state needs to be updated
      // This is a placeholder for the actual implementation
      
      // Example: Update last significant change timestamp
      if (changes.significanceScore > 0.5) {
        await this.db.businessState.updateOne(
          { businessId },
          { 
            $set: { 
              lastSignificantChangeAt: changes.timestamp,
              lastSignificanceScore: changes.significanceScore
            }
          },
          { upsert: true }
        );
      }
    } catch (error) {
      console.error(`Error updating derived state: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Analyze trends from profile history
   */
  private analyzeTrends(history: ProfileSnapshot[]): any[] {
    // This is a simplified implementation
    // A real implementation would analyze patterns over time
    
    // Sort history by timestamp (oldest first)
    const sortedHistory = [...history].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );
    
    const trends = [];
    
    // Check for product evolution
    if (sortedHistory[0].profile.products && sortedHistory[sortedHistory.length - 1].profile.products) {
      const initialProductCount = sortedHistory[0].profile.products.length;
      const currentProductCount = sortedHistory[sortedHistory.length - 1].profile.products.length;
      
      if (currentProductCount > initialProductCount) {
        trends.push({
          type: 'PRODUCT_EXPANSION',
          description: `Business expanded from ${initialProductCount} to ${currentProductCount} products`,
          changeRate: (currentProductCount - initialProductCount) / sortedHistory.length,
          initialValue: initialProductCount,
          currentValue: currentProductCount
        });
      }
    }
    
    // Check for market focus evolution
    if (
      sortedHistory[0].profile.targetMarkets && 
      sortedHistory[sortedHistory.length - 1].profile.targetMarkets
    ) {
      const initialMarketCount = sortedHistory[0].profile.targetMarkets.length;
      const currentMarketCount = sortedHistory[sortedHistory.length - 1].profile.targetMarkets.length;
      
      if (currentMarketCount > initialMarketCount) {
        trends.push({
          type: 'MARKET_EXPANSION',
          description: `Business expanded from ${initialMarketCount} to ${currentMarketCount} target markets`,
          changeRate: (currentMarketCount - initialMarketCount) / sortedHistory.length,
          initialValue: initialMarketCount,
          currentValue: currentMarketCount
        });
      }
    }
    
    // Check for business size evolution
    if (
      sortedHistory[0].profile.size !== undefined && 
      sortedHistory[sortedHistory.length - 1].profile.size !== undefined
    ) {
      const initialSize = sortedHistory[0].profile.size;
      const currentSize = sortedHistory[sortedHistory.length - 1].profile.size;
      
      if (currentSize > initialSize) {
        trends.push({
          type: 'BUSINESS_GROWTH',
          description: `Business grew from ${initialSize} to ${currentSize} employees`,
          changeRate: (currentSize - initialSize) / sortedHistory.length,
          initialValue: initialSize,
          currentValue: currentSize
        });
      }
    }
    
    return trends;
  }
} 