import { Database } from '../../database/connection';
import { StreamlinedBusinessState } from '../../types/streamlined-state';

/**
 * Pattern type enum.
 */
export enum PatternType {
  INDUSTRY_SPECIFIC = 'INDUSTRY_SPECIFIC',
  REGULATORY_REQUIREMENT = 'REGULATORY_REQUIREMENT',
  TIMELINE_OPTIMIZATION = 'TIMELINE_OPTIMIZATION'
}

/**
 * Pattern interface.
 */
export interface Pattern {
  id: string;
  type: PatternType;
  name: string;
  description: string;
  conditions: PatternCondition[];
  confidence: number;
  createdAt: Date;
  lastUpdated: Date;
}

/**
 * Pattern condition interface.
 */
export interface PatternCondition {
  field: string;
  operator: 'EQUALS' | 'CONTAINS' | 'GREATER_THAN' | 'LESS_THAN';
  value: any;
}

/**
 * The PatternRecognition class provides basic pattern recognition for industry-specific guidance.
 */
export class PatternRecognition {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  /**
   * Initializes the pattern recognition system.
   */
  async initialize(): Promise<void> {
    // Create default patterns if they don't exist
    const patterns = await this.db.exportPatterns.find().toArray();
    
    if (patterns.length === 0) {
      await this.createDefaultPatterns();
    }
  }
  
  /**
   * Creates default patterns.
   */
  private async createDefaultPatterns(): Promise<void> {
    const defaultPatterns: Pattern[] = [
      {
        id: this.generateId(),
        type: PatternType.INDUSTRY_SPECIFIC,
        name: 'Food Products Export Pattern',
        description: 'Common requirements for food product exports',
        conditions: [
          {
            field: 'profile.industry',
            operator: 'EQUALS',
            value: 'Food & Beverage'
          }
        ],
        confidence: 0.8,
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: this.generateId(),
        type: PatternType.REGULATORY_REQUIREMENT,
        name: 'EU Certification Pattern',
        description: 'Common certification requirements for EU markets',
        conditions: [
          {
            field: 'exportJourney.targetMarkets',
            operator: 'CONTAINS',
            value: { country: 'Germany' }
          }
        ],
        confidence: 0.9,
        createdAt: new Date(),
        lastUpdated: new Date()
      },
      {
        id: this.generateId(),
        type: PatternType.TIMELINE_OPTIMIZATION,
        name: 'Certification Timeline Pattern',
        description: 'Optimal timeline for obtaining certifications',
        conditions: [
          {
            field: 'exportJourney.stage',
            operator: 'EQUALS',
            value: 'COMPLIANCE_PLANNING'
          }
        ],
        confidence: 0.7,
        createdAt: new Date(),
        lastUpdated: new Date()
      }
    ];
    
    for (const pattern of defaultPatterns) {
      await this.db.exportPatterns.insertOne(pattern);
    }
    
    console.log(`Created ${defaultPatterns.length} default patterns`);
  }
  
  /**
   * Finds patterns that match a business state.
   */
  async findMatchingPatterns(
    businessState: StreamlinedBusinessState
  ): Promise<Pattern[]> {
    const patterns = await this.db.exportPatterns.find().toArray();
    
    return patterns.filter(pattern => 
      this.matchesPattern(businessState, pattern)
    );
  }
  
  /**
   * Checks if a business state matches a pattern.
   */
  private matchesPattern(
    businessState: StreamlinedBusinessState, 
    pattern: Pattern
  ): boolean {
    return pattern.conditions.every(condition => 
      this.evaluateCondition(businessState, condition)
    );
  }
  
  /**
   * Evaluates a pattern condition against a business state.
   */
  private evaluateCondition(
    businessState: StreamlinedBusinessState, 
    condition: PatternCondition
  ): boolean {
    const value = this.getNestedProperty(businessState, condition.field);
    
    if (value === undefined) {
      return false;
    }
    
    switch (condition.operator) {
      case 'EQUALS':
        return this.equals(value, condition.value);
        
      case 'CONTAINS':
        return this.contains(value, condition.value);
        
      case 'GREATER_THAN':
        return value > condition.value;
        
      case 'LESS_THAN':
        return value < condition.value;
        
      default:
        return false;
    }
  }
  
  /**
   * Checks if two values are equal.
   */
  private equals(a: any, b: any): boolean {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((val, i) => this.equals(val, b[i]));
    }
    
    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      return keysA.length === keysB.length && 
        keysA.every(key => keysB.includes(key) && this.equals(a[key], b[key]));
    }
    
    return a === b;
  }
  
  /**
   * Checks if an array contains a value.
   */
  private contains(array: any[], value: any): boolean {
    if (!Array.isArray(array)) {
      return false;
    }
    
    return array.some(item => {
      if (typeof item === 'object' && item !== null && typeof value === 'object' && value !== null) {
        return Object.keys(value).every(key => 
          item[key] !== undefined && this.equals(item[key], value[key])
        );
      }
      
      return this.equals(item, value);
    });
  }
  
  /**
   * Gets a nested property from an object.
   */
  private getNestedProperty(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      if (part.includes('[') && part.includes(']')) {
        const arrayName = part.substring(0, part.indexOf('['));
        const index = parseInt(part.substring(part.indexOf('[') + 1, part.indexOf(']')));
        
        current = current[arrayName];
        
        if (!Array.isArray(current) || index >= current.length) {
          return undefined;
        }
        
        current = current[index];
      } else {
        current = current[part];
      }
    }
    
    return current;
  }
  
  /**
   * Generates a unique ID.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
} 