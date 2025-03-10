/**
 * This is a simplified database connection module for the AI Agent implementation.
 * In a real implementation, this would connect to a MongoDB or PostgreSQL database.
 */

export class Database {
  // Collections
  public businessStates: Collection;
  public stateHistory: Collection;
  public events: Collection;
  public notifications: Collection;
  public scheduledJobs: Collection;
  public regulatorySnapshots: Collection;
  public profileChanges: Collection;
  public exportOutcomes: Collection;
  public exportPatterns: Collection;
  public marketSelections: Collection;
  public certificationNotifications: Collection;
  public timelines: Collection;
  public marketReports: Collection;
  
  constructor() {
    // Initialize collections
    this.businessStates = new Collection('businessStates');
    this.stateHistory = new Collection('stateHistory');
    this.events = new Collection('events');
    this.notifications = new Collection('notifications');
    this.scheduledJobs = new Collection('scheduledJobs');
    this.regulatorySnapshots = new Collection('regulatorySnapshots');
    this.profileChanges = new Collection('profileChanges');
    this.exportOutcomes = new Collection('exportOutcomes');
    this.exportPatterns = new Collection('exportPatterns');
    this.marketSelections = new Collection('marketSelections');
    this.certificationNotifications = new Collection('certificationNotifications');
    this.timelines = new Collection('timelines');
    this.marketReports = new Collection('marketReports');
  }
  
  async connect(connectionString?: string): Promise<void> {
    console.log(`Connected to database: ${connectionString || 'default'}`);
  }
  
  async disconnect(): Promise<void> {
    console.log('Disconnected from database');
  }
}

// Simple in-memory collection implementation for demonstration
class Collection {
  private name: string;
  private data: any[] = [];
  private indexes: { [key: string]: boolean } = {};
  
  constructor(name: string) {
    this.name = name;
  }
  
  async createIndex(key: any, options?: any): Promise<void> {
    const keyString = typeof key === 'string' ? key : JSON.stringify(key);
    this.indexes[keyString] = true;
    console.log(`Created index on ${this.name}: ${keyString}`);
  }
  
  async insertOne(document: any): Promise<any> {
    // Add _id if not present
    if (!document._id) {
      document._id = Math.random().toString(36).substring(2, 15);
    }
    
    this.data.push(document);
    return { insertedId: document._id };
  }
  
  async updateOne(filter: any, update: any, options?: any): Promise<any> {
    const index = this.data.findIndex(item => this.matchesFilter(item, filter));
    
    if (index !== -1) {
      // Handle $set operator
      if (update.$set) {
        for (const key in update.$set) {
          this.setNestedProperty(this.data[index], key, update.$set[key]);
        }
      }
      
      return { modifiedCount: 1, upsertedId: null };
    } else if (options?.upsert) {
      // Create new document for upsert
      const newDoc = { ...filter };
      
      if (update.$set) {
        for (const key in update.$set) {
          this.setNestedProperty(newDoc, key, update.$set[key]);
        }
      }
      
      return this.insertOne(newDoc);
    }
    
    return { modifiedCount: 0, upsertedId: null };
  }
  
  async deleteOne(filter: any): Promise<any> {
    const initialLength = this.data.length;
    this.data = this.data.filter(item => !this.matchesFilter(item, filter));
    
    return { deletedCount: initialLength - this.data.length };
  }
  
  async findOne(filter: any, options?: any): Promise<any> {
    return this.data.find(item => this.matchesFilter(item, filter)) || null;
  }
  
  find(filter: any = {}, options: any = {}): QueryCursor {
    const filteredData = this.data.filter(item => this.matchesFilter(item, filter));
    return new QueryCursor(filteredData, options);
  }
  
  private matchesFilter(item: any, filter: any): boolean {
    for (const key in filter) {
      if (key === '$or' && Array.isArray(filter.$or)) {
        // Handle $or operator
        const orMatches = filter.$or.some((subFilter: any) => this.matchesFilter(item, subFilter));
        if (!orMatches) return false;
      } else if (typeof filter[key] === 'object' && filter[key] !== null) {
        // Handle operators like $in, $gt, etc.
        const value = this.getNestedProperty(item, key);
        
        if (filter[key].$in && !filter[key].$in.includes(value)) {
          return false;
        }
        
        // Add more operators as needed
      } else {
        // Simple equality check
        const value = this.getNestedProperty(item, key);
        if (value !== filter[key]) return false;
      }
    }
    
    return true;
  }
  
  private getNestedProperty(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }
  
  private setNestedProperty(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
}

class QueryCursor {
  private data: any[];
  private options: any;
  
  constructor(data: any[], options: any) {
    this.data = [...data]; // Clone to avoid modifying original
    this.options = options;
  }
  
  sort(sortSpec: any): QueryCursor {
    if (sortSpec) {
      const sortKey = Object.keys(sortSpec)[0];
      const sortDir = sortSpec[sortKey];
      
      this.data.sort((a, b) => {
        const aVal = this.getNestedProperty(a, sortKey);
        const bVal = this.getNestedProperty(b, sortKey);
        
        if (aVal < bVal) return sortDir === 1 ? -1 : 1;
        if (aVal > bVal) return sortDir === 1 ? 1 : -1;
        return 0;
      });
    }
    
    return this;
  }
  
  limit(n: number): QueryCursor {
    if (n > 0) {
      this.data = this.data.slice(0, n);
    }
    
    return this;
  }
  
  async toArray(): Promise<any[]> {
    // Apply projection if specified
    if (this.options.projection) {
      return this.data.map(item => {
        const result: any = {};
        
        for (const key in this.options.projection) {
          if (this.options.projection[key]) {
            result[key] = this.getNestedProperty(item, key);
          }
        }
        
        return result;
      });
    }
    
    return this.data;
  }
  
  private getNestedProperty(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }
} 