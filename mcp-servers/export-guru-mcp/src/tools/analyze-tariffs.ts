import { Tool } from '../types';
import { Connectors } from '../connectors';

/**
 * Creates a tool for analyzing tariffs using the WITS connector
 * @param connectors Connectors object
 * @returns Tool for analyzing tariffs
 */
export function createAnalyzeTariffsTool(connectors: Connectors): Tool {
  return {
    name: 'analyzeTariffs',
    description: 'Analyze tariffs for a specific product in a target market',
    parameters: {
      type: 'object',
      properties: {
        reporter: {
          type: 'string',
          description: 'Reporter country code (ISO)'
        },
        partner: {
          type: 'string',
          description: 'Partner country code (ISO)'
        },
        product: {
          type: 'string',
          description: 'Product code (HS code)'
        },
        year: {
          type: 'number',
          description: 'Year (default: latest available)'
        }
      },
      required: ['reporter', 'partner', 'product']
    },
    handler: async (params: {
      reporter: string;
      partner: string;
      product: string;
      year?: number;
    }) => {
      try {
        // Use current year - 1 if year is not provided
        const year = params.year || new Date().getFullYear() - 1;
        
        // Use the WITS connector to analyze tariffs
        const tariffAnalysis = await connectors.wits.analyzeTariffs(
          params.reporter,
          params.partner,
          params.product,
          year
        );
        
        return {
          simpleAverage: tariffAnalysis.simpleAverage,
          preferentialRates: tariffAnalysis.preferentialRates,
          countryComparison: tariffAnalysis.countryComparison,
          summary: generateTariffSummary(
            params.reporter,
            params.partner,
            params.product,
            tariffAnalysis
          )
        };
      } catch (error) {
        console.error('Error analyzing tariffs', error);
        
        if (error instanceof Error) {
          throw new Error(`Failed to analyze tariffs: ${error.message}`);
        }
        
        throw new Error('Failed to analyze tariffs');
      }
    }
  };
}

/**
 * Creates a tool for evaluating market access using the WITS connector
 * @param connectors Connectors object
 * @returns Tool for evaluating market access
 */
export function createEvaluateMarketAccessTool(connectors: Connectors): Tool {
  return {
    name: 'evaluateMarketAccess',
    description: 'Evaluate market access for a product in target markets',
    parameters: {
      type: 'object',
      properties: {
        product: {
          type: 'string',
          description: 'Product code (HS code)'
        },
        originCountry: {
          type: 'string',
          description: 'Origin country code (ISO)'
        },
        targetMarkets: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Array of target market country codes (ISO)'
        },
        year: {
          type: 'number',
          description: 'Year (default: latest available)'
        }
      },
      required: ['product', 'originCountry', 'targetMarkets']
    },
    handler: async (params: {
      product: string;
      originCountry: string;
      targetMarkets: string[];
      year?: number;
    }) => {
      try {
        // Use current year - 1 if year is not provided
        const year = params.year || new Date().getFullYear() - 1;
        
        // Use the WITS connector to evaluate market access
        const marketAccessScores = await connectors.wits.evaluateMarketAccess(
          params.product,
          params.originCountry,
          params.targetMarkets,
          year
        );
        
        // Generate a summary of the market access evaluation
        const summary = generateMarketAccessSummary(
          params.product,
          params.originCountry,
          marketAccessScores
        );
        
        return {
          marketAccessScores,
          summary
        };
      } catch (error) {
        console.error('Error evaluating market access', error);
        
        if (error instanceof Error) {
          throw new Error(`Failed to evaluate market access: ${error.message}`);
        }
        
        throw new Error('Failed to evaluate market access');
      }
    }
  };
}

/**
 * Generate a summary of the tariff analysis
 * @param reporter Reporter country code
 * @param partner Partner country code
 * @param product Product code
 * @param tariffAnalysis Tariff analysis
 * @returns Summary of the tariff analysis
 */
function generateTariffSummary(
  reporter: string,
  partner: string,
  product: string,
  tariffAnalysis: {
    simpleAverage: number;
    preferentialRates: Array<{ agreementCode: string; agreementName: string; rate: number }>;
    countryComparison: Array<{ country: string; tariffRate: number }>;
  }
): string {
  // Generate a summary of the tariff analysis
  let summary = `Tariff Analysis for ${product} exported from ${partner} to ${reporter}:\n\n`;
  
  // Add simple average tariff rate
  summary += `The simple average tariff rate is ${tariffAnalysis.simpleAverage.toFixed(2)}%.\n\n`;
  
  // Add preferential rates if available
  if (tariffAnalysis.preferentialRates.length > 0) {
    summary += 'Preferential rates are available under the following agreements:\n';
    tariffAnalysis.preferentialRates.forEach(rate => {
      summary += `- ${rate.agreementName}: ${rate.rate.toFixed(2)}%\n`;
    });
    summary += '\n';
  } else {
    summary += 'No preferential rates are available.\n\n';
  }
  
  // Add country comparison
  summary += 'Comparison with other countries:\n';
  tariffAnalysis.countryComparison.forEach(country => {
    summary += `- ${country.country}: ${country.tariffRate.toFixed(2)}%\n`;
  });
  
  return summary;
}

/**
 * Generate a summary of the market access evaluation
 * @param product Product code
 * @param originCountry Origin country code
 * @param marketAccessScores Market access scores
 * @returns Summary of the market access evaluation
 */
function generateMarketAccessSummary(
  product: string,
  originCountry: string,
  marketAccessScores: Array<{
    market: string;
    tariffRate: number;
    hasPreferentialAccess: boolean;
    competitivePosition: Array<{ country: string; tariffRate: number }>;
  }>
): string {
  // Generate a summary of the market access evaluation
  let summary = `Market Access Evaluation for ${product} exported from ${originCountry}:\n\n`;
  
  // Sort markets by tariff rate (lowest first)
  const sortedMarkets = [...marketAccessScores].sort((a, b) => a.tariffRate - b.tariffRate);
  
  // Add market access scores
  sortedMarkets.forEach(market => {
    summary += `${market.market}:\n`;
    summary += `- Tariff rate: ${market.tariffRate.toFixed(2)}%\n`;
    summary += `- Preferential access: ${market.hasPreferentialAccess ? 'Yes' : 'No'}\n`;
    
    // Add competitive position
    if (market.competitivePosition.length > 0) {
      summary += '- Competitive position:\n';
      market.competitivePosition.forEach(competitor => {
        const comparison = competitor.tariffRate < market.tariffRate ? 'better' :
                          competitor.tariffRate > market.tariffRate ? 'worse' : 'same';
        summary += `  - ${competitor.country}: ${competitor.tariffRate.toFixed(2)}% (${comparison})\n`;
      });
    }
    
    summary += '\n';
  });
  
  // Add recommendations
  summary += 'Recommendations:\n';
  
  // Find markets with preferential access
  const marketsWithPreferentialAccess = sortedMarkets.filter(market => market.hasPreferentialAccess);
  if (marketsWithPreferentialAccess.length > 0) {
    summary += `- Consider prioritizing markets with preferential access: ${marketsWithPreferentialAccess.map(m => m.market).join(', ')}\n`;
  }
  
  // Find markets with lowest tariff rates
  const lowTariffMarkets = sortedMarkets.slice(0, 3);
  summary += `- Markets with lowest tariff rates: ${lowTariffMarkets.map(m => m.market).join(', ')}\n`;
  
  return summary;
} 