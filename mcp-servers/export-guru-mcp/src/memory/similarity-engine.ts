import { BusinessProfile } from '../types';

/**
 * Similarity calculation result
 */
export interface SimilarityResult {
  score: number; // 0-1 score where 1 is perfect match
  isMatch: boolean; // Whether the score exceeds the match threshold
  matchDetails?: {
    // Detailed matching information for each dimension
    [key: string]: {
      score: number;
      weight: number;
      contribution: number;
    };
  };
}

/**
 * Similarity configuration
 */
export interface SimilarityConfig {
  thresholds: {
    // Default thresholds for different entity types
    businessProfile: number;
    exportPattern: number;
    regulatoryPattern: number;
  };
  weights: {
    // Default weights for different dimensions
    products: number;
    targetMarkets: number;
    certifications: number;
    size: number;
    growthStage: number;
    industry: number;
    exportExperience: number;
    [key: string]: number;
  };
}

/**
 * SimilarityEngine provides methods for calculating similarity between various entities
 */
export class SimilarityEngine {
  private config: SimilarityConfig;
  
  constructor(customConfig?: Partial<SimilarityConfig>) {
    // Default configuration
    const defaultConfig: SimilarityConfig = {
      thresholds: {
        businessProfile: 0.65,
        exportPattern: 0.6,
        regulatoryPattern: 0.55
      },
      weights: {
        products: 3.0, // Highest weight
        targetMarkets: 2.0,
        certifications: 1.5,
        size: 1.0,
        growthStage: 1.0,
        industry: 2.0,
        exportExperience: 1.5
      }
    };
    
    // Merge default with custom config
    this.config = {
      thresholds: { ...defaultConfig.thresholds, ...customConfig?.thresholds },
      weights: { ...defaultConfig.weights, ...customConfig?.weights }
    };
  }

  /**
   * Calculate similarity between two business profiles
   */
  calculateBusinessSimilarity(
    profile1: BusinessProfile,
    profile2: BusinessProfile
  ): SimilarityResult {
    const matchDetails: SimilarityResult['matchDetails'] = {};
    let totalScore = 0;
    let totalWeight = 0;
    
    // Compare products
    const productMatch = this.compareProducts(
      profile1.products || [],
      profile2.products || []
    );
    matchDetails.products = {
      score: productMatch,
      weight: this.config.weights.products,
      contribution: productMatch * this.config.weights.products
    };
    totalScore += matchDetails.products.contribution;
    totalWeight += this.config.weights.products;
    
    // Compare target markets
    const marketMatch = this.compareStringArrays(
      profile1.targetMarkets || [],
      profile2.targetMarkets || []
    );
    matchDetails.targetMarkets = {
      score: marketMatch,
      weight: this.config.weights.targetMarkets,
      contribution: marketMatch * this.config.weights.targetMarkets
    };
    totalScore += matchDetails.targetMarkets.contribution;
    totalWeight += this.config.weights.targetMarkets;
    
    // Compare certifications - extract names if they're objects
    const certs1 = this.extractCertificationNames(profile1.certifications || []);
    const certs2 = this.extractCertificationNames(profile2.certifications || []);
    
    const certMatch = this.compareStringArrays(certs1, certs2);
    matchDetails.certifications = {
      score: certMatch,
      weight: this.config.weights.certifications,
      contribution: certMatch * this.config.weights.certifications
    };
    totalScore += matchDetails.certifications.contribution;
    totalWeight += this.config.weights.certifications;
    
    // Compare size
    if (typeof profile1.size === 'number' && typeof profile2.size === 'number') {
      const sizeMatch = this.compareNumericValues(profile1.size, profile2.size);
      matchDetails.size = {
        score: sizeMatch,
        weight: this.config.weights.size,
        contribution: sizeMatch * this.config.weights.size
      };
      totalScore += matchDetails.size.contribution;
      totalWeight += this.config.weights.size;
    }
    
    // Compare industry (if exists in the profiles)
    if ('industry' in profile1 && 'industry' in profile2 && 
        typeof profile1.industry === 'string' && typeof profile2.industry === 'string') {
      const industryMatch = this.compareStrings(profile1.industry, profile2.industry);
      matchDetails.industry = {
        score: industryMatch,
        weight: this.config.weights.industry,
        contribution: industryMatch * this.config.weights.industry
      };
      totalScore += matchDetails.industry.contribution;
      totalWeight += this.config.weights.industry;
    }
    
    // Calculate normalized score
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Determine if this is a match
    const isMatch = normalizedScore >= this.config.thresholds.businessProfile;
    
    return {
      score: normalizedScore,
      isMatch,
      matchDetails
    };
  }
  
