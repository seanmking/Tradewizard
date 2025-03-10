import { BusinessProfile } from '../types';
import { ExportStrategyMemory } from './export-strategy-memory';
import { RegulatoryPatternMemory } from './regulatory-pattern-memory';
import { BusinessProfileTracker } from './business-profile-tracker';
import { SimilarityEngine } from './similarity-engine';
import { Pool } from 'pg';

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
   * Process feedback on a pattern application and adjust pattern confidence accordingly
   * This implements a feedback loop that allows the system to learn from user feedback
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
        console.error(`Pattern application ${patternApplicationId} not found`);
        return;
      }

      // Get the pattern from the appropriate memory system
      let pattern: any = null;
      let memorySystem: any = null;

      if (patternApplication.source === PatternSource.EXPORT_STRATEGY) {
        memorySystem = this.exportStrategyMemory;
        const patterns = await this.exportStrategyMemory.findPatternById(patternApplication.patternId);
        pattern = patterns.length > 0 ? patterns[0] : null;
      } else if (patternApplication.source === PatternSource.REGULATORY) {
        memorySystem = this.regulatoryPatternMemory;
        const patterns = await this.regulatoryPatternMemory.findPatternById(patternApplication.patternId);
        pattern = patterns.length > 0 ? patterns[0] : null;
      }

      if (!pattern) {
        console.error(`Pattern ${patternApplication.patternId} not found`);
        return;
      }

      // Adjust the pattern confidence based on feedback
      const adjustedConfidence = this.adjustPatternConfidence(
        pattern.confidence,
        pattern.applicationCount,
        isHelpful,
        patternApplication.confidence
      );

      // Update the pattern with the new confidence
      pattern.confidence = adjustedConfidence;
      
      // Increment application count
      pattern.applicationCount += 1;
      
      // Update success rate if applicable
      if (pattern.successRate !== undefined) {
        const totalSuccesses = pattern.successRate * pattern.applicationCount;
        const newTotalSuccesses = isHelpful ? totalSuccesses + 1 : totalSuccesses;
        pattern.successRate = newTotalSuccesses / pattern.applicationCount;
      }
      
      // Add feedback to pattern metadata
      if (!pattern.metadata) {
        pattern.metadata = {};
      }
      
      if (!pattern.metadata.feedback) {
        pattern.metadata.feedback = [];
      }
      
      pattern.metadata.feedback.push({
        businessId,
        patternApplicationId,
        isHelpful,
        feedbackDetails,
        timestamp: new Date()
      });

      // Update the pattern in the memory system
      await memorySystem.updatePattern(pattern);

      // Record the feedback
      await this.recordFeedback(businessId, patternApplicationId, isHelpful, feedbackDetails);
      
      console.log(`Updated pattern ${pattern.id} confidence to ${adjustedConfidence} based on feedback`);
    } catch (error) {
      console.error(`Error processing feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Adjust pattern confidence based on feedback
   * This implements a Bayesian-inspired confidence adjustment
   */
  private adjustPatternConfidence(
    currentConfidence: number,
    applicationCount: number,
    isHelpful: boolean,
    applicationConfidence: number
  ): number {
    // Weight of the feedback depends on the application count
    // More applications means each individual feedback has less impact
    const feedbackWeight = Math.max(0.05, Math.min(0.3, 1 / (applicationCount + 1)));
    
    // The confidence adjustment is weighted by the application confidence
    // Higher confidence applications have more impact on the pattern confidence
    const confidenceImpact = applicationConfidence * feedbackWeight;
    
    // Adjust confidence up or down based on feedback
    let adjustedConfidence = currentConfidence;
    
    if (isHelpful) {
      // Positive feedback increases confidence, but with diminishing returns as confidence approaches 1
      const room_for_improvement = 1 - currentConfidence;
      adjustedConfidence += confidenceImpact * room_for_improvement;
    } else {
      // Negative feedback decreases confidence more significantly
      // The higher the current confidence, the more it should be reduced
      adjustedConfidence -= confidenceImpact * 1.5 * currentConfidence;
    }
    
    // Ensure confidence stays within valid range
    return Math.max(0.1, Math.min(0.99, adjustedConfidence));
  }
  
  /**
   * Find a pattern by ID in the appropriate memory system
   */
  async findPatternById(patternId: string, source: PatternSource): Promise<any | null> {
    try {
      if (source === PatternSource.EXPORT_STRATEGY) {
        return await this.exportStrategyMemory.findPatternById(patternId);
      } else if (source === PatternSource.REGULATORY) {
        return await this.regulatoryPatternMemory.findPatternById(patternId);
      }
      return null;
    } catch (error) {
      console.error(`Error finding pattern by ID: ${error instanceof Error ? error.message : String(error)}`);
      return null;
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
  
  /**
   * Get the similarity engine
   */
  getSimilarityEngine(): SimilarityEngine {
    return this.similarityEngine;
  }
  
  /**
   * Consolidate similar patterns to prevent fragmentation
   * This helps maintain a cleaner pattern database by merging patterns that are very similar
   */
  async consolidatePatterns(): Promise<void> {
    try {
      // Consolidate export strategy patterns
      await this.consolidateExportStrategyPatterns();
      
      // Consolidate regulatory patterns
      await this.consolidateRegulatoryPatterns();
      
      console.log('Pattern consolidation completed');
    } catch (error) {
      console.error(`Error consolidating patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Consolidate similar export strategy patterns
   */
  private async consolidateExportStrategyPatterns(): Promise<void> {
    try {
      // Get all export strategy patterns
      const patterns = await this.exportStrategyMemory.getAllPatterns();
      
      // Group patterns by market and entry strategy
      const patternGroups: Record<string, any[]> = {};
      
      for (const pattern of patterns) {
        // Skip patterns with high confidence and application count
        if (pattern.confidence > 0.8 && pattern.applicationCount > 10) {
          continue; // These are well-established patterns, don't consolidate
        }
        
        // Create a key based on markets and strategy
        const markets = pattern.applicableMarkets.sort().join(',');
        const key = `${markets}|${pattern.entryStrategy}`;
        
        if (!patternGroups[key]) {
          patternGroups[key] = [];
        }
        
        patternGroups[key].push(pattern);
      }
      
      // For each group with multiple patterns, check similarity and consolidate if needed
      for (const [key, groupPatterns] of Object.entries(patternGroups)) {
        if (groupPatterns.length < 2) {
          continue; // Need at least 2 patterns to consolidate
        }
        
        // Sort by application count (descending)
        groupPatterns.sort((a, b) => b.applicationCount - a.applicationCount);
        
        // Use the pattern with highest application count as primary
        const primaryPattern = groupPatterns[0];
        const patternsToMerge = [];
        
        // Check similarity with other patterns in the group
        for (let i = 1; i < groupPatterns.length; i++) {
          const secondaryPattern = groupPatterns[i];
          
          // Calculate similarity between patterns
          const similarity = this.calculatePatternSimilarity(primaryPattern, secondaryPattern);
          
          // If similarity is high, mark for merging
          if (similarity > 0.85) {
            patternsToMerge.push(secondaryPattern);
          }
        }
        
        // If we have patterns to merge, consolidate them
        if (patternsToMerge.length > 0) {
          await this.mergeExportStrategyPatterns(primaryPattern, patternsToMerge);
        }
      }
    } catch (error) {
      console.error(`Error consolidating export strategy patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Merge multiple export strategy patterns into a primary pattern
   */
  private async mergeExportStrategyPatterns(primaryPattern: any, patternsToMerge: any[]): Promise<void> {
    try {
      // Calculate total application count
      const totalApplicationCount = primaryPattern.applicationCount + 
        patternsToMerge.reduce((sum, p) => sum + p.applicationCount, 0);
      
      // Calculate weighted success rate
      const weightedSuccessRate = (primaryPattern.successRate * primaryPattern.applicationCount +
        patternsToMerge.reduce((sum, p) => sum + (p.successRate * p.applicationCount), 0)) / totalApplicationCount;
      
      // Merge common challenges
      const allChallenges = [
        ...primaryPattern.commonChallenges,
        ...patternsToMerge.flatMap(p => p.commonChallenges)
      ];
      const commonChallenges = this.getTopFrequentItems(allChallenges, 5);
      
      // Merge critical success factors
      const allSuccessFactors = [
        ...primaryPattern.criticalSuccessFactors,
        ...patternsToMerge.flatMap(p => p.criticalSuccessFactors)
      ];
      const criticalSuccessFactors = this.getTopFrequentItems(allSuccessFactors, 5);
      
      // Merge relevant certifications
      const allCertifications = [
        ...primaryPattern.relevantCertifications,
        ...patternsToMerge.flatMap(p => p.relevantCertifications)
      ];
      const relevantCertifications = this.getTopFrequentItems(allCertifications, 5);
      
      // Update primary pattern
      const updatedPattern = {
        ...primaryPattern,
        applicationCount: totalApplicationCount,
        successRate: weightedSuccessRate,
        confidence: this.calculateConfidence(weightedSuccessRate, totalApplicationCount),
        commonChallenges,
        criticalSuccessFactors,
        relevantCertifications,
        lastUpdated: new Date(),
        metadata: {
          ...primaryPattern.metadata,
          mergedPatternIds: patternsToMerge.map(p => p.id),
          mergedAt: new Date()
        }
      };
      
      // Update the primary pattern
      await this.exportStrategyMemory.updatePattern(updatedPattern);
      
      // Archive the merged patterns
      for (const pattern of patternsToMerge) {
        await this.exportStrategyMemory.archivePattern(pattern.id, primaryPattern.id);
      }
      
      console.log(`Merged ${patternsToMerge.length} export strategy patterns into ${primaryPattern.id}`);
    } catch (error) {
      console.error(`Error merging export strategy patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Consolidate similar regulatory patterns
   */
  private async consolidateRegulatoryPatterns(): Promise<void> {
    try {
      // Get all regulatory patterns
      const patterns = await this.regulatoryPatternMemory.getAllPatterns();
      
      // Group patterns by type and domain
      const patternGroups: Record<string, any[]> = {};
      
      for (const pattern of patterns) {
        // Skip patterns with high confidence and application count
        if (pattern.confidence > 0.8 && pattern.applicationCount > 10) {
          continue; // These are well-established patterns, don't consolidate
        }
        
        // Create a key based on type and domain
        const key = `${pattern.type}|${pattern.regulatoryDomain}`;
        
        if (!patternGroups[key]) {
          patternGroups[key] = [];
        }
        
        patternGroups[key].push(pattern);
      }
      
      // For each group with multiple patterns, check similarity and consolidate if needed
      for (const [key, groupPatterns] of Object.entries(patternGroups)) {
        if (groupPatterns.length < 2) {
          continue; // Need at least 2 patterns to consolidate
        }
        
        // Sort by application count (descending)
        groupPatterns.sort((a, b) => b.applicationCount - a.applicationCount);
        
        // Use the pattern with highest application count as primary
        const primaryPattern = groupPatterns[0];
        const patternsToMerge = [];
        
        // Check similarity with other patterns in the group
        for (let i = 1; i < groupPatterns.length; i++) {
          const secondaryPattern = groupPatterns[i];
          
          // Calculate similarity between patterns
          const similarity = this.calculatePatternSimilarity(primaryPattern, secondaryPattern);
          
          // If similarity is high, mark for merging
          if (similarity > 0.85) {
            patternsToMerge.push(secondaryPattern);
          }
        }
        
        // If we have patterns to merge, consolidate them
        if (patternsToMerge.length > 0) {
          await this.mergeRegulatoryPatterns(primaryPattern, patternsToMerge);
        }
      }
    } catch (error) {
      console.error(`Error consolidating regulatory patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Merge multiple regulatory patterns into a primary pattern
   */
  private async mergeRegulatoryPatterns(primaryPattern: any, patternsToMerge: any[]): Promise<void> {
    try {
      // Calculate total application count
      const totalApplicationCount = primaryPattern.applicationCount + 
        patternsToMerge.reduce((sum, p) => sum + p.applicationCount, 0);
      
      // Calculate weighted success rate
      const weightedSuccessRate = (primaryPattern.successRate * primaryPattern.applicationCount +
        patternsToMerge.reduce((sum, p) => sum + (p.successRate * p.applicationCount), 0)) / totalApplicationCount;
      
      // Merge applicable markets
      const allMarkets = [
        ...primaryPattern.applicableMarkets,
        ...patternsToMerge.flatMap(p => p.applicableMarkets)
      ];
      const applicableMarkets = [...new Set(allMarkets)];
      
      // Merge product categories
      const allCategories = [
        ...primaryPattern.productCategories,
        ...patternsToMerge.flatMap(p => p.productCategories)
      ];
      const productCategories = [...new Set(allCategories)];
      
      // Update primary pattern
      const updatedPattern = {
        ...primaryPattern,
        applicationCount: totalApplicationCount,
        successRate: weightedSuccessRate,
        confidence: this.calculateConfidence(weightedSuccessRate, totalApplicationCount),
        applicableMarkets,
        productCategories,
        lastUpdated: new Date(),
        metadata: {
          ...primaryPattern.metadata,
          mergedPatternIds: patternsToMerge.map(p => p.id),
          mergedAt: new Date()
        }
      };
      
      // Update the primary pattern
      await this.regulatoryPatternMemory.updatePattern(updatedPattern);
      
      // Archive the merged patterns
      for (const pattern of patternsToMerge) {
        await this.regulatoryPatternMemory.archivePattern(pattern.id, primaryPattern.id);
      }
      
      console.log(`Merged ${patternsToMerge.length} regulatory patterns into ${primaryPattern.id}`);
    } catch (error) {
      console.error(`Error merging regulatory patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Calculate similarity between two patterns
   */
  private calculatePatternSimilarity(pattern1: any, pattern2: any): number {
    // For export strategy patterns
    if (pattern1.entryStrategy && pattern2.entryStrategy) {
      return this.calculateExportStrategyPatternSimilarity(pattern1, pattern2);
    }
    
    // For regulatory patterns
    if (pattern1.regulatoryDomain && pattern2.regulatoryDomain) {
      return this.calculateRegulatoryPatternSimilarity(pattern1, pattern2);
    }
    
    // Default similarity calculation
    return 0.5;
  }
  
  /**
   * Calculate similarity between two export strategy patterns
   */
  private calculateExportStrategyPatternSimilarity(pattern1: any, pattern2: any): number {
    let score = 0;
    let totalWeight = 0;
    
    // Compare entry strategy (high weight)
    const entryStrategyWeight = 3;
    const entryStrategyMatch = pattern1.entryStrategy === pattern2.entryStrategy ? 1 : 0;
    score += entryStrategyMatch * entryStrategyWeight;
    totalWeight += entryStrategyWeight;
    
    // Compare compliance approach (medium weight)
    const complianceWeight = 2;
    const complianceMatch = pattern1.complianceApproach === pattern2.complianceApproach ? 1 : 0;
    score += complianceMatch * complianceWeight;
    totalWeight += complianceWeight;
    
    // Compare logistics model (medium weight)
    const logisticsWeight = 2;
    const logisticsMatch = pattern1.logisticsModel === pattern2.logisticsModel ? 1 : 0;
    score += logisticsMatch * logisticsWeight;
    totalWeight += logisticsWeight;
    
    // Compare applicable markets (medium weight)
    const marketsWeight = 2;
    const marketSimilarity = this.calculateSetSimilarity(
      pattern1.applicableMarkets,
      pattern2.applicableMarkets
    );
    score += marketSimilarity * marketsWeight;
    totalWeight += marketsWeight;
    
    // Compare product categories (medium weight)
    const categoriesWeight = 2;
    const categorySimilarity = this.calculateSetSimilarity(
      pattern1.productCategories,
      pattern2.productCategories
    );
    score += categorySimilarity * categoriesWeight;
    totalWeight += categoriesWeight;
    
    // Calculate normalized score
    return totalWeight > 0 ? score / totalWeight : 0;
  }
  
  /**
   * Calculate similarity between two regulatory patterns
   */
  private calculateRegulatoryPatternSimilarity(pattern1: any, pattern2: any): number {
    let score = 0;
    let totalWeight = 0;
    
    // Compare type (high weight)
    const typeWeight = 3;
    const typeMatch = pattern1.type === pattern2.type ? 1 : 0;
    score += typeMatch * typeWeight;
    totalWeight += typeWeight;
    
    // Compare regulatory domain (high weight)
    const domainWeight = 3;
    const domainMatch = pattern1.regulatoryDomain === pattern2.regulatoryDomain ? 1 : 0;
    score += domainMatch * domainWeight;
    totalWeight += domainWeight;
    
    // Compare applicable markets (medium weight)
    const marketsWeight = 2;
    const marketSimilarity = this.calculateSetSimilarity(
      pattern1.applicableMarkets,
      pattern2.applicableMarkets
    );
    score += marketSimilarity * marketsWeight;
    totalWeight += marketsWeight;
    
    // Compare product categories (medium weight)
    const categoriesWeight = 2;
    const categorySimilarity = this.calculateSetSimilarity(
      pattern1.productCategories,
      pattern2.productCategories
    );
    score += categorySimilarity * categoriesWeight;
    totalWeight += categoriesWeight;
    
    // Calculate normalized score
    return totalWeight > 0 ? score / totalWeight : 0;
  }
  
  /**
   * Calculate similarity between two sets
   */
  private calculateSetSimilarity(set1: string[], set2: string[]): number {
    if (!set1 || !set2 || set1.length === 0 || set2.length === 0) {
      return 0;
    }
    
    // Calculate Jaccard similarity: intersection size / union size
    const set1Set = new Set(set1);
    const set2Set = new Set(set2);
    
    // Calculate intersection
    const intersection = new Set([...set1Set].filter(x => set2Set.has(x)));
    
    // Calculate union
    const union = new Set([...set1Set, ...set2Set]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Get top N most frequent items from an array
   */
  private getTopFrequentItems(items: string[], n: number): string[] {
    const frequency: Record<string, number> = {};
    
    // Count frequency of each item
    for (const item of items) {
      if (!item) continue;
      frequency[item] = (frequency[item] || 0) + 1;
    }
    
    // Sort by frequency (descending)
    const sortedItems = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => item);
    
    // Return top N items
    return sortedItems.slice(0, n);
  }
  
  /**
   * Calculate confidence based on success rate and application count
   */
  private calculateConfidence(successRate: number, applicationCount: number): number {
    // Base confidence from success rate
    let confidence = successRate;
    
    // Adjust based on application count (more applications = more confidence)
    if (applicationCount < 5) {
      confidence *= 0.7; // Low application count reduces confidence
    } else if (applicationCount < 10) {
      confidence *= 0.85; // Medium application count slightly reduces confidence
    } else if (applicationCount > 20) {
      confidence = Math.min(0.95, confidence * 1.1); // High application count increases confidence
    }
    
    return confidence;
  }
} 