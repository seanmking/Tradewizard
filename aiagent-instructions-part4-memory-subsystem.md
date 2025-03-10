# Memory Subsystem Implementation

The Memory Subsystem enables the agent to learn from patterns across businesses, improving recommendations over time and providing more personalized assistance.

## Implementation Steps

### 1. Create Similarity Engine

First, create `src/agent/memory/similarity-engine.ts` for calculating similarity between business profiles:

```typescript
import { BusinessProfile, Product } from '../../types/state';

export class SimilarityEngine {
  calculateBusinessSimilarity(profile1: BusinessProfile, profile2: BusinessProfile): number {
    // Calculate similarity between two business profiles
    // This is a sophisticated calculation that considers multiple factors
    
    // Industry similarity (exact match = 1, related = 0.5, unrelated = 0)
    const industrySimilarity = this.calculateIndustrySimilarity(
      profile1.industry, 
      profile2.industry
    );
    
    // Size similarity (exact match = 1, close = 0.7, distant = 0.3)
    const sizeSimilarity = this.calculateSizeSimilarity(
      profile1.size, 
      profile2.size
    );
    
    // Product similarity (based on product categories and attributes)
    const productSimilarity = this.calculateProductSimilarity(
      profile1.products, 
      profile2.products
    );
    
    // Export experience similarity
    const experienceSimilarity = this.calculateExperienceSimilarity(
      profile1.exportExperience, 
      profile2.exportExperience
    );
    
    // Weighted combination of all factors
    return (
      industrySimilarity * 0.3 +
      sizeSimilarity * 0.2 +
      productSimilarity * 0.4 +
      experienceSimilarity * 0.1
    );
  }
  
  // Helper methods for calculating specific similarities
  private calculateIndustrySimilarity(industry1: string, industry2: string): number {
    if (!industry1 || !industry2) return 0;
    if (industry1 === industry2) return 1;
    
    // Industry relationships for partial matching
    const relatedIndustries: Record<string, string[]> = {
      'Food & Beverage': ['Agriculture', 'Retail'],
      'Textiles': ['Fashion', 'Manufacturing'],
      'Electronics': ['Technology', 'Manufacturing'],
      'Software': ['Technology', 'IT Services'],
      'Pharmaceuticals': ['Healthcare', 'Chemicals'],
      'Automotive': ['Manufacturing', 'Transportation'],
      'Furniture': ['Manufacturing', 'Home Goods'],
      'Cosmetics': ['Chemicals', 'Retail'],
      // More mappings...
    };
    
    // Check if industries are related
    if (relatedIndustries[industry1]?.includes(industry2) ||
        relatedIndustries[industry2]?.includes(industry1)) {
      return 0.5;
    }
    
    return 0;
  }
  
  private calculateSizeSimilarity(size1: string, size2: string): number {
    if (!size1 || !size2) return 0;
    
    const sizeOrder = ['Micro', 'Small', 'Medium', 'Large'];
    
    const index1 = sizeOrder.indexOf(size1);
    const index2 = sizeOrder.indexOf(size2);
    
    if (index1 === -1 || index2 === -1) return 0;
    if (index1 === index2) return 1;
    
    const distance = Math.abs(index1 - index2);
    if (distance === 1) return 0.7;
    
    return 0.3;
  }
  
  private calculateProductSimilarity(products1: Product[], products2: Product[]): number {
    if (!products1 || !products2) return 0;
    if (products1.length === 0 || products2.length === 0) return 0;
    
    // Calculate similarity for each product pair
    let totalSimilarity = 0;
    let pairCount = 0;
    
    for (const p1 of products1) {
      for (const p2 of products2) {
        totalSimilarity += this.calculateSingleProductSimilarity(p1, p2);
        pairCount++;
      }
    }
    
    return totalSimilarity / pairCount;
  }
  
  private calculateSingleProductSimilarity(p1: Product, p2: Product): number {
    // Calculate category similarity
    const categorySimilarity = p1.category === p2.category ? 1 : 0;
    
    // Calculate name similarity (simplified)
    const nameSimilarity = this.calculateStringSimilarity(p1.name, p2.name);
    
    // Calculate description similarity (simplified)
    const descriptionSimilarity = this.calculateStringSimilarity(p1.description, p2.description);
    
    return categorySimilarity * 0.6 + nameSimilarity * 0.2 + descriptionSimilarity * 0.2;
  }
  
  private calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Simple word overlap similarity
    const words1 = new Set(s1.split(/\W+/).filter(w => w.length > 2));
    const words2 = new Set(s2.split(/\W+/).filter(w => w.length > 2));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    let commonWords = 0;
    for (const word of words1) {
      if (words2.has(word)) {
        commonWords++;
      }
    }
    
    return commonWords / Math.max(words1.size, words2.size);
  }
  
  private calculateExperienceSimilarity(exp1: string, exp2: string): number {
    if (!exp1 || !exp2) return 0;
    
    const experienceOrder = ['None', 'Limited', 'Moderate', 'Extensive'];
    
    const index1 = experienceOrder.indexOf(exp1);
    const index2 = experienceOrder.indexOf(exp2);
    
    if (index1 === -1 || index2 === -1) return 0;
    if (index1 === index2) return 1;
    
    const distance = Math.abs(index1 - index2);
    if (distance === 1) return 0.7;
    
    return 0.3;
  }
}
```

