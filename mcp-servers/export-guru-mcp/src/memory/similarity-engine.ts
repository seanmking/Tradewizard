import { BusinessProfile } from '../types';

/**
 * Similarity calculation method
 */
export enum SimilarityMethod {
  JACCARD = 'JACCARD',
  COSINE = 'COSINE',
  WEIGHTED = 'WEIGHTED'
}

/**
 * Similarity calculation options
 */
export interface SimilarityOptions {
  method?: SimilarityMethod;
  weights?: Record<string, number>;
  threshold?: number;
  includeFields?: string[];
  excludeFields?: string[];
}

/**
 * Similarity result with detailed breakdown
 */
export interface SimilarityResult {
  score: number;
  breakdown: Record<string, number>;
  method: SimilarityMethod;
  threshold: number;
  isMatch: boolean;
}

/**
 * SimilarityEngine calculates similarity between business profiles and other entities
 * to enable pattern matching and recommendation enhancement
 */
export class SimilarityEngine {
  private defaultOptions: SimilarityOptions = {
    method: SimilarityMethod.WEIGHTED,
    weights: {
      products: 0.4,
      targetMarkets: 0.3,
      certifications: 0.2,
      size: 0.1
    },
    threshold: 0.7
  };
  
  /**
   * Calculate similarity between two business profiles
   */
  calculateBusinessSimilarity(
    profile1: BusinessProfile,
    profile2: BusinessProfile,
    options: SimilarityOptions = {}
  ): SimilarityResult {
    // Merge options with defaults
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Select similarity method
    switch (mergedOptions.method) {
      case SimilarityMethod.JACCARD:
        return this.calculateJaccardSimilarity(profile1, profile2, mergedOptions);
      case SimilarityMethod.COSINE:
        return this.calculateCosineSimilarity(profile1, profile2, mergedOptions);
      case SimilarityMethod.WEIGHTED:
      default:
        return this.calculateWeightedSimilarity(profile1, profile2, mergedOptions);
    }
  }
  
  /**
   * Calculate similarity between a business profile and a pattern
   */
  calculatePatternSimilarity(
    profile: BusinessProfile,
    pattern: any,
    options: SimilarityOptions = {}
  ): SimilarityResult {
    // Merge options with defaults
    const mergedOptions = { ...this.defaultOptions, ...options };
    
    // Extract pattern criteria for comparison
    const patternCriteria = this.extractPatternCriteria(pattern);
    
    // Calculate similarity based on pattern criteria
    return this.calculateWeightedSimilarity(profile, patternCriteria, mergedOptions);
  }
  
  /**
   * Calculate weighted similarity between two objects
   */
  private calculateWeightedSimilarity(
    obj1: any,
    obj2: any,
    options: SimilarityOptions
  ): SimilarityResult {
    const weights = options.weights || {};
    const breakdown: Record<string, number> = {};
    let totalWeight = 0;
    let weightedSum = 0;
    
    // Calculate similarity for each field with a weight
    for (const field in weights) {
      // Skip if field should be excluded
      if (options.excludeFields && options.excludeFields.includes(field)) {
        continue;
      }
      
      // Skip if includeFields is specified and field is not included
      if (options.includeFields && !options.includeFields.includes(field)) {
        continue;
      }
      
      const weight = weights[field];
      totalWeight += weight;
      
      // Calculate field similarity
      const fieldSimilarity = this.calculateFieldSimilarity(obj1[field], obj2[field]);
      breakdown[field] = fieldSimilarity;
      
      // Add to weighted sum
      weightedSum += fieldSimilarity * weight;
    }
    
    // Calculate final score
    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    
    return {
      score,
      breakdown,
      method: SimilarityMethod.WEIGHTED,
      threshold: options.threshold || 0.7,
      isMatch: score >= (options.threshold || 0.7)
    };
  }
  
  /**
   * Calculate Jaccard similarity between two objects
   */
  private calculateJaccardSimilarity(
    obj1: any,
    obj2: any,
    options: SimilarityOptions
  ): SimilarityResult {
    const breakdown: Record<string, number> = {};
    let totalFields = 0;
    let totalSimilarity = 0;
    
    // Get all fields from both objects
    const allFields = new Set([
      ...Object.keys(obj1),
      ...Object.keys(obj2)
    ]);
    
    // Calculate similarity for each field
    for (const field of allFields) {
      // Skip if field should be excluded
      if (options.excludeFields && options.excludeFields.includes(field)) {
        continue;
      }
      
      // Skip if includeFields is specified and field is not included
      if (options.includeFields && !options.includeFields.includes(field)) {
        continue;
      }
      
      // Calculate field similarity using Jaccard index for arrays
      const fieldSimilarity = this.calculateJaccardIndex(obj1[field], obj2[field]);
      breakdown[field] = fieldSimilarity;
      
      totalSimilarity += fieldSimilarity;
      totalFields++;
    }
    
    // Calculate final score
    const score = totalFields > 0 ? totalSimilarity / totalFields : 0;
    
    return {
      score,
      breakdown,
      method: SimilarityMethod.JACCARD,
      threshold: options.threshold || 0.7,
      isMatch: score >= (options.threshold || 0.7)
    };
  }
  
