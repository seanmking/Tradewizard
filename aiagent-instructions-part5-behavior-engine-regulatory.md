# Behavior Engine - Regulatory Monitor Implementation

The Regulatory Monitor proactively checks for regulatory changes that affect businesses' export activities and notifies them of relevant changes.

## Implementation Steps

### 1. Create Regulatory Monitor Class

Create `src/agent/behaviors/regulatory-monitor.ts` with the following implementation:

```typescript
import { Database } from '../../database/connection';
import { EventSystem, EventType, EventPriority } from '../event-system';
import { StateManager } from '../state-manager';
import { NotificationService, NotificationPriority } from '../notification-service';
import { Scheduler } from '../scheduler';

export interface RegulatoryChange {
  id: string;
  country: string;
  requirementType: string;
  description: string;
  productCategory?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  effectiveDate: Date;
  changeType: 'NEW' | 'MODIFIED' | 'REMOVED';
  previousVersion?: any;
  source: string;
  sourceUrl?: string;
  detectedAt: Date;
}

export class RegulatoryMonitor {
  private db: Database;
  private eventSystem: EventSystem;
  private stateManager: StateManager;
  private notificationService: NotificationService;
  private scheduler: Scheduler;
  
  constructor(
    db: Database, 
    eventSystem: EventSystem,
    stateManager: StateManager,
    notificationService: NotificationService,
    scheduler: Scheduler
  ) {
    this.db = db;
    this.eventSystem = eventSystem;
    this.stateManager = stateManager;
    this.notificationService = notificationService;
    this.scheduler = scheduler;
    
    // Register for events
    this.eventSystem.subscribe(
      EventType.REGULATORY_CHANGE_DETECTED, 
      this.handleRegulatoryChange.bind(this)
    );
  }
  
  async initialize(): Promise<void> {
    // Register job handler for regulatory checks
    this.scheduler.registerJobHandler(
      'REGULATORY_CHECK', 
      this.checkForRegulatoryChanges.bind(this)
    );
    
    // Schedule daily regulatory check (3 AM)
    await this.scheduler.scheduleJob({
      cronExpression: '03:00',
      jobType: 'REGULATORY_CHECK'
    });
  }
  
  async checkForRegulatoryChanges(): Promise<void> {
    console.log('Checking for regulatory changes...');
    
    try {
      // Get latest regulatory data from external API or service
      const latestRequirements = await this.fetchLatestRegulatoryRequirements();
      
      // Get previously stored requirements
      const storedRequirements = await this.db.regulatorySnapshots
        .findOne({}, { sort: { timestamp: -1 } });
        
      if (!storedRequirements) {
        // First run, store current snapshot and exit
        await this.db.regulatorySnapshots.insertOne({
          requirements: latestRequirements,
          timestamp: new Date()
        });
        return;
      }
      
      // Detect changes
      const changes = this.detectRegulatoryChanges(
        storedRequirements.requirements, 
        latestRequirements
      );
      
      if (changes.length === 0) {
        console.log('No regulatory changes detected');
        return;
      }
      
      console.log(`Detected ${changes.length} regulatory changes`);
      
      // Store new snapshot
      await this.db.regulatorySnapshots.insertOne({
        requirements: latestRequirements,
        timestamp: new Date()
      });
      
      // Trigger events for each change
      for (const change of changes) {
        await this.eventSystem.publish({
          type: EventType.REGULATORY_CHANGE_DETECTED,
          source: 'RegulatoryMonitor',
          priority: this.determinePriority(change),
          payload: {
            regulatoryChange: change,
            affectedMarkets: [change.country],
            affectedProducts: change.productCategory ? [change.productCategory] : []
          }
        });
      }
    } catch (error) {
      console.error(`Error checking for regulatory changes: ${error.message}`);
    }
  }
  
  private async fetchLatestRegulatoryRequirements(): Promise<any[]> {
    // In a real implementation, this would call an external API or service
    // For demonstration, we'll return mock data
    
    // This could be replaced with a call to a regulatory data service
    return [
      {
        country: 'US',
        requirementType: 'Documentation',
        description: 'Updated Certificate of Origin requirements',
        productCategory: 'Food & Beverage',
        severity: 'MEDIUM',
        complexity: 'MEDIUM',
        effectiveDate: new Date('2023-06-01'),
        source: 'US Customs and Border Protection',
        sourceUrl: 'https://www.cbp.gov/trade/programs-administration/entry-summary/certification-origin'
      },
      // More requirements...
    ];
  }
  
  private async handleRegulatoryChange(event: any): Promise<void> {
    const { regulatoryChange, affectedProducts, affectedMarkets } = event.payload;
    
    // Find businesses affected by this change
    const affectedBusinesses = await this.findAffectedBusinesses(
      affectedProducts, 
      affectedMarkets
    );
    
    console.log(`Found ${affectedBusinesses.length} businesses affected by regulatory change`);
    
    // For each affected business
    for (const business of affectedBusinesses) {
      // Generate impact assessment
      const impact = await this.assessImpact(business, regulatoryChange);
      
      // Update business state
      await this.stateManager.updateBusinessState(business.businessId, {
        'exportJourney.challenges': [...business.exportJourney.challenges, {
          type: 'REGULATORY_CHANGE',
          details: regulatoryChange,
          impact,
          status: 'NEW',
          createdAt: new Date()
        }]
      });
      
      // Generate notification if high impact
      if (impact.level === 'HIGH') {
        await this.notificationService.notify(
          business.businessId,
          'REGULATORY_ALERT',
          {
            country: regulatoryChange.country,
            product: impact.affectedProduct,
            changeId: regulatoryChange.id
          },
          {
            priority: NotificationPriority.HIGH
          }
        );
      } else if (impact.level === 'MEDIUM') {
        await this.notificationService.notify(
          business.businessId,
          'REGULATORY_ALERT',
          {
            country: regulatoryChange.country,
            product: impact.affectedProduct,
            changeId: regulatoryChange.id
          },
          {
            priority: NotificationPriority.MEDIUM
          }
        );
      }
    }
  }
  
  private async findAffectedBusinesses(
    affectedProducts: string[], 
    affectedMarkets: string[]
  ): Promise<any[]> {
    // Find businesses with matching products and markets
    const query: any = {};
    
    if (affectedProducts.length > 0 && affectedMarkets.length > 0) {
      query.$or = [
        { 'exportJourney.targetMarkets.country': { $in: affectedMarkets } },
        { 'profile.products.category': { $in: affectedProducts } }
      ];
    } else if (affectedProducts.length > 0) {
      query['profile.products.category'] = { $in: affectedProducts };
    } else if (affectedMarkets.length > 0) {
      query['exportJourney.targetMarkets.country'] = { $in: affectedMarkets };
    }
    
    return this.db.businessStates.find(query).toArray();
  }
  
  private async assessImpact(business: any, regulatoryChange: RegulatoryChange): Promise<any> {
    // Assess the impact of the regulatory change on the business
    // This could use LLM or rule-based logic
    
    // Find affected product
    const affectedProduct = business.profile.products
      .find(p => p.category === regulatoryChange.productCategory)?.name || 'products';
      
    // Check if directly targeting a market
    const directlyAffected = business.exportJourney.targetMarkets
      .some(m => m.country === regulatoryChange.country);
      
    // Determine impact level
    let level = 'LOW';
    if (directlyAffected && regulatoryChange.severity === 'HIGH') {
      level = 'HIGH';
    } else if (directlyAffected || regulatoryChange.severity === 'HIGH') {
      level = 'MEDIUM';
    }
    
    return {
      level,
      affectedProduct,
      summary: `This change affects ${affectedProduct} exports to ${regulatoryChange.country}`,
      complianceSteps: [
        'Review updated requirements',
        'Update product documentation',
        'Verify compliance with new standards'
      ],
      estimatedTimeToComply: this.estimateComplianceTime(regulatoryChange)
    };
  }
  
  private estimateComplianceTime(regulatoryChange: RegulatoryChange): number {
    // Estimate time to comply in days
    switch (regulatoryChange.complexity) {
      case 'HIGH':
        return 90;
      case 'MEDIUM':
        return 45;
      case 'LOW':
      default:
        return 15;
    }
  }
  
  private detectRegulatoryChanges(oldReqs: any[], newReqs: any[]): RegulatoryChange[] {
    const changes: RegulatoryChange[] = [];
    
    // Create maps for faster lookup
    const oldReqMap = new Map(oldReqs.map(r => [this.getRequirementKey(r), r]));
    const newReqMap = new Map(newReqs.map(r => [this.getRequirementKey(r), r]));
    
    // Find new or modified requirements
    for (const [key, newReq] of newReqMap.entries()) {
      const oldReq = oldReqMap.get(key);
      
      if (!oldReq) {
        // New requirement
        changes.push({
          ...newReq,
          changeType: 'NEW',
          id: this.generateId(),
          detectedAt: new Date()
        });
      } else if (JSON.stringify(oldReq) !== JSON.stringify(newReq)) {
        // Modified requirement
        changes.push({
          ...newReq,
          changeType: 'MODIFIED',
          previousVersion: oldReq,
          id: this.generateId(),
          detectedAt: new Date()
        });
      }
    }
    
    // Find removed requirements
    for (const [key, oldReq] of oldReqMap.entries()) {
      if (!newReqMap.has(key)) {
        // Removed requirement
        changes.push({
          ...oldReq,
          changeType: 'REMOVED',
          id: this.generateId(),
          detectedAt: new Date()
        });
      }
    }
    
    return changes;
  }
  
  private getRequirementKey(req: any): string {
    // Create a unique key for a requirement
    return `${req.country}|${req.requirementType}|${req.description}`;
  }
  
  private determinePriority(change: RegulatoryChange): EventPriority {
    // Determine event priority based on change significance
    if (change.changeType === 'NEW' && change.severity === 'HIGH') {
      return EventPriority.CRITICAL;
    } else if (change.changeType === 'MODIFIED' && change.severity === 'HIGH') {
      return EventPriority.HIGH;
    } else if (change.changeType === 'NEW') {
      return EventPriority.MEDIUM;
    } else {
      return EventPriority.LOW;
    }
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
```

