# Event System Implementation

The Event System enables the agent to respond to changes in the environment and trigger appropriate behaviors. It provides a publish-subscribe mechanism for event-driven architecture.

## Implementation Steps

### 1. Define Event Types

Create `src/agent/event-system.ts` with the following event type definitions:

```typescript
export enum EventType {
  // Business events
  BUSINESS_PROFILE_UPDATED = 'BUSINESS_PROFILE_UPDATED',
  ASSESSMENT_COMPLETED = 'ASSESSMENT_COMPLETED',
  MARKET_SELECTED = 'MARKET_SELECTED',
  
  // Regulatory events
  REGULATORY_CHANGE_DETECTED = 'REGULATORY_CHANGE_DETECTED',
  CERTIFICATION_EXPIRING = 'CERTIFICATION_EXPIRING',
  COMPLIANCE_STATUS_CHANGED = 'COMPLIANCE_STATUS_CHANGED',
  
  // Market events
  MARKET_OPPORTUNITY_DETECTED = 'MARKET_OPPORTUNITY_DETECTED',
  TARIFF_CHANGE_DETECTED = 'TARIFF_CHANGE_DETECTED',
  TRADE_AGREEMENT_CHANGE = 'TRADE_AGREEMENT_CHANGE',
  
  // Agent events
  AGENT_INSIGHT_GENERATED = 'AGENT_INSIGHT_GENERATED',
  AUTONOMOUS_ACTION_TAKEN = 'AUTONOMOUS_ACTION_TAKEN',
  LEARNING_PATTERN_IDENTIFIED = 'LEARNING_PATTERN_IDENTIFIED',
  
  // Notification events
  NOTIFICATION_CREATED = 'NOTIFICATION_CREATED',
  NOTIFICATION_READ = 'NOTIFICATION_READ',
  NOTIFICATION_ACTION_TAKEN = 'NOTIFICATION_ACTION_TAKEN'
}

export enum EventPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Event {
  id: string;
  type: EventType;
  source: string;
  priority: EventPriority;
  businessId?: string;
  payload: any;
  timestamp: Date;
}

export type EventHandler = (event: Event) => Promise<void>;

export interface SubscriptionOptions {
  businessId?: string;
  priority?: EventPriority;
  filter?: EventFilter;
}

export type EventFilter = (event: Event) => boolean;
```

### 2. Implement Event System Class

Add the following implementation to the same file:

```typescript
import { Database } from '../database/connection';

export class EventSystem {
  private handlers: Map<EventType, Array<{ handler: EventHandler; options?: SubscriptionOptions }>> = new Map();
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  subscribe(type: EventType, handler: EventHandler, options?: SubscriptionOptions): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    
    this.handlers.get(type)!.push({ handler, options });
  }
  
  subscribeToMultiple(types: EventType[], handler: EventHandler, options?: SubscriptionOptions): void {
    for (const type of types) {
      this.subscribe(type, handler, options);
    }
  }
  
  unsubscribe(type: EventType, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      return;
    }
    
    const handlers = this.handlers.get(type)!;
    const index = handlers.findIndex(h => h.handler === handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }
  
  async publish(event: Omit<Event, 'id' | 'timestamp'>): Promise<string> {
    const fullEvent: Event = {
      ...event,
      id: this.generateId(),
      timestamp: new Date()
    };
    
    // Persist event
    await this.persistEvent(fullEvent);
    
    // Process event
    await this.processEvent(fullEvent);
    
    return fullEvent.id;
  }
  
  private async persistEvent(event: Event): Promise<void> {
    try {
      await this.db.events.insertOne(event);
    } catch (error) {
      console.error(`Error persisting event: ${error.message}`);
      // Continue processing even if persistence fails
    }
  }
  
  private async processEvent(event: Event): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    for (const { handler, options } of handlers) {
      // Skip if handler has business filter and event doesn't match
      if (options?.businessId && event.businessId !== options.businessId) {
        continue;
      }
      
      // Skip if handler has priority filter and event doesn't match
      if (options?.priority && event.priority !== options.priority) {
        continue;
      }
      
      // Skip if handler has custom filter and event doesn't match
      if (options?.filter && !options.filter(event)) {
        continue;
      }
      
      try {
        await handler(event);
      } catch (error) {
        console.error(
          `Error processing event ${event.id} with handler: ${error.message}`
        );
        // Continue with other handlers even if one fails
      }
    }
  }
  
  async getRecentEvents(
    type?: EventType, 
    businessId?: string, 
    limit: number = 10
  ): Promise<Event[]> {
    const query: any = {};
    
    if (type) {
      query.type = type;
    }
    
    if (businessId) {
      query.businessId = businessId;
    }
    
    return this.db.events
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}
```

### 3. Create Database Indexes

Add the following to `src/database/setup.ts` to create indexes for efficient event processing:

```typescript
// Create indexes for events
await db.events.createIndex({ type: 1 });
await db.events.createIndex({ businessId: 1 });
await db.events.createIndex({ timestamp: -1 });
await db.events.createIndex({ priority: 1 });
```

### 4. Create Event Utilities

Create `src/agent/event-utils.ts` with helper functions for common event operations:

```typescript
import { EventSystem, EventType, EventPriority, Event } from './event-system';

export async function publishBusinessEvent(
  eventSystem: EventSystem,
  businessId: string,
  type: EventType,
  payload: any,
  priority: EventPriority = EventPriority.MEDIUM
): Promise<string> {
  return eventSystem.publish({
    type,
    source: 'BusinessEventUtil',
    priority,
    businessId,
    payload
  });
}

export async function publishSystemEvent(
  eventSystem: EventSystem,
  type: EventType,
  payload: any,
  priority: EventPriority = EventPriority.MEDIUM
): Promise<string> {
  return eventSystem.publish({
    type,
    source: 'SystemEventUtil',
    priority,
    payload
  });
}

export function createBusinessFilter(businessId: string): (event: Event) => boolean {
  return (event: Event) => event.businessId === businessId;
}

export function createPriorityFilter(minPriority: EventPriority): (event: Event) => boolean {
  const priorities = [
    EventPriority.LOW,
    EventPriority.MEDIUM,
    EventPriority.HIGH,
    EventPriority.CRITICAL
  ];
  
  const minIndex = priorities.indexOf(minPriority);
  
  return (event: Event) => {
    const eventPriorityIndex = priorities.indexOf(event.priority);
    return eventPriorityIndex >= minIndex;
  };
}
``` 