  /**
   * Calculate Cosine similarity between two objects
   */
  private calculateCosineSimilarity(
    obj1: any,
    obj2: any,
    options: SimilarityOptions
  ): SimilarityResult {
    // This is a simplified implementation
    // A real implementation would convert objects to vectors and calculate cosine similarity
    
    const breakdown: Record<string, number> = {};
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    // Get all fields from both objects
    const allFields = new Set([
      ...Object.keys(obj1),
      ...Object.keys(obj2)
    ]);
    
    // Calculate dot product and magnitudes
    for (const field of allFields) {
      // Skip if field should be excluded
      if (options.excludeFields && options.excludeFields.includes(field)) {
        continue;
      }
      
      // Skip if includeFields is specified and field is not included
      if (options.includeFields && !options.includeFields.includes(field)) {
        continue;
      }
      
      // Get field values
      const value1 = this.getFieldVector(obj1[field]);
      const value2 = this.getFieldVector(obj2[field]);
      
      // Calculate field similarity
      const fieldSimilarity = this.calculateFieldSimilarity(obj1[field], obj2[field]);
      breakdown[field] = fieldSimilarity;
      
      // Update dot product and magnitudes
      dotProduct += value1 * value2;
      magnitude1 += value1 * value1;
      magnitude2 += value2 * value2;
    }
    
    // Calculate final score
    const score = (magnitude1 > 0 && magnitude2 > 0)
      ? dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2))
      : 0;
    
    return {
      score,
      breakdown,
      method: SimilarityMethod.COSINE,
      threshold: options.threshold || 0.7,
      isMatch: score >= (options.threshold || 0.7)
    };
  }
  
  /**
   * Calculate similarity between two field values
   */
  private calculateFieldSimilarity(value1: any, value2: any): number {
    // Handle undefined or null values
    if (value1 === undefined || value1 === null || value2 === undefined || value2 === null) {
      return 0;
    }
    
    // Handle arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return this.calculateJaccardIndex(value1, value2);
    }
    
    // Handle objects
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      // Recursively calculate similarity for nested objects
      const nestedSimilarity = this.calculateWeightedSimilarity(
        value1,
        value2,
        { method: SimilarityMethod.WEIGHTED }
      );
      return nestedSimilarity.score;
    }
    
    // Handle strings
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return this.calculateStringSimilarity(value1, value2);
    }
    
    // Handle numbers
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      // Normalize the difference between 0 and 1
      const max = Math.max(Math.abs(value1), Math.abs(value2));
      if (max === 0) return 1; // Both values are 0
      return 1 - Math.abs(value1 - value2) / max;
    }
    
    // Handle booleans
    if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
      return value1 === value2 ? 1 : 0;
    }
    
    // Default: not comparable
    return 0;
  }
  
  /**
   * Calculate Jaccard index for two arrays
   */
  private calculateJaccardIndex(array1: any[], array2: any[]): number {
    if (!Array.isArray(array1) || !Array.isArray(array2)) {
      return 0;
    }
    
    if (array1.length === 0 && array2.length === 0) {
      return 1; // Both arrays are empty
    }
    
    // Convert arrays to sets of strings for comparison
    const set1 = new Set(array1.map(item => JSON.stringify(item)));
    const set2 = new Set(array2.map(item => JSON.stringify(item)));
    
    // Calculate intersection size
    let intersectionSize = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        intersectionSize++;
      }
    }
    
    // Calculate union size
    const unionSize = set1.size + set2.size - intersectionSize;
    
    // Calculate Jaccard index
    return unionSize > 0 ? intersectionSize / unionSize : 0;
  }
  
  /**
   * Calculate similarity between two strings
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple case: exact match
    if (str1 === str2) {
      return 1;
    }
    
    // Convert to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // Check if one string contains the other
    if (s1.includes(s2)) {
      return s2.length / s1.length;
    }
    if (s2.includes(s1)) {
      return s1.length / s2.length;
    }
    
    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    // Convert distance to similarity score
    return maxLength > 0 ? 1 - distance / maxLength : 0;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    
    // Create distance matrix
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Initialize first row and column
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    
    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // Deletion
          dp[i][j - 1] + 1,      // Insertion
          dp[i - 1][j - 1] + cost // Substitution
        );
      }
    }
    
    // Return the distance
    return dp[m][n];
  }
  
  /**
   * Convert a field value to a vector representation for cosine similarity
   */
  private getFieldVector(value: any): number {
    if (value === undefined || value === null) {
      return 0;
    }
    
    if (Array.isArray(value)) {
      return value.length;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length;
    }
    
    if (typeof value === 'string') {
      return value.length;
    }
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    
    return 0;
  }
  
  /**
   * Extract pattern criteria from a pattern for comparison
   */
  private extractPatternCriteria(pattern: any): any {
    // Implementation depends on pattern structure
    // This is a placeholder for the actual implementation
    return {
      products: pattern.productCategories || [],
      targetMarkets: pattern.applicableMarkets || [],
      certifications: pattern.relevantCertifications || [],
      size: pattern.businessSizeRange || {}
    };
  }
} 