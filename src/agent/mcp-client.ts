import axios from 'axios';

/**
 * MCPClient
 * 
 * A client for interacting with the MCP (Middleware Component Provider).
 * This class serves as the bridge between the Agent layer and the MCP layer,
 * providing a clean interface for accessing MCP tools and capabilities.
 */
export class MCPClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  
  /**
   * Create a new MCPClient
   * 
   * @param baseUrl - The base URL for the MCP API
   * @param timeout - Timeout for MCP requests in milliseconds
   * @param maxRetries - Maximum number of retries for failed requests
   */
  constructor(
    baseUrl: string = 'http://localhost:3000/api/mcp',
    timeout: number = 10000,
    maxRetries: number = 3
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }
  
  /**
   * Call an MCP tool with the specified action and parameters
   * 
   * @param tool - The name of the MCP tool to call
   * @param action - The action to perform with the tool
   * @param params - The parameters for the action
   * @returns The response from the MCP tool
   */
  async callMCPTool(tool: string, action: string, params: any): Promise<any> {
    let retries = 0;
    
    while (retries <= this.maxRetries) {
      try {
        const response = await axios.post(
          `${this.baseUrl}/tools`,
          {
            tool,
            action,
            params
          },
          {
            timeout: this.timeout
          }
        );
        
        return response.data;
      } catch (error: any) {
        retries++;
        
        if (retries > this.maxRetries) {
          console.error(`Error calling MCP tool ${tool}.${action} after ${retries} attempts:`, error);
          throw new Error(`Failed to call MCP tool: ${error.message || 'Unknown error'}`);
        }
        
        // Exponential backoff
        const delay = Math.pow(2, retries) * 100;
        console.warn(`Retrying MCP tool ${tool}.${action} in ${delay}ms (attempt ${retries}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  /**
   * Get market intelligence data from the MCP
   * 
   * @param params - Parameters for market intelligence
   * @returns Market intelligence data
   */
  async getMarketIntelligence(params: any): Promise<any> {
    return this.callMCPTool('marketIntelligence', 'getMarketData', params);
  }
  
  /**
   * Get regulatory requirements from the MCP
   * 
   * @param country - The target country
   * @param productCategory - The product category
   * @returns Regulatory requirements
   */
  async getRegulatoryRequirements(country: string, productCategory: string): Promise<any> {
    return this.callMCPTool('regulatory', 'getRequirements', { country, productCategory });
  }
  
  /**
   * Generate an export readiness report from the MCP
   * 
   * @param businessId - The business ID
   * @returns Export readiness report
   */
  async generateExportReadinessReport(businessId: string): Promise<any> {
    return this.callMCPTool('assessment', 'generateExportReadinessReport', { businessId });
  }
  
  /**
   * Analyze a website using the MCP
   * 
   * @param url - The website URL to analyze
   * @returns Website analysis data
   */
  async analyzeWebsite(url: string): Promise<any> {
    return this.callMCPTool('businessAnalysis', 'analyzeWebsite', { url });
  }
  
  /**
   * Map products to HS codes using the MCP
   * 
   * @param products - The products to map
   * @returns HS code mappings
   */
  async mapToHsCodes(products: string[]): Promise<any> {
    return this.callMCPTool('businessAnalysis', 'mapToHsCodes', { products });
  }
  
  /**
   * Get compliance requirements from the MCP
   * 
   * @param businessId - The business ID
   * @param targetMarket - The target market
   * @returns Compliance requirements
   */
  async getComplianceRequirements(businessId: string, targetMarket: string): Promise<any> {
    return this.callMCPTool('compliance', 'getRequirements', { businessId, targetMarket });
  }
} 