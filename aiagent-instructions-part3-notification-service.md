# Notification Service Implementation

The Notification Service manages communication with users, delivering timely and relevant information about events, opportunities, and required actions.

## Implementation Steps

### 1. Define Notification Types

Create `src/agent/notification-service.ts` with the following notification type definitions:

```typescript
import { Database } from '../database/connection';
import { EventSystem, EventType, EventPriority } from './event-system';

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS'
}

export interface NotificationAction {
  label: string;
  action: string;
  data: any;
}

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

export interface NotificationTemplate {
  type: string;
  titleTemplate: string;
  messageTemplate: string;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  defaultActions?: NotificationAction[];
}
```

### 2. Implement Notification Service Class

Add the following implementation to the same file:

```typescript
export class NotificationService {
  private db: Database;
  private eventSystem: EventSystem;
  private templates: Map<string, NotificationTemplate> = new Map();
  
  constructor(db: Database, eventSystem: EventSystem) {
    this.db = db;
    this.eventSystem = eventSystem;
    this.initializeTemplates();
  }
  
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
  
  registerTemplate(template: NotificationTemplate): void {
    this.templates.set(template.type, template);
  }
  
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
    
    // Return the notification ID
    return notification.id;
  }
  
  async notifyFromTemplate(
    businessId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      priority: NotificationPriority;
      actions?: NotificationAction[];
    }
  ): Promise<string> {
    // Create full notification
    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      businessId,
      channels: [NotificationChannel.IN_APP],
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
    
    // Return the notification ID
    return fullNotification.id;
  }
  
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
  }
  
  async getUnreadNotifications(businessId: string): Promise<Notification[]> {
    return this.db.notifications.find({
      businessId,
      read: false
    }).toArray();
  }
  
  async getRecentNotifications(businessId: string, limit: number = 10): Promise<Notification[]> {
    return this.db.notifications.find({
      businessId
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  }
  
  private applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }
  
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
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
```

### 3. Create Database Indexes

Add the following to `src/database/setup.ts` to create indexes for efficient notification retrieval:

```typescript
// Create indexes for notifications
await db.notifications.createIndex({ businessId: 1 });
await db.notifications.createIndex({ read: 1 });
await db.notifications.createIndex({ createdAt: -1 });
await db.notifications.createIndex({ 'channels': 1 });
await db.notifications.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

### 4. Implement Email Notification Sender

Create `src/agent/notification-senders/email-sender.ts` for sending email notifications:

```typescript
import { Notification, NotificationChannel } from '../notification-service';
import { EmailService } from '../../services/email-service';

export class EmailNotificationSender {
  private emailService: EmailService;
  
  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }
  
  async sendNotification(notification: Notification, businessEmail: string): Promise<void> {
    // Skip if email channel is not enabled for this notification
    if (!notification.channels.includes(NotificationChannel.EMAIL)) {
      return;
    }
    
    try {
      await this.emailService.sendEmail({
        to: businessEmail,
        subject: notification.title,
        body: this.formatEmailBody(notification),
        priority: this.mapPriorityToEmailPriority(notification.priority)
      });
      
      console.log(`Email notification sent to ${businessEmail}: ${notification.title}`);
    } catch (error) {
      console.error(`Error sending email notification: ${error.message}`);
      // Consider retrying or logging the failure
    }
  }
  
  private formatEmailBody(notification: Notification): string {
    // Create HTML email body with notification content
    let body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">${notification.title}</h2>
        <p style="font-size: 16px; color: #34495e;">${notification.message}</p>
    `;
    
    // Add actions as buttons if available
    if (notification.actions && notification.actions.length > 0) {
      body += `<div style="margin-top: 20px;">`;
      
      for (const action of notification.actions) {
        body += `
          <a href="${this.generateActionUrl(notification, action)}" 
             style="display: inline-block; margin-right: 10px; padding: 10px 15px; 
                    background-color: #3498db; color: white; text-decoration: none; 
                    border-radius: 4px;">
            ${action.label}
          </a>
        `;
      }
      
      body += `</div>`;
    }
    
    body += `
        <p style="margin-top: 30px; font-size: 14px; color: #7f8c8d;">
          This is an automated notification from TradeWizard. 
          You can manage your notification preferences in your account settings.
        </p>
      </div>
    `;
    
    return body;
  }
  
  private generateActionUrl(notification: Notification, action: any): string {
    // Generate URL for action button
    const baseUrl = process.env.APP_URL || 'https://tradewizard.com';
    const params = new URLSearchParams({
      businessId: notification.businessId,
      notificationId: notification.id,
      action: action.action,
      ...action.data
    });
    
    return `${baseUrl}/notifications/action?${params.toString()}`;
  }
  
  private mapPriorityToEmailPriority(priority: string): string {
    switch (priority) {
      case 'URGENT':
        return 'high';
      case 'HIGH':
        return 'high';
      default:
        return 'normal';
    }
  }
}
```

### 5. Register Notification Handlers

Add the following to `src/agent/index.ts` to set up notification handling:

```typescript
// Set up notification handlers
const emailSender = new EmailNotificationSender(emailService);

// Subscribe to notification events
eventSystem.subscribe(EventType.NOTIFICATION_CREATED, async (event) => {
  const { notification } = event.payload;
  const businessId = notification.businessId;
  
  // Get business email
  const business = await stateManager.getBusinessState(businessId);
  const businessEmail = business.profile.email;
  
  if (businessEmail && notification.channels.includes(NotificationChannel.EMAIL)) {
    await emailSender.sendNotification(notification, businessEmail);
  }
});
``` 