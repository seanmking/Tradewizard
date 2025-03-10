import { BusinessProfile } from '../types';
import { SimilarityEngine } from './similarity-engine';

/**
 * Export outcome structure
 */
export interface ExportOutcome {
  id: string;
  businessId: string;
  businessProfile: BusinessProfile;
  market: string;
  products: {
    name: string;
    category: string;
    hsCode: string;
  }[];
  entryStrategy: string;
  complianceApproach: string;
  logisticsModel: string;
  results: {
    successful: boolean;
    timeline: number; // in days
    challenges: string[];
    successFactors: string[];
    roi: number;
  };
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Export strategy pattern structure
 */
export interface ExportStrategyPattern {
  id: string;
  name: string;
  description: string;
  confidence: number;
  businessSizeRange: {
    min?: number;
    max?: number;
  };
  productCategories: string[];
  applicableMarkets: string[];
  entryStrategy: string;
  complianceApproach: string;
  logisticsModel: string;
  estimatedTimeline: {
    min: number;
    max: number;
    average: number;
  };
  successRate: number;
  commonChallenges: string[];
  criticalSuccessFactors: string[];
  relevantCertifications: string[];
  applicationCount: number;
  discoveredAt: Date;
  lastUpdated: Date;
  metadata: Record<string, any>;
}

/**
 * Recommended strategy structure
 */
export interface RecommendedStrategy {
  strategyType: string;
  confidence: number;
  reasonForRecommendation: string;
  estimatedTimeline: {
    min: number;
    max: number;
    average: number;
  };
  keySuccessFactors: string[];
  potentialChallenges: string[];
  relevantPatternIds: string[];
}

/**
 * ExportStrategyMemory learns from export outcomes and provides strategy recommendations
 */
export class ExportStrategyMemory {
  private patterns: ExportStrategyPattern[] = [];
  private similarityEngine: SimilarityEngine;
  private db: any; // Database connection
  
  constructor(similarityEngine: SimilarityEngine, db: any) {
    this.similarityEngine = similarityEngine;
    this.db = db;
  }
  
  /**
   * Initialize patterns from database
   */
  async initialize(): Promise<void> {
    try {
      // Load patterns from database
      this.patterns = await this.db.exportStrategyPatterns.find({}).toArray();
      console.log(`Loaded ${this.patterns.length} export strategy patterns from database`);
    } catch (error) {
      console.error(`Error initializing export strategy patterns: ${error instanceof Error ? error.message : String(error)}`);
      this.patterns = [];
    }
  }
  
