import axios from 'axios';
import { TradeFlowData } from '../types';
import { cache } from '../utils/cache';
import { ApiError } from '../utils/error-handling';

interface WITSConfig {
  baseUrl: string;
}

interface WITSTariffData {
  reporter: string;
  partner: string;
  product: string;
  year: number;
  simpleAverage?: number;
  weightedAverage?: number;
  preferentialRates?: Array<{
    agreementCode: string;
    agreementName: string;
    rate: number;
  }>;
  [key: string]: any;
}

interface WITSTradeStats {
  reporter: string;
  year: number;
  indicator: string;
  data: any[];
  [key: string]: any;
}

interface WITSResponse {
  data?: any[];
  dataSeries?: any[];
  preferentialAgreements?: any[];
  [key: string]: any;
}

/**
 * Sets up the WITS connector for accessing World Integrated Trade Solution API
 * @param config Configuration for the WITS connector
 * @returns Object with methods to interact with the WITS API
 */
export function setupWITSConnector(config: WITSConfig) {
  // Create axios instance with base configuration
  const api = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 30000 // 30 second timeout
  });
  
  return {
    /**
     * Get tariff data from the WITS API
     * @param reporterCode Reporter country code
     * @param partnerCode Partner country code
     * @param productCode Product code (HS code)
     * @param year Year
     * @returns Tariff data
     */
    getTariffData: async function(
      reporterCode: string,
      partnerCode: string,
      productCode: string,
      year: number
    ): Promise<WITSTariffData> {
      try {
        // Create a cache key from the function name and arguments
        const cacheKey = `wits_tariff_${reporterCode}_${partnerCode}_${productCode}_${year}`;
        
        // Try to get from cache
        const cachedData = await cache.get<WITSTariffData>(cacheKey);
        if (cachedData) {
          console.log('Retrieved WITS tariff data from cache', { cacheKey });
          return cachedData;
        }
        
        const url = `/SDMX/V21/datasource/TRN/reporter/${reporterCode}/partner/${partnerCode}/product/${productCode}/year/${year}/datatype/reported`;
        
        console.log('Fetching data from WITS API', { url });
        
        const response = await api.get<WITSResponse>(url);
        
        // Process the response data to extract tariff information
        const tariffData: WITSTariffData = {
          reporter: reporterCode,
          partner: partnerCode,
          product: productCode,
          year: year,
          // Extract relevant data from the response
          // This will need to be adjusted based on the actual WITS API response structure
          ...processWITSTariffResponse(response.data)
        };
        
        // Cache the data for future requests (1 hour TTL)
        await cache.set(cacheKey, tariffData, 3600);
        
        return tariffData;
      } catch (error) {
        console.error('Error fetching data from WITS API', error);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number }, message?: string, code?: string };
          
          if (axiosError.response?.status === 400) {
            throw new ApiError('Invalid parameters provided to WITS API', 400);
          } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            throw new ApiError('Unauthorized access to WITS API', 401);
          } else if (axiosError.response?.status === 404) {
            throw new ApiError('No tariff data found for the specified parameters', 404);
          } else if (axiosError.response?.status === 413) {
            throw new ApiError('The requested data set is too large. Please narrow your query parameters', 413);
          } else if (axiosError.response?.status === 429) {
            throw new ApiError('WITS API rate limit exceeded. Try again later.', 429);
          } else {
            throw new ApiError(`WITS API error: ${axiosError.message || 'Unknown error'}`, 502);
          }
        }
        
        throw new ApiError('Failed to fetch data from WITS API', 500);
      }
    },
    
    /**
     * Get trade statistics from the WITS API
     * @param reporterCode Reporter country code
     * @param year Year
     * @param indicator Indicator code
     * @returns Trade statistics
     */
    getTradeStats: async function(
      reporterCode: string,
      year: number,
      indicator: string
    ): Promise<WITSTradeStats> {
      try {
        // Create a cache key from the function name and arguments
        const cacheKey = `wits_trade_stats_${reporterCode}_${year}_${indicator}`;
        
        // Try to get from cache
        const cachedData = await cache.get<WITSTradeStats>(cacheKey);
        if (cachedData) {
          console.log('Retrieved WITS trade stats from cache', { cacheKey });
          return cachedData;
        }
        
        const url = `/SDMX/V21/datasource/tradestats-trade/reporter/${reporterCode}/year/${year}/indicator/${indicator}?format=JSON`;
        
        console.log('Fetching trade stats from WITS API', { url });
        
        const response = await api.get<WITSResponse>(url);
        
        // Process the response data
        const tradeStats: WITSTradeStats = {
          reporter: reporterCode,
          year: year,
          indicator: indicator,
          data: response.data.data || [],
          // Add any additional processing needed
          ...processWITSTradeStatsResponse(response.data)
        };
        
        // Cache the data for future requests (1 hour TTL)
        await cache.set(cacheKey, tradeStats, 3600);
        
        return tradeStats;
      } catch (error) {
        console.error('Error fetching trade stats from WITS API', error);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number }, message?: string, code?: string };
          
          if (axiosError.response?.status === 400) {
            throw new ApiError('Invalid parameters provided to WITS API', 400);
          } else if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            throw new ApiError('Unauthorized access to WITS API', 401);
          } else if (axiosError.response?.status === 404) {
            throw new ApiError('No trade statistics found for the specified parameters', 404);
          } else if (axiosError.response?.status === 413) {
            throw new ApiError('The requested data set is too large. Please narrow your query parameters', 413);
          } else if (axiosError.response?.status === 429) {
            throw new ApiError('WITS API rate limit exceeded. Try again later.', 429);
          } else {
            throw new ApiError(`WITS API error: ${axiosError.message || 'Unknown error'}`, 502);
          }
        }
        
        throw new ApiError('Failed to fetch trade stats from WITS API', 500);
      }
    },
    
    /**
     * Analyze tariffs for a specific product, reporter, and partner
     * @param reporterCode Reporter country code
     * @param partnerCode Partner country code
     * @param productCode Product code (HS code)
     * @param year Year
     * @returns Tariff analysis
     */
    analyzeTariffs: async function(
      reporterCode: string,
      partnerCode: string,
      productCode: string,
      year: number
    ): Promise<{
      simpleAverage: number;
      preferentialRates: Array<{ agreementCode: string; agreementName: string; rate: number }>;
      countryComparison: Array<{ country: string; tariffRate: number }>;
    }> {
      try {
        // Get tariff data
        const tariffData = await this.getTariffData(reporterCode, partnerCode, productCode, year);
        
        // Get tariff data for comparison countries (top 5 exporters to the reporter)
        const comparisonCountries = await getTopExportersToMarket(reporterCode, productCode, year);
        
        const countryComparison = await Promise.all(
          comparisonCountries.map(async (country) => {
            try {
              const countryTariffData = await this.getTariffData(reporterCode, country, productCode, year);
              return {
                country,
                tariffRate: countryTariffData.simpleAverage || 0
              };
            } catch (error) {
              console.warn(`Could not get tariff data for ${country}`, error);
              return {
                country,
                tariffRate: 0
              };
            }
          })
        );
        
        return {
          simpleAverage: tariffData.simpleAverage || 0,
          preferentialRates: tariffData.preferentialRates || [],
          countryComparison
        };
      } catch (error) {
        console.error('Error analyzing tariffs', error);
        
        if (error instanceof ApiError) {
          throw error;
        }
        
        throw new ApiError('Failed to analyze tariffs', 500);
      }
    },
    
    /**
     * Evaluate market access for a product in target markets
     * @param productCode Product code (HS code)
     * @param originCountry Origin country code
     * @param targetMarkets Array of target market country codes
     * @param year Year
     * @returns Market access evaluation
     */
    evaluateMarketAccess: async function(
      productCode: string,
      originCountry: string,
      targetMarkets: string[],
      year: number
    ): Promise<Array<{
      market: string;
      tariffRate: number;
      hasPreferentialAccess: boolean;
      competitivePosition: Array<{ country: string; tariffRate: number }>;
    }>> {
      try {
        const marketAccessScores = await Promise.all(
          targetMarkets.map(async (market) => {
            try {
              const tariffAnalysis = await this.analyzeTariffs(market, originCountry, productCode, year);
              
              return {
                market,
                tariffRate: tariffAnalysis.simpleAverage,
                hasPreferentialAccess: tariffAnalysis.preferentialRates.length > 0,
                competitivePosition: tariffAnalysis.countryComparison
              };
            } catch (error) {
              console.warn(`Could not evaluate market access for ${market}`, error);
              return {
                market,
                tariffRate: 0,
                hasPreferentialAccess: false,
                competitivePosition: []
              };
            }
          })
        );
        
        return marketAccessScores;
      } catch (error) {
        console.error('Error evaluating market access', error);
        
        if (error instanceof ApiError) {
          throw error;
        }
        
        throw new ApiError('Failed to evaluate market access', 500);
      }
    },
    
    /**
     * Test the WITS API connection
     * @returns Test result
     */
    testConnection: async function(): Promise<{ success: boolean; message: string }> {
      try {
        // Test with South African dried fruits (HS code 080620) exported to the UK
        const result = await this.getTariffData('GBR', 'ZAF', '080620', new Date().getFullYear() - 1);
        
        return {
          success: true,
          message: 'WITS API connection test successful'
        };
      } catch (error) {
        console.error('WITS API connection test failed', error);
        
        return {
          success: false,
          message: error instanceof ApiError ? error.message : 'WITS API connection test failed'
        };
      }
    }
  };
}

