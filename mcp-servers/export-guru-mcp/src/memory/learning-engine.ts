import { BusinessProfile } from '../types';
import { ExportStrategyMemory } from './export-strategy-memory';
import { RegulatoryPatternMemory } from './regulatory-pattern-memory';
import { BusinessProfileTracker } from './business-profile-tracker';
import { SimilarityEngine } from './similarity-engine';

/**
 * Confidence level for pattern application
 */
export enum ConfidenceLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

/**
 * Pattern source tracking
 */
export enum PatternSource {
  EXPORT_STRATEGY = 'EXPORT_STRATEGY',
  REGULATORY = 'REGULATORY',
  BUSINESS_PROFILE = 'BUSINESS_PROFILE',
  COMBINED = 'COMBINED'
}

/**
 * Pattern application result
 */
export interface PatternApplication {
  patternId: string;
  confidence: number; // 0-1 scale
  confidenceLevel: ConfidenceLevel;
  source: PatternSource;
  explanation: string;
  appliedTo: string; // What aspect of the recommendation was enhanced
  beforeEnhancement?: any; // Optional: value before enhancement
  afterEnhancement: any; // Value after enhancement
  metadata: Record<string, any>; // Additional metadata about the pattern application
}

/**
 * Learning Engine coordinates learning across different memory subsystems
 * and applies learned patterns to enhance recommendations
 */
export class LearningEngine {
  private exportStrategyMemory: ExportStrategyMemory;
  private regulatoryPatternMemory: RegulatoryPatternMemory;
  private businessProfileTracker: BusinessProfileTracker;
  private similarityEngine: SimilarityEngine;
  
  constructor(
    exportStrategyMemory: ExportStrategyMemory,
    regulatoryPatternMemory: RegulatoryPatternMemory,
    businessProfileTracker: BusinessProfileTracker,
    similarityEngine: SimilarityEngine
  ) {
    this.exportStrategyMemory = exportStrategyMemory;
    this.regulatoryPatternMemory = regulatoryPatternMemory;
    this.businessProfileTracker = businessProfileTracker;
    this.similarityEngine = similarityEngine;
  }
  
  /**
   * Enhance market recommendations using learned patterns
   */
  async enhanceMarketRecommendations(
    businessId: string,
    businessProfile: BusinessProfile,
    recommendations: any[]
  ): Promise<{
    enhancedRecommendations: any[];
    patternApplications: PatternApplication[];
  }> {
    const patternApplications: PatternApplication[] = [];
    
    // Get relevant export strategy patterns
    const strategyPatterns = await this.exportStrategyMemory.findRelevantPatterns(
      businessProfile
    );
    
    // Get relevant regulatory patterns
    const regulatoryPatterns = await this.regulatoryPatternMemory.findRelevantPatterns(
      businessProfile
    );
    
    // Apply patterns to enhance recommendations
    const enhancedRecommendations = recommendations.map(recommendation => {
      const enhancedRecommendation = { ...recommendation };
      
      // Apply export strategy patterns
      strategyPatterns.forEach(pattern => {
        if (this.isPatternApplicable(pattern, recommendation)) {
          const application = this.applyStrategyPattern(pattern, enhancedRecommendation);
          if (application) {
            patternApplications.push(application);
          }
        }
      });
      
      // Apply regulatory patterns
      regulatoryPatterns.forEach(pattern => {
        if (this.isPatternApplicable(pattern, recommendation)) {
          const application = this.applyRegulatoryPattern(pattern, enhancedRecommendation);
          if (application) {
            patternApplications.push(application);
          }
        }
      });
      
      return enhancedRecommendation;
    });
    
    // Record pattern applications for feedback loop
    await this.recordPatternApplications(businessId, patternApplications);
    
    return {
      enhancedRecommendations,
      patternApplications
    };
  }
  
  /**
   * Enhance compliance recommendations using learned patterns
   */
  async enhanceComplianceRecommendations(
    businessId: string,
    businessProfile: BusinessProfile,
    complianceRecommendations: any[]
  ): Promise<{
    enhancedRecommendations: any[];
    patternApplications: PatternApplication[];
  }> {
    const patternApplications: PatternApplication[] = [];
    
    // Get relevant regulatory patterns focused on compliance
    const regulatoryPatterns = await this.regulatoryPatternMemory.findCompliancePatterns(
      businessProfile
    );
    
    // Apply patterns to enhance compliance recommendations
    const enhancedRecommendations = complianceRecommendations.map(recommendation => {
      const enhancedRecommendation = { ...recommendation };
      
      // Apply regulatory patterns
      regulatoryPatterns.forEach(pattern => {
        if (this.isPatternApplicable(pattern, recommendation)) {
          const application = this.applyRegulatoryPattern(pattern, enhancedRecommendation);
          if (application) {
            patternApplications.push(application);
          }
        }
      });
      
      return enhancedRecommendation;
    });
    
    // Record pattern applications for feedback loop
    await this.recordPatternApplications(businessId, patternApplications);
    
    return {
      enhancedRecommendations,
      patternApplications
    };
  }
  