### 2. Create Database Indexes

Add the following to `src/database/setup.ts` to create indexes for efficient regulatory monitoring:

```typescript
// Create indexes for regulatory monitoring
await db.regulatorySnapshots.createIndex({ timestamp: -1 });
await db.businessStates.createIndex({ 'profile.products.category': 1 });
await db.businessStates.createIndex({ 'exportJourney.targetMarkets.country': 1 });
```

### 3. Register Regulatory Monitor

Update `src/agent/behaviors/index.ts` to include the Regulatory Monitor:

```typescript
import { Database } from '../../database/connection';
import { EventSystem } from '../event-system';
import { StateManager } from '../state-manager';
import { NotificationService } from '../notification-service';
import { Scheduler } from '../scheduler';
import { RegulatoryMonitor } from './regulatory-monitor';

export class BehaviorEngine {
  public regulatoryMonitor: RegulatoryMonitor;
  // Other monitors will be added here
  
  constructor(
    db: Database,
    eventSystem: EventSystem,
    stateManager: StateManager,
    notificationService: NotificationService,
    scheduler: Scheduler
  ) {
    // Initialize regulatory monitor
    this.regulatoryMonitor = new RegulatoryMonitor(
      db,
      eventSystem,
      stateManager,
      notificationService,
      scheduler
    );
  }
  
  async initialize(): Promise<void> {
    // Initialize all monitors
    await this.regulatoryMonitor.initialize();
  }
}
``` 