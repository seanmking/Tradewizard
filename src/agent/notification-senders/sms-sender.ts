import { Notification, NotificationChannel } from '../notification-service';

/**
 * Simple SMS service interface.
 */
interface SmsService {
  sendSms(options: {
    to: string;
    message: string;
    priority: string;
  }): Promise<void>;
}

/**
 * Mock SMS service implementation for demonstration.
 */
export class MockSmsService implements SmsService {
  async sendSms(options: {
    to: string;
    message: string;
    priority: string;
  }): Promise<void> {
    console.log(`[MOCK SMS] Sending SMS to ${options.to}`);
    console.log(`[MOCK SMS] Priority: ${options.priority}`);
    console.log(`[MOCK SMS] Message: ${options.message.substring(0, 100)}...`);
  }
}

/**
 * The SmsNotificationSender sends SMS notifications to users.
 */
export class SmsNotificationSender {
  private smsService: SmsService;
  
  constructor(smsService: SmsService) {
    this.smsService = smsService;
  }
  
  /**
   * Sends a notification via SMS.
   */
  async sendNotification(notification: Notification, phoneNumber: string): Promise<void> {
    // Skip if SMS channel is not enabled for this notification
    if (!notification.channels.includes(NotificationChannel.SMS)) {
      return;
    }
    
    try {
      await this.smsService.sendSms({
        to: phoneNumber,
        message: this.formatSmsMessage(notification),
        priority: this.mapPriorityToSmsPriority(notification.priority)
      });
      
      console.log(`SMS notification sent to ${phoneNumber}: ${notification.title}`);
    } catch (error) {
      console.error(`Error sending SMS notification: ${error.message}`);
      // Consider retrying or logging the failure
    }
  }
  
  /**
   * Formats the notification as an SMS message.
   */
  private formatSmsMessage(notification: Notification): string {
    // Create SMS message with notification content
    let message = `TradeWizard: ${notification.title}\n\n${notification.message}`;
    
    // Add action information if available
    if (notification.actions && notification.actions.length > 0) {
      message += `\n\nActions:`;
      
      for (const action of notification.actions) {
        message += `\n- ${action.label}: ${this.generateActionUrl(notification, action)}`;
      }
    }
    
    return message;
  }
  
  /**
   * Generates a URL for an action.
   */
  private generateActionUrl(notification: Notification, action: any): string {
    // Generate URL for action
    const baseUrl = process.env.APP_URL || 'https://tradewizard.com';
    const params = new URLSearchParams({
      businessId: notification.businessId,
      notificationId: notification.id,
      action: action.action,
      ...action.data
    });
    
    return `${baseUrl}/notifications/action?${params.toString()}`;
  }
  
  /**
   * Maps notification priority to SMS priority.
   */
  private mapPriorityToSmsPriority(priority: string): string {
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