  /**
   * Process feedback on pattern applications to improve future recommendations
   */
  async processFeedback(
    businessId: string,
    patternApplicationId: string,
    isHelpful: boolean,
    feedbackDetails?: string
  ): Promise<void> {
    try {
      // Get the pattern application
      const patternApplication = await this.getPatternApplication(patternApplicationId);
      
      if (!patternApplication) {
        console.warn(`Pattern application ${patternApplicationId} not found`);
        return;
      }
      
      // Update pattern confidence based on feedback
      switch (patternApplication.source) {
        case PatternSource.EXPORT_STRATEGY:
          await this.exportStrategyMemory.updatePatternConfidence(
            patternApplication.patternId,
            isHelpful,
            feedbackDetails
          );
          break;
        case PatternSource.REGULATORY:
          await this.regulatoryPatternMemory.updatePatternConfidence(
            patternApplication.patternId,
            isHelpful,
            feedbackDetails
          );
          break;
        case PatternSource.BUSINESS_PROFILE:
          // Handle business profile pattern feedback
          break;
        case PatternSource.COMBINED:
          // Handle combined pattern feedback
          // This might require updating multiple pattern sources
          break;
      }
      
      // Record feedback for analysis
      await this.recordFeedback(businessId, patternApplicationId, isHelpful, feedbackDetails);
    } catch (error) {
      console.error(`Error processing feedback: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Determine if a pattern is applicable to a recommendation
   */
  private isPatternApplicable(pattern: any, recommendation: any): boolean {
    // Implementation depends on pattern and recommendation structure
    // This is a placeholder for the actual implementation
    return true;
  }
  
  /**
   * Apply an export strategy pattern to enhance a recommendation
   */
  private applyStrategyPattern(pattern: any, recommendation: any): PatternApplication | null {
    try {
      // Store original value for comparison
      const beforeEnhancement = { ...recommendation };
      
      // Apply pattern logic to enhance recommendation
      // This is a placeholder for the actual implementation
      
      // Create pattern application record
      return {
        patternId: pattern.id,
        confidence: pattern.confidence || 0.7,
        confidenceLevel: this.getConfidenceLevel(pattern.confidence || 0.7),
        source: PatternSource.EXPORT_STRATEGY,
        explanation: pattern.explanation || 'Applied export strategy pattern',
        appliedTo: 'marketStrategy',
        beforeEnhancement: beforeEnhancement.marketStrategy,
        afterEnhancement: recommendation.marketStrategy,
        metadata: {
          patternType: pattern.type,
          patternCategory: pattern.category,
          successRate: pattern.successRate
        }
      };
    } catch (error) {
      console.error(`Error applying strategy pattern: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Apply a regulatory pattern to enhance a recommendation
   */
  private applyRegulatoryPattern(pattern: any, recommendation: any): PatternApplication | null {
    try {
      // Store original value for comparison
      const beforeEnhancement = { ...recommendation };
      
      // Apply pattern logic to enhance recommendation
      // This is a placeholder for the actual implementation
      
      // Create pattern application record
      return {
        patternId: pattern.id,
        confidence: pattern.confidence || 0.7,
        confidenceLevel: this.getConfidenceLevel(pattern.confidence || 0.7),
        source: PatternSource.REGULATORY,
        explanation: pattern.explanation || 'Applied regulatory pattern',
        appliedTo: 'complianceStrategy',
        beforeEnhancement: beforeEnhancement.complianceStrategy,
        afterEnhancement: recommendation.complianceStrategy,
        metadata: {
          patternType: pattern.type,
          patternCategory: pattern.category,
          regulatoryDomain: pattern.regulatoryDomain
        }
      };
    } catch (error) {
      console.error(`Error applying regulatory pattern: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Convert numeric confidence to confidence level
   */
  private getConfidenceLevel(confidence: number): ConfidenceLevel {
    if (confidence >= 0.8) {
      return ConfidenceLevel.HIGH;
    } else if (confidence >= 0.5) {
      return ConfidenceLevel.MEDIUM;
    } else {
      return ConfidenceLevel.LOW;
    }
  }
  
  /**
   * Record pattern applications for analysis and feedback
   */
  private async recordPatternApplications(
    businessId: string,
    patternApplications: PatternApplication[]
  ): Promise<void> {
    try {
      // Implementation depends on storage mechanism
      // This is a placeholder for the actual implementation
      console.log(`Recorded ${patternApplications.length} pattern applications for business ${businessId}`);
    } catch (error) {
      console.error(`Error recording pattern applications: ${error.message}`);
    }
  }
  
  /**
   * Get a specific pattern application by ID
   */
  private async getPatternApplication(patternApplicationId: string): Promise<PatternApplication | null> {
    try {
      // Implementation depends on storage mechanism
      // This is a placeholder for the actual implementation
      return null;
    } catch (error) {
      console.error(`Error getting pattern application: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Record feedback for analysis
   */
  private async recordFeedback(
    businessId: string,
    patternApplicationId: string,
    isHelpful: boolean,
    feedbackDetails?: string
  ): Promise<void> {
    try {
      // Implementation depends on storage mechanism
      // This is a placeholder for the actual implementation
      console.log(`Recorded feedback for pattern application ${patternApplicationId}`);
    } catch (error) {
      console.error(`Error recording feedback: ${error.message}`);
    }
  }
} 