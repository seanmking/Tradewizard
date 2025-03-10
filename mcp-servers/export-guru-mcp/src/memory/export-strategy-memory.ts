import { BusinessProfile } from '../types';
import { SimilarityEngine } from './similarity-engine';
import { Pool } from 'pg';

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
  private db: Pool; // Database connection
  
  constructor(similarityEngine: SimilarityEngine, db: Pool) {
    this.similarityEngine = similarityEngine;
    this.db = db;
  }
  
  /**
   * Initialize patterns from database
   */
  async initialize(): Promise<void> {
    try {
      // Load patterns from database
      const result = await this.db.query(`
        SELECT * FROM export_strategy_patterns 
        WHERE archived = false
      `);
      
      this.patterns = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        confidence: row.confidence,
        businessSizeRange: {
          min: row.business_size_min,
          max: row.business_size_max
        },
        productCategories: row.product_categories,
        applicableMarkets: row.applicable_markets,
        entryStrategy: row.entry_strategy,
        complianceApproach: row.compliance_approach,
        logisticsModel: row.logistics_model,
        estimatedTimeline: {
          min: row.timeline_min,
          max: row.timeline_max,
          average: row.timeline_average
        },
        successRate: row.success_rate,
        commonChallenges: row.common_challenges,
        criticalSuccessFactors: row.critical_success_factors,
        relevantCertifications: row.relevant_certifications,
        applicationCount: row.application_count,
        discoveredAt: row.discovered_at,
        lastUpdated: row.last_updated,
        metadata: row.metadata || {}
      }));
      
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
      await this.db.query(`
        INSERT INTO export_outcomes (
          id, business_id, business_profile, market, products, 
          entry_strategy, compliance_approach, logistics_model, 
          results, timestamp, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        outcome.id,
        outcome.businessId,
        JSON.stringify(outcome.businessProfile),
        outcome.market,
        JSON.stringify(outcome.products),
        outcome.entryStrategy,
        outcome.complianceApproach,
        outcome.logisticsModel,
        JSON.stringify(outcome.results),
        outcome.timestamp,
        JSON.stringify(outcome.metadata)
      ]);
      
      // If outcome was successful, learn from it
      if (outcome.results.successful) {
        await this.learnFromOutcome(outcome);
      }
      
      // Detect meta patterns periodically
      await this.detectMetaPatterns();
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
      await this.db.query(`
        UPDATE export_strategy_patterns SET
          confidence = $1,
          success_rate = $2,
          application_count = $3,
          last_updated = $4
        WHERE id = $5
      `, [
        pattern.confidence,
        pattern.successRate,
        pattern.applicationCount,
        new Date(),
        pattern.id
      ]);
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
        console.log(`Updated existing pattern ${existingPattern.id} with new outcome data`);
      } else {
        // Create new pattern
        const newPattern = await this.createNewPattern(outcome);
        console.log(`Created new pattern ${newPattern.id} from outcome for business ${outcome.businessId}`);
      }
      
      // After learning individual patterns, attempt to detect meta-patterns
      if (outcome.results.successful) {
        await this.detectMetaPatterns();
      }
      
      // Record the learning event for analytics
      await this.recordLearningEvent({
        type: 'OUTCOME_LEARNING',
        outcomeId: outcome.id,
        businessId: outcome.businessId,
        market: outcome.market,
        timestamp: new Date(),
        patternId: existingPattern?.id
      });
    } catch (error) {
      console.error(`Error learning from outcome: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Detects higher-level patterns across multiple successful strategies
   * This helps identify trends and commonalities across different businesses
   */
  private async detectMetaPatterns(): Promise<void> {
    try {
      // Get all successful outcomes
      const successfulOutcomes = await this.db.query(`
        SELECT * FROM export_outcomes 
        WHERE results = $1
      `, [JSON.stringify({ successful: true })]);
      
      if (successfulOutcomes.rows.length < 5) {
        // Not enough data to detect meta-patterns
        return;
      }
      
      // Group outcomes by market
      const outcomesByMarket = this.groupOutcomesByMarket(successfulOutcomes.rows.map(row => ({
        id: row.id,
        businessId: row.business_id,
        businessProfile: JSON.parse(row.business_profile),
        market: row.market,
        products: JSON.parse(row.products),
        entryStrategy: row.entry_strategy,
        complianceApproach: row.compliance_approach,
        logisticsModel: row.logistics_model,
        results: JSON.parse(row.results),
        timestamp: row.timestamp,
        metadata: row.metadata || {}
      })));
      
      // For each market with enough data, detect market-specific patterns
      for (const [market, outcomes] of Object.entries(outcomesByMarket)) {
        if (outcomes.length >= 3) {
          await this.detectMarketSpecificPatterns(market, outcomes);
        }
      }
      
      // Group outcomes by product category
      const outcomesByProductCategory = this.groupOutcomesByProductCategory(successfulOutcomes.rows.map(row => ({
        id: row.id,
        businessId: row.business_id,
        businessProfile: JSON.parse(row.business_profile),
        market: row.market,
        products: JSON.parse(row.products),
        entryStrategy: row.entry_strategy,
        complianceApproach: row.compliance_approach,
        logisticsModel: row.logistics_model,
        results: JSON.parse(row.results),
        timestamp: row.timestamp,
        metadata: row.metadata || {}
      })));
      
      // For each product category with enough data, detect product-specific patterns
      for (const [category, outcomes] of Object.entries(outcomesByProductCategory)) {
        if (outcomes.length >= 3) {
          await this.detectProductSpecificPatterns(category, outcomes);
        }
      }
      
      // Detect business-size specific patterns
      await this.detectBusinessSizePatterns(successfulOutcomes.rows.map(row => ({
        id: row.id,
        businessId: row.business_id,
        businessProfile: JSON.parse(row.business_profile),
        market: row.market,
        products: JSON.parse(row.products),
        entryStrategy: row.entry_strategy,
        complianceApproach: row.compliance_approach,
        logisticsModel: row.logistics_model,
        results: JSON.parse(row.results),
        timestamp: row.timestamp,
        metadata: row.metadata || {}
      })));
      
      // Detect cross-market patterns (strategies that work across multiple markets)
      await this.detectCrossMarketPatterns(successfulOutcomes.rows.map(row => ({
        id: row.id,
        businessId: row.business_id,
        businessProfile: JSON.parse(row.business_profile),
        market: row.market,
        products: JSON.parse(row.products),
        entryStrategy: row.entry_strategy,
        complianceApproach: row.compliance_approach,
        logisticsModel: row.logistics_model,
        results: JSON.parse(row.results),
        timestamp: row.timestamp,
        metadata: row.metadata || {}
      })));
    } catch (error) {
      console.error(`Error detecting meta-patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Group outcomes by market
   */
  private groupOutcomesByMarket(outcomes: ExportOutcome[]): Record<string, ExportOutcome[]> {
    const groupedOutcomes: Record<string, ExportOutcome[]> = {};
    
    for (const outcome of outcomes) {
      if (!groupedOutcomes[outcome.market]) {
        groupedOutcomes[outcome.market] = [];
      }
      groupedOutcomes[outcome.market].push(outcome);
    }
    
    return groupedOutcomes;
  }
  
  /**
   * Group outcomes by product category
   */
  private groupOutcomesByProductCategory(outcomes: ExportOutcome[]): Record<string, ExportOutcome[]> {
    const groupedOutcomes: Record<string, ExportOutcome[]> = {};
    
    for (const outcome of outcomes) {
      for (const product of outcome.products) {
        if (!groupedOutcomes[product.category]) {
          groupedOutcomes[product.category] = [];
        }
        
        // Only add the outcome once per category
        if (!groupedOutcomes[product.category].some(o => o.id === outcome.id)) {
          groupedOutcomes[product.category].push(outcome);
        }
      }
    }
    
    return groupedOutcomes;
  }
  
  /**
   * Detect market-specific patterns
   */
  private async detectMarketSpecificPatterns(market: string, outcomes: ExportOutcome[]): Promise<void> {
    try {
      // Find common strategies for this market
      const entryStrategies = this.findMostCommonValues(outcomes.map(o => o.entryStrategy));
      const complianceApproaches = this.findMostCommonValues(outcomes.map(o => o.complianceApproach));
      const logisticsModels = this.findMostCommonValues(outcomes.map(o => o.logisticsModel));
      
      // Find common success factors
      const allSuccessFactors = outcomes.flatMap(o => o.results.successFactors);
      const commonSuccessFactors = this.findMostCommonValues(allSuccessFactors);
      
      // Find common challenges
      const allChallenges = outcomes.flatMap(o => o.results.challenges);
      const commonChallenges = this.findMostCommonValues(allChallenges);
      
      // Check if we already have a market meta-pattern
      const existingMetaPattern = await this.db.query(`
        SELECT * FROM export_strategy_patterns 
        WHERE archived = false AND metadata = $1
      `, [JSON.stringify({ patternType: 'MARKET_META', market: market })]);
      
      if (existingMetaPattern.rows.length > 0) {
        // Update existing meta-pattern
        await this.db.query(`
          UPDATE export_strategy_patterns SET
            entry_strategy = $1,
            compliance_approach = $2,
            logistics_model = $3,
            critical_success_factors = $4,
            common_challenges = $5,
            last_updated = $6,
            metadata = $7
          WHERE id = $8
        `, [
          entryStrategies[0] || existingMetaPattern.rows[0].entry_strategy,
          complianceApproaches[0] || existingMetaPattern.rows[0].compliance_approach,
          logisticsModels[0] || existingMetaPattern.rows[0].logistics_model,
          commonSuccessFactors,
          commonChallenges,
          new Date(),
          JSON.stringify({
            ...existingMetaPattern.rows[0].metadata,
            sampleSize: outcomes.length,
            sourceOutcomeIds: outcomes.map(o => o.id),
            confidence: {
              entryStrategy: entryStrategies[0] ? entryStrategies[1] / outcomes.length : 0,
              complianceApproach: complianceApproaches[0] ? complianceApproaches[1] / outcomes.length : 0,
              logisticsModel: logisticsModels[0] ? logisticsModels[1] / outcomes.length : 0
            }
          }),
          existingMetaPattern.rows[0].id
        ]);
      } else {
        // Create new meta-pattern
        const metaPatternId = `market-meta-${market}-${Date.now()}`;
        
        // Calculate timeline statistics
        const timelineStats = this.calculateTimelineStatistics(outcomes.map(o => o.results.timeline));
        
        // Extract certification names
        const certificationNames = this.extractCertificationNames(
          outcomes.flatMap(o => o.businessProfile.certifications || [])
        );
        
        // Create meta-pattern
        const metaPattern: ExportStrategyPattern = {
          id: metaPatternId,
          name: `${market} Market Success Pattern`,
          description: `Common successful strategies for exporting to ${market}`,
          confidence: 0.7, // Initial confidence for meta-patterns
          businessSizeRange: {}, // Will be populated dynamically based on query
          productCategories: this.findMostCommonValues(
            outcomes.flatMap(o => o.products.map(p => p.category))
          ),
          applicableMarkets: [market],
          entryStrategy: entryStrategies[0] || 'Various',
          complianceApproach: complianceApproaches[0] || 'Various',
          logisticsModel: logisticsModels[0] || 'Various',
          estimatedTimeline: {
            min: timelineStats.min,
            max: timelineStats.max,
            average: timelineStats.average
          },
          successRate: 1.0, // Meta-patterns are derived from successful outcomes
          commonChallenges: commonChallenges,
          criticalSuccessFactors: commonSuccessFactors,
          relevantCertifications: certificationNames,
          applicationCount: 0,
          discoveredAt: new Date(),
          lastUpdated: new Date(),
          metadata: {
            patternType: 'MARKET_META',
            market: market,
            sampleSize: outcomes.length,
            sourceOutcomeIds: outcomes.map(o => o.id),
            confidence: {
              entryStrategy: entryStrategies[0] ? entryStrategies[1] / outcomes.length : 0,
              complianceApproach: complianceApproaches[0] ? complianceApproaches[1] / outcomes.length : 0,
              logisticsModel: logisticsModels[0] ? logisticsModels[1] / outcomes.length : 0
            }
          }
        };
        
        // Store the meta-pattern
        await this.db.query(`
          INSERT INTO export_strategy_patterns (
            id, name, description, confidence, business_size_min, business_size_max, 
            product_categories, applicable_markets, entry_strategy, compliance_approach, 
            logistics_model, timeline_min, timeline_max, timeline_average, success_rate, 
            common_challenges, critical_success_factors, relevant_certifications, application_count, 
            discovered_at, last_updated, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        `, [
          metaPattern.id,
          metaPattern.name,
          metaPattern.description,
          metaPattern.confidence,
          metaPattern.businessSizeRange.min,
          metaPattern.businessSizeRange.max,
          metaPattern.productCategories,
          metaPattern.applicableMarkets,
          metaPattern.entryStrategy,
          metaPattern.complianceApproach,
          metaPattern.logisticsModel,
          metaPattern.estimatedTimeline.min,
          metaPattern.estimatedTimeline.max,
          metaPattern.estimatedTimeline.average,
          metaPattern.successRate,
          metaPattern.commonChallenges,
          metaPattern.criticalSuccessFactors,
          metaPattern.relevantCertifications,
          metaPattern.applicationCount,
          metaPattern.discoveredAt,
          new Date(),
          JSON.stringify(metaPattern.metadata)
        ]);
        
        // Add to in-memory patterns
        this.patterns.push(metaPattern);
        
        console.log(`Created market meta-pattern for ${market} based on ${outcomes.length} outcomes`);
      }
    } catch (error) {
      console.error(`Error detecting market-specific patterns for ${market}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Detect product-specific patterns
   */
  private async detectProductSpecificPatterns(category: string, outcomes: ExportOutcome[]): Promise<void> {
    try {
      // Find markets where this product category is successful
      const successfulMarkets = this.findMostCommonValues(outcomes.map(o => o.market));
      
      // Find common strategies for this product category
      const entryStrategies = this.findMostCommonValues(outcomes.map(o => o.entryStrategy));
      const complianceApproaches = this.findMostCommonValues(outcomes.map(o => o.complianceApproach));
      const logisticsModels = this.findMostCommonValues(outcomes.map(o => o.logisticsModel));
      
      // Find common success factors
      const allSuccessFactors = outcomes.flatMap(o => o.results.successFactors);
      const commonSuccessFactors = this.findMostCommonValues(allSuccessFactors);
      
      // Find common challenges
      const allChallenges = outcomes.flatMap(o => o.results.challenges);
      const commonChallenges = this.findMostCommonValues(allChallenges);
      
      // Check if we already have a product meta-pattern
      const existingMetaPattern = await this.db.query(`
        SELECT * FROM export_strategy_patterns 
        WHERE archived = false AND metadata = $1
      `, [JSON.stringify({ patternType: 'PRODUCT_META', productCategory: category })]);
      
      if (existingMetaPattern.rows.length > 0) {
        // Update existing meta-pattern
        await this.db.query(`
          UPDATE export_strategy_patterns SET
            applicable_markets = $1,
            entry_strategy = $2,
            compliance_approach = $3,
            logistics_model = $4,
            critical_success_factors = $5,
            common_challenges = $6,
            last_updated = $7,
            metadata = $8
          WHERE id = $9
        `, [
          successfulMarkets.slice(0, 10), // Top 10 markets
          entryStrategies[0] || existingMetaPattern.rows[0].entry_strategy,
          complianceApproaches[0] || existingMetaPattern.rows[0].compliance_approach,
          logisticsModels[0] || existingMetaPattern.rows[0].logistics_model,
          commonSuccessFactors,
          commonChallenges,
          new Date(),
          JSON.stringify({
            ...existingMetaPattern.rows[0].metadata,
            sampleSize: outcomes.length,
            sourceOutcomeIds: outcomes.map(o => o.id),
            topMarkets: successfulMarkets.slice(0, 5),
            confidence: {
              entryStrategy: entryStrategies[0] ? entryStrategies[1] / outcomes.length : 0,
              complianceApproach: complianceApproaches[0] ? complianceApproaches[1] / outcomes.length : 0,
              logisticsModel: logisticsModels[0] ? logisticsModels[1] / outcomes.length : 0
            }
          }),
          existingMetaPattern.rows[0].id
        ]);
      } else {
        // Create new meta-pattern
        const metaPatternId = `product-meta-${category.replace(/\s+/g, '-')}-${Date.now()}`;
        
        // Calculate timeline statistics
        const timelineStats = this.calculateTimelineStatistics(outcomes.map(o => o.results.timeline));
        
        // Extract certification names
        const certificationNames = this.extractCertificationNames(
          outcomes.flatMap(o => o.businessProfile.certifications || [])
        );
        
        // Create meta-pattern
        const metaPattern: ExportStrategyPattern = {
          id: metaPatternId,
          name: `${category} Product Success Pattern`,
          description: `Common successful strategies for exporting ${category} products`,
          confidence: 0.7, // Initial confidence for meta-patterns
          businessSizeRange: {}, // Will be populated dynamically based on query
          productCategories: [category],
          applicableMarkets: successfulMarkets.slice(0, 10), // Top 10 markets
          entryStrategy: entryStrategies[0] || 'Various',
          complianceApproach: complianceApproaches[0] || 'Various',
          logisticsModel: logisticsModels[0] || 'Various',
          estimatedTimeline: {
            min: timelineStats.min,
            max: timelineStats.max,
            average: timelineStats.average
          },
          successRate: 1.0, // Meta-patterns are derived from successful outcomes
          commonChallenges: commonChallenges,
          criticalSuccessFactors: commonSuccessFactors,
          relevantCertifications: certificationNames,
          applicationCount: 0,
          discoveredAt: new Date(),
          lastUpdated: new Date(),
          metadata: {
            patternType: 'PRODUCT_META',
            productCategory: category,
            sampleSize: outcomes.length,
            sourceOutcomeIds: outcomes.map(o => o.id),
            topMarkets: successfulMarkets.slice(0, 5),
            confidence: {
              entryStrategy: entryStrategies[0] ? entryStrategies[1] / outcomes.length : 0,
              complianceApproach: complianceApproaches[0] ? complianceApproaches[1] / outcomes.length : 0,
              logisticsModel: logisticsModels[0] ? logisticsModels[1] / outcomes.length : 0
            }
          }
        };
        
        // Store the meta-pattern
        await this.db.query(`
          INSERT INTO export_strategy_patterns (
            id, name, description, confidence, business_size_min, business_size_max, 
            product_categories, applicable_markets, entry_strategy, compliance_approach, 
            logistics_model, timeline_min, timeline_max, timeline_average, success_rate, 
            common_challenges, critical_success_factors, relevant_certifications, application_count, 
            discovered_at, last_updated, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        `, [
          metaPattern.id,
          metaPattern.name,
          metaPattern.description,
          metaPattern.confidence,
          metaPattern.businessSizeRange.min,
          metaPattern.businessSizeRange.max,
          metaPattern.productCategories,
          metaPattern.applicableMarkets,
          metaPattern.entryStrategy,
          metaPattern.complianceApproach,
          metaPattern.logisticsModel,
          metaPattern.estimatedTimeline.min,
          metaPattern.estimatedTimeline.max,
          metaPattern.estimatedTimeline.average,
          metaPattern.successRate,
          metaPattern.commonChallenges,
          metaPattern.criticalSuccessFactors,
          metaPattern.relevantCertifications,
          metaPattern.applicationCount,
          metaPattern.discoveredAt,
          new Date(),
          JSON.stringify(metaPattern.metadata)
        ]);
        
        // Add to in-memory patterns
        this.patterns.push(metaPattern);
        
        console.log(`Created product meta-pattern for ${category} based on ${outcomes.length} outcomes`);
      }
    } catch (error) {
      console.error(`Error detecting product-specific patterns for ${category}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Detect business-size specific patterns
   */
  private async detectBusinessSizePatterns(outcomes: ExportOutcome[]): Promise<void> {
    try {
      // Group businesses by size category
      const sizeCategories = {
        'micro': outcomes.filter(o => (o.businessProfile.size || 0) < 10),
        'small': outcomes.filter(o => (o.businessProfile.size || 0) >= 10 && (o.businessProfile.size || 0) < 50),
        'medium': outcomes.filter(o => (o.businessProfile.size || 0) >= 50 && (o.businessProfile.size || 0) < 250),
        'large': outcomes.filter(o => (o.businessProfile.size || 0) >= 250)
      };
      
      // Process each size category with enough data
      for (const [sizeCategory, sizeOutcomes] of Object.entries(sizeCategories)) {
        if (sizeOutcomes.length >= 3) {
          await this.detectSizeCategoryPatterns(sizeCategory, sizeOutcomes);
        }
      }
    } catch (error) {
      console.error(`Error detecting business-size patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Detect patterns for a specific business size category
   */
  private async detectSizeCategoryPatterns(sizeCategory: string, outcomes: ExportOutcome[]): Promise<void> {
    try {
      // Find successful markets for this size category
      const successfulMarkets = this.findMostCommonValues(outcomes.map(o => o.market));
      
      // Find common strategies for this size category
      const entryStrategies = this.findMostCommonValues(outcomes.map(o => o.entryStrategy));
      const complianceApproaches = this.findMostCommonValues(outcomes.map(o => o.complianceApproach));
      const logisticsModels = this.findMostCommonValues(outcomes.map(o => o.logisticsModel));
      
      // Find common product categories
      const productCategories = this.findMostCommonValues(
        outcomes.flatMap(o => o.products.map(p => p.category))
      );
      
      // Find common success factors
      const allSuccessFactors = outcomes.flatMap(o => o.results.successFactors);
      const commonSuccessFactors = this.findMostCommonValues(allSuccessFactors);
      
      // Find common challenges
      const allChallenges = outcomes.flatMap(o => o.results.challenges);
      const commonChallenges = this.findMostCommonValues(allChallenges);
      
      // Check if we already have a size meta-pattern
      const existingMetaPattern = await this.db.query(`
        SELECT * FROM export_strategy_patterns 
        WHERE archived = false AND metadata = $1
      `, [JSON.stringify({ patternType: 'SIZE_META', sizeCategory: sizeCategory })]);
      
      // Calculate business size range
      const sizeRange = this.calculateSizeRange(sizeCategory);
      
      if (existingMetaPattern.rows.length > 0) {
        // Update existing meta-pattern
        await this.db.query(`
          UPDATE export_strategy_patterns SET
            applicable_markets = $1,
            product_categories = $2,
            entry_strategy = $3,
            compliance_approach = $4,
            logistics_model = $5,
            critical_success_factors = $6,
            common_challenges = $7,
            last_updated = $8,
            metadata = $9
          WHERE id = $10
        `, [
          successfulMarkets.slice(0, 10), // Top 10 markets
          productCategories.slice(0, 10), // Top 10 product categories
          entryStrategies[0] || existingMetaPattern.rows[0].entry_strategy,
          complianceApproaches[0] || existingMetaPattern.rows[0].compliance_approach,
          logisticsModels[0] || existingMetaPattern.rows[0].logistics_model,
          commonSuccessFactors,
          commonChallenges,
          new Date(),
          JSON.stringify({
            ...existingMetaPattern.rows[0].metadata,
            sampleSize: outcomes.length,
            sourceOutcomeIds: outcomes.map(o => o.id),
            topMarkets: successfulMarkets.slice(0, 5),
            confidence: {
              entryStrategy: entryStrategies[0] ? entryStrategies[1] / outcomes.length : 0,
              complianceApproach: complianceApproaches[0] ? complianceApproaches[1] / outcomes.length : 0,
              logisticsModel: logisticsModels[0] ? logisticsModels[1] / outcomes.length : 0
            }
          }),
          existingMetaPattern.rows[0].id
        ]);
      } else {
        // Create new meta-pattern
        const metaPatternId = `size-meta-${sizeCategory}-${Date.now()}`;
        
        // Calculate timeline statistics
        const timelineStats = this.calculateTimelineStatistics(outcomes.map(o => o.results.timeline));
        
        // Extract certification names
        const certificationNames = this.extractCertificationNames(
          outcomes.flatMap(o => o.businessProfile.certifications || [])
        );
        
        // Create meta-pattern
        const metaPattern: ExportStrategyPattern = {
          id: metaPatternId,
          name: `${this.capitalizeSizeCategory(sizeCategory)} Business Success Pattern`,
          description: `Common successful export strategies for ${sizeCategory} businesses`,
          confidence: 0.7, // Initial confidence for meta-patterns
          businessSizeRange: sizeRange,
          productCategories: productCategories.slice(0, 10), // Top 10 product categories
          applicableMarkets: successfulMarkets.slice(0, 10), // Top 10 markets
          entryStrategy: entryStrategies[0] || 'Various',
          complianceApproach: complianceApproaches[0] || 'Various',
          logisticsModel: logisticsModels[0] || 'Various',
          estimatedTimeline: {
            min: timelineStats.min,
            max: timelineStats.max,
            average: timelineStats.average
          },
          successRate: 1.0, // Meta-patterns are derived from successful outcomes
          commonChallenges: commonChallenges,
          criticalSuccessFactors: commonSuccessFactors,
          relevantCertifications: certificationNames,
          applicationCount: 0,
          discoveredAt: new Date(),
          lastUpdated: new Date(),
          metadata: {
            patternType: 'SIZE_META',
            sizeCategory: sizeCategory,
            sampleSize: outcomes.length,
            sourceOutcomeIds: outcomes.map(o => o.id),
            topMarkets: successfulMarkets.slice(0, 5),
            confidence: {
              entryStrategy: entryStrategies[0] ? entryStrategies[1] / outcomes.length : 0,
              complianceApproach: complianceApproaches[0] ? complianceApproaches[1] / outcomes.length : 0,
              logisticsModel: logisticsModels[0] ? logisticsModels[1] / outcomes.length : 0
            }
          }
        };
        
        // Store the meta-pattern
        await this.db.query(`
          INSERT INTO export_strategy_patterns (
            id, name, description, confidence, business_size_min, business_size_max, 
            product_categories, applicable_markets, entry_strategy, compliance_approach, 
            logistics_model, timeline_min, timeline_max, timeline_average, success_rate, 
            common_challenges, critical_success_factors, relevant_certifications, application_count, 
            discovered_at, last_updated, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        `, [
          metaPattern.id,
          metaPattern.name,
          metaPattern.description,
          metaPattern.confidence,
          metaPattern.businessSizeRange.min,
          metaPattern.businessSizeRange.max,
          metaPattern.productCategories,
          metaPattern.applicableMarkets,
          metaPattern.entryStrategy,
          metaPattern.complianceApproach,
          metaPattern.logisticsModel,
          metaPattern.estimatedTimeline.min,
          metaPattern.estimatedTimeline.max,
          metaPattern.estimatedTimeline.average,
          metaPattern.successRate,
          metaPattern.commonChallenges,
          metaPattern.criticalSuccessFactors,
          metaPattern.relevantCertifications,
          metaPattern.applicationCount,
          metaPattern.discoveredAt,
          new Date(),
          JSON.stringify(metaPattern.metadata)
        ]);
        
        // Add to in-memory patterns
        this.patterns.push(metaPattern);
        
        console.log(`Created size meta-pattern for ${sizeCategory} businesses based on ${outcomes.length} outcomes`);
      }
    } catch (error) {
      console.error(`Error detecting size category patterns for ${sizeCategory}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Detect cross-market patterns (strategies that work across multiple markets)
   */
  private async detectCrossMarketPatterns(outcomes: ExportOutcome[]): Promise<void> {
    try {
      // Group businesses that have successfully exported to multiple markets
      const businessIds = new Set(outcomes.map(o => o.businessId));
      
      const crossMarketBusinesses: Record<string, ExportOutcome[]> = {};
      
      for (const businessId of businessIds) {
        const businessOutcomes = outcomes.filter(o => o.businessId === businessId);
        
        // Only consider businesses with exports to multiple markets
        const uniqueMarkets = new Set(businessOutcomes.map(o => o.market));
        if (uniqueMarkets.size >= 2) {
          crossMarketBusinesses[businessId] = businessOutcomes;
        }
      }
      
      // If we don't have enough businesses with cross-market success, exit
      if (Object.keys(crossMarketBusinesses).length < 3) {
        return;
      }
      
      // Find common strategies across multiple markets
      const allCrossMarketOutcomes = Object.values(crossMarketBusinesses).flat();
      
      // Find common strategies for cross-market success
      const entryStrategies = this.findMostCommonValues(allCrossMarketOutcomes.map(o => o.entryStrategy));
      const complianceApproaches = this.findMostCommonValues(allCrossMarketOutcomes.map(o => o.complianceApproach));
      const logisticsModels = this.findMostCommonValues(allCrossMarketOutcomes.map(o => o.logisticsModel));
      
      // Find common product categories
      const productCategories = this.findMostCommonValues(
        allCrossMarketOutcomes.flatMap(o => o.products.map(p => p.category))
      );
      
      // Find common success factors
      const allSuccessFactors = allCrossMarketOutcomes.flatMap(o => o.results.successFactors);
      const commonSuccessFactors = this.findMostCommonValues(allSuccessFactors);
      
      // Find common challenges
      const allChallenges = allCrossMarketOutcomes.flatMap(o => o.results.challenges);
      const commonChallenges = this.findMostCommonValues(allChallenges);
      
      // Find all markets involved
      const allMarkets = new Set(allCrossMarketOutcomes.map(o => o.market));
      
      // Check if we already have a cross-market meta-pattern
      const existingMetaPattern = await this.db.query(`
        SELECT * FROM export_strategy_patterns 
        WHERE archived = false AND metadata = $1
      `, [JSON.stringify({ patternType: 'CROSS_MARKET_META' })]);
      
      if (existingMetaPattern.rows.length > 0) {
        // Update existing meta-pattern
        await this.db.query(`
          UPDATE export_strategy_patterns SET
            applicable_markets = $1,
            product_categories = $2,
            entry_strategy = $3,
            compliance_approach = $4,
            logistics_model = $5,
            critical_success_factors = $6,
            common_challenges = $7,
            last_updated = $8,
            metadata = $9
          WHERE id = $10
        `, [
          Array.from(allMarkets),
          productCategories.slice(0, 10), // Top 10 product categories
          entryStrategies[0] || existingMetaPattern.rows[0].entry_strategy,
          complianceApproaches[0] || existingMetaPattern.rows[0].compliance_approach,
          logisticsModels[0] || existingMetaPattern.rows[0].logistics_model,
          commonSuccessFactors,
          commonChallenges,
          new Date(),
          JSON.stringify({
            ...existingMetaPattern.rows[0].metadata,
            sampleSize: Object.keys(crossMarketBusinesses).length,
            sourceBusinessIds: Object.keys(crossMarketBusinesses),
            marketCount: allMarkets.size,
            confidence: {
              entryStrategy: entryStrategies[0] ? entryStrategies[1] / allCrossMarketOutcomes.length : 0,
              complianceApproach: complianceApproaches[0] ? complianceApproaches[1] / allCrossMarketOutcomes.length : 0,
              logisticsModel: logisticsModels[0] ? logisticsModels[1] / allCrossMarketOutcomes.length : 0
            }
          }),
          existingMetaPattern.rows[0].id
        ]);
      } else {
        // Create new meta-pattern
        const metaPatternId = `cross-market-meta-${Date.now()}`;
        
        // Calculate timeline statistics
        const timelineStats = this.calculateTimelineStatistics(allCrossMarketOutcomes.map(o => o.results.timeline));
        
        // Extract certification names
        const certificationNames = this.extractCertificationNames(
          allCrossMarketOutcomes.flatMap(o => o.businessProfile.certifications || [])
        );
        
        // Create meta-pattern
        const metaPattern: ExportStrategyPattern = {
          id: metaPatternId,
          name: `Cross-Market Success Pattern`,
          description: `Strategies that enable successful exports across multiple markets`,
          confidence: 0.75, // Higher confidence for cross-market patterns
          businessSizeRange: {}, // Will be populated dynamically
          productCategories: productCategories.slice(0, 10), // Top 10 product categories
          applicableMarkets: Array.from(allMarkets),
          entryStrategy: entryStrategies[0] || 'Various',
          complianceApproach: complianceApproaches[0] || 'Various',
          logisticsModel: logisticsModels[0] || 'Various',
          estimatedTimeline: {
            min: timelineStats.min,
            max: timelineStats.max,
            average: timelineStats.average
          },
          successRate: 1.0, // Meta-patterns are derived from successful outcomes
          commonChallenges: commonChallenges,
          criticalSuccessFactors: commonSuccessFactors,
          relevantCertifications: certificationNames,
          applicationCount: 0,
          discoveredAt: new Date(),
          lastUpdated: new Date(),
          metadata: {
            patternType: 'CROSS_MARKET_META',
            sampleSize: Object.keys(crossMarketBusinesses).length,
            sourceBusinessIds: Object.keys(crossMarketBusinesses),
            marketCount: allMarkets.size,
            confidence: {
              entryStrategy: entryStrategies[0] ? entryStrategies[1] / allCrossMarketOutcomes.length : 0,
              complianceApproach: complianceApproaches[0] ? complianceApproaches[1] / allCrossMarketOutcomes.length : 0,
              logisticsModel: logisticsModels[0] ? logisticsModels[1] / allCrossMarketOutcomes.length : 0
            }
          }
        };
        
        // Store the meta-pattern
        await this.db.query(`
          INSERT INTO export_strategy_patterns (
            id, name, description, confidence, business_size_min, business_size_max, 
            product_categories, applicable_markets, entry_strategy, compliance_approach, 
            logistics_model, timeline_min, timeline_max, timeline_average, success_rate, 
            common_challenges, critical_success_factors, relevant_certifications, application_count, 
            discovered_at, last_updated, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        `, [
          metaPattern.id,
          metaPattern.name,
          metaPattern.description,
          metaPattern.confidence,
          metaPattern.businessSizeRange.min,
          metaPattern.businessSizeRange.max,
          metaPattern.productCategories,
          metaPattern.applicableMarkets,
          metaPattern.entryStrategy,
          metaPattern.complianceApproach,
          metaPattern.logisticsModel,
          metaPattern.estimatedTimeline.min,
          metaPattern.estimatedTimeline.max,
          metaPattern.estimatedTimeline.average,
          metaPattern.successRate,
          metaPattern.commonChallenges,
          metaPattern.criticalSuccessFactors,
          metaPattern.relevantCertifications,
          metaPattern.applicationCount,
          metaPattern.discoveredAt,
          new Date(),
          JSON.stringify(metaPattern.metadata)
        ]);
        
        // Add to in-memory patterns
        this.patterns.push(metaPattern);
        
        console.log(`Created cross-market meta-pattern based on ${Object.keys(crossMarketBusinesses).length} businesses with multiple market success`);
      }
    } catch (error) {
      console.error(`Error detecting cross-market patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Record learning event for analytics
   */
  private async recordLearningEvent(event: any): Promise<void> {
    try {
      // Store the learning event
      await this.db.query(`
        INSERT INTO learning_events (
          type, outcome_id, business_id, market, timestamp, pattern_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        event.type,
        event.outcomeId,
        event.businessId,
        event.market,
        event.timestamp,
        event.patternId
      ]);
    } catch (error) {
      console.error(`Error recording learning event: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Calculate size range from size category
   */
  private calculateSizeRange(sizeCategory: string): { min?: number; max?: number } {
    switch (sizeCategory) {
      case 'micro':
        return { max: 9 };
      case 'small':
        return { min: 10, max: 49 };
      case 'medium':
        return { min: 50, max: 249 };
      case 'large':
        return { min: 250 };
      default:
        return {};
    }
  }
  
  /**
   * Capitalize size category
   */
  private capitalizeSizeCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
  
  /**
   * Extract certification names from certification objects or strings
   */
  private extractCertificationNames(certifications: any[]): string[] {
    return certifications.map(cert => {
      if (typeof cert === 'string') {
        return cert;
      } else if (typeof cert === 'object' && cert !== null) {
        return cert.name || '';
      }
      return '';
    }).filter(name => name !== '');
  }
  
  /**
   * Calculate timeline statistics from an array of timeline values
   */
  private calculateTimelineStatistics(timelines: number[]): { min: number; max: number; average: number } {
    if (!timelines.length) {
      return { min: 0, max: 0, average: 0 };
    }
    
    const filteredTimelines = timelines.filter(t => t > 0);
    
    if (!filteredTimelines.length) {
      return { min: 0, max: 0, average: 0 };
    }
    
    const min = Math.min(...filteredTimelines);
    const max = Math.max(...filteredTimelines);
    const average = Math.round(filteredTimelines.reduce((sum, t) => sum + t, 0) / filteredTimelines.length);
    
    return { min, max, average };
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
    await this.db.query(`
      UPDATE export_strategy_patterns SET
        confidence = $1,
        success_rate = $2,
        application_count = $3,
        timeline_min = $4,
        timeline_max = $5,
        timeline_average = $6,
        common_challenges = $7,
        critical_success_factors = $8,
        last_updated = $9
      WHERE id = $10
    `, [
      pattern.confidence,
      pattern.successRate,
      pattern.applicationCount,
      pattern.estimatedTimeline.min,
      pattern.estimatedTimeline.max,
      pattern.estimatedTimeline.average,
      pattern.commonChallenges,
      pattern.criticalSuccessFactors,
      new Date(),
      pattern.id
    ]);
    
    // Update pattern in memory
    const patternIndex = this.patterns.findIndex(p => p.id === pattern.id);
    if (patternIndex !== -1) {
      this.patterns[patternIndex] = pattern;
    }
  }
  
  /**
   * Create a new pattern from an outcome
   */
  private async createNewPattern(outcome: ExportOutcome): Promise<ExportStrategyPattern> {
    // Extract certification names
    const certificationNames = this.extractCertificationNames(
      outcome.businessProfile.certifications || []
    );
    
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
      relevantCertifications: certificationNames,
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
    await this.db.query(`
      INSERT INTO export_strategy_patterns (
        id, name, description, confidence, business_size_min, business_size_max, 
        product_categories, applicable_markets, entry_strategy, compliance_approach, 
        logistics_model, timeline_min, timeline_max, timeline_average, success_rate, 
        common_challenges, critical_success_factors, relevant_certifications, application_count, 
        discovered_at, last_updated, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    `, [
      newPattern.id,
      newPattern.name,
      newPattern.description,
      newPattern.confidence,
      newPattern.businessSizeRange.min,
      newPattern.businessSizeRange.max,
      newPattern.productCategories,
      newPattern.applicableMarkets,
      newPattern.entryStrategy,
      newPattern.complianceApproach,
      newPattern.logisticsModel,
      newPattern.estimatedTimeline.min,
      newPattern.estimatedTimeline.max,
      newPattern.estimatedTimeline.average,
      newPattern.successRate,
      newPattern.commonChallenges,
      newPattern.criticalSuccessFactors,
      newPattern.relevantCertifications,
      newPattern.applicationCount,
      newPattern.discoveredAt,
      new Date(),
      JSON.stringify(newPattern.metadata)
    ]);
    
    console.log(`Created new export strategy pattern: ${newPattern.id}`);
    
    return newPattern;
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
  
  /**
   * Find most common values in an array with their frequencies
   * Returns array of values sorted by frequency
   */
  private findMostCommonValues(values: any[]): any[] {
    const valueCounts = new Map<any, number>();
    
    for (const value of values) {
      if (!value) continue;
      
      // Convert the value to a string for map keying
      const key = typeof value === 'object' ? JSON.stringify(value) : String(value);
      const count = valueCounts.get(key) || 0;
      valueCounts.set(key, count + 1);
    }
    
    // Convert to array and sort by frequency
    const sortedValues = Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => {
        // For string-based keys, try to parse JSON if it was originally an object
        try {
          if (key.startsWith('{') || key.startsWith('[')) {
            return [JSON.parse(key), count];
          }
        } catch (e) {
          // Ignore parsing errors
        }
        return [key, count];
      });
    
    // Return values, not counts
    return sortedValues.map(([value]) => value);
  }
  
  /**
   * Get all non-archived patterns
   */
  async getAllPatterns(): Promise<ExportStrategyPattern[]> {
    try {
      const result = await this.db.query(`
        SELECT * FROM export_strategy_patterns 
        WHERE archived = false
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        confidence: row.confidence,
        businessSizeRange: {
          min: row.business_size_min,
          max: row.business_size_max
        },
        productCategories: row.product_categories,
        applicableMarkets: row.applicable_markets,
        entryStrategy: row.entry_strategy,
        complianceApproach: row.compliance_approach,
        logisticsModel: row.logistics_model,
        estimatedTimeline: {
          min: row.timeline_min,
          max: row.timeline_max,
          average: row.timeline_average
        },
        successRate: row.success_rate,
        commonChallenges: row.common_challenges,
        criticalSuccessFactors: row.critical_success_factors,
        relevantCertifications: row.relevant_certifications,
        applicationCount: row.application_count,
        discoveredAt: row.discovered_at,
        lastUpdated: row.last_updated,
        metadata: row.metadata || {}
      }));
    } catch (error) {
      console.error(`Error getting all patterns: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Update an existing pattern
   */
  async updatePattern(pattern: ExportStrategyPattern): Promise<void> {
    try {
      await this.db.query(`
        UPDATE export_strategy_patterns SET
          name = $1,
          description = $2,
          confidence = $3,
          business_size_min = $4,
          business_size_max = $5,
          product_categories = $6,
          applicable_markets = $7,
          entry_strategy = $8,
          compliance_approach = $9,
          logistics_model = $10,
          timeline_min = $11,
          timeline_max = $12,
          timeline_average = $13,
          success_rate = $14,
          common_challenges = $15,
          critical_success_factors = $16,
          relevant_certifications = $17,
          application_count = $18,
          last_updated = $19,
          metadata = $20
        WHERE id = $21
      `, [
        pattern.name,
        pattern.description,
        pattern.confidence,
        pattern.businessSizeRange.min,
        pattern.businessSizeRange.max,
        pattern.productCategories,
        pattern.applicableMarkets,
        pattern.entryStrategy,
        pattern.complianceApproach,
        pattern.logisticsModel,
        pattern.estimatedTimeline.min,
        pattern.estimatedTimeline.max,
        pattern.estimatedTimeline.average,
        pattern.successRate,
        pattern.commonChallenges,
        pattern.criticalSuccessFactors,
        pattern.relevantCertifications,
        pattern.applicationCount,
        new Date(),
        JSON.stringify(pattern.metadata),
        pattern.id
      ]);
      
      // Update in-memory pattern
      const index = this.patterns.findIndex(p => p.id === pattern.id);
      if (index !== -1) {
        this.patterns[index] = pattern;
      }
      
      console.log(`Updated export strategy pattern: ${pattern.id}`);
    } catch (error) {
      console.error(`Error updating pattern: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Archive a pattern (mark as merged into another pattern)
   */
  async archivePattern(patternId: string, mergedIntoId: string): Promise<void> {
    try {
      await this.db.query(`
        UPDATE export_strategy_patterns SET
          archived = true,
          merged_into = $1,
          archived_date = $2
        WHERE id = $3
      `, [
        mergedIntoId,
        new Date(),
        patternId
      ]);
      
      // Remove from in-memory patterns
      this.patterns = this.patterns.filter(p => p.id !== patternId);
      
      console.log(`Archived export strategy pattern: ${patternId} (merged into ${mergedIntoId})`);
    } catch (error) {
      console.error(`Error archiving pattern: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find a pattern by ID
   */
  async findPatternById(patternId: string): Promise<ExportStrategyPattern | null> {
    try {
      const result = await this.db.query(`
        SELECT * FROM export_strategy_patterns 
        WHERE id = $1
      `, [patternId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        confidence: row.confidence,
        businessSizeRange: {
          min: row.business_size_min,
          max: row.business_size_max
        },
        productCategories: row.product_categories,
        applicableMarkets: row.applicable_markets,
        entryStrategy: row.entry_strategy,
        complianceApproach: row.compliance_approach,
        logisticsModel: row.logistics_model,
        estimatedTimeline: {
          min: row.timeline_min,
          max: row.timeline_max,
          average: row.timeline_average
        },
        successRate: row.success_rate,
        commonChallenges: row.common_challenges,
        criticalSuccessFactors: row.critical_success_factors,
        relevantCertifications: row.relevant_certifications,
        applicationCount: row.application_count,
        discoveredAt: row.discovered_at,
        lastUpdated: row.last_updated,
        metadata: row.metadata || {}
      };
    } catch (error) {
      console.error(`Error finding pattern by ID: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
} 