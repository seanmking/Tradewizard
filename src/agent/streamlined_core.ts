import { Database } from '../database/connection';
import { StreamlinedEventSystem, EventPriority, Event } from './streamlined-event-system';
import { StreamlinedStateManager } from './streamlined-state-manager';
import { StreamlinedNotificationService } from './streamlined-notification-service';
import { PatternRecognition } from './memory/pattern-recognition';
import { RegulatoryMonitor } from './behaviors/regulatory-monitor';
import { CertificationMonitor } from './behaviors/certification-monitor';
import { TimelineGenerator } from './behaviors/timeline-generator';
import { MarketReportGenerator } from './behaviors/market-report-generator';
import { CoreEventType } from '../types/streamlined-state';

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
 * The StreamlinedAgentCore class is the central component of the AI Agent layer.
 * It coordinates the various subsystems and handles requests, focusing on essential business workflows.
 */
export class StreamlinedAgentCore {
  private db: Database;
  private eventSystem: StreamlinedEventSystem;
  private stateManager: StreamlinedStateManager;
  private notificationService: StreamlinedNotificationService;
  private patternRecognition: PatternRecognition;
  private regulatoryMonitor: RegulatoryMonitor;
  private certificationMonitor: CertificationMonitor;
  private timelineGenerator: TimelineGenerator;
  private marketReportGenerator: MarketReportGenerator;
  private initialized: boolean = false;
  