/**
 * Process the WITS tariff response to extract relevant information
 * @param responseData WITS API response data
 * @returns Processed tariff data
 */
function processWITSTariffResponse(responseData: WITSResponse): Partial<WITSTariffData> {
  // This is a placeholder implementation
  // In a real implementation, this would extract the relevant data from the WITS API response
  
  try {
    // Extract simple average tariff rate
    const simpleAverage = extractSimpleAverageTariff(responseData);
    
    // Extract weighted average tariff rate
    const weightedAverage = extractWeightedAverageTariff(responseData);
    
    // Extract preferential rates
    const preferentialRates = extractPreferentialRates(responseData);
    
    return {
      simpleAverage,
      weightedAverage,
      preferentialRates
    };
  } catch (error) {
    console.error('Error processing WITS tariff response', error);
    return {};
  }
}

/**
 * Process the WITS trade stats response to extract relevant information
 * @param responseData WITS API response data
 * @returns Processed trade stats data
 */
function processWITSTradeStatsResponse(responseData: WITSResponse): Partial<WITSTradeStats> {
  // This is a placeholder implementation
  // In a real implementation, this would extract the relevant data from the WITS API response
  
  try {
    // Extract any additional data needed
    return {};
  } catch (error) {
    console.error('Error processing WITS trade stats response', error);
    return {};
  }
}

