import { Database } from '../../database/connection';
import { StreamlinedEventSystem, EventPriority } from '../streamlined-event-system';
import { StreamlinedStateManager } from '../streamlined-state-manager';
import { StreamlinedNotificationService } from '../streamlined-notification-service';
import { CoreEventType } from '../../types/streamlined-state';

/**
 * The CertificationMonitor tracks expiration of essential documents and certifications.
 */
export class CertificationMonitor {
  private db: Database;
  private eventSystem: StreamlinedEventSystem;
  private stateManager: StreamlinedStateManager;
  private notificationService: StreamlinedNotificationService;
  
  // Notification thresholds in days
  private readonly EXPIRY_THRESHOLDS = [90, 60, 30, 14, 7];
  
  constructor(
    db: Database,
    eventSystem: StreamlinedEventSystem,
    stateManager: StreamlinedStateManager,
    notificationService: StreamlinedNotificationService
  ) {
    this.db = db;
    this.eventSystem = eventSystem;
    this.stateManager = stateManager;
    this.notificationService = notificationService;
  }
  
  /**
   * Initializes the certification monitor.
   */
  async initialize(): Promise<void> {
    console.log('Certification Monitor initialized');
  }
  
  /**
   * Checks for expiring certifications for all businesses.
   * This should be run on a daily schedule.
   */
  async checkExpiringCertifications(): Promise<void> {
    // Get all business IDs
    const businessIds = await this.stateManager.getAllBusinessIds();
    
    // Check each business
    for (const businessId of businessIds) {
      await this.checkBusinessCertifications(businessId);
    }
  }
  
  /**
   * Checks for expiring certifications for a specific business.
   */
  async checkBusinessCertifications(businessId: string): Promise<void> {
    // Get business state
    const business = await this.stateManager.getBusinessState(businessId);
    
    // Check each certification
    for (const certification of business.profile.certifications) {
      // Skip if not active
      if (certification.status !== 'ACTIVE') {
        continue;
      }
      
      // Calculate days until expiry
      const daysUntilExpiry = this.calculateDaysUntilExpiry(certification.expiryDate);
      
      // Check if we need to notify
      const thresholdReached = this.EXPIRY_THRESHOLDS.find(threshold => 
        daysUntilExpiry <= threshold
      );
      
      if (thresholdReached) {
        // Check if we've already notified for this threshold
        const alreadyNotified = await this.hasNotifiedForThreshold(
          businessId, 
          certification.id, 
          thresholdReached
        );
        
        if (!alreadyNotified) {
          await this.notifyExpiringCertification(
            businessId, 
            certification, 
            daysUntilExpiry
          );
          
          // Record notification
          await this.recordNotification(
            businessId, 
            certification.id, 
            thresholdReached
          );
          
          // If expired or about to expire, update status
          if (daysUntilExpiry <= 0) {
            await this.stateManager.updateCertificationStatus(
              businessId,
              certification.id,
              'EXPIRED'
            );
          }
        }
      }
    }
  }
  
  /**
   * Notifies about an expiring certification.
   */
  private async notifyExpiringCertification(
    businessId: string,
    certification: {
      id: string;
      name: string;
      expiryDate: Date;
    },
    daysUntilExpiry: number
  ): Promise<void> {
    // Publish event
    await this.eventSystem.publish({
      type: CoreEventType.CERTIFICATION_EXPIRING,
      source: 'CertificationMonitor',
      priority: daysUntilExpiry <= 7 ? EventPriority.HIGH : EventPriority.MEDIUM,
      businessId,
      payload: {
        certificationId: certification.id,
        name: certification.name,
        expiryDate: certification.expiryDate,
        daysUntilExpiry
      }
    });
    
    // Send notification
    await this.notificationService.notify(
      businessId,
      'CERTIFICATION_EXPIRATION',
      {
        id: certification.id,
        name: certification.name,
        expiryDate: certification.expiryDate.toLocaleDateString(),
        daysRemaining: daysUntilExpiry
      },
      {
        priority: daysUntilExpiry <= 7 ? 'HIGH' : 'MEDIUM'
      }
    );
  }
  
  /**
   * Calculates days until expiry.
   */
  private calculateDaysUntilExpiry(expiryDate: Date): number {
    const now = new Date();
    const expiryTime = new Date(expiryDate).getTime();
    const diffTime = expiryTime - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Checks if we've already notified for a threshold.
   */
  private async hasNotifiedForThreshold(
    businessId: string,
    certificationId: string,
    threshold: number
  ): Promise<boolean> {
    const record = await this.db.certificationNotifications.findOne({
      businessId,
      certificationId,
      threshold
    });
    
    return !!record;
  }
  
  /**
   * Records a notification for a threshold.
   */
  private async recordNotification(
    businessId: string,
    certificationId: string,
    threshold: number
  ): Promise<void> {
    await this.db.certificationNotifications.insertOne({
      businessId,
      certificationId,
      threshold,
      notifiedAt: new Date()
    });
  }
} 