  constructor(db: Database) {
    this.db = db;
    this.eventSystem = new StreamlinedEventSystem(db);
    this.stateManager = new StreamlinedStateManager(db);
    this.notificationService = new StreamlinedNotificationService(db, this.eventSystem);
    this.patternRecognition = new PatternRecognition(db);
    this.regulatoryMonitor = new RegulatoryMonitor(
      db, 
      this.eventSystem, 
      this.stateManager, 
      this.notificationService
    );
    this.certificationMonitor = new CertificationMonitor(
      db, 
      this.eventSystem, 
      this.stateManager, 
      this.notificationService
    );
    this.timelineGenerator = new TimelineGenerator(
      db, 
      this.stateManager
    );
    this.marketReportGenerator = new MarketReportGenerator(
      db, 
      this.eventSystem, 
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
    
    console.log('Initializing Streamlined Agent Core...');
    
    // Initialize subsystems
    await this.patternRecognition.initialize();
    await this.regulatoryMonitor.initialize();
    await this.certificationMonitor.initialize();
    await this.timelineGenerator.initialize();
    await this.marketReportGenerator.initialize();
    
    // Setup event handlers
    await this.setupEventHandlers();
    
    this.initialized = true;
    console.log('Streamlined Agent Core initialized successfully');
  }
  
  /**
   * Sets up event handlers for the agent.
   */
  private async setupEventHandlers(): Promise<void> {
    // Handle market selection events
    this.eventSystem.subscribe(CoreEventType.MARKET_SELECTED, async (event: Event) => {
      if (!event.businessId || !event.payload.country) {
        return;
      }
      
      const businessId = event.businessId;
      const country = event.payload.country;
      
      // Generate market report
      await this.marketReportGenerator.generateMarketReport(businessId, country);
      
      // Generate timeline
      await this.timelineGenerator.generateTimeline(businessId, country);
    });
    
    // Handle notification action events
    this.eventSystem.subscribe(CoreEventType.NOTIFICATION_ACTION_TAKEN, async (event: Event) => {
      if (!event.businessId) {
        return;
      }
      
      const businessId = event.businessId;
      const action = event.payload.action;
      const data = event.payload.data;
      
      // Handle different actions
      switch (action) {
        case 'VIEW_MARKET_REPORT':
          // This would typically redirect the user to the market report page
          console.log(`User viewed market report for ${data.country}`);
          break;
          
        case 'VIEW_REQUIREMENT':
          // This would typically redirect the user to the requirement details page
          console.log(`User viewed requirement details for ${data.requirementId}`);
          break;
          
        case 'COMPLETE_REQUIREMENT':
          // Mark requirement as completed
          console.log(`User completed requirement ${data.requirementId}`);
          break;
          
        case 'UPDATE_CERTIFICATION':
          // Update certification status
          if (data.certId) {
            await this.stateManager.updateCertificationStatus(
              businessId,
              data.certId,
              'ACTIVE'
            );
            console.log(`User updated certification ${data.certId}`);
          }
          break;
      }
    });
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
          
        case 'SELECT_TARGET_MARKET':
          return this.handleSelectTargetMarket(request);
          
        case 'GET_MARKET_REPORT':
          return this.handleGetMarketReport(request);
          
        case 'COMPARE_MARKETS':
          return this.handleCompareMarkets(request);
          
        case 'GET_TIMELINE':
          return this.handleGetTimeline(request);
          
        case 'UPDATE_TASK_STATUS':
          return this.handleUpdateTaskStatus(request);
          
        case 'GET_NOTIFICATIONS':
          return this.handleGetNotifications(request);
          
        case 'MARK_NOTIFICATION_READ':
          return this.handleMarkNotificationRead(request);
          
        case 'TAKE_NOTIFICATION_ACTION':
          return this.handleTakeNotificationAction(request);
          
        default:
          return {
            success: false,
            error: `Unknown request type: ${request.type}`
          };
      }
    } catch (error) {
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
      data: businessState
    };
  }
  
  /**
   * Handles a request to update the business profile.
   */
  private async handleUpdateBusinessProfile(request: AgentRequest): Promise<AgentResponse> {
    const updates = request.data;
    
    await this.stateManager.updateBusinessState(request.businessId, {
      profile: updates
    });
    
    // Publish event
    await this.eventSystem.publish({
      type: CoreEventType.BUSINESS_PROFILE_UPDATED,
      source: 'AgentCore',
      priority: EventPriority.MEDIUM,
      businessId: request.businessId,
      payload: updates
    });
    
    return {
      success: true,
      message: 'Business profile updated successfully'
    };
  }
  
  /**
   * Handles a request to select a target market.
   */
  private async handleSelectTargetMarket(request: AgentRequest): Promise<AgentResponse> {
    const country = request.data.country;
    
    if (!country) {
      return {
        success: false,
        error: 'Country is required'
      };
    }
    
    // Add target market
    await this.stateManager.addTargetMarket(request.businessId, country);
    
    // Publish event
    await this.eventSystem.publish({
      type: CoreEventType.MARKET_SELECTED,
      source: 'AgentCore',
      priority: EventPriority.MEDIUM,
      businessId: request.businessId,
      payload: {
        country
      }
    });
    
    return {
      success: true,
      message: `${country} added as target market`
    };
  }
  
  /**
   * Handles a request to get a market report.
   */
  private async handleGetMarketReport(request: AgentRequest): Promise<AgentResponse> {
    const country = request.data.country;
    
    if (!country) {
      return {
        success: false,
        error: 'Country is required'
      };
    }
    
    // Get market report
    let report = await this.marketReportGenerator.getMarketReport(
      request.businessId,
      country
    );
    
    // Generate report if it doesn't exist
    if (!report) {
      report = await this.marketReportGenerator.generateMarketReport(
        request.businessId,
        country
      );
    }
    
    return {
      success: true,
      data: report
    };
  }
  
  /**
   * Handles a request to compare markets.
   */
  private async handleCompareMarkets(request: AgentRequest): Promise<AgentResponse> {
    const countries = request.data.countries;
    
    if (!countries || !Array.isArray(countries) || countries.length === 0) {
      return {
        success: false,
        error: 'Countries array is required'
      };
    }
    
    // Compare markets
    const reports = await this.marketReportGenerator.compareMarkets(
      request.businessId,
      countries
    );
    
    return {
      success: true,
      data: reports
    };
  }
  
  /**
   * Handles a request to get a timeline.
   */
  private async handleGetTimeline(request: AgentRequest): Promise<AgentResponse> {
    const timelineId = request.data.timelineId;
    const country = request.data.country;
    
    if (timelineId) {
      // Get timeline by ID
      const timeline = await this.timelineGenerator.getTimeline(timelineId);
      
      if (!timeline) {
        return {
          success: false,
          error: `Timeline not found: ${timelineId}`
        };
      }
      
      return {
        success: true,
        data: timeline
      };
    } else if (country) {
      // Get timelines for business
      const timelines = await this.timelineGenerator.getBusinessTimelines(request.businessId);
      
      // Find timeline for country
      const timeline = timelines.find(t => t.market === country);
      
      if (!timeline) {
        // Generate timeline if it doesn't exist
        const newTimeline = await this.timelineGenerator.generateTimeline(
          request.businessId,
          country
        );
        
        return {
          success: true,
          data: newTimeline
        };
      }
      
      return {
        success: true,
        data: timeline
      };
    } else {
      // Get all timelines for business
      const timelines = await this.timelineGenerator.getBusinessTimelines(request.businessId);
      
      return {
        success: true,
        data: timelines
      };
    }
  }
  
  /**
   * Handles a request to update a task status.
   */
  private async handleUpdateTaskStatus(request: AgentRequest): Promise<AgentResponse> {
    const timelineId = request.data.timelineId;
    const taskId = request.data.taskId;
    const status = request.data.status;
    
    if (!timelineId || !taskId || !status) {
      return {
        success: false,
        error: 'Timeline ID, task ID, and status are required'
      };
    }
    
    // Update task status
    await this.timelineGenerator.updateTaskStatus(
      timelineId,
      taskId,
      status
    );
    
    return {
      success: true,
      message: `Task status updated to ${status}`
    };
  }
  
  /**
   * Handles a request to get notifications.
   */
  private async handleGetNotifications(request: AgentRequest): Promise<AgentResponse> {
    const unreadOnly = request.data.unreadOnly;
    const limit = request.data.limit;
    
    // Get notifications
    const notifications = await this.notificationService.getNotifications(
      request.businessId,
      {
        unreadOnly,
        limit
      }
    );
    
    return {
      success: true,
      data: notifications
    };
  }
  
  /**
   * Handles a request to mark a notification as read.
   */
  private async handleMarkNotificationRead(request: AgentRequest): Promise<AgentResponse> {
    const notificationId = request.data.notificationId;
    
    if (!notificationId) {
      return {
        success: false,
        error: 'Notification ID is required'
      };
    }
    
    // Mark notification as read
    await this.notificationService.markAsRead(notificationId);
    
    return {
      success: true,
      message: 'Notification marked as read'
    };
  }
  
  /**
   * Handles a request to take an action on a notification.
   */
  private async handleTakeNotificationAction(request: AgentRequest): Promise<AgentResponse> {
    const notificationId = request.data.notificationId;
    const action = request.data.action;
    const actionData = request.data.actionData;
    
    if (!notificationId || !action) {
      return {
        success: false,
        error: 'Notification ID and action are required'
      };
    }
    
    // Record notification action
    await this.notificationService.recordAction(
      notificationId,
      action,
      actionData
    );
    
    return {
      success: true,
      message: 'Notification action recorded'
    };
  }
  
  /**
   * Runs the certification monitor to check for expiring certifications.
   * This should be called on a daily schedule.
   */
  async runCertificationMonitor(): Promise<void> {
    await this.certificationMonitor.checkExpiringCertifications();
  }
} 