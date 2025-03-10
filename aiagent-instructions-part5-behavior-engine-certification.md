# Behavior Engine - Certification Monitor Implementation

The Certification Monitor tracks certification expirations and sends timely reminders to businesses, ensuring they maintain compliance with required certifications.

## Implementation Steps

### 1. Create Certification Monitor Class

Create `src/agent/behaviors/certification-monitor.ts` with the following implementation:

```typescript
import { Database } from '../../database/connection';
import { EventSystem, EventType, EventPriority } from '../event-system';
import { StateManager } from '../state-manager';
import { NotificationService, NotificationPriority } from '../notification-service';
import { Scheduler } from '../scheduler';
import { Certification } from '../../types/state';

export interface ExpiringCertification {
  certification: Certification;
  daysUntilExpiry: number;
}

export class CertificationMonitor {
  private db: Database;
  private eventSystem: EventSystem;
  private stateManager: StateManager;
  private notificationService: NotificationService;
  private scheduler: Scheduler;
  
  constructor(
    db: Database,
    eventSystem: EventSystem,
    stateManager: StateManager,
    notificationService: NotificationService,
    scheduler: Scheduler
  ) {
    this.db = db;
    this.eventSystem = eventSystem;
    this.stateManager = stateManager;
    this.notificationService = notificationService;
    this.scheduler = scheduler;
    
    // Register for events
    this.eventSystem.subscribe(
      EventType.CERTIFICATION_EXPIRING, 
      this.handleCertificationExpiring.bind(this)
    );
  }
  
  async initialize(): Promise<void> {
    // Register job handler for certification checks
    this.scheduler.registerJobHandler(
      'CERTIFICATION_CHECK', 
      this.checkExpiringCertifications.bind(this)
    );
    
    // Schedule daily certification check (9 AM)
    await this.scheduler.scheduleJob({
      cronExpression: '09:00',
      jobType: 'CERTIFICATION_CHECK'
    });
  }
  
  async checkExpiringCertifications(): Promise<void> {
    console.log('Checking for expiring certifications...');
    
    try {
      // Get all business IDs
      const businessIds = await this.stateManager.getAllBusinessIds();
      
      console.log(`Checking certifications for ${businessIds.length} businesses`);
      
      // Check each business
      for (const businessId of businessIds) {
        await this.checkBusinessCertifications(businessId);
      }
    } catch (error) {
      console.error(`Error checking for expiring certifications: ${error.message}`);
    }
  }
  
  private async checkBusinessCertifications(businessId: string): Promise<void> {
    // Get business state
    const business = await this.stateManager.getBusinessState(businessId);
    
    // Skip if no certifications
    if (!business.profile.certifications || business.profile.certifications.length === 0) {
      return;
    }
    
    // Find expiring certifications
    const expiringCertifications = this.findExpiringCertifications(business.profile.certifications);
    
    if (expiringCertifications.length === 0) {
      return;
    }
    
    console.log(`Found ${expiringCertifications.length} expiring certifications for business ${businessId}`);
    
    // Process each expiring certification
    for (const expiringCert of expiringCertifications) {
      await this.processCertificationExpiration(businessId, expiringCert);
    }
  }
  
  private findExpiringCertifications(certifications: Certification[]): ExpiringCertification[] {
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    
    return certifications
      .filter(cert => 
        cert.status === 'ACTIVE' && 
        cert.expiryDate && 
        new Date(cert.expiryDate) <= sixtyDaysFromNow
      )
      .map(cert => ({
        certification: cert,
        daysUntilExpiry: Math.floor(
          (new Date(cert.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
      }))
      .filter(expiring => expiring.daysUntilExpiry >= 0); // Only include non-expired certifications
  }
  
  private async processCertificationExpiration(
    businessId: string, 
    expiringCert: ExpiringCertification
  ): Promise<void> {
    // Get business state
    const business = await this.stateManager.getBusinessState(businessId);
    
    // Check if we've already notified about this expiration
    const existingTrigger = (business.temporalTriggers.certificationExpirations || [])
      .find(exp => 
        exp.certificationType === expiringCert.certification.type &&
        exp.expiryDate.getTime() === expiringCert.certification.expiryDate.getTime()
      );
      
    // Determine if we should send a notification
    const shouldNotify = this.shouldSendNotification(
      expiringCert.daysUntilExpiry, 
      existingTrigger?.notifiedAt
    );
    
    if (!shouldNotify) {
      return;
    }
    
    // Update temporal triggers
    await this.updateTemporalTriggers(businessId, business, expiringCert);
    
    // Publish certification expiring event
    await this.eventSystem.publish({
      type: EventType.CERTIFICATION_EXPIRING,
      source: 'CertificationMonitor',
      priority: this.determinePriority(expiringCert.daysUntilExpiry),
      businessId,
      payload: {
        certification: expiringCert.certification,
        daysUntilExpiry: expiringCert.daysUntilExpiry
      }
    });
  }
  
  private async handleCertificationExpiring(event: any): Promise<void> {
    const { certification, daysUntilExpiry } = event.payload;
    const businessId = event.businessId;
    
    // Send notification
    await this.notificationService.notify(
      businessId,
      'CERTIFICATION_EXPIRATION',
      {
        certName: certification.name,
        daysRemaining: daysUntilExpiry,
        certId: certification.id
      },
      {
        priority: this.mapPriorityToNotificationPriority(
          this.determinePriority(daysUntilExpiry)
        )
      }
    );
  }
  
  private async updateTemporalTriggers(
    businessId: string, 
    business: any, 
    expiringCert: ExpiringCertification
  ): Promise<void> {
    // Filter out existing trigger for this certification
    const existingTriggers = (business.temporalTriggers.certificationExpirations || [])
      .filter(exp => 
        exp.certificationType !== expiringCert.certification.type ||
        exp.expiryDate.getTime() !== expiringCert.certification.expiryDate.getTime()
      );
    
    // Add new trigger
    const newTriggers = [
      ...existingTriggers,
      {
        certificationType: expiringCert.certification.type,
        expiryDate: expiringCert.certification.expiryDate,
        notifiedAt: new Date(),
        status: 'NOTIFIED'
      }
    ];
    
    // Update business state
    await this.stateManager.updateBusinessState(businessId, {
      'temporalTriggers.certificationExpirations': newTriggers
    });
  }
  
  private shouldSendNotification(daysUntilExpiry: number, lastNotifiedAt?: Date): boolean {
    // If never notified, send notification
    if (!lastNotifiedAt) {
      return true;
    }
    
    // Calculate days since last notification
    const daysSinceLastNotification = Math.floor(
      (new Date().getTime() - new Date(lastNotifiedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Notification schedule:
    // - First notification at 60 days
    // - Reminders at 30, 14, 7, 3, and 1 days
    const reminderDays = [60, 30, 14, 7, 3, 1];
    
    // Check if today is a reminder day and we haven't notified in the last day
    return reminderDays.includes(daysUntilExpiry) && daysSinceLastNotification >= 1;
  }
  
  private determinePriority(daysUntilExpiry: number): EventPriority {
    if (daysUntilExpiry <= 7) {
      return EventPriority.HIGH;
    } else if (daysUntilExpiry <= 30) {
      return EventPriority.MEDIUM;
    } else {
      return EventPriority.LOW;
    }
  }
  
  private mapPriorityToNotificationPriority(priority: EventPriority): NotificationPriority {
    switch (priority) {
      case EventPriority.CRITICAL:
        return NotificationPriority.URGENT;
      case EventPriority.HIGH:
        return NotificationPriority.HIGH;
      case EventPriority.MEDIUM:
        return NotificationPriority.MEDIUM;
      default:
        return NotificationPriority.LOW;
    }
  }
}
```

