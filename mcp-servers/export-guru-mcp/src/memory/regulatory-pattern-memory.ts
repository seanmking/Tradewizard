import { BusinessProfile } from '../types';
import { SimilarityEngine } from './similarity-engine';
import { Pool } from 'pg';

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
      this.patterns = await this.db.query('SELECT * FROM regulatoryPatterns').then(res => res.rows.map(row => row as RegulatoryPattern));
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
        const hasMatchingMarkets = (businessProfile.targetMarkets || []).some(market => 
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
      await this.db.query('UPDATE regulatoryPatterns SET confidence = $1, successRate = $2, applicationCount = $3, lastUpdated = $4 WHERE id = $5', [
        pattern.confidence,
        pattern.successRate,
        pattern.applicationCount,
        pattern.lastUpdated,
        pattern.id
      ]);
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
      await this.db.query('INSERT INTO regulatoryPatterns (id, type, name, description, confidence, applicableMarkets, productCategories, hsCodePatterns, regulatoryDomain, patternCriteria, discoveredAt, lastUpdated, applicationCount, successRate, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)', patterns.map(pattern => [
        pattern.id,
        pattern.type,
        pattern.name,
        pattern.description,
        pattern.confidence,
        pattern.applicableMarkets,
        pattern.productCategories,
        pattern.hsCodePatterns,
        pattern.regulatoryDomain,
        pattern.patternCriteria,
        pattern.discoveredAt,
        pattern.lastUpdated,
        pattern.applicationCount,
        pattern.successRate,
        pattern.metadata
      ]));
      
      console.log(`Stored ${patterns.length} new regulatory patterns`);
    } catch (error) {
      console.error(`Error storing new patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Detect compliance barriers by analyzing failure patterns
   */
  async detectComplianceBarriers(
    markets: string[],
    productCategories: string[]
  ): Promise<RegulatoryPattern[]> {
    try {
      // Get failed export outcomes related to compliance issues
      const failedOutcomes = await this.db.query('SELECT * FROM exportOutcomes WHERE results.successful = false AND market = ANY($1) AND products.category = ANY($2) AND results.challenges ILIKE %s%', [
        markets,
        productCategories,
        '%compliance%',
        '%regulation%',
        '%certificate%',
        '%approval%',
        '%standard%',
        '%requirement%'
      ]).then(res => res.rows.map(row => row as any));
      
      if (failedOutcomes.length < 3) {
        console.log('Not enough compliance-related failures to detect patterns');
        return [];
      }
      
      // Group failures by market
      const failuresByMarket: Record<string, any[]> = {};
      
      for (const outcome of failedOutcomes) {
        if (!failuresByMarket[outcome.market]) {
          failuresByMarket[outcome.market] = [];
        }
        failuresByMarket[outcome.market].push(outcome);
      }
      
      const detectedPatterns: RegulatoryPattern[] = [];
      
      // Analyze each market with sufficient failures
      for (const [market, failures] of Object.entries(failuresByMarket)) {
        if (failures.length >= 3) {
          // Find common challenges across failures
          const commonChallenges = this.findMostCommonChallenges(failures);
          
          // Find common product categories affected
          const affectedProductCategories = this.findCommonProductCategories(failures);
          
          // Extract common patterns in compliance approach
          const complianceApproaches = failures.map(f => f.complianceApproach);
          const commonApproach = this.findMostFrequent(complianceApproaches);
          
          // Create a new barrier pattern if we have meaningful insights
          if (commonChallenges.length > 0 && affectedProductCategories.length > 0) {
            const pattern: RegulatoryPattern = {
              id: `barrier-${market}-${Date.now()}`,
              type: RegulatoryPatternType.COMPLIANCE_BARRIER,
              name: `${market} compliance barrier pattern`,
              description: `Common compliance barriers when exporting to ${market}`,
              confidence: 0.7,
              applicableMarkets: [market],
              productCategories: affectedProductCategories,
              hsCodePatterns: [],
              regulatoryDomain: 'compliance',
              patternCriteria: {
                challenges: commonChallenges,
                ineffectiveApproach: commonApproach,
                mitigationStrategies: this.generateMitigationStrategies(commonChallenges)
              },
              discoveredAt: new Date(),
              lastUpdated: new Date(),
              applicationCount: 0,
              successRate: 0,
              metadata: {
                sourceFailureCount: failures.length,
                detectionMethod: 'failure-analysis',
                severity: this.calculateBarrierSeverity(failures)
              }
            };
            
            // Store the pattern
            await this.db.query('INSERT INTO regulatoryPatterns (id, type, name, description, confidence, applicableMarkets, productCategories, hsCodePatterns, regulatoryDomain, patternCriteria, discoveredAt, lastUpdated, applicationCount, successRate, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)', [
              pattern.id,
              pattern.type,
              pattern.name,
              pattern.description,
              pattern.confidence,
              pattern.applicableMarkets,
              pattern.productCategories,
              pattern.hsCodePatterns,
              pattern.regulatoryDomain,
              pattern.patternCriteria,
              pattern.discoveredAt,
              pattern.lastUpdated,
              pattern.applicationCount,
              pattern.successRate,
              pattern.metadata
            ]);
            
            // Add to in-memory patterns
            this.patterns.push(pattern);
            
            detectedPatterns.push(pattern);
            
            console.log(`Detected compliance barrier pattern for ${market} affecting ${affectedProductCategories.join(', ')}`);
          }
        }
      }
      
      return detectedPatterns;
    } catch (error) {
      console.error(`Error detecting compliance barriers: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Detect regulatory harmonization patterns between markets
   */
  async detectHarmonizationPatterns(
    markets: string[],
    productCategories: string[]
  ): Promise<RegulatoryPattern[]> {
    try {
      if (markets.length < 2) {
        console.log('At least two markets are required to detect harmonization patterns');
        return [];
      }
      
      // Get regulatory requirements for all markets
      const requirements = await this.db.query('SELECT * FROM regulatoryRequirements WHERE market = ANY($1) AND productCategory = ANY($2)', [
        markets,
        productCategories
      ]).then(res => res.rows.map(row => row as any));
      
      // Group requirements by markets
      const requirementsByMarket: Record<string, any[]> = {};
      
      for (const req of requirements) {
        if (!requirementsByMarket[req.market]) {
          requirementsByMarket[req.market] = [];
        }
        requirementsByMarket[req.market].push(req);
      }
      
      const detectedPatterns: RegulatoryPattern[] = [];
      
      // Compare requirements between pairs of markets
      for (let i = 0; i < markets.length; i++) {
        for (let j = i + 1; j < markets.length; j++) {
          const market1 = markets[i];
          const market2 = markets[j];
          
          const reqs1 = requirementsByMarket[market1] || [];
          const reqs2 = requirementsByMarket[market2] || [];
          
          if (reqs1.length === 0 || reqs2.length === 0) {
            continue;
          }
          
          // Find similarities in requirements
          const similarities = this.findRequirementSimilarities(reqs1, reqs2);
          
          if (similarities.score >= 0.7) {
            // High similarity indicates harmonization
            const harmonizedCategories = this.findHarmonizedCategories(reqs1, reqs2);
            
            if (harmonizedCategories.length > 0) {
              const pattern: RegulatoryPattern = {
                id: `harmonization-${market1}-${market2}-${Date.now()}`,
                type: RegulatoryPatternType.HARMONIZATION,
                name: `${market1}-${market2} regulatory harmonization`,
                description: `Harmonized regulatory requirements between ${market1} and ${market2}`,
                confidence: similarities.score,
                applicableMarkets: [market1, market2],
                productCategories: harmonizedCategories,
                hsCodePatterns: [],
                regulatoryDomain: 'harmonization',
                patternCriteria: {
                  sharedRequirements: similarities.sharedRequirements,
                  sharedStandards: similarities.sharedStandards,
                  reciprocity: similarities.hasReciprocity
                },
                discoveredAt: new Date(),
                lastUpdated: new Date(),
                applicationCount: 0,
                successRate: 0,
                metadata: {
                  similarityScore: similarities.score,
                  detectionMethod: 'requirement-comparison',
                  marketPair: `${market1}-${market2}`
                }
              };
              
              // Store the pattern
              await this.db.query('INSERT INTO regulatoryPatterns (id, type, name, description, confidence, applicableMarkets, productCategories, hsCodePatterns, regulatoryDomain, patternCriteria, discoveredAt, lastUpdated, applicationCount, successRate, metadata) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)', [
                pattern.id,
                pattern.type,
                pattern.name,
                pattern.description,
                pattern.confidence,
                pattern.applicableMarkets,
                pattern.productCategories,
                pattern.hsCodePatterns,
                pattern.regulatoryDomain,
                pattern.patternCriteria,
                pattern.discoveredAt,
                pattern.lastUpdated,
                pattern.applicationCount,
                pattern.successRate,
                pattern.metadata
              ]);
              
              // Add to in-memory patterns
              this.patterns.push(pattern);
              
              detectedPatterns.push(pattern);
              
              console.log(`Detected harmonization pattern between ${market1} and ${market2} for ${harmonizedCategories.join(', ')}`);
            }
          }
        }
      }
      
      return detectedPatterns;
    } catch (error) {
      console.error(`Error detecting harmonization patterns: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Monitor for regulatory changes and detect change patterns
   */
  async monitorRegulatoryChanges(
    markets: string[],
    productCategories: string[],
    timeWindow: { start: Date; end: Date }
  ): Promise<any[]> {
    try {
      // Get regulatory change history
      const changes = await this.db.query('SELECT * FROM regulatoryChangeHistory WHERE market = ANY($1) AND productCategory = ANY($2) AND timestamp >= $3 AND timestamp <= $4', [
        markets,
        productCategories,
        timeWindow.start,
        timeWindow.end
      ]).then(res => res.rows.map(row => row as any));
      
      if (changes.length === 0) {
        console.log('No regulatory changes detected in the specified time window');
        return [];
      }
      
      // Group changes by market
      const changesByMarket: Record<string, any[]> = {};
      
      for (const change of changes) {
        if (!changesByMarket[change.market]) {
          changesByMarket[change.market] = [];
        }
        changesByMarket[change.market].push(change);
      }
      
      const changePatterns: any[] = [];
      
      // Analyze change patterns for each market
      for (const [market, marketChanges] of Object.entries(changesByMarket)) {
        if (marketChanges.length >= 3) {
          // Analyze frequency of changes
          const frequency = this.analyzeChangeFrequency(marketChanges);
          
          // Identify common change types
          const changeTypes = this.identifyCommonChangeTypes(marketChanges);
          
          // Analyze seasonal patterns
          const seasonality = this.analyzeSeasonality(marketChanges);
          
          // Create change pattern
          const changePattern = {
            market,
            changeCount: marketChanges.length,
            frequency,
            commonChangeTypes: changeTypes,
            seasonality,
            affectedProducts: this.findMostAffectedProducts(marketChanges)
          };
          
          changePatterns.push(changePattern);
          
          // Store change pattern for future reference
          await this.db.query('INSERT INTO regulatoryChangePatterns (market, changeCount, frequency, commonChangeTypes, seasonality, affectedProducts) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (market) DO UPDATE SET changeCount = $2, frequency = $3, commonChangeTypes = $4, seasonality = $5, affectedProducts = $6', [
            market,
            changePattern.changeCount,
            changePattern.frequency,
            changePattern.commonChangeTypes,
            changePattern.seasonality,
            changePattern.affectedProducts
          ]);
          
          console.log(`Analyzed regulatory change patterns for ${market}: ${marketChanges.length} changes detected`);
        }
      }
      
      return changePatterns;
    } catch (error) {
      console.error(`Error monitoring regulatory changes: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Find most common challenges in failed outcomes
   */
  private findMostCommonChallenges(failedOutcomes: any[]): string[] {
    const allChallenges: string[] = [];
    
    // Extract all compliance-related challenges
    for (const outcome of failedOutcomes) {
      const complianceChallenges = (outcome.results.challenges || []).filter(
        (c: string) => /compliance|regulation|certificate|approval|standard|requirement/i.test(c)
      );
      
      allChallenges.push(...complianceChallenges);
    }
    
    // Find most frequent challenges
    return this.findMostFrequentItems(allChallenges);
  }
  
  /**
   * Find common product categories in outcomes
   */
  private findCommonProductCategories(outcomes: any[]): string[] {
    const categories = outcomes.flatMap(o => o.products.map((p: any) => p.category));
    return this.findMostFrequentItems(categories);
  }
  
  /**
   * Generate mitigation strategies for common challenges
   */
  private generateMitigationStrategies(challenges: string[]): string[] {
    const strategies: string[] = [];
    
    for (const challenge of challenges) {
      if (/certificate|certification/i.test(challenge)) {
        strategies.push('Obtain necessary certifications before attempting market entry');
      }
      
      if (/standard|specification/i.test(challenge)) {
        strategies.push('Ensure products meet all relevant standards and specifications');
      }
      
      if (/documentation|paperwork/i.test(challenge)) {
        strategies.push('Prepare comprehensive documentation well in advance');
      }
      
      if (/timeline|delay/i.test(challenge)) {
        strategies.push('Allow for extended timelines in compliance planning');
      }
      
      if (/cost|expense/i.test(challenge)) {
        strategies.push('Budget adequately for compliance-related expenses');
      }
    }
    
    return strategies.length > 0 ? strategies : ['Work with regulatory experts to develop a compliance strategy'];
  }
  
  /**
   * Calculate the severity of a compliance barrier
   */
  private calculateBarrierSeverity(failures: any[]): 'low' | 'medium' | 'high' {
    const totalTimeline = failures.reduce((sum, f) => sum + (f.results.timeline || 0), 0);
    const avgTimeline = totalTimeline / failures.length;
    
    const allChallenges = failures.flatMap(f => f.results.challenges || []);
    const uniqueChallengeCount = new Set(allChallenges).size;
    
    // Severity is based on average timeline and number of unique challenges
    if (avgTimeline > 180 || uniqueChallengeCount > 5) {
      return 'high';
    } else if (avgTimeline > 90 || uniqueChallengeCount > 3) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Find requirement similarities between two markets
   */
  private findRequirementSimilarities(reqs1: any[], reqs2: any[]): {
    score: number;
    sharedRequirements: string[];
    sharedStandards: string[];
    hasReciprocity: boolean;
  } {
    const reqNames1 = reqs1.map(r => r.name || r.description);
    const reqNames2 = reqs2.map(r => r.name || r.description);
    
    const standards1 = reqs1.filter(r => r.type === 'standard').map(r => r.name || r.description);
    const standards2 = reqs2.filter(r => r.type === 'standard').map(r => r.name || r.description);
    
    // Find shared requirements
    const sharedRequirements = reqNames1.filter(name => {
      return reqNames2.some(n => this.calculateStringSimilarity(name, n) > 0.8);
    });
    
    // Find shared standards
    const sharedStandards = standards1.filter(std => {
      return standards2.some(s => this.calculateStringSimilarity(std, s) > 0.8);
    });
    
    // Check for reciprocity mentions
    const hasReciprocity = reqs1.some(r => /reciprocal|mutual|recognition/i.test(r.description || '')) ||
      reqs2.some(r => /reciprocal|mutual|recognition/i.test(r.description || ''));
    
    // Calculate overall similarity score
    const totalUniqueReqs = new Set([...reqNames1, ...reqNames2]).size;
    const score = totalUniqueReqs > 0 ? sharedRequirements.length / totalUniqueReqs : 0;
    
    return {
      score,
      sharedRequirements,
      sharedStandards,
      hasReciprocity
    };
  }
  
  /**
   * Find product categories with harmonized regulations
   */
  private findHarmonizedCategories(reqs1: any[], reqs2: any[]): string[] {
    const categories1 = reqs1.map(r => r.productCategory);
    const categories2 = reqs2.map(r => r.productCategory);
    
    // Find categories that appear in both requirement sets
    const potentialHarmonized = categories1.filter(cat => categories2.includes(cat));
    
    // Verify if requirements for these categories are similar
    const harmonized: string[] = [];
    
    for (const category of potentialHarmonized) {
      const catReqs1 = reqs1.filter(r => r.productCategory === category);
      const catReqs2 = reqs2.filter(r => r.productCategory === category);
      
      const similarity = this.findRequirementSimilarities(catReqs1, catReqs2);
      
      if (similarity.score >= 0.7) {
        harmonized.push(category);
      }
    }
    
    return harmonized;
  }
  
  /**
   * Analyze the frequency of regulatory changes
   */
  private analyzeChangeFrequency(changes: any[]): {
    averageDaysBetweenChanges: number;
    changePattern: 'frequent' | 'moderate' | 'infrequent';
  } {
    if (changes.length < 2) {
      return {
        averageDaysBetweenChanges: 0,
        changePattern: 'infrequent'
      };
    }
    
    // Sort changes by timestamp
    const sortedChanges = [...changes].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Calculate days between consecutive changes
    let totalDays = 0;
    for (let i = 1; i < sortedChanges.length; i++) {
      const timeDiff = new Date(sortedChanges[i].timestamp).getTime() - 
                      new Date(sortedChanges[i-1].timestamp).getTime();
      totalDays += timeDiff / (1000 * 60 * 60 * 24); // Convert ms to days
    }
    
    const averageDaysBetweenChanges = totalDays / (sortedChanges.length - 1);
    
    // Determine change pattern
    let changePattern: 'frequent' | 'moderate' | 'infrequent';
    if (averageDaysBetweenChanges < 30) {
      changePattern = 'frequent';
    } else if (averageDaysBetweenChanges < 90) {
      changePattern = 'moderate';
    } else {
      changePattern = 'infrequent';
    }
    
    return {
      averageDaysBetweenChanges,
      changePattern
    };
  }
  
  /**
   * Identify common types of regulatory changes
   */
  private identifyCommonChangeTypes(changes: any[]): string[] {
    const changeTypes = changes.map(c => c.changeType || 'unknown');
    return this.findMostFrequentItems(changeTypes);
  }
  
  /**
   * Analyze seasonality in regulatory changes
   */
  private analyzeSeasonality(changes: any[]): {
    hasSeasonal: boolean;
    peakMonths: number[];
  } {
    const monthCounts = new Array(12).fill(0);
    
    // Count changes by month
    for (const change of changes) {
      const month = new Date(change.timestamp).getMonth();
      monthCounts[month]++;
    }
    
    // Calculate average changes per month
    const avgChangesPerMonth = changes.length / 12;
    
    // Find months with significantly more changes
    const peakMonths: number[] = [];
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] >= avgChangesPerMonth * 1.5) {
        peakMonths.push(i + 1); // Convert 0-based to 1-based month numbering
      }
    }
    
    return {
      hasSeasonal: peakMonths.length > 0,
      peakMonths
    };
  }
  
  /**
   * Find products most affected by regulatory changes
   */
  private findMostAffectedProducts(changes: any[]): string[] {
    const productCategories = changes.map(c => c.productCategory).filter(Boolean);
    return this.findMostFrequentItems(productCategories);
  }
  
  /**
   * Find the most frequent items in an array
   */
  private findMostFrequentItems(items: string[]): string[] {
    const frequency: Record<string, number> = {};
    
    // Count frequency of each item
    for (const item of items) {
      if (!item) continue;
      frequency[item] = (frequency[item] || 0) + 1;
    }
    
    // Sort by frequency
    const sortedItems = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([item]) => item);
    
    // Return top 5 items or all if fewer than 5
    return sortedItems.slice(0, 5);
  }
  
  /**
   * Find the most frequent item in an array
   */
  private findMostFrequent(items: string[]): string {
    const frequency: Record<string, number> = {};
    let maxFreq = 0;
    let mostFrequent = '';
    
    for (const item of items) {
      if (!item) continue;
      frequency[item] = (frequency[item] || 0) + 1;
      
      if (frequency[item] > maxFreq) {
        maxFreq = frequency[item];
        mostFrequent = item;
      }
    }
    
    return mostFrequent;
  }
  
  /**
   * Calculate similarity between two strings
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Normalize strings
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;
    
    // Simple implementation using Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    return 1 - (distance / maxLength);
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    
    // Create distance matrix
    const dp: number[][] = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = [i];
    }
    for (let j = 1; j <= n; j++) {
      dp[0][j] = j;
    }
    
    // Fill distance matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i-1] === str2[j-1]) {
          dp[i][j] = dp[i-1][j-1];
        } else {
          dp[i][j] = Math.min(
            dp[i-1][j-1] + 1, // substitution
            dp[i][j-1] + 1,   // insertion
            dp[i-1][j] + 1    // deletion
          );
        }
      }
    }
    
    return dp[m][n];
  }
  
  /**
   * Get all patterns
   */
  async getAllPatterns(): Promise<RegulatoryPattern[]> {
    try {
      // Get all patterns from database
      const patterns = await this.db.query('SELECT * FROM regulatoryPatterns WHERE archived = false').then(res => res.rows.map(row => row as RegulatoryPattern));
      
      return patterns;
    } catch (error) {
      console.error(`Error getting all patterns: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Update an existing pattern
   */
  async updatePattern(pattern: RegulatoryPattern): Promise<void> {
    try {
      // Update pattern in database
      await this.db.query('UPDATE regulatoryPatterns SET type = $1, name = $2, description = $3, confidence = $4, applicableMarkets = $5, productCategories = $6, hsCodePatterns = $7, regulatoryDomain = $8, patternCriteria = $9, discoveredAt = $10, lastUpdated = $11, applicationCount = $12, successRate = $13, metadata = $14 WHERE id = $15', [
        pattern.type,
        pattern.name,
        pattern.description,
        pattern.confidence,
        pattern.applicableMarkets,
        pattern.productCategories,
        pattern.hsCodePatterns,
        pattern.regulatoryDomain,
        pattern.patternCriteria,
        pattern.discoveredAt,
        pattern.lastUpdated,
        pattern.applicationCount,
        pattern.successRate,
        pattern.metadata,
        pattern.id
      ]);
      
      // Update in-memory pattern
      const index = this.patterns.findIndex(p => p.id === pattern.id);
      if (index !== -1) {
        this.patterns[index] = pattern;
      }
      
      console.log(`Updated regulatory pattern: ${pattern.id}`);
    } catch (error) {
      console.error(`Error updating regulatory pattern: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Archive a pattern (mark as merged into another)
   */
  async archivePattern(patternId: string, mergedIntoId: string): Promise<void> {
    try {
      // Update pattern in database
      await this.db.query('UPDATE regulatoryPatterns SET archived = true, mergedInto = $1, archivedAt = $2 WHERE id = $3', [
        mergedIntoId,
        new Date(),
        patternId
      ]);
      
      // Remove from in-memory patterns
      const index = this.patterns.findIndex(p => p.id === patternId);
      if (index !== -1) {
        this.patterns.splice(index, 1);
      }
      
      console.log(`Archived regulatory pattern ${patternId} (merged into ${mergedIntoId})`);
    } catch (error) {
      console.error(`Error archiving regulatory pattern: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find a pattern by its ID
   * @param patternId The ID of the pattern to find
   * @returns The pattern if found, or null if not found
   */
  async findPatternById(patternId: string): Promise<RegulatoryPattern[]> {
    try {
      const pattern = await this.db.query('SELECT * FROM regulatoryPatterns WHERE id = $1', [patternId]).then(res => res.rows.map(row => row as RegulatoryPattern)[0]);
      
      if (pattern) {
        return [pattern];
      }
      
      return [];
    } catch (error) {
      console.error(`Error finding regulatory pattern by ID: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
} 