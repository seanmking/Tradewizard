import { BusinessProfile } from '../types';
import { BusinessProfileTracker, ProfileChanges } from '../memory/business-profile-tracker';
import { ExportStrategyMemory } from '../memory/export-strategy-memory';
import { RegulatoryPatternMemory, RegulatoryPattern, RegulatoryPatternType } from '../memory/regulatory-pattern-memory';
import { LearningEngine } from '../memory/learning-engine';
import { EventSystem } from './event-system';

/**
 * Notification priority levels
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Notification structure
 */
export interface Notification {
  id: string;
  businessId: string;
  type: string;
  title: string;
  content: string;
  priority: NotificationPriority;
  data?: Record<string, any>;
  created: Date;
  expiration?: Date;
  read?: boolean;
  actions?: Array<{
    label: string;
    action: string;
    data?: Record<string, any>;
  }>;
}

/**
 * AgentBehaviors implements autonomous agent behaviors that leverage
 * the memory subsystem to provide proactive features
 */
export class AgentBehaviors {
  private businessProfileTracker: BusinessProfileTracker;
  private exportStrategyMemory: ExportStrategyMemory;
  private regulatoryPatternMemory: RegulatoryPatternMemory;
  private learningEngine: LearningEngine;
  private eventSystem: EventSystem;
  private notificationService: any; // This would be a proper service in a real implementation
  private db: any; // Database connection
  
  constructor(
    businessProfileTracker: BusinessProfileTracker,
    exportStrategyMemory: ExportStrategyMemory,
    regulatoryPatternMemory: RegulatoryPatternMemory,
    learningEngine: LearningEngine,
    eventSystem: EventSystem,
    notificationService: any,
    db: any
  ) {
    this.businessProfileTracker = businessProfileTracker;
    this.exportStrategyMemory = exportStrategyMemory;
    this.regulatoryPatternMemory = regulatoryPatternMemory;
    this.learningEngine = learningEngine;
    this.eventSystem = eventSystem;
    this.notificationService = notificationService;
    this.db = db;
    
    // Register for events
    this.registerEventHandlers();
  }
  
  /**
   * Register handlers for relevant events
   */
  private registerEventHandlers(): void {
    // Profile changes
    this.eventSystem.subscribe('BUSINESS_PROFILE_UPDATE', this.handleProfileUpdate.bind(this));
    
    // Regulatory changes
    this.eventSystem.subscribe('REGULATORY_CHANGE', this.handleRegulatoryChange.bind(this));
    
    // Certification events
    this.eventSystem.subscribe('CERTIFICATION_EXPIRATION', this.handleCertificationExpiration.bind(this));
    
    // Market opportunities
    this.eventSystem.subscribe('MARKET_OPPORTUNITY', this.handleMarketOpportunity.bind(this));
  }
  