### 2. Update Behavior Engine

Update `src/agent/behaviors/index.ts` to include the Certification Monitor:

```typescript
import { Database } from '../../database/connection';
import { EventSystem } from '../event-system';
import { StateManager } from '../state-manager';
import { NotificationService } from '../notification-service';
import { Scheduler } from '../scheduler';
import { RegulatoryMonitor } from './regulatory-monitor';
import { CertificationMonitor } from './certification-monitor';

export class BehaviorEngine {
  public regulatoryMonitor: RegulatoryMonitor;
  public certificationMonitor: CertificationMonitor;
  // Other monitors will be added here
  
  constructor(
    db: Database,
    eventSystem: EventSystem,
    stateManager: StateManager,
    notificationService: NotificationService,
    scheduler: Scheduler
  ) {
    // Initialize monitors
    this.regulatoryMonitor = new RegulatoryMonitor(
      db,
      eventSystem,
      stateManager,
      notificationService,
      scheduler
    );
    
    this.certificationMonitor = new CertificationMonitor(
      db,
      eventSystem,
      stateManager,
      notificationService,
      scheduler
    );
  }
  
  async initialize(): Promise<void> {
    // Initialize all monitors
    await this.regulatoryMonitor.initialize();
    await this.certificationMonitor.initialize();
  }
}
``` 