### 2. Create Business Profile Tracker

Next, create `src/agent/memory/business-profile-tracker.ts` for tracking business profile changes:

```typescript
import { BusinessProfile } from '../../types/state';
import { Database } from '../../database/connection';
import { EventSystem, EventType, EventPriority } from '../event-system';

export interface ProfileChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED';
  significance: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class BusinessProfileTracker {
  private db: Database;
  private eventSystem: EventSystem;
  
  constructor(db: Database, eventSystem: EventSystem) {
    this.db = db;
    this.eventSystem = eventSystem;
  }
  
  async trackProfileChange(
    businessId: string, 
    oldProfile: BusinessProfile, 
    newProfile: BusinessProfile
  ): Promise<ProfileChange[]> {
    // Detect and categorize changes
    const changes = this.detectChanges(oldProfile, newProfile);
    
    // Record changes for future pattern recognition
    await this.recordChanges(businessId, changes);
    
    // Trigger relevant events based on changes
    await this.triggerChangeEvents(businessId, changes);
    
    return changes;
  }
  
  private detectChanges(
    oldProfile: BusinessProfile, 
    newProfile: BusinessProfile
  ): ProfileChange[] {
    const changes: ProfileChange[] = [];
    
    // Check basic fields
    const basicFields = ['name', 'website', 'industry', 'size', 'exportExperience'];
    for (const field of basicFields) {
      if (oldProfile[field] !== newProfile[field]) {
        changes.push({
          field,
          oldValue: oldProfile[field],
          newValue: newProfile[field],
          changeType: 'MODIFIED',
          significance: field === 'industry' ? 'HIGH' : 'MEDIUM'
        });
      }
    }
    
    // Check products
    const oldProductIds = new Set(oldProfile.products?.map(p => p.id) || []);
    const newProductIds = new Set(newProfile.products?.map(p => p.id) || []);
    
    // Added products
    for (const product of newProfile.products || []) {
      if (!oldProductIds.has(product.id)) {
        changes.push({
          field: 'products',
          oldValue: null,
          newValue: product,
          changeType: 'ADDED',
          significance: 'HIGH'
        });
      }
    }
    
    // Removed products
    for (const product of oldProfile.products || []) {
      if (!newProductIds.has(product.id)) {
        changes.push({
          field: 'products',
          oldValue: product,
          newValue: null,
          changeType: 'REMOVED',
          significance: 'HIGH'
        });
      }
    }
    
    // Modified products
    for (const oldProduct of oldProfile.products || []) {
      const newProduct = (newProfile.products || []).find(p => p.id === oldProduct.id);
      if (newProduct && JSON.stringify(oldProduct) !== JSON.stringify(newProduct)) {
        changes.push({
          field: `products.${oldProduct.id}`,
          oldValue: oldProduct,
          newValue: newProduct,
          changeType: 'MODIFIED',
          significance: 'MEDIUM'
        });
      }
    }
    
    // Similar logic for certifications
    const oldCertIds = new Set(oldProfile.certifications?.map(c => c.id) || []);
    const newCertIds = new Set(newProfile.certifications?.map(c => c.id) || []);
    
    // Added certifications
    for (const cert of newProfile.certifications || []) {
      if (!oldCertIds.has(cert.id)) {
        changes.push({
          field: 'certifications',
          oldValue: null,
          newValue: cert,
          changeType: 'ADDED',
          significance: 'HIGH'
        });
      }
    }
    
    // Removed certifications
    for (const cert of oldProfile.certifications || []) {
      if (!newCertIds.has(cert.id)) {
        changes.push({
          field: 'certifications',
          oldValue: cert,
          newValue: null,
          changeType: 'REMOVED',
          significance: 'HIGH'
        });
      }
    }
    
    // Modified certifications
    for (const oldCert of oldProfile.certifications || []) {
      const newCert = (newProfile.certifications || []).find(c => c.id === oldCert.id);
      if (newCert && JSON.stringify(oldCert) !== JSON.stringify(newCert)) {
        changes.push({
          field: `certifications.${oldCert.id}`,
          oldValue: oldCert,
          newValue: newCert,
          changeType: 'MODIFIED',
          significance: 'MEDIUM'
        });
      }
    }
    
    return changes;
  }
  
  private async recordChanges(
    businessId: string, 
    changes: ProfileChange[]
  ): Promise<void> {
    await this.db.profileChanges.insertOne({
      businessId,
      changes,
      timestamp: new Date()
    });
  }
  
  private async triggerChangeEvents(
    businessId: string, 
    changes: ProfileChange[]
  ): Promise<void> {
    // Trigger events based on significant changes
    const significantChanges = changes.filter(c => c.significance === 'HIGH');
    
    if (significantChanges.length > 0) {
      await this.eventSystem.publish({
        type: EventType.BUSINESS_PROFILE_UPDATED,
        source: 'BusinessProfileTracker',
        priority: EventPriority.MEDIUM,
        businessId,
        payload: {
          changes: significantChanges
        }
      });
    }
  }
}
```