/**
 * Extract simple average tariff rate from WITS API response
 * @param responseData WITS API response data
 * @returns Simple average tariff rate
 */
function extractSimpleAverageTariff(responseData: WITSResponse): number {
  // This is a placeholder implementation
  // In a real implementation, this would extract the simple average tariff rate from the WITS API response
  
  try {
    // Example implementation - adjust based on actual API response structure
    if (responseData && responseData.dataSeries && responseData.dataSeries.length > 0) {
      const simpleAverageSeries = responseData.dataSeries.find((series: any) => 
        series.seriesCode === 'AHS' || series.seriesName?.includes('Simple Average')
      );
      
      if (simpleAverageSeries && simpleAverageSeries.value !== undefined) {
        return parseFloat(simpleAverageSeries.value);
      }
    }
    
    return 0;
  } catch (error) {
    console.error('Error extracting simple average tariff', error);
    return 0;
  }
}

/**
 * Extract weighted average tariff rate from WITS API response
 * @param responseData WITS API response data
 * @returns Weighted average tariff rate
 */
function extractWeightedAverageTariff(responseData: WITSResponse): number {
  // This is a placeholder implementation
  // In a real implementation, this would extract the weighted average tariff rate from the WITS API response
  
  try {
    // Example implementation - adjust based on actual API response structure
    if (responseData && responseData.dataSeries && responseData.dataSeries.length > 0) {
      const weightedAverageSeries = responseData.dataSeries.find((series: any) => 
        series.seriesCode === 'WHS' || series.seriesName?.includes('Weighted Average')
      );
      
      if (weightedAverageSeries && weightedAverageSeries.value !== undefined) {
        return parseFloat(weightedAverageSeries.value);
      }
    }
    
    return 0;
  } catch (error) {
    console.error('Error extracting weighted average tariff', error);
    return 0;
  }
}

/**
 * Extract preferential rates from WITS API response
 * @param responseData WITS API response data
 * @returns Preferential rates
 */
function extractPreferentialRates(responseData: WITSResponse): Array<{ agreementCode: string; agreementName: string; rate: number }> {
  // This is a placeholder implementation
  // In a real implementation, this would extract the preferential rates from the WITS API response
  
  try {
    // Example implementation - adjust based on actual API response structure
    if (responseData && responseData.preferentialAgreements && responseData.preferentialAgreements.length > 0) {
      return responseData.preferentialAgreements.map((agreement: any) => ({
        agreementCode: agreement.agreementCode || '',
        agreementName: agreement.agreementName || '',
        rate: parseFloat(agreement.rate || 0)
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error extracting preferential rates', error);
    return [];
  }
}

/**
 * Get top exporters to a market for a specific product
 * @param marketCode Market country code
 * @param productCode Product code (HS code)
 * @param year Year
 * @returns Array of country codes
 */
async function getTopExportersToMarket(marketCode: string, productCode: string, year: number): Promise<string[]> {
  // This is a placeholder implementation
  // In a real implementation, this would get the top exporters to the market for the product
  
  // Return some example countries
  return ['CHN', 'USA', 'DEU', 'JPN', 'KOR'];
} 