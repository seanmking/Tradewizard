import { Database } from '../../database/connection';
import { StreamlinedStateManager } from '../streamlined-state-manager';
import { StreamlinedRequirement } from '../../types/streamlined-state';

/**
 * Timeline task interface.
 */
export interface TimelineTask {
  id: string;
  requirementId: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  prerequisiteTasks: string[];
  issuingAuthority: {
    name: string;
    website?: string;
    contactInfo?: string;
  };
  estimatedCost: {
    amount: number;
    currency: string;
  };
  isMandatory: boolean;
}

/**
 * Timeline interface.
 */
export interface Timeline {
  id: string;
  businessId: string;
  market: string;
  tasks: TimelineTask[];
  createdAt: Date;
  updatedAt: Date;
  progress: number;
}

/**
 * The TimelineGenerator creates sequential task timelines based on regulatory requirements.
 */
export class TimelineGenerator {
  private db: Database;
  private stateManager: StreamlinedStateManager;
  
  // Default buffer days between tasks
  private readonly DEFAULT_BUFFER_DAYS = 5;
  
  constructor(
    db: Database,
    stateManager: StreamlinedStateManager
  ) {
    this.db = db;
    this.stateManager = stateManager;
  }
  
  /**
   * Initializes the timeline generator.
   */
  async initialize(): Promise<void> {
    console.log('Timeline Generator initialized');
  }
  
  /**
   * Generates a timeline for a market.
   */
  async generateTimeline(
    businessId: string,
    market: string
  ): Promise<Timeline> {
    // Get business state
    const business = await this.stateManager.getBusinessState(businessId);
    
    // Get requirements for the market
    const requirements = await this.getMarketRequirements(market, business.profile.industry);
    
    // Build dependency tree
    const dependencyTree = this.buildDependencyTree(requirements);
    
    // Generate tasks
    const tasks = this.generateTasks(dependencyTree);
    
    // Create timeline
    const timeline: Timeline = {
      id: this.generateId(),
      businessId,
      market,
      tasks,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0
    };
    
    // Save timeline
    await this.saveTimeline(timeline);
    
    return timeline;
  }
  
