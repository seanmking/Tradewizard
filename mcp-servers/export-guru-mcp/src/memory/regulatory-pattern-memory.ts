import { BusinessProfile } from '../types';
import { SimilarityEngine } from './similarity-engine';

/**
 * Regulatory pattern type
 */
export enum RegulatoryPatternType {
  CROSS_MARKET = 'CROSS_MARKET',
  TEMPORAL = 'TEMPORAL',
  COMPLIANCE_BARRIER = 'COMPLIANCE_BARRIER',
  HARMONIZATION = 'HARMONIZATION'
}

/**
 * Regulatory pattern structure
 */
export interface RegulatoryPattern {
  id: string;
  type: RegulatoryPatternType;
  name: string;
  description: string;
  confidence: number;
  applicableMarkets: string[];
  productCategories: string[];
  hsCodePatterns: string[];
  regulatoryDomain: string;
  patternCriteria: Record<string, any>;
  discoveredAt: Date;
  lastUpdated: Date;
  applicationCount: number;
  successRate: number;
  metadata: Record<string, any>;
}

/**
 * RegulatoryPatternMemory learns and recognizes patterns in regulatory data across markets
 */
export class RegulatoryPatternMemory {
  private patterns: RegulatoryPattern[] = [];
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
      this.patterns = await this.db.regulatoryPatterns.find({}).toArray();
      console.log(`Loaded ${this.patterns.length} regulatory patterns from database`);
    } catch (error) {
      console.error(`Error initializing regulatory patterns: ${error instanceof Error ? error.message : String(error)}`);
      this.patterns = [];
    }
  }
  
  /**
   * Find relevant patterns for a business profile
   */
  async findRelevantPatterns(
    businessProfile: BusinessProfile
  ): Promise<RegulatoryPattern[]> {
    try {
      // Filter patterns by basic criteria
      const filteredPatterns = this.patterns.filter(pattern => {
        // Check if any product categories match
        const hasMatchingProducts = businessProfile.products.some(product => 
          pattern.productCategories.includes(product.category)
        );
        
        // Check if any target markets match
        const hasMatchingMarkets = businessProfile.targetMarkets.some(market => 
          pattern.applicableMarkets.includes(market)
        );
        
        // Basic filtering: must match either products or markets
        return hasMatchingProducts || hasMatchingMarkets;
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
   * Find compliance-specific patterns for a business profile
   */
  async findCompliancePatterns(
    businessProfile: BusinessProfile
  ): Promise<RegulatoryPattern[]> {
    try {
      // Get all relevant patterns
      const relevantPatterns = await this.findRelevantPatterns(businessProfile);
      
      // Filter for compliance-specific patterns
      const compliancePatterns = relevantPatterns.filter(pattern => 
        pattern.type === RegulatoryPatternType.COMPLIANCE_BARRIER ||
        pattern.regulatoryDomain === 'compliance'
      );
      
      return compliancePatterns;
    } catch (error) {
      console.error(`Error finding compliance patterns: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Detect cross-market patterns in regulatory data
   */
  async detectCrossMarketPatterns(
    markets: string[],
    productCategories: string[]
  ): Promise<RegulatoryPattern[]> {
    try {
      // Implementation depends on regulatory data structure
      // This is a placeholder for the actual implementation
      
      // Get regulatory requirements for all markets and product categories
      const requirements = await this.getRequirementsForMarketsAndProducts(
        markets,
        productCategories
      );
      
      // Analyze requirements to find patterns
      const patterns = this.analyzeCrossMarketPatterns(requirements);
      
      // Store new patterns
      await this.storeNewPatterns(patterns);
      
      return patterns;
    } catch (error) {
      console.error(`Error detecting cross-market patterns: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Detect temporal trends in regulatory data
   */
  async detectTemporalPatterns(
    markets: string[],
    productCategories: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<RegulatoryPattern[]> {
    try {
      // Implementation depends on regulatory data structure
      // This is a placeholder for the actual implementation
      
      // Get historical regulatory requirements
      const historicalRequirements = await this.getHistoricalRequirements(
        markets,
        productCategories,
        timeRange
      );
      
      // Analyze requirements to find temporal patterns
      const patterns = this.analyzeTemporalPatterns(historicalRequirements);
      
      // Store new patterns
      await this.storeNewPatterns(patterns);
      
      return patterns;
    } catch (error) {
      console.error(`Error detecting temporal patterns: ${error instanceof Error ? error.message : String(error)}`);
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
      await this.db.regulatoryPatterns.updateOne(
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
  
  /**
   * Get regulatory requirements for multiple markets and product categories
   */
  private async getRequirementsForMarketsAndProducts(
    markets: string[],
    productCategories: string[]
  ): Promise<any[]> {
    try {
      // Implementation depends on regulatory data structure
      // This is a placeholder for the actual implementation
      return [];
    } catch (error) {
      console.error(`Error getting requirements: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Get historical regulatory requirements
   */
  private async getHistoricalRequirements(
    markets: string[],
    productCategories: string[],
    timeRange: { start: Date; end: Date }
  ): Promise<any[]> {
    try {
      // Implementation depends on regulatory data structure
      // This is a placeholder for the actual implementation
      return [];
    } catch (error) {
      console.error(`Error getting historical requirements: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Analyze requirements to find cross-market patterns
   */
  private analyzeCrossMarketPatterns(requirements: any[]): RegulatoryPattern[] {
    // Implementation depends on regulatory data structure
    // This is a placeholder for the actual implementation
    return [];
  }
  
  /**
   * Analyze historical requirements to find temporal patterns
   */
  private analyzeTemporalPatterns(historicalRequirements: any[]): RegulatoryPattern[] {
    // Implementation depends on regulatory data structure
    // This is a placeholder for the actual implementation
    return [];
  }
  
  /**
   * Store new patterns in database
   */
  private async storeNewPatterns(patterns: RegulatoryPattern[]): Promise<void> {
    try {
      if (patterns.length === 0) {
        return;
      }
      
      // Add new patterns to memory
      this.patterns = [...this.patterns, ...patterns];
      
      // Store new patterns in database
      await this.db.regulatoryPatterns.insertMany(patterns);
      
      console.log(`Stored ${patterns.length} new regulatory patterns`);
    } catch (error) {
      console.error(`Error storing new patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 