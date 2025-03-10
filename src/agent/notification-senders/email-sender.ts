import { Notification, NotificationChannel } from '../notification-service';

/**
 * Simple email service interface.
 */
interface EmailService {
  sendEmail(options: {
    to: string;
    subject: string;
    body: string;
    priority: string;
  }): Promise<void>;
}

/**
 * Mock email service implementation for demonstration.
 */
export class MockEmailService implements EmailService {
  async sendEmail(options: {
    to: string;
    subject: string;
    body: string;
    priority: string;
  }): Promise<void> {
    console.log(`[MOCK EMAIL] Sending email to ${options.to}`);
    console.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    console.log(`[MOCK EMAIL] Priority: ${options.priority}`);
    console.log(`[MOCK EMAIL] Body: ${options.body.substring(0, 100)}...`);
  }
}

/**
 * The EmailNotificationSender sends email notifications to users.
 */
export class EmailNotificationSender {
  private emailService: EmailService;
  
  constructor(emailService: EmailService) {
    this.emailService = emailService;
  }
  
  /**
   * Sends a notification via email.
   */
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
  
  /**
   * Formats the notification as an HTML email.
   */
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
  
  /**
   * Generates a URL for an action button.
   */
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
  
  /**
   * Maps notification priority to email priority.
   */
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