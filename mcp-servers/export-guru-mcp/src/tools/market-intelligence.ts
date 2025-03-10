import { Connectors } from '../connectors';
import { LLM, Tool, MarketInfo, TradeFlowData } from '../types';

/**
 * Analyzes market intelligence data for a specific market and product category
 * @param market Target market
 * @param productCategories Product categories
 * @param hsCode Optional HS code for more specific analysis
 * @param connectors Data connectors
 * @param llm LLM for enhanced analysis
 * @returns Market intelligence data
 */
async function getMarketIntelligence(
  market: string,
  productCategories: string[],
  hsCode: string | undefined,
  connectors: Connectors,
  llm: LLM
): Promise<MarketInfo> {
  try {
    // Normalize market name (country code)
    const marketCode = market.toUpperCase();
    
    // Get HS code if not provided
    let productHsCode = hsCode;
    if (!productHsCode && productCategories.length > 0) {
      // Use the first product category to get an HS code
      // In a real implementation, you would map the product category to an HS code
      // or use the LLM to determine the most appropriate HS code
      productHsCode = '8471'; // Example: computers and parts
    }
    
    if (!productHsCode) {
      throw new Error('No HS code provided or could be determined');
    }
    
    // Get market data from TradeMap
    const tradeFlowData = await connectors.tradeMap.getTradeFlowByHsCode(
      productHsCode,
      '', // exporter country (empty string instead of undefined)
      marketCode  // importer country
    );
    
    // Get market trends from TradeMap
    const marketTrends = await connectors.tradeMap.getMarketTrends(
      productHsCode,
      marketCode,
      5 // last 5 years
    );
    
    // Get tariff data from WITS
    const tariffData = await connectors.wits.getTariffData(
      marketCode,
      '', // partner country (empty string instead of undefined)
      productHsCode,
      new Date().getFullYear() - 1 // Use previous year's data
    );
    
    // Use LLM to generate market description and analysis
    const marketDescription = await generateMarketDescription(
      market,
      tradeFlowData,
      marketTrends,
      tariffData,
      productCategories,
      llm
    );
    
    // Calculate market size and growth rate
    const marketSize = calculateMarketSize(tradeFlowData);
    const growthRate = calculateGrowthRate(marketTrends);
    
    // Return structured market intelligence
    return {
      id: marketCode,
      name: market,
      description: marketDescription,
      confidence: 0.85, // Confidence based on real data
      marketSize: marketSize,
      growthRate: growthRate,
      entryBarriers: determineTariffBarriers(tariffData),
      regulatoryComplexity: 'medium', // This would come from regulatory DB
      strengths: extractMarketStrengths(marketTrends, tradeFlowData)
    };
  } catch (error) {
    console.error('Error getting market intelligence:', error);
    
    // Fallback to simpler analysis if real-time data fails
    return generateSimpleMarketData(market, productCategories, llm);
  }
}

/**
 * Generate market description using LLM
 */
async function generateMarketDescription(
  market: string,
  tradeFlowData: TradeFlowData[],
  marketTrends: any[],
  tariffData: any,
  productCategories: string[],
  llm: LLM
): Promise<string> {
  // Create a prompt for the LLM
  const prompt = `
    Generate a concise market description for ${market} for the following product categories: ${productCategories.join(', ')}.
    
    Trade flow data: ${JSON.stringify(tradeFlowData)}
    Market trends: ${JSON.stringify(marketTrends)}
    Tariff data: ${JSON.stringify(tariffData)}
    
    Focus on:
    1. Market size and growth potential
    2. Entry barriers
    3. Competitive landscape
    4. Consumer trends
    5. Regulatory environment
    
    Format as a concise paragraph suitable for a business intelligence report.
  `;
  
  // Get LLM response
  const description = await llm.complete({
    prompt,
    max_tokens: 300,
    temperature: 0.7
  });
  
  return description;
}

/**
 * Calculate market size from trade flow data
 */
function calculateMarketSize(tradeFlowData: TradeFlowData[]): string {
  // Sum up the total value of imports
  const totalValue = tradeFlowData.reduce((sum, item) => sum + item.value, 0);
  
  // Format as a string with appropriate units
  if (totalValue >= 1000000000) {
    return `$${(totalValue / 1000000000).toFixed(2)} billion`;
  } else if (totalValue >= 1000000) {
    return `$${(totalValue / 1000000).toFixed(2)} million`;
  } else {
    return `$${totalValue.toFixed(2)}`;
  }
}

