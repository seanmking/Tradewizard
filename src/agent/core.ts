import { Database } from '../database/connection';
import { EventSystem, EventType, Event, EventPriority } from './event-system';
import { StateManager } from './state-manager';
import { NotificationService } from './notification-service';
import { MockEmailService, EmailNotificationSender } from './notification-senders/email-sender';
import { BusinessState } from '../types/state';
import { MCPClient } from './mcp-client';
import { MarketRecommendationBehavior } from './behaviors/market-recommendation-behavior';

/**
 * Agent request interface.
 */
export interface AgentRequest {
  businessId: string;
  userId?: string;
  type: string;
  data: any;
  metadata?: {
    source?: string;
    timestamp?: number;
    sessionId?: string;
    [key: string]: any;
  };
}

/**
 * Agent response interface.
 */
export interface AgentResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  notifications?: any[];
}

/**
 * The AgentCore class is the central component of the AI Agent layer.
 * It coordinates the various subsystems and handles requests.
 */
export class AgentCore {
  private db: Database;
  private eventSystem: EventSystem;
  private stateManager: StateManager;
  private notificationService: NotificationService;
  private emailSender: EmailNotificationSender;
  private mcpClient: MCPClient;
  private marketRecommendationBehavior: MarketRecommendationBehavior;
  private initialized: boolean = false;
  
  constructor(db: Database) {
    this.db = db;
    this.eventSystem = new EventSystem(db);
    this.stateManager = new StateManager(db);
    this.notificationService = new NotificationService(db, this.eventSystem);
    this.emailSender = new EmailNotificationSender(new MockEmailService());
    
    // Initialize MCP client
    this.mcpClient = new MCPClient();
    
    // Initialize behaviors that use MCP
    this.marketRecommendationBehavior = new MarketRecommendationBehavior(
      this.mcpClient,
      this.stateManager,
      this.notificationService
    );
  }
  
  /**
   * Initializes the agent core and all subsystems.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    console.log('Initializing Agent Core...');
    
    // Initialize subsystems
    await this.setupEventHandlers();
    
    // Subscribe to notification events
    this.eventSystem.subscribe(EventType.NOTIFICATION_CREATED, async (event: Event) => {
      const notification = event.payload.notification;
      if (!notification) return;
      
      // Get business state to retrieve email
      if (event.businessId) {
        const businessState = await this.stateManager.getBusinessState(event.businessId);
        // Using name as a fallback since email is not in the BusinessProfile interface
        // In a real implementation, you would add email to the BusinessProfile interface
        const contactEmail = businessState?.profile?.name + '@example.com';
        if (contactEmail) {
          await this.emailSender.sendNotification(notification, contactEmail);
        }
      }
    }, { priority: EventPriority.MEDIUM });
    
    this.initialized = true;
    console.log('Agent Core initialized successfully');
  }
  
  /**
   * Sets up event handlers for the agent.
   */
  private async setupEventHandlers(): Promise<void> {
    // Handle business profile updates
    this.eventSystem.subscribe(EventType.BUSINESS_PROFILE_UPDATED, async (event: Event) => {
      if (!event.businessId) return;
      
      const businessId = event.businessId;
      const updates = event.payload;
      
      // Update the business state
      await this.stateManager.updateBusinessState(businessId, {
        profile: updates
      });
      
      // Check if this is a significant update that requires notification
      if (this.isSignificantProfileUpdate(updates)) {
        await this.notificationService.notify(
          businessId,
          'PROFILE_UPDATE_CONFIRMATION',
          { profile: updates }
        );
      }
    }, { priority: EventPriority.MEDIUM });
    
    // Handle assessment completion
    this.eventSystem.subscribe(EventType.ASSESSMENT_COMPLETED, async (event: Event) => {
      if (!event.businessId) return;
      
      const businessId = event.businessId;
      const assessmentResults = event.payload.results;
      
      // Get current business state
      const businessState = await this.stateManager.getBusinessState(businessId);
      
      // Create a new completed step
      const newCompletedStep = {
        type: 'ASSESSMENT',
        completedAt: new Date(),
        score: assessmentResults?.overallScore || 0
      };
      
      // Update the business state with assessment results
      await this.stateManager.updateBusinessState(businessId, {
        exportJourney: {
          ...businessState.exportJourney,
          completedSteps: [...businessState.exportJourney.completedSteps, newCompletedStep]
        }
      });
      
      // Notify the user about completed assessment
      await this.notificationService.notify(
        businessId,
        'ASSESSMENT_COMPLETED',
        { results: assessmentResults }
      );
    }, { priority: EventPriority.MEDIUM });
    
    // Handle regulatory changes
    this.eventSystem.subscribe(EventType.REGULATORY_CHANGE_DETECTED, async (event: Event) => {
      if (!event.businessId) return;
      
      const businessId = event.businessId;
      const regulatoryChange = event.payload;
      
      // Notify the user about regulatory change
      await this.notificationService.notify(
        businessId,
        'REGULATORY_ALERT',
        { change: regulatoryChange }
      );
    }, { priority: EventPriority.HIGH });
    
    // Handle market opportunities
    this.eventSystem.subscribe(EventType.MARKET_OPPORTUNITY_DETECTED, async (event: Event) => {
      if (!event.businessId) return;
      
      const businessId = event.businessId;
      const opportunity = event.payload;
      
      // Get current business state
      const businessState = await this.stateManager.getBusinessState(businessId);
      
      // Using the opportunities field from ExportJourney
      const currentOpportunities = businessState.exportJourney.opportunities || [];
      
      // Update the business state with the new opportunity
      await this.stateManager.updateBusinessState(businessId, {
        exportJourney: {
          ...businessState.exportJourney,
          opportunities: [...currentOpportunities, opportunity]
        }
      });
      
      // Notify the user about the market opportunity
      await this.notificationService.notify(
        businessId,
        'MARKET_OPPORTUNITY',
        { opportunity }
      );
    }, { priority: EventPriority.MEDIUM });
  }
  