  /**
   * Calculate similarity between a business profile and a pattern
   */
  calculatePatternSimilarity(
    businessProfile: BusinessProfile,
    pattern: any
  ): SimilarityResult {
    const matchDetails: SimilarityResult['matchDetails'] = {};
    let totalScore = 0;
    let totalWeight = 0;
    
    // Compare products to pattern product categories
    const productMatch = this.compareProductsToCategories(
      businessProfile.products || [],
      pattern.productCategories || []
    );
    matchDetails.products = {
      score: productMatch,
      weight: this.config.weights.products,
      contribution: productMatch * this.config.weights.products
    };
    totalScore += matchDetails.products.contribution;
    totalWeight += this.config.weights.products;
    
    // Compare target markets to applicable markets
    const marketMatch = this.compareStringArrays(
      businessProfile.targetMarkets || [],
      pattern.applicableMarkets || []
    );
    matchDetails.markets = {
      score: marketMatch,
      weight: this.config.weights.targetMarkets,
      contribution: marketMatch * this.config.weights.targetMarkets
    };
    totalScore += matchDetails.markets.contribution;
    totalWeight += this.config.weights.targetMarkets;
    
    // Compare business size to size range if applicable
    if (typeof businessProfile.size === 'number' && pattern.businessSizeRange) {
      const sizeMatch = this.compareSizeToRange(
        businessProfile.size,
        pattern.businessSizeRange
      );
      matchDetails.size = {
        score: sizeMatch,
        weight: this.config.weights.size,
        contribution: sizeMatch * this.config.weights.size
      };
      totalScore += matchDetails.size.contribution;
      totalWeight += this.config.weights.size;
    }
    
    // Compare certifications if applicable
    if (businessProfile.certifications && pattern.relevantCertifications) {
      const certifications = this.extractCertificationNames(businessProfile.certifications);
      const certMatch = this.compareStringArrays(
        certifications,
        pattern.relevantCertifications
      );
      matchDetails.certifications = {
        score: certMatch,
        weight: this.config.weights.certifications,
        contribution: certMatch * this.config.weights.certifications
      };
      totalScore += matchDetails.certifications.contribution;
      totalWeight += this.config.weights.certifications;
    }
    
    // Calculate normalized score
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    
    // Determine threshold based on pattern type
    let threshold = this.config.thresholds.exportPattern;
    if (pattern.type && pattern.type.startsWith('REGULATORY')) {
      threshold = this.config.thresholds.regulatoryPattern;
    }
    
    // Determine if this is a match
    const isMatch = normalizedScore >= threshold;
    
    return {
      score: normalizedScore,
      isMatch,
      matchDetails
    };
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
   * Compare products from two business profiles
   * This handles the complex comparison of product objects
   */
  private compareProducts(products1: any[], products2: any[]): number {
    if (!products1.length || !products2.length) return 0;
    
    // Extract categories for comparison
    const categories1 = products1.map(p => 
      typeof p === 'string' ? p : (p.category || p.name || '')
    );
    
    const categories2 = products2.map(p => 
      typeof p === 'string' ? p : (p.category || p.name || '')
    );
    
    // Compare the category arrays
    return this.compareStringArrays(categories1, categories2);
  }
  
  /**
   * Compare products to category strings
   * Handles the case where products are objects but categories are strings
   */
  private compareProductsToCategories(products: any[], categories: string[]): number {
    if (!products.length || !categories.length) return 0;
    
    // Extract categories from products
    const productCategories = products.map(p => 
      typeof p === 'string' ? p : (p.category || p.name || '')
    );
    
    // Compare arrays with semantic similarity
    return this.compareStringArrays(productCategories, categories);
  }
  
  /**
   * Compare two string arrays using Jaccard similarity with semantic matching
   */
  private compareStringArrays(array1: string[], array2: string[]): number {
    if (!array1.length || !array2.length) return 0;
    
    // Count exact and semantic matches
    let exactMatches = 0;
    let semanticMatches = 0;
    
    for (const item1 of array1) {
      // Check for exact match
      if (array2.some(item2 => this.normalizeString(item1) === this.normalizeString(item2))) {
        exactMatches++;
      } 
      // Check for semantic match (if not exact match)
      else if (array2.some(item2 => this.calculateSemanticSimilarity(item1, item2) > 0.8)) {
        semanticMatches++;
      }
    }
    
    // Calculate Jaccard similarity with weighted semantic matches
    const effectiveMatches = exactMatches + (semanticMatches * 0.7);
    return effectiveMatches / (array1.length + array2.length - effectiveMatches);
  }
  
  /**
   * Compare a size value to a size range
   */
  private compareSizeToRange(
    size: number,
    range: { min?: number; max?: number }
  ): number {
    // If size is in range, perfect score
    if ((range.min === undefined || size >= range.min) && 
        (range.max === undefined || size <= range.max)) {
      return 1;
    }
    
    // Calculate distance from range
    let distance = 0;
    if (range.min !== undefined && size < range.min) {
      distance = range.min - size;
    } else if (range.max !== undefined && size > range.max) {
      distance = size - range.max;
    }
    
    // Convert distance to similarity score (inverse relationship)
    const rangeWidth = (range.max !== undefined && range.min !== undefined) 
      ? (range.max - range.min)
      : 100; // Default width if not specified
    
    const normalizedDistance = distance / rangeWidth;
    
    // Use a sigmoid-like function to map distance to 0-1 range
    return 1 / (1 + 3 * normalizedDistance);
  }
  
  /**
   * Compare two numeric values
   */
  private compareNumericValues(value1: number, value2: number): number {
    if (value1 === value2) return 1;
    
    // Calculate relative difference
    const maxValue = Math.max(Math.abs(value1), Math.abs(value2));
    if (maxValue === 0) return 1; // Both values are 0
    
    const absoluteDifference = Math.abs(value1 - value2);
    const relativeDifference = absoluteDifference / maxValue;
    
    // Convert to similarity score (1 is perfect match, 0 is completely different)
    return 1 - Math.min(relativeDifference, 1);
  }
  
  /**
   * Compare two strings with basic semantic similarity
   */
  private compareStrings(str1: string, str2: string): number {
    // Normalize strings
    const normalizedStr1 = this.normalizeString(str1);
    const normalizedStr2 = this.normalizeString(str2);
    
    // If strings are identical after normalization, perfect match
    if (normalizedStr1 === normalizedStr2) return 1;
    
    // Calculate semantic similarity
    return this.calculateSemanticSimilarity(normalizedStr1, normalizedStr2);
  }
  
  /**
   * Calculate semantic similarity between two strings
   * This is a simplified implementation that could be enhanced with word embeddings
   */
  private calculateSemanticSimilarity(str1: string, str2: string): number {
    // Normalize strings
    const normalizedStr1 = this.normalizeString(str1);
    const normalizedStr2 = this.normalizeString(str2);
    
    // If strings are identical after normalization, perfect match
    if (normalizedStr1 === normalizedStr2) return 1;
    
    // Word-level comparison (Jaccard similarity of words)
    const words1 = normalizedStr1.split(/\s+/);
    const words2 = normalizedStr2.split(/\s+/);
    
    let matches = 0;
    for (const word1 of words1) {
      if (words2.includes(word1)) {
        matches++;
      }
    }
    
    const union = words1.length + words2.length - matches;
    if (union === 0) return 0;
    
    // Calculate Jaccard similarity of words
    return matches / union;
  }
  
  /**
   * Normalize a string for comparison
   */
  private normalizeString(str: string): string {
    if (!str) return '';
    
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }
} 