### 3. Create Export Strategy Memory

Create `src/agent/memory/export-strategy-memory.ts` for learning from export outcomes:

```typescript
import { Database } from '../../database/connection';
import { BusinessProfile } from '../../types/state';
import { SimilarityEngine } from './similarity-engine';

export interface ExportOutcome {
  businessId: string;
  businessProfile: BusinessProfile;
  market: string;
  products: string[];
  entryStrategy: string;
  complianceApproach: string;
  logisticsModel: string;
  results: {
    successful: boolean;
    timeline: number; // In days
    challenges: string[];
    successFactors: string[];
  };
  timestamp: Date;
}

export interface StrategyRecommendation {
  strategyType: string;
  confidence: number;
  reasonForRecommendation: string;
  estimatedTimeline: number;
  keySuccessFactors: string[];
}

export class ExportStrategyMemory {
  private db: Database;
  private similarityEngine: SimilarityEngine;
  
  constructor(db: Database, similarityEngine: SimilarityEngine) {
    this.db = db;
    this.similarityEngine = similarityEngine;
  }
  
  async recordExportOutcome(outcome: ExportOutcome): Promise<void> {
    // Store export outcome with all context
    await this.db.exportOutcomes.insertOne(outcome);
    
    // Update success patterns if successful
    if (outcome.results.successful) {
      await this.updateSuccessPatterns(outcome);
    }
  }
  
  async findSimilarBusinessStrategies(
    businessProfile: BusinessProfile,
    targetMarket: string
  ): Promise<StrategyRecommendation[]> {
    // Get all successful strategies for the target market
    const successfulStrategies = await this.db.exportOutcomes.find({
      market: targetMarket,
      'results.successful': true
    }).toArray();
    
    // No successful strategies found
    if (successfulStrategies.length === 0) {
      return [];
    }
    
    // Find businesses similar to the current business
    const similarBusinessStrategies = successfulStrategies.filter(strategy =>
      this.similarityEngine.calculateBusinessSimilarity(
        businessProfile,
        strategy.businessProfile
      ) > 0.7 // Similarity threshold
    );
    
    // Rank strategies by similarity and success metrics
    const rankedStrategies = this.rankStrategiesByRelevance(
      similarBusinessStrategies,
      businessProfile
    );
    
    // Transform to recommendations
    return rankedStrategies.map(strategy => ({
      strategyType: strategy.entryStrategy,
      confidence: this.calculateConfidence(strategy, businessProfile),
      reasonForRecommendation: this.generateRecommendationReason(strategy, businessProfile),
      estimatedTimeline: strategy.results.timeline,
      keySuccessFactors: strategy.results.successFactors
    }));
  }
  
  private async updateSuccessPatterns(outcome: ExportOutcome): Promise<void> {
    // Extract pattern from the successful outcome
    const pattern = this.extractPattern(outcome);
    
    // Store pattern in patterns collection
    await this.db.exportPatterns.insertOne(pattern);
  }
  
  private extractPattern(outcome: ExportOutcome): any {
    // Implementation to extract generalizable pattern from the outcome
    return {
      industryType: outcome.businessProfile.industry,
      marketRegion: this.getMarketRegion(outcome.market),
      businessSize: outcome.businessProfile.size,
      entryStrategy: outcome.entryStrategy,
      complianceApproach: outcome.complianceApproach,
      logisticsModel: outcome.logisticsModel,
      successFactors: outcome.results.successFactors,
      timeToSuccess: outcome.results.timeline,
      timestamp: new Date()
    };
  }
  
  private getMarketRegion(market: string): string {
    // Convert market to region
    const marketRegions: Record<string, string> = {
      'US': 'North America',
      'Canada': 'North America',
      'Mexico': 'North America',
      'UK': 'Europe',
      'Germany': 'Europe',
      'France': 'Europe',
      'Spain': 'Europe',
      'Italy': 'Europe',
      'China': 'Asia',
      'Japan': 'Asia',
      'South Korea': 'Asia',
      'India': 'Asia',
      'Australia': 'Oceania',
      'New Zealand': 'Oceania',
      'Brazil': 'South America',
      'Argentina': 'South America',
      'South Africa': 'Africa',
      'Nigeria': 'Africa',
      'Egypt': 'Africa',
      // More mappings...
    };
    
    return marketRegions[market] || 'Other';
  }
  
  private rankStrategiesByRelevance(strategies: ExportOutcome[], profile: BusinessProfile): ExportOutcome[] {
    // Implementation to rank strategies by relevance
    return strategies.sort((a, b) => {
      const similarityA = this.similarityEngine.calculateBusinessSimilarity(profile, a.businessProfile);
      const similarityB = this.similarityEngine.calculateBusinessSimilarity(profile, b.businessProfile);
      
      // Prioritize higher similarity
      return similarityB - similarityA;
    });
  }
  
  private calculateConfidence(strategy: ExportOutcome, profile: BusinessProfile): number {
    // Calculate confidence based on similarity and recency
    const similarity = this.similarityEngine.calculateBusinessSimilarity(profile, strategy.businessProfile);
    
    // Adjust for recency - more recent outcomes have higher confidence
    const recencyAdjustment = this.calculateRecencyAdjustment(strategy.timestamp);
    
    return Math.min(0.95, similarity * 0.8 + recencyAdjustment * 0.2);
  }
  
  private calculateRecencyAdjustment(timestamp: Date): number {
    const now = new Date();
    const ageInMonths = (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // Outcomes less than 3 months old have full recency value
    if (ageInMonths < 3) return 1;
    
    // Outcomes more than 24 months old have minimum recency value
    if (ageInMonths > 24) return 0.3;
    
    // Linear scale between 3 and 24 months
    return 1 - (ageInMonths - 3) * 0.7 / 21;
  }
  
  private generateRecommendationReason(strategy: ExportOutcome, profile: BusinessProfile): string {
    return `This approach worked well for ${strategy.businessProfile.size} businesses in your industry with similar products, achieving successful market entry in ${strategy.results.timeline} days.`;
  }
}
```

