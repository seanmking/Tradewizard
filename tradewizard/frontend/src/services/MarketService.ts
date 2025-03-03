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
  'eu': 'eu',
  'europeanunion': 'eu',
  'uae': 'uae',
  'unitedarabemirates': 'uae'
};

/**
 * Normalizes market names to match file naming conventions
 */
export const normalizeMarketName = (market: string): string => {
  const normalizedName = market.toLowerCase().replace(/\s+/g, '');
  return marketAliases[normalizedName] || normalizedName;
};

/**
 * Fetches market intelligence data for a specific market
 */
export const fetchMarketIntelligence = async (market: string): Promise<MarketData | null> => {
  const normalizedMarket = normalizeMarketName(market);
  
  try {
    // Use the API service to fetch market data
    const data = await marketIntelligenceApi.getMarketData(normalizedMarket);
    return data;
  } catch (error) {
    console.error(`Error fetching market intelligence for ${market}:`, error);
    return null;
  }
};

/**
 * Extracts key market data needed for the Export Readiness Report
 */
export const extractMarketDataForReport = (data: MarketData): MarketData => {
  if (!data) return {
    market_size: 'Data unavailable',
    growth_rate: 'Data unavailable',
    key_trends: ['Data unavailable'],
    regulatory_requirements: ['Data unavailable']
  };
  
  // Create a copy of the data to avoid modifying the original
  const result: MarketData = { ...data };
  
  // Ensure we have the basic fields for backward compatibility
  result.market_size = data.market_size || data.food_market_data?.market_size || 'Data unavailable';
  result.growth_rate = data.growth_rate || data.food_market_data?.growth_rate || 'Data unavailable';
  
  // Handle key trends from various possible sources
  result.key_trends = data.key_trends || 
    (data.consumer_trends?.map((trend: any) => trend.trend || trend)) || 
    data.food_market_data?.key_trends || 
    ['Data unavailable'];
  
  // Handle regulatory requirements from various possible sources
  result.regulatory_requirements = 
    (data.regulatory_environment?.import_regulations?.labeling_requirements) ||
    (data.regulatory_environment?.import_regulations?.key_requirements) ||
    (data.regulatory_requirements?.labeling) ||
    data.regulatory_requirements || 
    ['Data unavailable'];
  
  // Ensure market_overview exists
  if (!result.market_overview) {
    result.market_overview = {
      population: 'Data unavailable',
      gdp: 'Data unavailable',
      gdp_growth: 'Data unavailable',
      currency: 'Data unavailable'
    };
  }
  
  // Ensure food_market_data exists
  if (!result.food_market_data) {
    result.food_market_data = {
      market_size: result.market_size,
      growth_rate: result.growth_rate,
      key_trends: Array.isArray(result.key_trends) ? result.key_trends : ['Data unavailable']
    };
  }
  
  return result;
};

/**
 * Fetches market data for multiple markets
 */
export const fetchMultipleMarkets = async (markets: string[]): Promise<{ [key: string]: MarketData }> => {
  const results: { [key: string]: MarketData } = {};
  
  // First, deduplicate the markets array to avoid redundant fetches
  const uniqueMarkets = Array.from(new Set(
    markets.map(market => {
      const normalized = normalizeMarketName(market);
      // Map normalized names back to their primary display name
      if (normalized === 'usa') return 'United States';
      if (normalized === 'uk') return 'United Kingdom';
      if (normalized === 'eu') return 'European Union';
      if (normalized === 'uae') return 'United Arab Emirates';
      return market;
    })
  ));
  
  const fetchPromises = uniqueMarkets.map(async (market) => {
    const data = await fetchMarketIntelligence(market);
    if (data) {
      // Store under the original market name only
      results[market] = extractMarketDataForReport(data);
    }
  });
  
  await Promise.all(fetchPromises);
  return results;
};

export default {
  fetchMarketIntelligence,
  fetchMultipleMarkets,
  extractMarketDataForReport,
  normalizeMarketName
}; 