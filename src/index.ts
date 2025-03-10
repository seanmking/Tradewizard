/**
 * TradeWizard AI Agent - Streamlined Implementation
 * 
 * This is the main entry point for the TradeWizard AI Agent.
 * It exports all the components of the streamlined implementation.
 */

// Re-export everything from the streamlined index
export * from './agent/streamlined-index';

// Export the database connection
export { Database } from './database/connection';

// Export the example
import runExample from './examples/streamlined-example';
export { runExample }; 