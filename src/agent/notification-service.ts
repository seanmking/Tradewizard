import { Database } from '../database/connection';
import { EventSystem, EventType, EventPriority } from './event-system';

/**
 * Notification priority levels.
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Notification delivery channels.
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

/**
 * Notification action interface.
 */
export interface NotificationAction {
  label: string;
  action: string;
  data: any;
}

/**
 * Notification interface.
 */
export interface Notification {
  id: string;
  businessId: string;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  actions?: NotificationAction[];
  metadata?: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Notification template interface.
 */
export interface NotificationTemplate {
  type: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  defaultActions?: NotificationAction[];
}

/**
 * The NotificationService manages communication with users, delivering timely
 * and relevant information about events, opportunities, and required actions.
 */
export class NotificationService {
  private db: Database;
  private eventSystem: EventSystem;
  private templates: Map<string, NotificationTemplate> = new Map();
  
  constructor(db: Database, eventSystem: EventSystem) {
    this.db = db;
    this.eventSystem = eventSystem;
    this.initializeTemplates();
  }
  
  /**
   * Initializes default notification templates.
   */
  private initializeTemplates(): void {
    // Initialize default notification templates
    this.registerTemplate({
      type: 'REGULATORY_ALERT',
      titleTemplate: 'Important Regulatory Change Detected',
      messageTemplate: 'A change in {{country}} regulations affects your {{product}} exports.',
      defaultPriority: NotificationPriority.HIGH,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      defaultActions: [
        { 
          label: 'View Details', 
          action: 'VIEW_REGULATORY_CHANGE', 
          data: { changeId: '{{changeId}}' } 
        },
        { 
          label: 'Assess Impact', 
          action: 'ASSESS_REGULATORY_IMPACT', 
          data: { changeId: '{{changeId}}' } 
        }
      ]
    });
    
    this.registerTemplate({
      type: 'CERTIFICATION_EXPIRATION',
      titleTemplate: '{{certName}} Expiring Soon',
      messageTemplate: 'Your {{certName}} will expire in {{daysRemaining}} days.',
      defaultPriority: NotificationPriority.MEDIUM,
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      defaultActions: [
        { 
          label: 'Renewal Information', 
          action: 'VIEW_CERTIFICATION_RENEWAL', 
          data: { certId: '{{certId}}' } 
        },
        { 
          label: 'Mark as Renewed', 
          action: 'UPDATE_CERTIFICATION', 
          data: { certId: '{{certId}}' } 
        }
      ]
    });
    
    this.registerTemplate({
      type: 'MARKET_OPPORTUNITY',
      titleTemplate: 'New Market Opportunity for {{product}}',
      messageTemplate: 'We\'ve identified {{market}} as a promising market for your {{product}} product.',
      defaultPriority: NotificationPriority.MEDIUM,
      defaultChannels: [NotificationChannel.IN_APP],
      defaultActions: [
        { 
          label: 'View Details', 
          action: 'VIEW_MARKET_OPPORTUNITY', 
          data: { market: '{{market}}', productId: '{{productId}}' } 
        },
        { 
          label: 'Add to Target Markets', 
          action: 'ADD_TARGET_MARKET', 
          data: { market: '{{market}}' } 
        }
      ]
    });
  }
  
  /**
   * Registers a notification template.
   */
  registerTemplate(template: NotificationTemplate): void {
    this.templates.set(template.type, template);
    console.log(`Registered notification template: ${template.type}`);
  }
  
