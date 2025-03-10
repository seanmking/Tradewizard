/**
 * Event structure
 */
export interface Event {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
  priority: EventPriority;
  metadata?: Record<string, any>;
}

/**
 * Event priority levels
 */
export enum EventPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Event handler function type
 */
export type EventHandler = (event: Event) => Promise<void>;

/**
 * Subscription options
 */
export interface SubscriptionOptions {
  priority?: EventPriority[];
  source?: string[];
  filter?: (event: Event) => boolean;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Subscription structure
 */
interface Subscription {
  id: string;
  eventType: string;
  handler: EventHandler;
  options: SubscriptionOptions;
}

/**
 * Event publishing options
 */
export interface PublishOptions {
  priority?: EventPriority;
  source?: string;
  metadata?: Record<string, any>;
  persist?: boolean;
}

/**
 * EventSystem handles event publishing and subscription
 */
export class EventSystem {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private db: any; // Database connection
  private isProcessing: boolean = false;
  private eventQueue: Event[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  
  constructor(db: any) {
    this.db = db;
    
    // Start event processing loop
    this.startProcessing();
  }
  
  /**
   * Subscribe to an event type
   */
  subscribe(
    eventType: string,
    handler: EventHandler,
    options: SubscriptionOptions = {}
  ): string {
    // Generate subscription ID
    const subscriptionId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Create subscription
    const subscription: Subscription = {
      id: subscriptionId,
      eventType,
      handler,
      options
    };
    
    // Add to subscriptions map
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }
    this.subscriptions.get(eventType)!.push(subscription);
    
    console.log(`Subscription ${subscriptionId} created for event type ${eventType}`);
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from an event type
   */
  unsubscribe(subscriptionId: string): boolean {
    // Find subscription
    for (const [eventType, subscriptions] of this.subscriptions.entries()) {
      const index = subscriptions.findIndex(sub => sub.id === subscriptionId);
      
      if (index !== -1) {
        // Remove subscription
        subscriptions.splice(index, 1);
        
        // Remove event type if no more subscriptions
        if (subscriptions.length === 0) {
          this.subscriptions.delete(eventType);
        }
        
        console.log(`Subscription ${subscriptionId} removed`);
        return true;
      }
    }
    
    console.warn(`Subscription ${subscriptionId} not found`);
    return false;
  }
  
  /**
   * Publish an event
   */
  async publish(
    eventType: string,
    payload: any,
    options: PublishOptions = {}
  ): Promise<string> {
    // Create event
    const event: Event = {
      id: `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: eventType,
      payload,
      timestamp: new Date(),
      source: options.source || 'system',
      priority: options.priority || EventPriority.MEDIUM,
      metadata: options.metadata
    };
    
    // Persist event if requested
    if (options.persist !== false) {
      await this.persistEvent(event);
    }
    
    // Add to queue for processing
    this.eventQueue.push(event);
    
    // Process immediately if high priority
    if (event.priority === EventPriority.HIGH || event.priority === EventPriority.CRITICAL) {
      this.processEvent(event);
    }
    
    return event.id;
  }
  
  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      // Check queue first
      const queuedEvent = this.eventQueue.find(event => event.id === eventId);
      if (queuedEvent) {
        return queuedEvent;
      }
      
      // Check database
      const event = await this.db.events.findOne({ id: eventId });
      return event;
    } catch (error) {
      console.error(`Error getting event: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }
  
  /**
   * Get events by type
   */
  async getEventsByType(
    eventType: string,
    options: { limit?: number; since?: Date } = {}
  ): Promise<Event[]> {
    try {
      // Build query
      const query: any = { type: eventType };
      
      if (options.since) {
        query.timestamp = { $gte: options.since };
      }
      
      // Execute query
      const events = await this.db.events
        .find(query)
        .sort({ timestamp: -1 })
        .limit(options.limit || 100)
        .toArray();
      
      return events;
    } catch (error) {
      console.error(`Error getting events by type: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Start event processing loop
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    this.processingInterval = setInterval(() => {
      this.processNextEvent();
    }, 100); // Process events every 100ms
  }
  
  /**
   * Stop event processing loop
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }
  
  /**
   * Process next event in queue
   */
  private async processNextEvent(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Sort queue by priority
      this.eventQueue.sort((a, b) => this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority));
      
      // Get next event
      const event = this.eventQueue.shift();
      
      if (event) {
        await this.processEvent(event);
      }
    } catch (error) {
      console.error(`Error processing event: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Process a specific event
   */
  private async processEvent(event: Event): Promise<void> {
    // Get subscriptions for this event type
    const subscriptions = this.subscriptions.get(event.type) || [];
    
    // Process each subscription
    const promises = subscriptions.map(async subscription => {
      try {
        // Check if subscription should handle this event
        if (this.shouldHandleEvent(subscription, event)) {
          // Call handler
          await subscription.handler(event);
        }
      } catch (error) {
        console.error(`Error in event handler for ${event.type}: ${error instanceof Error ? error.message : String(error)}`);
        
        // Retry if configured
        if (subscription.options.maxRetries && subscription.options.maxRetries > 0) {
          await this.retryHandler(subscription, event, 1);
        }
      }
    });
    
    // Wait for all handlers to complete
    await Promise.all(promises);
    
    // Update event status in database
    await this.updateEventStatus(event.id, 'processed');
  }
  
  /**
   * Retry an event handler
   */
  private async retryHandler(
    subscription: Subscription,
    event: Event,
    attempt: number
  ): Promise<void> {
    if (attempt > (subscription.options.maxRetries || 0)) {
      console.error(`Max retries reached for event ${event.id}, subscription ${subscription.id}`);
      return;
    }
    
    // Wait before retrying
    const delay = subscription.options.retryDelay || 1000 * Math.pow(2, attempt - 1); // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    try {
      // Retry handler
      await subscription.handler(event);
    } catch (error) {
      console.error(`Error in retry ${attempt} for event ${event.id}: ${error instanceof Error ? error.message : String(error)}`);
      
      // Retry again
      await this.retryHandler(subscription, event, attempt + 1);
    }
  }
  
  /**
   * Check if a subscription should handle an event
   */
  private shouldHandleEvent(subscription: Subscription, event: Event): boolean {
    // Check priority filter
    if (
      subscription.options.priority &&
      subscription.options.priority.length > 0 &&
      !subscription.options.priority.includes(event.priority)
    ) {
      return false;
    }
    
    // Check source filter
    if (
      subscription.options.source &&
      subscription.options.source.length > 0 &&
      !subscription.options.source.includes(event.source)
    ) {
      return false;
    }
    
    // Check custom filter
    if (subscription.options.filter && !subscription.options.filter(event)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Persist event to database
   */
  private async persistEvent(event: Event): Promise<void> {
    try {
      await this.db.events.insertOne({
        ...event,
        status: 'pending',
        createdAt: new Date()
      });
    } catch (error) {
      console.error(`Error persisting event: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Update event status in database
   */
  private async updateEventStatus(eventId: string, status: string): Promise<void> {
    try {
      await this.db.events.updateOne(
        { id: eventId },
        {
          $set: {
            status,
            processedAt: new Date()
          }
        }
      );
    } catch (error) {
      console.error(`Error updating event status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get numeric value for priority
   */
  private getPriorityValue(priority: EventPriority): number {
    switch (priority) {
      case EventPriority.CRITICAL:
        return 4;
      case EventPriority.HIGH:
        return 3;
      case EventPriority.MEDIUM:
        return 2;
      case EventPriority.LOW:
        return 1;
      default:
        return 0;
    }
  }
} 