### 4. Create Learning Engine

Create `src/agent/memory/learning-engine.ts` for enhancing recommendations based on patterns:

```typescript
import { SimilarityEngine } from './similarity-engine';
import { MemorySubsystem } from './index';
import { BusinessProfile } from '../../types/state';

export interface MarketRecommendation {
  market: string;
  score: number;
  reasons: string[];
}

export interface EnhancedMarketRecommendation extends MarketRecommendation {
  successPatterns?: string[];
  similarBusinesses?: number;
  estimatedTimeline?: number;
}

export class LearningEngine {
  private memorySubsystem: MemorySubsystem;
  private similarityEngine: SimilarityEngine;
  
  constructor(
    memorySubsystem: MemorySubsystem,
    similarityEngine: SimilarityEngine
  ) {
    this.memorySubsystem = memorySubsystem;
    this.similarityEngine = similarityEngine;
  }
  
  async enhanceMarketRecommendations(
    businessId: string,
    baseRecommendations: MarketRecommendation[]
  ): Promise<EnhancedMarketRecommendation[]> {
    // Get business profile
    const business = await this.memorySubsystem.getBusinessProfile(businessId);
    
    if (!business) {
      return baseRecommendations as EnhancedMarketRecommendation[];
    }
    
    // Enhance each recommendation with learned patterns
    const enhancedRecommendations: EnhancedMarketRecommendation[] = [];
    
    for (const recommendation of baseRecommendations) {
      const enhanced = await this.enhanceSingleRecommendation(
        business,
        recommendation
      );
      
      enhancedRecommendations.push(enhanced);
    }
    
    // Sort by enhanced score
    return enhancedRecommendations.sort((a, b) => b.score - a.score);
  }
  
  private async enhanceSingleRecommendation(
    business: BusinessProfile,
    recommendation: MarketRecommendation
  ): Promise<EnhancedMarketRecommendation> {
    // Get strategies for this market
    const strategies = await this.memorySubsystem.exportStrategyMemory
      .findSimilarBusinessStrategies(business, recommendation.market);
    
    // Base enhanced recommendation
    const enhanced: EnhancedMarketRecommendation = {
      ...recommendation,
      successPatterns: [],
      similarBusinesses: 0
    };
    
    // If we have strategies, enhance the recommendation
    if (strategies.length > 0) {
      enhanced.similarBusinesses = strategies.length;
      enhanced.successPatterns = strategies
        .flatMap(s => s.keySuccessFactors)
        .filter((v, i, a) => a.indexOf(v) === i) // Unique values
        .slice(0, 3); // Top 3
      
      // Average estimated timeline
      enhanced.estimatedTimeline = Math.round(
        strategies.reduce((sum, s) => sum + s.estimatedTimeline, 0) / strategies.length
      );
      
      // Adjust score based on confidence
      const avgConfidence = strategies.reduce((sum, s) => sum + s.confidence, 0) / strategies.length;
      enhanced.score = enhanced.score * 0.7 + avgConfidence * 0.3;
    }
    
    return enhanced;
  }
  
  async recordMarketSelection(
    businessId: string,
    profile: BusinessProfile,
    selectedMarkets: string[]
  ): Promise<void> {
    // Record market selection for learning
    await this.memorySubsystem.recordMarketSelection(businessId, profile, selectedMarkets);
  }
}
```

