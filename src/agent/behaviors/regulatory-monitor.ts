import { Database } from '../../database/connection';
import { StreamlinedEventSystem, EventPriority, Event } from '../streamlined-event-system';
import { StreamlinedStateManager } from '../streamlined-state-manager';
import { StreamlinedNotificationService } from '../streamlined-notification-service';
import { StreamlinedRequirement, CoreEventType } from '../../types/streamlined-state';

/**
 * The RegulatoryMonitor monitors essential regulatory requirements for selected markets.
 */
export class RegulatoryMonitor {
  private db: Database;
  private eventSystem: StreamlinedEventSystem;
  private stateManager: StreamlinedStateManager;
  private notificationService: StreamlinedNotificationService;
  
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
   * Initializes the regulatory monitor.
   */
  async initialize(): Promise<void> {
    // Subscribe to market selection events
    this.eventSystem.subscribe(
      CoreEventType.MARKET_SELECTED,
      this.handleMarketSelected.bind(this)
    );
    
    console.log('Regulatory Monitor initialized');
  }
  
  /**
   * Handles market selection events.
   */
  private async handleMarketSelected(event: Event): Promise<void> {
    if (!event.businessId || !event.payload.country) {
      return;
    }
    
    const businessId = event.businessId;
    const country = event.payload.country;
    
    // Check for regulatory requirements for the selected market
    await this.checkRegulatoryRequirements(businessId, country);
  }
  
  /**
   * Checks regulatory requirements for a market.
   */
  async checkRegulatoryRequirements(
    businessId: string,
    country: string
  ): Promise<void> {
    // Get business state
    const business = await this.stateManager.getBusinessState(businessId);
    
    // Get regulatory requirements for the market
    const requirements = await this.getMarketRequirements(country, business.profile.industry);
    
    // Notify about each requirement
    for (const requirement of requirements) {
      await this.eventSystem.publish({
        type: CoreEventType.REGULATORY_REQUIREMENT_DETECTED,
        source: 'RegulatoryMonitor',
        priority: EventPriority.HIGH,
        businessId,
        payload: {
          requirement,
          market: country
        }
      });
      
      // Send notification
      await this.notificationService.notify(
        businessId,
        'REGULATORY_REQUIREMENT',
        {
          id: requirement.id,
          name: requirement.name,
          market: country,
          processingTime: requirement.processingTime
        }
      );
    }
    
    // Update market status to RESEARCHING
    await this.stateManager.updateTargetMarketStatus(
      businessId,
      country,
      'RESEARCHING'
    );
  }
  
  /**
   * Gets regulatory requirements for a market and industry.
   */
  private async getMarketRequirements(
    country: string,
    industry: string
  ): Promise<StreamlinedRequirement[]> {
    // In a real implementation, this would query an external API or database
    // For now, we'll return mock data
    return [
      {
        id: this.generateId(),
        market: country,
        name: `${country} Import License`,
        description: `Required for all businesses importing goods into ${country}.`,
        issuingAuthority: {
          name: `${country} Trade Authority`,
          website: `https://trade.${country.toLowerCase()}.gov`,
          contactInfo: `info@trade.${country.toLowerCase()}.gov`
        },
        processingTime: 30, // days
        estimatedCost: {
          amount: 500,
          currency: 'USD'
        },
        prerequisiteIds: [],
        isMandatory: true
      },
      {
        id: this.generateId(),
        market: country,
        name: `${industry} Certification`,
        description: `Required for all ${industry} products sold in ${country}.`,
        issuingAuthority: {
          name: `${country} Standards Authority`,
          website: `https://standards.${country.toLowerCase()}.gov`
        },
        processingTime: 45, // days
        estimatedCost: {
          amount: 750,
          currency: 'USD'
        },
        prerequisiteIds: [],
        isMandatory: true
      },
      {
        id: this.generateId(),
        market: country,
        name: 'Product Registration',
        description: `Register your products in the ${country} product database.`,
        issuingAuthority: {
          name: `${country} Product Registry`,
          website: `https://registry.${country.toLowerCase()}.gov`
        },
        processingTime: 15, // days
        estimatedCost: {
          amount: 250,
          currency: 'USD'
        },
        prerequisiteIds: [],
        isMandatory: true
      }
    ];
  }
  
  /**
   * Generates a unique ID.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
} 