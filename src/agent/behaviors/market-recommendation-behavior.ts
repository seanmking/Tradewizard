import { MCPClient } from '../mcp-client';
import { StateManager } from '../state-manager';
import { NotificationService, NotificationPriority } from '../notification-service';
import { MarketOpportunity } from '../../types/state';

/**
 * MarketRecommendationBehavior
 * 
 * This behavior is responsible for generating market recommendations
 * by leveraging the MCP's market intelligence capabilities.
 */
export class MarketRecommendationBehavior {
  private mcpClient: MCPClient;
  private stateManager: StateManager;
  private notificationService: NotificationService;
  
  /**
   * Create a new MarketRecommendationBehavior
   * 
   * @param mcpClient - The MCP client for accessing MCP tools
   * @param stateManager - The state manager for accessing business state
   * @param notificationService - The notification service for sending notifications
   */
  constructor(
    mcpClient: MCPClient,
    stateManager: StateManager,
    notificationService: NotificationService
  ) {
    this.mcpClient = mcpClient;
    this.stateManager = stateManager;
    this.notificationService = notificationService;
  }
  
  /**
   * Generate market recommendations for a business
   * 
   * @param businessId - The business ID
   * @returns Market recommendations
   */
  async generateMarketRecommendations(businessId: string): Promise<any> {
    try {
      // 1. Get business profile from state
      const business = await this.stateManager.getBusinessState(businessId);
      
      if (!business || !business.profile) {
        throw new Error('Business profile not found');
      }
      
      // 2. Extract relevant parameters for market intelligence
      const params = {
        industry: business.profile.industry || '',
        products: business.profile.products?.map(p => p.category) || [],
        businessSize: business.profile.size || 'SMALL',
        exportExperience: business.profile.exportExperience || 'NONE',
        // Use additional data from the profile if available
        additionalInfo: business.exportJourney?.completedSteps || []
      };
      
      // 3. Call MCP to get market recommendations
      const marketData = await this.mcpClient.getMarketIntelligence(params);
      
      // 4. Filter and format the recommendations
      const recommendations = this.formatRecommendations(marketData);
      
      // 5. Update business state with recommendations
      // Store recommendations as opportunities in the export journey
      const opportunities: MarketOpportunity[] = recommendations.map(rec => ({
        market: rec.id,
        product: 'ALL', // Default to all products
        score: rec.confidence,
        reasons: [rec.description],
        detectedAt: new Date(),
        status: 'NEW' // Explicitly typed as a valid status
      }));
      
      // Get the current export journey and update only the opportunities
      const currentExportJourney = business.exportJourney;
      
      // Update business state with the new opportunities
      await this.stateManager.updateBusinessState(businessId, {
        exportJourney: {
          ...currentExportJourney,
          opportunities
        }
      });
      
      // 6. Send notification about new recommendations
      await this.notificationService.notifyCustom(businessId, {
        type: 'MARKET_RECOMMENDATIONS',
        title: 'Market Recommendations Available',
        message: `We've analyzed your business profile and identified ${recommendations.length} promising markets for your products.`,
        priority: NotificationPriority.MEDIUM,
        actions: [
          { 
            label: 'View Recommendations', 
            action: 'VIEW_MARKET_RECOMMENDATIONS',
            data: null
          }
        ]
      });
      
      return recommendations;
    } catch (error: any) {
      console.error(`Error generating market recommendations: ${error.message}`);
      
      // Return fallback recommendations if MCP call fails
      return this.getFallbackRecommendations();
    }
  }
  
  /**
   * Format market recommendations from MCP data
   * 
   * @param marketData - The market data from MCP
   * @returns Formatted market recommendations
   */
  private formatRecommendations(marketData: any): any[] {
    // Handle case where marketData is missing or malformed
    if (!marketData || !marketData.recommendations || !Array.isArray(marketData.recommendations)) {
      return this.getFallbackRecommendations();
    }
    
    // Extract essential fields and limit to top 5 markets
    return marketData.recommendations.map((rec: any) => ({
      id: rec.countryCode || rec.country,
      name: rec.countryName || rec.country,
      description: rec.marketSummary || `${rec.country} has a market size of ${rec.marketSize} with a growth rate of ${rec.growthRate}%.`,
      confidence: rec.confidenceScore || 0.7,
      marketSize: rec.marketSize,
      growthRate: rec.growthRate,
      entryDifficulty: rec.entryDifficulty,
      tariffRate: rec.tariffRate
    })).slice(0, 5);
  }
  
  /**
   * Get fallback market recommendations when MCP call fails
   * 
   * @returns Fallback market recommendations
   */
  private getFallbackRecommendations(): any[] {
    return [
      {
        id: 'USA',
        name: 'United States',
        description: 'The United States market is large and competitive, with strong demand for innovative products. The market size is estimated at $400 billion with a steady growth rate of 5.2% annually.',
        confidence: 0.85,
        marketSize: '$400 billion',
        growthRate: 5.2,
        entryDifficulty: 'MEDIUM',
        tariffRate: 3.5
      },
      {
        id: 'CAN',
        name: 'Canada',
        description: 'Canada has a stable economy and strong trade relations with many countries, making it an attractive export market. The market size is estimated at $50 billion with a growth rate of 3.8% annually.',
        confidence: 0.82,
        marketSize: '$50 billion',
        growthRate: 3.8,
        entryDifficulty: 'LOW',
        tariffRate: 2.8
      },
      {
        id: 'GBR',
        name: 'United Kingdom',
        description: 'The UK offers a large consumer market with high purchasing power and demand for quality products. The market size is estimated at $80 billion with a growth rate of 4.1% annually.',
        confidence: 0.78,
        marketSize: '$80 billion',
        growthRate: 4.1,
        entryDifficulty: 'MEDIUM',
        tariffRate: 4.0
      }
    ];
  }
} 