  /**
   * Determines if a profile update is significant enough to warrant a notification.
   */
  private isSignificantProfileUpdate(updates: Partial<BusinessState['profile']>): boolean {
    // Consider updates to key fields as significant
    const significantFields = [
      'industry', 
      'size', 
      'exportExperience'
    ];
    
    return Object.keys(updates).some(key => significantFields.includes(key));
  }
  
  /**
   * Handles a request to the agent.
   */
  async handleRequest(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Ensure the agent is initialized
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Process the request based on type
      switch (request.type) {
        case 'GET_BUSINESS_STATE':
          return this.handleGetBusinessState(request);
          
        case 'UPDATE_BUSINESS_PROFILE':
          return this.handleUpdateBusinessProfile(request);
          
        case 'COMPLETE_ASSESSMENT':
          return this.handleCompleteAssessment(request);
          
        case 'GET_RECOMMENDATIONS':
          return this.handleGetRecommendations(request);
          
        case 'GET_NOTIFICATIONS':
          return this.handleGetNotifications(request);
          
        default:
          return {
            success: false,
            error: `Unknown request type: ${request.type}`
          };
      }
    } catch (error: any) {
      console.error(`Error handling request: ${error.message}`);
      
      return {
        success: false,
        error: `Error processing request: ${error.message}`
      };
    }
  }
  
  /**
   * Handles a request to get the business state.
   */
  private async handleGetBusinessState(request: AgentRequest): Promise<AgentResponse> {
    const businessState = await this.stateManager.getBusinessState(request.businessId);
    
    return {
      success: true,
      data: { businessState }
    };
  }
  
  /**
   * Handles a request to update the business profile.
   */
  private async handleUpdateBusinessProfile(request: AgentRequest): Promise<AgentResponse> {
    const profileUpdates = request.data.profile;
    
    // Publish event for profile update
    await this.eventSystem.publish({
      type: EventType.BUSINESS_PROFILE_UPDATED,
      businessId: request.businessId,
      source: 'user',
      priority: EventPriority.MEDIUM,
      payload: profileUpdates
    });
    
    return {
      success: true,
      message: 'Business profile updated successfully'
    };
  }
  
  /**
   * Handles a request to complete an assessment.
   */
  private async handleCompleteAssessment(request: AgentRequest): Promise<AgentResponse> {
    const assessmentResults = request.data.results;
    
    // Publish event for assessment completion
    await this.eventSystem.publish({
      type: EventType.ASSESSMENT_COMPLETED,
      businessId: request.businessId,
      source: 'user',
      priority: EventPriority.MEDIUM,
      payload: {
        results: assessmentResults
      }
    });
    
    return {
      success: true,
      message: 'Assessment completed successfully'
    };
  }
  
  /**
   * Handles a request to get recommendations.
   */
  private async handleGetRecommendations(request: AgentRequest): Promise<AgentResponse> {
    try {
      // Get the recommendation type from the request
      const recommendationType = request.data?.type || 'MARKET';
      
      // Handle different recommendation types
      switch (recommendationType) {
        case 'MARKET':
          // Use the MarketRecommendationBehavior to get market recommendations
          const marketRecommendations = await this.marketRecommendationBehavior.generateMarketRecommendations(request.businessId);
          
          return {
            success: true,
            data: marketRecommendations
          };
          
        case 'CERTIFICATION':
          // In a real implementation, this would use a CertificationRecommendationBehavior
          // For now, return mock certification recommendations
          return {
            success: true,
            data: [
              {
                type: 'CERTIFICATION',
                title: 'Obtain ISO 9001 certification',
                description: 'This certification would improve your credibility in international markets and is often required by distributors in European countries.',
                confidence: 0.78
              },
              {
                type: 'CERTIFICATION',
                title: 'Consider Fair Trade certification',
                description: 'This would appeal to ethical consumers and open doors to specialty retailers focused on sustainable products.',
                confidence: 0.72
              }
            ]
          };
          
        default:
          return {
            success: false,
            error: `Unknown recommendation type: ${recommendationType}`
          };
      }
    } catch (error: any) {
      console.error(`Error getting recommendations: ${error.message}`);
      
      return {
        success: false,
        error: `Error getting recommendations: ${error.message}`
      };
    }
  }
  
  /**
   * Handles a request to get notifications.
   */
  private async handleGetNotifications(request: AgentRequest): Promise<AgentResponse> {
    const unreadOnly = request.data.unreadOnly || false;
    
    let notifications;
    if (unreadOnly) {
      notifications = await this.notificationService.getUnreadNotifications(request.businessId);
    } else {
      notifications = await this.notificationService.getRecentNotifications(request.businessId);
    }
    
    return {
      success: true,
      data: { notifications }
    };
  }
  
  /**
   * Gets the notification service.
   */
  getNotificationService(): NotificationService {
    return this.notificationService;
  }
  
  /**
   * Gets the state manager.
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }
  
  /**
   * Gets the event system.
   */
  getEventSystem(): EventSystem {
    return this.eventSystem;
  }
} 