import { Database } from '../database/connection';

/**
 * Event types for the AI Agent system.
 */
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

/**
 * Event priority levels.
 */
export enum EventPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Event interface for the AI Agent system.
 */
export interface Event {
  id: string;
  type: EventType;
  source: string;
  priority: EventPriority;
  businessId?: string;
  payload: any;
  timestamp: Date;
}

/**
 * Event handler function type.
 */
export type EventHandler = (event: Event) => Promise<void>;

/**
 * Subscription options for event handlers.
 */
export interface SubscriptionOptions {
  businessId?: string;
  priority?: EventPriority;
  filter?: EventFilter;
}

/**
 * Event filter function type.
 */
export type EventFilter = (event: Event) => boolean;

/**
 * The EventSystem enables the agent to respond to changes in the environment
 * and trigger appropriate behaviors. It provides a publish-subscribe mechanism
 * for event-driven architecture.
 */
export class EventSystem {
  private handlers: Map<EventType, Array<{ handler: EventHandler; options?: SubscriptionOptions }>> = new Map();
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  /**
   * Subscribes an event handler to a specific event type.
   */
  subscribe(type: EventType, handler: EventHandler, options?: SubscriptionOptions): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    
    this.handlers.get(type)!.push({ handler, options });
    console.log(`Subscribed handler to event type: ${type}`);
  }
  
  /**
   * Subscribes an event handler to multiple event types.
   */
  subscribeToMultiple(types: EventType[], handler: EventHandler, options?: SubscriptionOptions): void {
    for (const type of types) {
      this.subscribe(type, handler, options);
    }
  }
  
  /**
   * Unsubscribes an event handler from a specific event type.
   */
  unsubscribe(type: EventType, handler: EventHandler): void {
    if (!this.handlers.has(type)) {
      return;
    }
    
    const handlers = this.handlers.get(type)!;
    const index = handlers.findIndex(h => h.handler === handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
      console.log(`Unsubscribed handler from event type: ${type}`);
    }
  }
  
  /**
   * Publishes an event to all subscribed handlers.
   */
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
    
    console.log(`Published event: ${fullEvent.type} (${fullEvent.id})`);
    
    return fullEvent.id;
  }
  
  /**
   * Persists an event to the database.
   */
  private async persistEvent(event: Event): Promise<void> {
    try {
      await this.db.events.insertOne(event);
    } catch (error) {
      console.error(`Error persisting event: ${error.message}`);
      // Continue processing even if persistence fails
    }
  }
  
  /**
   * Processes an event by calling all subscribed handlers.
   */
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
  
  /**
   * Retrieves recent events from the database.
   */
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
  
  /**
   * Generates a unique ID for an event.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
} 