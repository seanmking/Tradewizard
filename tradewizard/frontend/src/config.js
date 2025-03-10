/**
 * Configuration file for the TradeWizard frontend.
 */

// API configuration
export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: 'http://localhost:5002', // Changed to Flask backend
  
  // MCP server URL (via proxy)
  MCP_URL: 'http://localhost:5002/api/proxy/mcp/tools', // Use proxy endpoint
  
  // Backend server URL
  BACKEND_URL: 'http://localhost:5002',
  
  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,
  
  // Retry configuration
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  }
};

// Feature flags
export const FEATURES = {
  // Enable AI Agent integration
  ENABLE_AI_AGENT: true,
  
  // Enable mock data
  USE_MOCK_DATA: true,
  
  // Enable debug logging
  DEBUG_LOGGING: true
};

// Export default configuration
export default {
  API_CONFIG,
  FEATURES
}; 