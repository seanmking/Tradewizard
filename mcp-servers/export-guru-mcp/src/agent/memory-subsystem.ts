import { 
  BusinessProfileTracker,
  ExportStrategyMemory,
  RegulatoryPatternMemory,
  SimilarityEngine,
  LearningEngine
} from '../memory';
import { EventSystem } from './event-system';
import { BusinessProfile } from '../types';

/**
 * Memory subsystem configuration
 */
export interface MemorySubsystemConfig {
  enableLearning?: boolean;
  enablePatternDetection?: boolean;
  enableProfileTracking?: boolean;
  similarityThreshold?: number;
}

/**
 * MemorySubsystem integrates all memory components and provides a unified interface
 */
export class MemorySubsystem {
  private db: any; // Database connection
  private eventSystem: EventSystem;
  private similarityEngine: SimilarityEngine;
  private businessProfileTracker: BusinessProfileTracker;
  private exportStrategyMemory: ExportStrategyMemory;
  private regulatoryPatternMemory: RegulatoryPatternMemory;
  private learningEngine: LearningEngine;
  private config: MemorySubsystemConfig;
  private isInitialized: boolean = false;
  
  constructor(db: any, eventSystem: EventSystem, config: MemorySubsystemConfig = {}) {
    this.db = db;
    this.eventSystem = eventSystem;
    this.config = {
      enableLearning: true,
      enablePatternDetection: true,
      enableProfileTracking: true,
      similarityThreshold: 0.7,
      ...config
    };
    
    // Initialize components
    this.similarityEngine = new SimilarityEngine();
    this.businessProfileTracker = new BusinessProfileTracker(db, eventSystem);
    this.exportStrategyMemory = new ExportStrategyMemory(this.similarityEngine, db);
    this.regulatoryPatternMemory = new RegulatoryPatternMemory(this.similarityEngine, db);
    this.learningEngine = new LearningEngine(
      this.exportStrategyMemory,
      this.regulatoryPatternMemory,
      this.businessProfileTracker,
      this.similarityEngine
    );
  }
  
  /**
   * Initialize the memory subsystem
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      console.log('Initializing memory subsystem...');
      
      // Initialize pattern memories
      if (this.config.enableLearning) {
        await Promise.all([
          this.exportStrategyMemory.initialize(),
          this.regulatoryPatternMemory.initialize()
        ]);
      }
      
      this.isInitialized = true;
      console.log('Memory subsystem initialized successfully');
    } catch (error) {
      console.error(`Error initializing memory subsystem: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Get the business profile tracker
   */
  getBusinessProfileTracker(): BusinessProfileTracker {
    return this.businessProfileTracker;
  }
  
  /**
   * Get the export strategy memory
   */
  getExportStrategyMemory(): ExportStrategyMemory {
    return this.exportStrategyMemory;
  }
  
  /**
   * Get the regulatory pattern memory
   */
  getRegulatoryPatternMemory(): RegulatoryPatternMemory {
    return this.regulatoryPatternMemory;
  }
  
  /**
   * Get the learning engine
   */
  getLearningEngine(): LearningEngine {
    return this.learningEngine;
  }
  
  /**
   * Get the similarity engine
   */
  getSimilarityEngine(): SimilarityEngine {
    return this.similarityEngine;
  }
  
  /**
   * Record a business profile update
   */
  async recordBusinessProfileUpdate(
    businessId: string,
    updatedProfile: BusinessProfile,
    previousProfile?: BusinessProfile
  ): Promise<void> {
    if (!this.config.enableProfileTracking) {
      return;
    }
    
    try {
      // Publish profile update event
      await this.eventSystem.publish('BUSINESS_PROFILE_UPDATE', {
        businessId,
        updatedProfile,
        previousProfile
      });
    } catch (error) {
      console.error(`Error recording business profile update: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Enhance market recommendations using learned patterns
   */
  async enhanceMarketRecommendations(
    businessId: string,
    businessProfile: BusinessProfile,
    recommendations: any[]
  ): Promise<any[]> {
    if (!this.config.enableLearning || recommendations.length === 0) {
      return recommendations;
    }
    
    try {
      const result = await this.learningEngine.enhanceMarketRecommendations(
        businessId,
        businessProfile,
        recommendations
      );
      
      return result.enhancedRecommendations;
    } catch (error) {
      console.error(`Error enhancing market recommendations: ${error instanceof Error ? error.message : String(error)}`);
      return recommendations; // Return original recommendations on error
    }
  }
  
  /**
   * Enhance compliance recommendations using learned patterns
   */
  async enhanceComplianceRecommendations(
    businessId: string,
    businessProfile: BusinessProfile,
    complianceRecommendations: any[]
  ): Promise<any[]> {
    if (!this.config.enableLearning || complianceRecommendations.length === 0) {
      return complianceRecommendations;
    }
    
    try {
      const result = await this.learningEngine.enhanceComplianceRecommendations(
        businessId,
        businessProfile,
        complianceRecommendations
      );
      
      return result.enhancedRecommendations;
    } catch (error) {
      console.error(`Error enhancing compliance recommendations: ${error instanceof Error ? error.message : String(error)}`);
      return complianceRecommendations; // Return original recommendations on error
    }
  }
  
  /**
   * Find similar successful strategies for a business profile and target market
   */
  async findSimilarSuccessfulStrategies(
    businessProfile: BusinessProfile,
    targetMarket: string
  ): Promise<any[]> {
    if (!this.config.enableLearning) {
      return [];
    }
    
    try {
      return await this.exportStrategyMemory.findSimilarSuccessfulStrategies(
        businessProfile,
        targetMarket
      );
    } catch (error) {
      console.error(`Error finding similar strategies: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Process feedback on pattern applications
   */
  async processFeedback(
    businessId: string,
    patternApplicationId: string,
    isHelpful: boolean,
    feedbackDetails?: string
  ): Promise<void> {
    if (!this.config.enableLearning) {
      return;
    }
    
    try {
      await this.learningEngine.processFeedback(
        businessId,
        patternApplicationId,
        isHelpful,
        feedbackDetails
      );
    } catch (error) {
      console.error(`Error processing feedback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 