  /**
   * Sends a notification using a template.
   */
  async notify(
    businessId: string, 
    type: string, 
    data: Record<string, any>, 
    options?: {
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
      actions?: NotificationAction[];
      expiresAt?: Date;
    }
  ): Promise<string> {
    // Get template
    const template = this.templates.get(type);
    
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`);
    }
    
    // Apply template with data
    const title = this.applyTemplate(template.titleTemplate, data);
    const message = this.applyTemplate(template.messageTemplate, data);
    
    // Apply actions with data
    const actions = options?.actions || template.defaultActions || [];
    const processedActions = actions.map(action => ({
      ...action,
      data: Object.entries(action.data).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' 
          ? this.applyTemplate(value as string, data)
          : value;
        return acc;
      }, {} as Record<string, any>)
    }));
    
    // Create notification
    const notification: Notification = {
      id: this.generateId(),
      businessId,
      type,
      title,
      message,
      priority: options?.priority || template.defaultPriority,
      channels: options?.channels || template.defaultChannels,
      actions: processedActions,
      metadata: data,
      read: false,
      createdAt: new Date(),
      expiresAt: options?.expiresAt
    };
    
    // Store notification
    await this.db.notifications.insertOne(notification);
    
    // Publish notification event
    await this.eventSystem.publish({
      type: EventType.NOTIFICATION_CREATED,
      source: 'NotificationService',
      priority: this.mapPriorityToEventPriority(notification.priority),
      businessId,
      payload: {
        notification
      }
    });
    
    console.log(`Created notification: ${notification.id} (${notification.type}) for business: ${businessId}`);
    
    // Return the notification ID
    return notification.id;
  }
  
  /**
   * Sends a custom notification without using a template.
   */
  async notifyCustom(
    businessId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      priority: NotificationPriority;
      actions?: NotificationAction[];
      channels?: NotificationChannel[];
      expiresAt?: Date;
    }
  ): Promise<string> {
    // Create full notification
    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      businessId,
      channels: notification.channels || [NotificationChannel.IN_APP],
      read: false,
      createdAt: new Date()
    };
    
    // Store notification
    await this.db.notifications.insertOne(fullNotification);
    
    // Publish notification event
    await this.eventSystem.publish({
      type: EventType.NOTIFICATION_CREATED,
      source: 'NotificationService',
      priority: this.mapPriorityToEventPriority(notification.priority),
      businessId,
      payload: {
        notification: fullNotification
      }
    });
    
    console.log(`Created custom notification: ${fullNotification.id} (${fullNotification.type}) for business: ${businessId}`);
    
    // Return the notification ID
    return fullNotification.id;
  }
  
  /**
   * Marks a notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = await this.db.notifications.findOne({ id: notificationId });
    
    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }
    
    await this.db.notifications.updateOne(
      { id: notificationId },
      { $set: { read: true } }
    );
    
    // Publish notification read event
    await this.eventSystem.publish({
      type: EventType.NOTIFICATION_READ,
      source: 'NotificationService',
      priority: EventPriority.LOW,
      businessId: notification.businessId,
      payload: {
        notificationId
      }
    });
    
    console.log(`Marked notification as read: ${notificationId}`);
  }
  
  /**
   * Records a notification action.
   */
  async recordAction(notificationId: string, action: string, actionData: any): Promise<void> {
    const notification = await this.db.notifications.findOne({ id: notificationId });
    
    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }
    
    // Publish notification action event
    await this.eventSystem.publish({
      type: EventType.NOTIFICATION_ACTION_TAKEN,
      source: 'NotificationService',
      priority: EventPriority.MEDIUM,
      businessId: notification.businessId,
      payload: {
        notificationId,
        action,
        actionData
      }
    });
    
    console.log(`Recorded notification action: ${action} for notification: ${notificationId}`);
  }
  
  /**
   * Retrieves unread notifications for a business.
   */
  async getUnreadNotifications(businessId: string): Promise<Notification[]> {
    return this.db.notifications.find({
      businessId,
      read: false
    }).toArray();
  }
  
  /**
   * Retrieves recent notifications for a business.
   */
  async getRecentNotifications(businessId: string, limit: number = 10): Promise<Notification[]> {
    return this.db.notifications.find({
      businessId
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  }
  
  /**
   * Applies a template with data.
   */
  private applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }
  
  /**
   * Generates a unique ID for a notification.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Maps notification priority to event priority.
   */
  private mapPriorityToEventPriority(priority: NotificationPriority): EventPriority {
    switch (priority) {
      case NotificationPriority.URGENT:
        return EventPriority.CRITICAL;
      case NotificationPriority.HIGH:
        return EventPriority.HIGH;
      case NotificationPriority.MEDIUM:
        return EventPriority.MEDIUM;
      default:
        return EventPriority.LOW;
    }
  }
} 