### 5. Create Memory Subsystem Index

Create `src/agent/memory/index.ts` to export the memory subsystem:

```typescript
import { Database } from '../../database/connection';
import { EventSystem } from '../event-system';
import { BusinessProfileTracker } from './business-profile-tracker';
import { ExportStrategyMemory } from './export-strategy-memory';
import { SimilarityEngine } from './similarity-engine';
import { LearningEngine } from './learning-engine';
import { BusinessProfile } from '../../types/state';

export class MemorySubsystem {
  public businessProfileTracker: BusinessProfileTracker;
  public exportStrategyMemory: ExportStrategyMemory;
  public learningEngine: LearningEngine;
  private db: Database;
  
  constructor(db: Database, eventSystem: EventSystem) {
    this.db = db;
    const similarityEngine = new SimilarityEngine();
    
    this.businessProfileTracker = new BusinessProfileTracker(db, eventSystem);
    this.exportStrategyMemory = new ExportStrategyMemory(db, similarityEngine);
    
    this.learningEngine = new LearningEngine(
      this,
      similarityEngine
    );
    
    // Set up event listeners
    this.initializeEventListeners(eventSystem);
  }
  
  private initializeEventListeners(eventSystem: EventSystem): void {
    // Set up memory-related event handlers
  }
  
  async getBusinessProfile(businessId: string): Promise<BusinessProfile | null> {
    const business = await this.db.businessStates.findOne({ businessId });
    return business?.profile || null;
  }
  
  async recordMarketSelection(
    businessId: string,
    profile: BusinessProfile,
    selectedMarkets: string[]
  ): Promise<void> {
    // Record market selection for pattern learning
    await this.db.marketSelections.insertOne({
      businessId,
      profile,
      selectedMarkets,
      timestamp: new Date()
    });
  }
}
```

### 6. Create Database Indexes

Add the following to `src/database/setup.ts` to create indexes for efficient memory operations:

```typescript
// Create indexes for memory subsystem
await db.profileChanges.createIndex({ businessId: 1 });
await db.profileChanges.createIndex({ timestamp: 1 });

await db.exportOutcomes.createIndex({ businessId: 1 });
await db.exportOutcomes.createIndex({ market: 1 });
await db.exportOutcomes.createIndex({ 'results.successful': 1 });
await db.exportOutcomes.createIndex({ 'businessProfile.industry': 1 });
await db.exportOutcomes.createIndex({ 'businessProfile.size': 1 });

await db.exportPatterns.createIndex({ industryType: 1 });
await db.exportPatterns.createIndex({ marketRegion: 1 });
await db.exportPatterns.createIndex({ businessSize: 1 });
await db.exportPatterns.createIndex({ timestamp: 1 });

await db.marketSelections.createIndex({ businessId: 1 });
await db.marketSelections.createIndex({ 'profile.industry': 1 });
await db.marketSelections.createIndex({ selectedMarkets: 1 });
await db.marketSelections.createIndex({ timestamp: 1 });
``` 