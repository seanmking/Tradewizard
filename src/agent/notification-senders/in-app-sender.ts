import { Notification, NotificationChannel } from '../notification-service';
import { Database } from '../../database/connection';

/**
 * The InAppNotificationSender delivers notifications to the user's in-app notification center.
 */
export class InAppNotificationSender {
  private db: Database;
  
  constructor(db: Database) {
    this.db = db;
  }
  
  /**
   * Sends a notification to the in-app notification center.
   */
  async sendNotification(notification: Notification): Promise<void> {
    // Skip if in-app channel is not enabled for this notification
    if (!notification.channels.includes(NotificationChannel.IN_APP)) {
      return;
    }
    
    try {
      // Store the notification in the notifications collection
      await this.db.notifications.insertOne({
        ...notification,
        deliveredAt: new Date(),
        status: 'DELIVERED'
      });
      
      console.log(`In-app notification delivered: ${notification.title}`);
      
      // Publish a websocket event (in a real implementation)
      this.publishWebSocketEvent(notification);
    } catch (error) {
      console.error(`Error delivering in-app notification: ${error.message}`);
    }
  }
  
  /**
   * Gets unread in-app notifications for a business.
   */
  async getUnreadNotifications(businessId: string): Promise<Notification[]> {
    return this.db.notifications
      .find({ 
        businessId, 
        read: false,
        channels: NotificationChannel.IN_APP
      })
      .sort({ createdAt: -1 })
      .toArray();
  }
  
  /**
   * Gets all in-app notifications for a business.
   */
  async getAllNotifications(businessId: string, limit: number = 50): Promise<Notification[]> {
    return this.db.notifications
      .find({ 
        businessId,
        channels: NotificationChannel.IN_APP
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
  
  /**
   * Marks an in-app notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.db.notifications.updateOne(
      { id: notificationId },
      { $set: { read: true, readAt: new Date() } }
    );
  }
  
  /**
   * Marks all in-app notifications for a business as read.
   */
  async markAllAsRead(businessId: string): Promise<void> {
    // Since our mock database doesn't support updateMany, we'll use a workaround
    const unreadNotifications = await this.db.notifications
      .find({ businessId, read: false })
      .toArray();
    
    const now = new Date();
    
    // Update each notification individually
    for (const notification of unreadNotifications) {
      await this.db.notifications.updateOne(
        { id: notification.id },
        { $set: { read: true, readAt: now } }
      );
    }
    
    console.log(`Marked ${unreadNotifications.length} notifications as read for business ${businessId}`);
  }
  
  /**
   * Deletes an in-app notification.
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.db.notifications.deleteOne({ id: notificationId });
  }
  
  /**
   * Publishes a websocket event for real-time notification delivery.
   * This is a mock implementation - in a real system, this would use a websocket server.
   */
  private publishWebSocketEvent(notification: Notification): void {
    console.log(`[MOCK WEBSOCKET] Publishing notification to business ${notification.businessId}`);
    // In a real implementation, this would send the notification to connected clients
  }
} 