  /**
   * Gets requirements for a market.
   */
  private async getMarketRequirements(
    market: string,
    industry: string
  ): Promise<StreamlinedRequirement[]> {
    // In a real implementation, this would query an external API or database
    // For now, we'll return mock data
    return [
      {
        id: this.generateId(),
        market,
        name: `${market} Import License`,
        description: `Required for all businesses importing goods into ${market}.`,
        issuingAuthority: {
          name: `${market} Trade Authority`,
          website: `https://trade.${market.toLowerCase()}.gov`,
          contactInfo: `info@trade.${market.toLowerCase()}.gov`
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
        market,
        name: `${industry} Certification`,
        description: `Required for all ${industry} products sold in ${market}.`,
        issuingAuthority: {
          name: `${market} Standards Authority`,
          website: `https://standards.${market.toLowerCase()}.gov`
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
        market,
        name: 'Product Registration',
        description: `Register your products in the ${market} product database.`,
        issuingAuthority: {
          name: `${market} Product Registry`,
          website: `https://registry.${market.toLowerCase()}.gov`
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
   * Builds a dependency tree from requirements.
   */
  private buildDependencyTree(
    requirements: StreamlinedRequirement[]
  ): StreamlinedRequirement[] {
    // Create a map of requirements by ID
    const requirementsMap = new Map<string, StreamlinedRequirement>();
    requirements.forEach(req => requirementsMap.set(req.id, req));
    
    // Sort requirements by dependencies
    const sorted: StreamlinedRequirement[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();
    
    // Topological sort function
    const visit = (reqId: string) => {
      if (temp.has(reqId)) {
        // Circular dependency detected
        throw new Error(`Circular dependency detected for requirement: ${reqId}`);
      }
      
      if (visited.has(reqId)) {
        return;
      }
      
      temp.add(reqId);
      
      const req = requirementsMap.get(reqId);
      if (req) {
        for (const prereqId of req.prerequisiteIds) {
          visit(prereqId);
        }
        
        visited.add(reqId);
        temp.delete(reqId);
        sorted.push(req);
      }
    };
    
    // Visit all requirements
    for (const req of requirements) {
      if (!visited.has(req.id)) {
        visit(req.id);
      }
    }
    
    return sorted;
  }
  
  /**
   * Generates tasks from a dependency tree.
   */
  private generateTasks(
    dependencyTree: StreamlinedRequirement[]
  ): TimelineTask[] {
    const tasks: TimelineTask[] = [];
    const startDate = new Date();
    let currentDate = new Date(startDate);
    
    // Create a map of requirements by ID
    const requirementsMap = new Map<string, StreamlinedRequirement>();
    dependencyTree.forEach(req => requirementsMap.set(req.id, req));
    
    // Generate tasks
    for (const req of dependencyTree) {
      // Calculate start date based on prerequisites
      let taskStartDate = new Date(currentDate);
      
      // Find prerequisite tasks
      const prerequisiteTasks: string[] = [];
      for (const prereqId of req.prerequisiteIds) {
        const prereqTask = tasks.find(task => task.requirementId === prereqId);
        if (prereqTask) {
          prerequisiteTasks.push(prereqTask.id);
          
          // Update start date if prerequisite ends later
          if (prereqTask.endDate > taskStartDate) {
            taskStartDate = new Date(prereqTask.endDate);
            taskStartDate.setDate(taskStartDate.getDate() + this.DEFAULT_BUFFER_DAYS);
          }
        }
      }
      
      // Calculate end date
      const taskEndDate = new Date(taskStartDate);
      taskEndDate.setDate(taskEndDate.getDate() + req.processingTime);
      
      // Create task
      const task: TimelineTask = {
        id: this.generateId(),
        requirementId: req.id,
        name: req.name,
        description: req.description,
        startDate: taskStartDate,
        endDate: taskEndDate,
        status: 'NOT_STARTED',
        prerequisiteTasks,
        issuingAuthority: req.issuingAuthority,
        estimatedCost: req.estimatedCost,
        isMandatory: req.isMandatory
      };
      
      tasks.push(task);
      
      // Update current date
      currentDate = new Date(taskEndDate);
      currentDate.setDate(currentDate.getDate() + this.DEFAULT_BUFFER_DAYS);
    }
    
    return tasks;
  }
  
  /**
   * Saves a timeline to the database.
   */
  private async saveTimeline(timeline: Timeline): Promise<void> {
    await this.db.timelines.insertOne(timeline);
  }
  
  /**
   * Updates a task status.
   */
  async updateTaskStatus(
    timelineId: string,
    taskId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  ): Promise<void> {
    // Get timeline
    const timeline = await this.db.timelines.findOne({ id: timelineId });
    
    if (!timeline) {
      throw new Error(`Timeline not found: ${timelineId}`);
    }
    
    // Update task status
    const updatedTasks = timeline.tasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    );
    
    // Calculate progress
    const completedTasks = updatedTasks.filter(task => task.status === 'COMPLETED').length;
    const progress = completedTasks / updatedTasks.length;
    
    // Update timeline
    await this.db.timelines.updateOne(
      { id: timelineId },
      { 
        $set: { 
          tasks: updatedTasks,
          progress,
          updatedAt: new Date()
        } 
      }
    );
  }
  
  /**
   * Gets a timeline by ID.
   */
  async getTimeline(timelineId: string): Promise<Timeline | null> {
    return this.db.timelines.findOne({ id: timelineId });
  }
  
  /**
   * Gets timelines for a business.
   */
  async getBusinessTimelines(businessId: string): Promise<Timeline[]> {
    return this.db.timelines.find({ businessId }).toArray();
  }
  
  /**
   * Generates a unique ID.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
} 