  /**
   * Record an export outcome for learning
   */
  async recordExportOutcome(outcome: ExportOutcome): Promise<void> {
    try {
      // Store export outcome in database
      await this.db.exportOutcomes.insertOne(outcome);
      
      // If outcome was successful, learn from it
      if (outcome.results.successful) {
        await this.learnFromOutcome(outcome);
      }
      
      console.log(`Recorded export outcome for business ${outcome.businessId} to market ${outcome.market}`);
    } catch (error) {
      console.error(`Error recording export outcome: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Find similar successful strategies for a business profile and target market
   */
  async findSimilarSuccessfulStrategies(
    businessProfile: BusinessProfile,
    targetMarket: string
  ): Promise<RecommendedStrategy[]> {
    try {
      // Find relevant patterns for the business profile
      const relevantPatterns = await this.findRelevantPatterns(businessProfile);
      
      // Filter patterns for the target market
      const marketPatterns = relevantPatterns.filter(pattern => 
        pattern.applicableMarkets.includes(targetMarket)
      );
      
      // Convert patterns to recommendations
      const recommendations = marketPatterns.map(pattern => this.patternToRecommendation(
        pattern,
        businessProfile,
        targetMarket
      ));
      
      // Sort by confidence
      return recommendations.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error(`Error finding similar strategies: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Find relevant patterns for a business profile
   */
  async findRelevantPatterns(
    businessProfile: BusinessProfile
  ): Promise<ExportStrategyPattern[]> {
    try {
      // Filter patterns by basic criteria
      const filteredPatterns = this.patterns.filter(pattern => {
        // Check if business size is in range
        const businessSize = businessProfile.size || 0;
        const sizeInRange = (
          (pattern.businessSizeRange.min === undefined || businessSize >= pattern.businessSizeRange.min) &&
          (pattern.businessSizeRange.max === undefined || businessSize <= pattern.businessSizeRange.max)
        );
        
        // Check if any product categories match
        const hasMatchingProducts = businessProfile.products.some(product => 
          pattern.productCategories.includes(product.category)
        );
        
        // Basic filtering: size in range and matching products
        return sizeInRange && hasMatchingProducts;
      });
      
      // Calculate similarity scores for filtered patterns
      const scoredPatterns = filteredPatterns.map(pattern => {
        const similarityResult = this.similarityEngine.calculatePatternSimilarity(
          businessProfile,
          pattern
        );
        
        return {
          pattern,
          similarityScore: similarityResult.score,
          isMatch: similarityResult.isMatch
        };
      });
      
      // Sort by similarity score and filter by threshold
      const relevantPatterns = scoredPatterns
        .filter(item => item.isMatch)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .map(item => item.pattern);
      
      return relevantPatterns;
    } catch (error) {
      console.error(`Error finding relevant patterns: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Update pattern confidence based on feedback
   */
  async updatePatternConfidence(
    patternId: string,
    isHelpful: boolean,
    feedbackDetails?: string
  ): Promise<void> {
    try {
      // Find pattern in memory
      const patternIndex = this.patterns.findIndex(p => p.id === patternId);
      
      if (patternIndex === -1) {
        console.warn(`Pattern ${patternId} not found`);
        return;
      }
      
      // Update pattern
      const pattern = this.patterns[patternIndex];
      
      // Update application count
      pattern.applicationCount += 1;
      
      // Update success rate
      const successCount = pattern.successRate * pattern.applicationCount;
      const newSuccessCount = isHelpful ? successCount + 1 : successCount;
      pattern.successRate = newSuccessCount / pattern.applicationCount;
      
      // Update confidence based on success rate and application count
      pattern.confidence = this.calculateConfidence(
        pattern.successRate,
        pattern.applicationCount
      );
      
      // Update last updated timestamp
      pattern.lastUpdated = new Date();
      
      // Update pattern in memory
      this.patterns[patternIndex] = pattern;
      
      // Update pattern in database
      await this.db.exportStrategyPatterns.updateOne(
        { id: patternId },
        {
          $set: {
            confidence: pattern.confidence,
            successRate: pattern.successRate,
            applicationCount: pattern.applicationCount,
            lastUpdated: pattern.lastUpdated
          },
          $push: {
            feedback: {
              isHelpful,
              details: feedbackDetails,
              timestamp: new Date()
            }
          }
        }
      );
    } catch (error) {
      console.error(`Error updating pattern confidence: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Learn from a successful export outcome
   */
  private async learnFromOutcome(outcome: ExportOutcome): Promise<void> {
    try {
      // Check if a similar pattern already exists
      const existingPattern = await this.findSimilarExistingPattern(outcome);
      
      if (existingPattern) {
        // Update existing pattern
        await this.updateExistingPattern(existingPattern, outcome);
      } else {
        // Create new pattern
        await this.createNewPattern(outcome);
      }
    } catch (error) {
      console.error(`Error learning from outcome: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Find a similar existing pattern for an outcome
   */
  private async findSimilarExistingPattern(outcome: ExportOutcome): Promise<ExportStrategyPattern | null> {
    // Filter patterns by basic criteria
    const candidatePatterns = this.patterns.filter(pattern => 
      pattern.entryStrategy === outcome.entryStrategy &&
      pattern.complianceApproach === outcome.complianceApproach &&
      pattern.logisticsModel === outcome.logisticsModel &&
      pattern.applicableMarkets.includes(outcome.market) &&
      outcome.products.some(product => 
        pattern.productCategories.includes(product.category)
      )
    );
    
    if (candidatePatterns.length === 0) {
      return null;
    }
    
    // Calculate similarity scores
    const scoredPatterns = candidatePatterns.map(pattern => {
      const similarityResult = this.similarityEngine.calculatePatternSimilarity(
        outcome.businessProfile,
        pattern
      );
      
      return {
        pattern,
        similarityScore: similarityResult.score
      };
    });
    
    // Sort by similarity score
    scoredPatterns.sort((a, b) => b.similarityScore - a.similarityScore);
    
    // Return the most similar pattern if it's above threshold
    return scoredPatterns[0].similarityScore > 0.8 ? scoredPatterns[0].pattern : null;
  }
  
  /**
   * Update an existing pattern with a new outcome
   */
  private async updateExistingPattern(
    pattern: ExportStrategyPattern,
    outcome: ExportOutcome
  ): Promise<void> {
    // Update application count
    pattern.applicationCount += 1;
    
    // Update success rate (all outcomes here are successful)
    const successCount = pattern.successRate * (pattern.applicationCount - 1) + 1;
    pattern.successRate = successCount / pattern.applicationCount;
    
    // Update timeline
    const totalDays = pattern.estimatedTimeline.average * (pattern.applicationCount - 1) + outcome.results.timeline;
    pattern.estimatedTimeline.average = totalDays / pattern.applicationCount;
    pattern.estimatedTimeline.min = Math.min(pattern.estimatedTimeline.min, outcome.results.timeline);
    pattern.estimatedTimeline.max = Math.max(pattern.estimatedTimeline.max, outcome.results.timeline);
    
    // Update challenges and success factors
    this.updateArrayWithFrequency(pattern.commonChallenges, outcome.results.challenges);
    this.updateArrayWithFrequency(pattern.criticalSuccessFactors, outcome.results.successFactors);
    
    // Update confidence
    pattern.confidence = this.calculateConfidence(pattern.successRate, pattern.applicationCount);
    
    // Update last updated timestamp
    pattern.lastUpdated = new Date();
    
    // Update pattern in database
    await this.db.exportStrategyPatterns.updateOne(
      { id: pattern.id },
      {
        $set: {
          applicationCount: pattern.applicationCount,
          successRate: pattern.successRate,
          estimatedTimeline: pattern.estimatedTimeline,
          commonChallenges: pattern.commonChallenges,
          criticalSuccessFactors: pattern.criticalSuccessFactors,
          confidence: pattern.confidence,
          lastUpdated: pattern.lastUpdated
        },
        $push: {
          outcomes: outcome.id
        }
      }
    );
    
    // Update pattern in memory
    const patternIndex = this.patterns.findIndex(p => p.id === pattern.id);
    if (patternIndex !== -1) {
      this.patterns[patternIndex] = pattern;
    }
  }
  
  /**
   * Create a new pattern from an outcome
   */
  private async createNewPattern(outcome: ExportOutcome): Promise<void> {
    // Create new pattern
    const newPattern: ExportStrategyPattern = {
      id: `esp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${outcome.entryStrategy} strategy for ${outcome.market}`,
      description: `Export strategy pattern derived from successful export to ${outcome.market} using ${outcome.entryStrategy} approach`,
      confidence: 0.6, // Initial confidence
      businessSizeRange: this.deriveBusinessSizeRange(outcome.businessProfile),
      productCategories: outcome.products.map(p => p.category),
      applicableMarkets: [outcome.market],
      entryStrategy: outcome.entryStrategy,
      complianceApproach: outcome.complianceApproach,
      logisticsModel: outcome.logisticsModel,
      estimatedTimeline: {
        min: outcome.results.timeline,
        max: outcome.results.timeline,
        average: outcome.results.timeline
      },
      successRate: 1.0, // First outcome is successful
      commonChallenges: outcome.results.challenges,
      criticalSuccessFactors: outcome.results.successFactors,
      relevantCertifications: outcome.businessProfile.certifications || [],
      applicationCount: 1,
      discoveredAt: new Date(),
      lastUpdated: new Date(),
      metadata: {
        sourceOutcomeId: outcome.id,
        initialROI: outcome.results.roi
      }
    };
    
    // Add to memory
    this.patterns.push(newPattern);
    
    // Store in database
    await this.db.exportStrategyPatterns.insertOne(newPattern);
    
    console.log(`Created new export strategy pattern: ${newPattern.id}`);
  }
  
  /**
   * Convert a pattern to a recommendation
   */
  private patternToRecommendation(
    pattern: ExportStrategyPattern,
    businessProfile: BusinessProfile,
    targetMarket: string
  ): RecommendedStrategy {
    // Calculate similarity for confidence adjustment
    const similarityResult = this.similarityEngine.calculatePatternSimilarity(
      businessProfile,
      pattern
    );
    
    // Adjust confidence based on similarity
    const adjustedConfidence = pattern.confidence * similarityResult.score;
    
    // Create recommendation
    return {
      strategyType: pattern.entryStrategy,
      confidence: adjustedConfidence,
      reasonForRecommendation: this.generateRecommendationReason(pattern, businessProfile, similarityResult.score),
      estimatedTimeline: pattern.estimatedTimeline,
      keySuccessFactors: pattern.criticalSuccessFactors,
      potentialChallenges: pattern.commonChallenges,
      relevantPatternIds: [pattern.id]
    };
  }
  
  /**
   * Generate a reason for recommendation
   */
  private generateRecommendationReason(
    pattern: ExportStrategyPattern,
    businessProfile: BusinessProfile,
    similarityScore: number
  ): string {
    // Generate reason based on pattern and business profile
    const businessSizeDesc = this.getBusinessSizeDescription(businessProfile.size || 0);
    const similarityDesc = this.getSimilarityDescription(similarityScore);
    const successRateDesc = this.getSuccessRateDescription(pattern.successRate);
    
    return `This ${pattern.entryStrategy} approach has been ${successRateDesc} for ${businessSizeDesc} businesses with similar products. Your business profile is ${similarityDesc} to businesses that have succeeded with this strategy in ${pattern.applicableMarkets.join(', ')}.`;
  }
  
  /**
   * Get business size description
   */
  private getBusinessSizeDescription(size: number): string {
    if (size < 10) return 'small';
    if (size < 50) return 'small to medium';
    if (size < 250) return 'medium';
    return 'large';
  }
  
  /**
   * Get similarity description
   */
  private getSimilarityDescription(score: number): string {
    if (score > 0.9) return 'very similar';
    if (score > 0.8) return 'highly similar';
    if (score > 0.7) return 'similar';
    if (score > 0.6) return 'somewhat similar';
    return 'partially similar';
  }
  
  /**
   * Get success rate description
   */
  private getSuccessRateDescription(rate: number): string {
    if (rate > 0.9) return 'highly successful';
    if (rate > 0.8) return 'very successful';
    if (rate > 0.7) return 'successful';
    if (rate > 0.6) return 'moderately successful';
    return 'somewhat successful';
  }
  
  /**
   * Derive business size range from a business profile
   */
  private deriveBusinessSizeRange(profile: BusinessProfile): { min?: number; max?: number } {
    const size = profile.size || 0;
    
    // Create a range around the business size
    return {
      min: Math.max(1, Math.floor(size * 0.7)),
      max: Math.ceil(size * 1.3)
    };
  }
  
  /**
   * Update an array with frequency tracking
   */
  private updateArrayWithFrequency(array: string[], newItems: string[]): void {
    // This is a simplified implementation
    // A real implementation would track frequency and limit array size
    
    // Add new items that don't exist
    for (const item of newItems) {
      if (!array.includes(item)) {
        array.push(item);
      }
    }
    
    // Limit array size if needed
    if (array.length > 10) {
      array.length = 10;
    }
  }
  
  /**
   * Calculate confidence based on success rate and application count
   */
  private calculateConfidence(successRate: number, applicationCount: number): number {
    // Base confidence on success rate
    let confidence = successRate;
    
    // Adjust confidence based on application count
    // More applications = more confidence in the success rate
    const applicationFactor = Math.min(applicationCount / 100, 1);
    
    // Blend initial confidence (0.5) with success rate based on application count
    confidence = 0.5 * (1 - applicationFactor) + successRate * applicationFactor;
    
    return confidence;
  }
} 