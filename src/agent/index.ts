import { Database } from '../database/connection';
import { AgentCore, AgentRequest, AgentResponse } from './core';

/**
 * The Agent class is the main entry point for the AI Agent layer.
 * It provides a simple interface for interacting with the agent.
 */
export class Agent {
  private core: AgentCore;
  
  constructor(db: Database) {
    this.core = new AgentCore(db);
  }
  
  /**
   * Initializes the agent.
   */
  async initialize(): Promise<void> {
    await this.core.initialize();
  }
  
  /**
   * Handles a request to the agent.
   */
  async handleRequest(request: AgentRequest): Promise<AgentResponse> {
    return this.core.handleRequest(request);
  }
  
  /**
   * Gets the notification service.
   */
  getNotificationService() {
    return this.core.getNotificationService();
  }
  
  /**
   * Gets the state manager.
   */
  getStateManager() {
    return this.core.getStateManager();
  }
  
  /**
   * Gets the event system.
   */
  getEventSystem() {
    return this.core.getEventSystem();
  }
}

export { AgentRequest, AgentResponse } from './core'; 