import { marketIntelligenceApi } from './api';

// Interface for market data
export interface MarketData {
  market_overview?: {
    region?: string;
    population?: string;
    gdp?: string;
    gdp_growth?: string;
    currency?: string;
    exchange_rate?: string;
    key_countries?: string[];
    economic_outlook?: string;
  };
  food_market_data?: {
    market_size?: string;
    growth_rate?: string;
    import_dependence?: string;
    south_african_imports?: string;
    key_trends?: string[];
  };
  dried_fruit_sector?: any;
  consumer_insights?: any;
  retail_landscape?: any;
  competitive_landscape?: any;
  distribution_channels?: any;
  market_entry_considerations?: any;
  regulatory_environment?: any;
  future_outlook?: any;
  // Legacy fields for backward compatibility
  market_size?: string;
  growth_rate?: string;
  key_trends?: string[] | any[];
  consumer_trends?: any[];
  regulatory_requirements?: string[] | any;
}

// Map of aliases to standardized market names
const marketAliases: { [key: string]: string } = {
  'usa': 'usa',
  'unitedstatesofamerica': 'usa',
  'unitedstates': 'usa',
  'us': 'usa',
  'uk': 'uk',
  'unitedkingdom': 'uk',
  'uae': 'uae',
  'unitedarabemirates': 'uae',
  'emirates': 'uae'
};

/**
 * Normalizes market names to match file naming conventions
 */
export const normalizeMarketName = (market: string): string => {
  const normalizedName = market.toLowerCase().replace(/\s+/g, '');
  return marketAliases[normalizedName] || normalizedName;
};

/**
 * Fetches market data for a specific market
 */
export const fetchMarketIntelligence = async (market: string): Promise<MarketData | null> => {
  try {
    const normalizedMarket = normalizeMarketName(market);
    console.log(`Fetching market intelligence for: ${market} (normalized to: ${normalizedMarket})`);
    return await marketIntelligenceApi.getMarketData(normalizedMarket);
  } catch (error) {
    console.error(`Error fetching market intelligence for ${market}:`, error);
    return null;
  }
};

/**
 * Fetches market data for multiple markets
 */
export const fetchMultipleMarkets = async (markets: string[]): Promise<{ [key: string]: MarketData }> => {
  const results: { [key: string]: MarketData } = {};
  
  console.log("Original markets in fetchMultipleMarkets:", markets);
  
  // First, deduplicate the markets array to avoid redundant fetches
  const uniqueMarkets = Array.from(new Set(
    markets.map(market => {
      const normalized = normalizeMarketName(market);
      console.log(`Normalizing market: "${market}" -> "${normalized}"`);
      
      // Map normalized names back to their primary display name
      let displayName = market;
      if (normalized === 'usa') displayName = 'United States';
      if (normalized === 'uk') displayName = 'United Kingdom';
      if (normalized === 'uae') displayName = 'United Arab Emirates';
      
      console.log(`Mapped to display name: "${displayName}"`);
      return displayName;
    })
  ));
  
  console.log("Unique markets after normalization:", uniqueMarkets);
  
  const fetchPromises = uniqueMarkets.map(async (market) => {
    console.log(`Attempting to fetch market data for: "${market}"`);
    const data = await fetchMarketIntelligence(market);
    if (data) {
      console.log(`Successfully fetched data for: "${market}"`);
      
      // Process the structured market data format
      const processedData = extractMarketDataForReport(data);
      results[market] = processedData;
    } else {
      console.warn(`Failed to fetch data for: "${market}"`);
    }
  });
  
  await Promise.all(fetchPromises);
  console.log("Final result markets:", Object.keys(results));
  return results;
};

/**
 * Extract market data from structured format
 */
export const extractMarketDataForReport = (data: any): MarketData => {
  const result: MarketData = {
    market_overview: {},
    food_market_data: {},
    regulatory_environment: {}
  };
  
  // Handle the structured format
  if (data.market_overview) {
    result.market_overview = data.market_overview;
  }
  
  // Extract market size
  if (data.market_size && data.market_size.value) {
    result.market_size = data.market_size.value;
  }
  
  // Extract growth rate
  if (data.growth_rate && data.growth_rate.value) {
    result.growth_rate = data.growth_rate.value;
  }
  
  // Extract regulatory information
  if (data.regulations && data.regulations.items) {
    result.regulatory_requirements = data.regulations.items;
  } else if (data.regulatory_complexity && data.regulatory_complexity.key_regulations) {
    result.regulatory_requirements = data.regulatory_complexity.key_regulations.map((reg: any) => reg.name);
  }
  
  // Extract consumer trends
  if (data.consumer_trends) {
    result.key_trends = data.consumer_trends.map((trend: any) => trend.name);
  } else if (data.market_trends && data.market_trends.emerging_trends) {
    result.key_trends = data.market_trends.emerging_trends.map((trend: any) => trend.trend_name);
  }
  
  // Package food market data
  if (!result.food_market_data) {
    result.food_market_data = {};
  }
  
  result.food_market_data.market_size = result.market_size;
  result.food_market_data.growth_rate = result.growth_rate;
  result.food_market_data.key_trends = Array.isArray(result.key_trends) ? result.key_trends : ['No trends available'];
  
  return result;
};

export default {
  fetchMarketIntelligence,
  fetchMultipleMarkets,
  extractMarketDataForReport,
  normalizeMarketName
}; 