/**
 * Calculate growth rate from market trends
 */
function calculateGrowthRate(marketTrends: any[]): string {
  if (!marketTrends || marketTrends.length < 2) {
    return 'N/A';
  }
  
  // Sort by year
  const sortedTrends = [...marketTrends].sort((a, b) => a.year - b.year);
  
  // Calculate average growth rate
  let totalGrowth = 0;
  let count = 0;
  
  for (let i = 1; i < sortedTrends.length; i++) {
    if (sortedTrends[i].growth) {
      totalGrowth += sortedTrends[i].growth;
      count++;
    }
  }
  
  if (count === 0) {
    return 'N/A';
  }
  
  const averageGrowth = totalGrowth / count;
  return `${averageGrowth.toFixed(2)}%`;
}

/**
 * Determine tariff barriers based on tariff data
 */
function determineTariffBarriers(tariffData: any): string {
  if (!tariffData || !tariffData.simpleAverage) {
    return 'Unknown';
  }
  
  const avgTariff = tariffData.simpleAverage;
  
  if (avgTariff <= 3) {
    return 'Low';
  } else if (avgTariff <= 10) {
    return 'Medium';
  } else {
    return 'High';
  }
}

/**
 * Extract market strengths from data
 */
function extractMarketStrengths(marketTrends: any[], tradeFlowData: TradeFlowData[]): string[] {
  const strengths: string[] = [];
  
  // Check for positive growth
  const hasPositiveGrowth = marketTrends.some(trend => trend.growth && trend.growth > 0);
  if (hasPositiveGrowth) {
    strengths.push('Growing market demand');
  }
  
  // Check for market size
  const totalValue = tradeFlowData.reduce((sum, item) => sum + item.value, 0);
  if (totalValue > 1000000) {
    strengths.push('Significant market size');
  }
  
  // Add more strengths based on data analysis
  
  return strengths;
}

/**
 * Generate simple market data when real-time data is unavailable
 */
async function generateSimpleMarketData(
  market: string,
  productCategories: string[],
  llm: LLM
): Promise<MarketInfo> {
  // Create a prompt for the LLM
  const prompt = `
    Generate basic market intelligence for ${market} for the following product categories: ${productCategories.join(', ')}.
    
    Include:
    1. A brief market description
    2. Estimated market size
    3. Estimated growth rate
    4. Potential entry barriers
    5. Regulatory complexity level
    6. Key market strengths
    
    Format as JSON with the following structure:
    {
      "description": "...",
      "marketSize": "...",
      "growthRate": "...",
      "entryBarriers": "...",
      "regulatoryComplexity": "...",
      "strengths": ["...", "..."]
    }
  `;
  
  // Get LLM response
  const response = await llm.complete({
    prompt,
    max_tokens: 500,
    temperature: 0.7
  });
  
  try {
    const data = JSON.parse(response);
    
    return {
      id: market.toUpperCase(),
      name: market,
      description: data.description,
      confidence: 0.6, // Lower confidence for LLM-generated data
      marketSize: data.marketSize,
      growthRate: data.growthRate,
      entryBarriers: data.entryBarriers,
      regulatoryComplexity: data.regulatoryComplexity,
      strengths: data.strengths
    };
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    
    // Return minimal data
    return {
      id: market.toUpperCase(),
      name: market,
      description: `Market intelligence for ${market} regarding ${productCategories.join(', ')}.`,
      confidence: 0.4,
      marketSize: 'Unknown',
      growthRate: 'Unknown',
      entryBarriers: 'Unknown',
      regulatoryComplexity: 'Unknown',
      strengths: []
    };
  }
}

export function registerMarketIntelligenceTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'getMarketIntelligence',
      description: 'Get market intelligence for a specific market and product category',
      parameters: [
        {
          name: 'market',
          description: 'Target market (country name or code)',
          type: 'string',
          required: true
        },
        {
          name: 'productCategories',
          description: 'List of product categories',
          type: 'array',
          required: true
        },
        {
          name: 'hsCode',
          description: 'Optional HS code for more specific analysis',
          type: 'string',
          required: false
        }
      ],
      handler: async (params) => getMarketIntelligence(
        params.market,
        params.productCategories,
        params.hsCode,
        connectors,
        llm
      )
    },
    // Add more market intelligence tools here
  ];
} 