import { Database } from '../database/connection';
import { StreamlinedEventSystem, EventPriority, Event } from './streamlined-event-system';
import { ActionNotification, CoreEventType } from '../types/streamlined-state';

/**
 * Notification delivery channels.
 */
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL'
}

/**
 * Notification template interface.
 */
interface NotificationTemplate {
  type: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  defaultChannels: NotificationChannel[];
  defaultActions?: Array<{
    label: string;
    action: string;
    data: any;
  }>;
}

/**
 * The StreamlinedNotificationService manages communication with users, delivering timely
 * and action-oriented notifications with clear next steps.
 */
export class StreamlinedNotificationService {
  private db: Database;
  private eventSystem: StreamlinedEventSystem;
  private templates: Map<string, NotificationTemplate> = new Map();
  
  constructor(db: Database, eventSystem: StreamlinedEventSystem) {
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
      type: 'REGULATORY_REQUIREMENT',
      titleTemplate: 'Required: {{name}} for {{market}}',
      messageTemplate: 'You need to obtain {{name}} to export to {{market}}. Processing time: {{processingTime}} days.',
      defaultPriority: 'HIGH',
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      defaultActions: [
        { 
          label: 'View Details', 
          action: 'VIEW_REQUIREMENT', 
          data: { requirementId: '{{id}}' } 
        },
        { 
          label: 'Mark as Completed', 
          action: 'COMPLETE_REQUIREMENT', 
          data: { requirementId: '{{id}}' } 
        }
      ]
    });
    
    this.registerTemplate({
      type: 'CERTIFICATION_EXPIRATION',
      titleTemplate: '{{name}} Expiring Soon',
      messageTemplate: 'Your {{name}} certification will expire on {{expiryDate}}.',
      defaultPriority: 'HIGH',
      defaultChannels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      defaultActions: [
        { 
          label: 'Renewal Information', 
          action: 'VIEW_CERTIFICATION_RENEWAL', 
          data: { certId: '{{id}}' } 
        },
        { 
          label: 'Mark as Renewed', 
          action: 'UPDATE_CERTIFICATION', 
          data: { certId: '{{id}}' } 
        }
      ]
    });
    
    this.registerTemplate({
      type: 'MARKET_REPORT_READY',
      titleTemplate: 'Market Report for {{country}} Ready',
      messageTemplate: 'Your market report for {{country}} is now available. Market size: ${{marketSize}} million.',
      defaultPriority: 'MEDIUM',
      defaultChannels: [NotificationChannel.IN_APP],
      defaultActions: [
        { 
          label: 'View Report', 
          action: 'VIEW_MARKET_REPORT', 
          data: { country: '{{country}}' } 
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
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      channels?: NotificationChannel[];
      actions?: Array<{
        label: string;
        action: string;
        data: any;
      }>;
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
    const notification: ActionNotification = {
      id: this.generateId(),
      businessId,
      title,
      message,
      priority: options?.priority || template.defaultPriority,
      actions: processedActions,
      read: false,
      createdAt: new Date()
    };
    
    // Store notification
    await this.db.notifications.insertOne(notification);
    
    // Publish notification event
    await this.eventSystem.publish({
      type: CoreEventType.NOTIFICATION_CREATED,
      source: 'NotificationService',
      priority: this.mapPriorityToEventPriority(notification.priority),
      businessId,
      payload: {
        notification
      }
    });
    
    console.log(`Created notification: ${notification.id} (${type}) for business: ${businessId}`);
    
    // Return the notification ID
    return notification.id;
  }
  
  /**
   * Sends a custom notification without using a template.
   */
  async notifyCustom(
    businessId: string,
    notification: {
      title: string;
      message: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      actions?: Array<{
        label: string;
        action: string;
        data: any;
      }>;
    }
  ): Promise<string> {
    // Create full notification
    const fullNotification: ActionNotification = {
      id: this.generateId(),
      businessId,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      actions: notification.actions || [],
      read: false,
      createdAt: new Date()
    };
    
    // Store notification
    await this.db.notifications.insertOne(fullNotification);
    
    // Publish notification event
    await this.eventSystem.publish({
      type: CoreEventType.NOTIFICATION_CREATED,
      source: 'NotificationService',
      priority: this.mapPriorityToEventPriority(fullNotification.priority),
      businessId,
      payload: {
        notification: fullNotification
      }
    });
    
    console.log(`Created custom notification: ${fullNotification.id} for business: ${businessId}`);
    
    // Return the notification ID
    return fullNotification.id;
  }
  
  /**
   * Marks a notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.db.notifications.updateOne(
      { id: notificationId },
      { $set: { read: true } }
    );
  }
  
  /**
   * Records a notification action taken by the user.
   */
  async recordAction(
    notificationId: string, 
    action: string, 
    data: any
  ): Promise<void> {
    // Get the notification
    const notification = await this.db.notifications.findOne({ id: notificationId });
    
    if (!notification) {
      throw new Error(`Notification not found: ${notificationId}`);
    }
    
    // Publish action taken event
    await this.eventSystem.publish({
      type: CoreEventType.NOTIFICATION_ACTION_TAKEN,
      source: 'NotificationService',
      priority: EventPriority.MEDIUM,
      businessId: notification.businessId,
      payload: {
        notificationId,
        action,
        data
      }
    });
  }
  
  /**
   * Gets all notifications for a business.
   */
  async getNotifications(
    businessId: string, 
    options?: {
      unreadOnly?: boolean;
      limit?: number;
    }
  ): Promise<ActionNotification[]> {
    const query: any = { businessId };
    
    if (options?.unreadOnly) {
      query.read = false;
    }
    
    return this.db.notifications
      .find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .toArray();
  }
  
  /**
   * Applies a template string with data.
   */
  private applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedProperty(data, key.trim());
      return value !== undefined ? String(value) : match;
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
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * Maps notification priority to event priority.
   */
  private mapPriorityToEventPriority(priority: string): EventPriority {
    switch (priority) {
      case 'URGENT':
        return EventPriority.CRITICAL;
      case 'HIGH':
        return EventPriority.HIGH;
      case 'MEDIUM':
        return EventPriority.MEDIUM;
      default:
        return EventPriority.LOW;
    }
  }
  
  /**
   * Generates a unique ID for a notification.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
} 