  /**
   * Handle business profile update events
   */
  private async handleProfileUpdate(event: any): Promise<void> {
    try {
      const { businessId, changes } = event.payload;
      
      if (!businessId || !changes) {
        console.warn('Invalid profile update event payload');
        return;
      }
      
      // Get the current business profile
      const businessProfile = await this.getBusinessProfile(businessId);
      
      if (!businessProfile) {
        console.warn(`Cannot process profile update: business profile ${businessId} not found`);
        return;
      }
      
      // Process the changes based on their significance
      if (changes.significanceScore >= 0.7) {
        // High significance changes warrant immediate recommendations
        await this.recommendMarketsBasedOnChanges(businessId, businessProfile, changes);
        await this.recommendRegulatoryActionsBasedOnChanges(businessId, businessProfile, changes);
      } else if (changes.significanceScore >= 0.4) {
        // Medium significance changes
        await this.updateComplianceStatus(businessId, businessProfile);
      }
      
      // Log the handled event
      console.log(`Handled profile update for business ${businessId} with significance ${changes.significanceScore}`);
    } catch (error) {
      console.error(`Error handling profile update: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get business profile by ID
   */
  private async getBusinessProfile(businessId: string): Promise<BusinessProfile | null> {
    try {
      return await this.db.businessProfiles.findOne({ id: businessId });
    } catch (error) {
      console.error(`Error getting business profile: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Recommend markets based on significant profile changes
   */
  private async recommendMarketsBasedOnChanges(
    businessId: string,
    businessProfile: BusinessProfile,
    changes: ProfileChanges
  ): Promise<void> {
    try {
      // Skip if profile has no target markets field or it's empty
      if (!businessProfile.targetMarkets || businessProfile.targetMarkets.length === 0) {
        businessProfile.targetMarkets = []; // Ensure it's at least an empty array for further processing
      }
      
      // Determine if profile changes warrant market recommendations
      if (this.shouldRecommendMarkets(changes)) {
        // Find similar businesses with successful exports
        const similarBusinesses = await this.findSimilarSuccessfulBusinesses(businessProfile);
        
        if (similarBusinesses.length > 0) {
          // Extract markets from similar businesses
          const recommendedMarkets = await this.extractMarketsFromSimilarBusinesses(
            similarBusinesses,
            businessProfile.targetMarkets
          );
          
          if (recommendedMarkets.length > 0) {
            // Create notification with market recommendations
            await this.notificationService.createNotification({
              businessId,
              type: 'MARKET_RECOMMENDATION',
              title: 'New Market Opportunities Based on Your Profile',
              content: `Based on recent changes to your business profile, we've identified ${recommendedMarkets.length} potential new markets that match your export capabilities.`,
              priority: NotificationPriority.MEDIUM,
              data: {
                recommendedMarkets,
                basedOn: 'profile_changes',
                similarBusinessCount: similarBusinesses.length
              },
              created: new Date(),
              expiration: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
              actions: [
                {
                  label: 'View Markets',
                  action: 'VIEW_RECOMMENDED_MARKETS',
                  data: { markets: recommendedMarkets.map(m => m.marketName) }
                }
              ]
            });
            
            console.log(`Created market recommendations for business ${businessId} based on profile changes`);
          }
        }
      }
    } catch (error) {
      console.error(`Error recommending markets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Determine if profile changes warrant market recommendations
   */
  private shouldRecommendMarkets(changes: ProfileChanges): boolean {
    // Check significance score
    if (changes.significanceScore >= 0.7) {
      return true;
    }
    
    // Check for specific high-value changes
    const hasProductChanges = changes.changes.some(change => 
      change.field === 'products' && 
      (change.type === 'ADDITION' || change.type === 'MODIFICATION')
    );
    
    const hasCertificationChanges = changes.changes.some(change => 
      change.field === 'certifications' && 
      change.type === 'ADDITION'
    );
    
    return hasProductChanges || hasCertificationChanges;
  }
  
  /**
   * Find businesses with similar profiles that have successful exports
   */
  private async findSimilarSuccessfulBusinesses(
    businessProfile: BusinessProfile
  ): Promise<BusinessProfile[]> {
    try {
      // Get all business profiles
      const allBusinessProfiles = await this.db.businessProfiles.find({
        id: { $ne: businessProfile.id } // Exclude current business
      }).toArray();
      
      // Get successful export outcomes
      const successfulOutcomes = await this.db.exportOutcomes.find({
        'results.successful': true
      }).toArray();
      
      // Get businesses with successful exports
      const successfulBusinessIds = new Set(successfulOutcomes.map((o: any) => o.businessId));
      
      // Filter for businesses with successful exports
      const successfulBusinesses = allBusinessProfiles.filter(
        (profile: BusinessProfile) => successfulBusinessIds.has(profile.id)
      );
      
      // Calculate similarity for each business
      const similarBusinesses = [];
      
      for (const profile of successfulBusinesses) {
        const similarity = await this.calculateBusinessSimilarity(businessProfile, profile);
        
        if (similarity.score >= 0.65) {
          similarBusinesses.push({
            ...profile,
            similarityScore: similarity.score
          });
        }
      }
      
      // Sort by similarity score (highest first)
      return similarBusinesses.sort((a, b) => b.similarityScore - a.similarityScore);
    } catch (error) {
      console.error(`Error finding similar businesses: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Extract recommended markets from similar businesses
   */
  private async extractMarketsFromSimilarBusinesses(
    similarBusinesses: BusinessProfile[],
    existingMarkets: string[]
  ): Promise<{ marketName: string; score: number; reasonForRecommendation: string }[]> {
    try {
      // Extract all target markets from similar businesses
      const marketFrequency: Record<string, { count: number; businesses: BusinessProfile[] }> = {};
      
      for (const business of similarBusinesses) {
        if (business.targetMarkets && business.targetMarkets.length > 0) {
          for (const market of business.targetMarkets) {
            // Skip markets the business already targets
            if (existingMarkets.includes(market)) {
              continue;
            }
            
            if (!marketFrequency[market]) {
              marketFrequency[market] = { count: 0, businesses: [] };
            }
            
            marketFrequency[market].count += 1;
            marketFrequency[market].businesses.push(business);
          }
        }
      }
      
      // Calculate success rate for each market
      const marketSuccessRate: Record<string, number> = {};
      const successfulOutcomes = await this.db.exportOutcomes.find({
        'results.successful': true
      }).toArray();
      
      const allOutcomes = await this.db.exportOutcomes.find({}).toArray();
      
      for (const market in marketFrequency) {
        const marketOutcomes = allOutcomes.filter((o: any) => o.market === market);
        const successfulMarketOutcomes = successfulOutcomes.filter((o: any) => o.market === market);
        
        marketSuccessRate[market] = marketOutcomes.length > 0
          ? successfulMarketOutcomes.length / marketOutcomes.length
          : 0;
      }
      
      // Calculate recommendation score and sort markets
      const recommendedMarkets = Object.keys(marketFrequency).map(market => {
        // Score is based on frequency among similar businesses and success rate
        const frequencyScore = marketFrequency[market].count / similarBusinesses.length;
        const successScore = marketSuccessRate[market] || 0;
        
        const score = (frequencyScore * 0.7) + (successScore * 0.3);
        
        return {
          marketName: market,
          score,
          reasonForRecommendation: this.generateMarketRecommendationReason(
            market,
            marketFrequency[market].count,
            similarBusinesses.length,
            marketSuccessRate[market] || 0
          )
        };
      });
      
      // Sort by score (highest first) and return top 5
      return recommendedMarkets
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    } catch (error) {
      console.error(`Error extracting markets: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Generate market recommendation reason
   */
  private generateMarketRecommendationReason(
    market: string,
    frequencyCount: number,
    totalBusinesses: number,
    successRate: number
  ): string {
    const percentage = Math.round((frequencyCount / totalBusinesses) * 100);
    const successPercentage = Math.round(successRate * 100);
    
    let reason = `${percentage}% of similar businesses successfully export to ${market}`;
    
    if (successRate > 0) {
      reason += ` with a ${successPercentage}% success rate`;
    }
    
    return reason;
  }
  
  /**
   * Calculate similarity between two businesses
   */
  private async calculateBusinessSimilarity(
    profile1: BusinessProfile,
    profile2: BusinessProfile
  ): Promise<{ score: number; isMatch: boolean }> {
    // Use the similarity engine directly
    return { score: 0.5, isMatch: true }; // Temporary implementation until learning engine is updated
  }
  
  /**
   * Recommend regulatory actions based on profile changes
   */
  private async recommendRegulatoryActionsBasedOnChanges(
    businessId: string,
    businessProfile: BusinessProfile,
    changes: ProfileChanges
  ): Promise<void> {
    try {
      // Check if changes include products or target markets
      const hasProductChanges = changes.changes.some(change => change.field === 'products');
      const hasMarketChanges = changes.changes.some(change => change.field === 'targetMarkets');
      
      if (!hasProductChanges && !hasMarketChanges) {
        return; // No product or market changes, so no regulatory impact
      }
      
      // Ensure target markets exists
      const targetMarkets = businessProfile.targetMarkets || [];
      
      if (targetMarkets.length === 0) {
        return; // No target markets to analyze
      }
      
      // Get product categories
      const productCategories = businessProfile.products.map(p => 
        typeof p === 'string' ? p : (p.category || '')
      ).filter(Boolean);
      
      if (productCategories.length === 0) {
        return; // No product categories to analyze
      }
      
      // Find regulatory patterns relevant to this business
      const relevantPatterns = await this.regulatoryPatternMemory.findRelevantPatterns(businessProfile);
      
      // Find compliance barrier patterns
      const barrierPatterns = relevantPatterns.filter(
        pattern => pattern.type === RegulatoryPatternType.COMPLIANCE_BARRIER
      );
      
      if (barrierPatterns.length > 0) {
        // Create notification for compliance barriers
        await this.notificationService.createNotification({
          businessId,
          type: 'REGULATORY_BARRIER_ALERT',
          title: 'Potential Regulatory Barriers Identified',
          content: `Based on your updated business profile, we've identified ${barrierPatterns.length} potential regulatory barriers that could affect your export plans.`,
          priority: NotificationPriority.HIGH,
          data: {
            patterns: barrierPatterns.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              markets: p.applicableMarkets,
              products: p.productCategories
            })),
            basedOn: 'profile_changes'
          },
          created: new Date(),
          expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          actions: [
            {
              label: 'View Barriers',
              action: 'VIEW_REGULATORY_BARRIERS',
              data: { patternIds: barrierPatterns.map(p => p.id) }
            }
          ]
        });
        
        console.log(`Created regulatory barrier alert for business ${businessId} with ${barrierPatterns.length} barriers`);
      }
      
      // Check for harmonization opportunities
      const harmonizationPatterns = relevantPatterns.filter(
        pattern => pattern.type === RegulatoryPatternType.HARMONIZATION
      );
      
      if (harmonizationPatterns.length > 0) {
        // Create notification for harmonization opportunities
        await this.notificationService.createNotification({
          businessId,
          type: 'REGULATORY_HARMONIZATION',
          title: 'Regulatory Harmonization Opportunities',
          content: `We've identified opportunities where regulatory requirements are harmonized across multiple markets you're targeting.`,
          priority: NotificationPriority.MEDIUM,
          data: {
            patterns: harmonizationPatterns.map(p => ({
              id: p.id,
              name: p.name,
              description: p.description,
              markets: p.applicableMarkets,
              products: p.productCategories
            })),
            basedOn: 'profile_changes'
          },
          created: new Date(),
          expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          actions: [
            {
              label: 'View Opportunities',
              action: 'VIEW_HARMONIZATION_OPPORTUNITIES',
              data: { patternIds: harmonizationPatterns.map(p => p.id) }
            }
          ]
        });
        
        console.log(`Created harmonization opportunity alert for business ${businessId} with ${harmonizationPatterns.length} opportunities`);
      }
      
      // Schedule compliance assessment
      await this.scheduleComplianceAssessment(businessId, businessProfile);
    } catch (error) {
      console.error(`Error recommending regulatory actions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update compliance status based on profile changes
   */
  private async updateComplianceStatus(
    businessId: string,
    businessProfile: BusinessProfile
  ): Promise<void> {
    try {
      // Ensure target markets exists
      const targetMarkets = businessProfile.targetMarkets || [];
      
      if (targetMarkets.length === 0) {
        return; // No target markets to analyze
      }
      
      // Get product categories
      const productCategories = businessProfile.products.map(p => 
        typeof p === 'string' ? p : (p.category || '')
      ).filter(Boolean);
      
      if (productCategories.length === 0) {
        return; // No product categories to analyze
      }
      
      // Check for existing compliance assessments
      const existingAssessments = await this.db.complianceAssessments.find({
        businessId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Within last 30 days
      }).toArray();
      
      // If we already have recent assessments, skip
      if (existingAssessments.length > 0) {
        return;
      }
      
      // Schedule a new compliance assessment
      await this.scheduleComplianceAssessment(businessId, businessProfile);
    } catch (error) {
      console.error(`Error updating compliance status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Schedule a compliance assessment
   */
  private async scheduleComplianceAssessment(
    businessId: string,
    businessProfile: BusinessProfile
  ): Promise<void> {
    try {
      // Create a scheduled task
      await this.db.scheduledTasks.insertOne({
        type: 'COMPLIANCE_ASSESSMENT',
        businessId,
        status: 'PENDING',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Schedule for 24 hours from now
        data: {
          businessProfile,
          reason: 'profile_changes'
        },
        createdAt: new Date()
      });
      
      console.log(`Scheduled compliance assessment for business ${businessId}`);
    } catch (error) {
      console.error(`Error scheduling compliance assessment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Handle regulatory change events
   */
  private async handleRegulatoryChange(event: any): Promise<void> {
    try {
      const { market, productCategory, changeType, description } = event.payload;
      
      if (!market || !productCategory) {
        console.warn('Invalid regulatory change event payload');
        return;
      }
      
      // Find businesses that target this market and have products in this category
      const affectedBusinesses = await this.db.businessProfiles.find({
        targetMarkets: market,
        'products.category': productCategory
      }).toArray();
      
      if (affectedBusinesses.length === 0) {
        console.log(`No businesses affected by regulatory change in ${market} for ${productCategory}`);
        return;
      }
      
      // Determine priority based on change type
      let priority = NotificationPriority.MEDIUM;
      
      if (changeType === 'MAJOR' || changeType === 'URGENT') {
        priority = NotificationPriority.HIGH;
      } else if (changeType === 'MINOR') {
        priority = NotificationPriority.LOW;
      }
      
      // Create notifications for affected businesses
      for (const business of affectedBusinesses) {
        await this.notificationService.createNotification({
          businessId: business.id,
          type: 'REGULATORY_CHANGE',
          title: `Regulatory Change in ${market}`,
          content: `A ${changeType.toLowerCase()} regulatory change has been detected that affects your products in ${market}: ${description}`,
          priority,
          data: {
            market,
            productCategory,
            changeType,
            description
          },
          created: new Date(),
          expiration: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          actions: [
            {
              label: 'View Details',
              action: 'VIEW_REGULATORY_CHANGE',
              data: { market, productCategory }
            }
          ]
        });
      }
      
      console.log(`Created regulatory change notifications for ${affectedBusinesses.length} businesses`);
      
      // Update regulatory patterns
      await this.updateRegulatoryPatterns(market, productCategory);
    } catch (error) {
      console.error(`Error handling regulatory change: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update regulatory patterns based on new changes
   */
  private async updateRegulatoryPatterns(
    market: string,
    productCategory: string
  ): Promise<void> {
    try {
      // Monitor for changes over the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const timeWindow = {
        start: sixMonthsAgo,
        end: new Date()
      };
      
      // Detect regulatory change patterns
      await this.regulatoryPatternMemory.monitorRegulatoryChanges(
        [market],
        [productCategory],
        timeWindow
      );
      
      // Detect compliance barriers
      await this.regulatoryPatternMemory.detectComplianceBarriers(
        [market],
        [productCategory]
      );
      
      // Detect harmonization patterns
      await this.regulatoryPatternMemory.detectHarmonizationPatterns(
        [market],
        [productCategory]
      );
      
      console.log(`Updated regulatory patterns for ${market} and ${productCategory}`);
    } catch (error) {
      console.error(`Error updating regulatory patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Handle certification expiration events
   */
  private async handleCertificationExpiration(event: any): Promise<void> {
    try {
      const { businessId, certificationName, expirationDate } = event.payload;
      
      if (!businessId || !certificationName || !expirationDate) {
        console.warn('Invalid certification expiration event payload');
        return;
      }
      
      // Get the business profile
      const businessProfile = await this.getBusinessProfile(businessId);
      
      if (!businessProfile) {
        console.warn(`Cannot process certification expiration: business profile ${businessId} not found`);
        return;
      }
      
      // Calculate days until expiration
      const now = new Date();
      const expiration = new Date(expirationDate);
      const daysUntilExpiration = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine priority based on days until expiration
      let priority = NotificationPriority.MEDIUM;
      
      if (daysUntilExpiration <= 7) {
        priority = NotificationPriority.URGENT;
      } else if (daysUntilExpiration <= 30) {
        priority = NotificationPriority.HIGH;
      } else if (daysUntilExpiration > 90) {
        priority = NotificationPriority.LOW;
      }
      
      // Create notification for the certification expiration
      await this.notificationService.createNotification({
        businessId,
        type: 'CERTIFICATION_EXPIRATION',
        title: `Certification Expiring: ${certificationName}`,
        content: daysUntilExpiration > 0
          ? `Your "${certificationName}" certification will expire in ${daysUntilExpiration} days.`
          : `Your "${certificationName}" certification has expired.`,
        priority,
        data: {
          certificationName,
          expirationDate,
          daysUntilExpiration
        },
        created: new Date(),
        expiration: new Date(expiration.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days after certification expires
        actions: [
          {
            label: 'Renewal Information',
            action: 'VIEW_CERTIFICATION_RENEWAL',
            data: { certificationName }
          }
        ]
      });
      
      console.log(`Created certification expiration notification for ${businessId} regarding ${certificationName}`);
      
      // If the certification has already expired, update compliance status
      if (daysUntilExpiration <= 0) {
        await this.updateComplianceStatus(businessId, businessProfile);
      }
    } catch (error) {
      console.error(`Error handling certification expiration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Handle market opportunity events
   */
  private async handleMarketOpportunity(event: any): Promise<void> {
    try {
      const { market, opportunityType, description, productCategories, source, confidence } = event.payload;
      
      if (!market || !opportunityType || !description) {
        console.warn('Invalid market opportunity event payload');
        return;
      }
      
      // Find businesses that may be interested in this opportunity
      const query: any = {
        // Businesses already targeting this market or with it in their interested markets
        $or: [
          { targetMarkets: market },
          { interestedMarkets: market }
        ]
      };
      
      // Add product category filter if available
      if (productCategories && productCategories.length > 0) {
        query['products.category'] = { $in: productCategories };
      }
      
      const potentiallyInterestedBusinesses = await this.db.businessProfiles.find(query).toArray();
      
      if (potentiallyInterestedBusinesses.length === 0) {
        console.log(`No businesses potentially interested in opportunity in ${market}`);
        return;
      }
      
      // Determine priority based on confidence and opportunity type
      let priority = NotificationPriority.MEDIUM;
      
      if ((confidence >= 0.8) || (opportunityType === 'HIGH_DEMAND')) {
        priority = NotificationPriority.HIGH;
      } else if (confidence < 0.6) {
        priority = NotificationPriority.LOW;
      }
      
      // Create notifications for potentially interested businesses
      for (const business of potentiallyInterestedBusinesses) {
        // Use memory to enhance the opportunity recommendation
        const enhancedOpportunity = await this.enhanceOpportunityForBusiness(business, {
          market,
          opportunityType,
          description,
          productCategories: productCategories || [],
          source: source || 'market_intelligence'
        });
        
        // Create the notification
        await this.notificationService.createNotification({
          businessId: business.id,
          type: 'MARKET_OPPORTUNITY',
          title: `New Market Opportunity in ${market}`,
          content: enhancedOpportunity.description,
          priority,
          data: {
            market,
            opportunityType,
            description: enhancedOpportunity.description,
            productCategories: enhancedOpportunity.productCategories,
            source: enhancedOpportunity.source,
            confidence: enhancedOpportunity.confidence,
            relevantPatterns: enhancedOpportunity.relevantPatterns
          },
          created: new Date(),
          expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          actions: [
            {
              label: 'View Opportunity',
              action: 'VIEW_MARKET_OPPORTUNITY',
              data: { market, opportunityType }
            }
          ]
        });
      }
      
      console.log(`Created market opportunity notifications for ${potentiallyInterestedBusinesses.length} businesses`);
    } catch (error) {
      console.error(`Error handling market opportunity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Enhance an opportunity with business-specific context
   */
  private async enhanceOpportunityForBusiness(
    businessProfile: BusinessProfile,
    opportunity: {
      market: string;
      opportunityType: string;
      description: string;
      productCategories: string[];
      source: string;
    }
  ): Promise<{
    market: string;
    opportunityType: string;
    description: string;
    productCategories: string[];
    source: string;
    confidence: number;
    relevantPatterns?: string[];
  }> {
    try {
      // Get relevant regulatory patterns
      const regulatoryPatterns = await this.regulatoryPatternMemory.findRelevantPatterns(businessProfile);
      const marketPatterns = regulatoryPatterns.filter(p => p.applicableMarkets.includes(opportunity.market));
      
      // Get relevant export strategy patterns
      const strategyPatterns = await this.exportStrategyMemory.findRelevantPatterns(businessProfile);
      const marketStrategyPatterns = strategyPatterns.filter(p => p.applicableMarkets.includes(opportunity.market));
      
      // Extract any relevant pattern IDs
      const relevantPatternIds = [
        ...marketPatterns.map(p => p.id),
        ...marketStrategyPatterns.map(p => p.id)
      ];
      
      // Enhance the description with business-specific insights
      let enhancedDescription = opportunity.description;
      
      // Add information about harmonization if applicable
      const harmonizationPatterns = marketPatterns.filter(p => p.type === RegulatoryPatternType.HARMONIZATION);
      if (harmonizationPatterns.length > 0) {
        enhancedDescription += ` This market has harmonized regulations with ${harmonizationPatterns[0].applicableMarkets.filter(m => m !== opportunity.market).join(', ')}, which may simplify compliance.`;
      }
      
      // Add information about successful strategies if available
      if (marketStrategyPatterns.length > 0) {
        const topStrategy = marketStrategyPatterns[0];
        enhancedDescription += ` Businesses similar to yours have successfully used a ${topStrategy.entryStrategy} strategy to enter this market.`;
      }
      
      // Calculate confidence score based on patterns and opportunity source
      let confidence = 0.7; // Default confidence
      
      if (marketStrategyPatterns.length > 0) {
        // Higher confidence if we have successful strategy patterns
        confidence = Math.min(0.9, confidence + 0.2);
      }
      
      if (harmonizationPatterns.length > 0) {
        // Higher confidence if there are harmonization patterns
        confidence = Math.min(0.9, confidence + 0.1);
      }
      
      if (marketPatterns.filter(p => p.type === RegulatoryPatternType.COMPLIANCE_BARRIER).length > 0) {
        // Lower confidence if there are compliance barriers
        confidence = Math.max(0.4, confidence - 0.2);
      }
      
      return {
        ...opportunity,
        description: enhancedDescription,
        confidence,
        relevantPatterns: relevantPatternIds.length > 0 ? relevantPatternIds : undefined
      };
    } catch (error) {
      console.error(`Error enhancing opportunity: ${error instanceof Error ? error.message : String(error)}`);
      return {
        ...opportunity,
        confidence: 0.6 // Default confidence if enhancement fails
      };
    }
  }
} 