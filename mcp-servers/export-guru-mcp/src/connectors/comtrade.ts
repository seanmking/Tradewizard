import axios from 'axios';
import { TradeFlowData } from '../types';
import { cache, cacheable } from '../utils/cache';
import { ApiError } from '../utils/error-handling';

interface ComtradeConfig {
  apiKey: string;
  baseUrl: string;
}

interface ComtradeParams {
  typeCode: string;
  freqCode: string;
  clCode: string;
  [key: string]: string | number | boolean;
}

interface ComtradeResponse {
  data: any[];
  count: number;
  message: string;
  validation: any[];
}

/**
 * Sets up the Comtrade connector for accessing UN Comtrade API
 * @param config Configuration for the Comtrade connector
 * @returns Object with methods to interact with the Comtrade API
 */
export function setupComtradeConnector(config: ComtradeConfig) {
  // Create axios instance with base configuration
  const api = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': config.apiKey
    },
    timeout: 30000 // 30 second timeout
  });
  
  return {
    /**
     * Get data from the Comtrade API
     * @param params Parameters for the Comtrade API
     * @returns API response data
     */
    getData: async function(params: ComtradeParams): Promise<ComtradeResponse> {
      try {
        // Create a cache key from the function name and arguments
        const cacheKey = `comtrade_getData_${JSON.stringify(params)}`;
        
        // Try to get from cache
        const cachedData = await cache.get<ComtradeResponse>(cacheKey);
        if (cachedData) {
          console.log('Retrieved data from cache', { cacheKey });
          return cachedData;
        }
        
        const { typeCode, freqCode, clCode, ...queryParams } = params;
        const url = `/getDA/${typeCode}/${freqCode}/${clCode}`;
        
        console.log('Fetching data from Comtrade API', { url, params: queryParams });
        
        const response = await api.get<ComtradeResponse>(url, { params: queryParams });
        
        // Cache the data for future requests (1 hour TTL)
        await cache.set(cacheKey, response.data, 3600);
        
        return response.data;
      } catch (error) {
        console.error('Error fetching data from Comtrade API', error);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number }, message?: string };
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            throw new ApiError('Unauthorized access to Comtrade API. Check your API key.', 401);
          } else if (axiosError.response?.status === 404) {
            return { data: [], count: 0, message: 'No data found', validation: [] }; // No data found, return empty response
          } else if (axiosError.response?.status === 429) {
            throw new ApiError('Comtrade API rate limit exceeded. Try again later.', 429);
          } else {
            throw new ApiError(`Comtrade API error: ${axiosError.message || 'Unknown error'}`, 502);
          }
        }
        
        throw new ApiError('Failed to fetch data from Comtrade API', 500);
      }
    },
    
    /**
     * Get trade data for specific reporter, partner, HS code and year
     * @param reporterCode Reporter country code
     * @param partnerCode Partner country code
     * @param hsCode HS code
     * @param year Year
     * @returns Trade flow data
     */
    getTradeData: async function(
      reporterCode: string,
      partnerCode: string,
      hsCode: string,
      year: number
    ): Promise<TradeFlowData[]> {
      try {
        // Create a cache key from the function name and arguments
        const cacheKey = `comtrade_getTradeData_${reporterCode}_${partnerCode}_${hsCode}_${year}`;
        
        // Try to get from cache
        const cachedData = await cache.get<TradeFlowData[]>(cacheKey);
        if (cachedData) {
          console.log('Retrieved trade data from cache', { cacheKey });
          return cachedData;
        }
        
        const params: ComtradeParams = {
          typeCode: 'C',  // Commodities
          freqCode: 'A',  // Annual
          clCode: 'HS',   // Harmonized System classification
          reporterCode,
          partnerCode,
          period: year,
          cmdCode: hsCode
        };
        
        const response = await api.get<ComtradeResponse>(`/getDA/${params.typeCode}/${params.freqCode}/${params.clCode}`, {
          params: {
            reporterCode: params.reporterCode,
            partnerCode: params.partnerCode,
            period: params.period,
            cmdCode: params.cmdCode
          }
        });
        
        // Transform response to our data model
        const tradeData = response.data.data.map((item: any) => ({
          exporterCountry: item.reporterCode || reporterCode,
          importerCountry: item.partnerCode || partnerCode,
          hsCode: item.cmdCode || hsCode,
          year: item.period || year,
          value: item.primaryValue || 0,
          quantity: item.netWgt,
          unit: 'kg',
          growth: item.growthRate,
          marketShare: item.marketShare
        }));
        
        // Cache the data for future requests (1 hour TTL)
        await cache.set(cacheKey, tradeData, 3600);
        
        return tradeData;
      } catch (error) {
        console.error('Error fetching trade data from Comtrade API', error);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number }, message?: string };
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            throw new ApiError('Unauthorized access to Comtrade API. Check your API key.', 401);
          } else if (axiosError.response?.status === 404) {
            return []; // No data found, return empty array
          } else if (axiosError.response?.status === 429) {
            throw new ApiError('Comtrade API rate limit exceeded. Try again later.', 429);
          } else {
            throw new ApiError(`Comtrade API error: ${axiosError.message || 'Unknown error'}`, 502);
          }
        }
        
        throw new ApiError('Failed to fetch trade data from Comtrade API', 500);
      }
    },
    
    /**
     * Get top exporters for a specific HS code
     * @param hsCode HS code
     * @param year Year
     * @param limit Number of results to return (default: 10)
     * @returns List of top exporters with trade values
     */
    getTopExportersByHsCode: async function(
      hsCode: string,
      year: number,
      limit: number = 10
    ): Promise<{ country: string; value: number; share: number }[]> {
      try {
        // Create a cache key from the function name and arguments
        const cacheKey = `comtrade_getTopExportersByHsCode_${hsCode}_${year}_${limit}`;
        
        // Try to get from cache
        const cachedData = await cache.get<{ country: string; value: number; share: number }[]>(cacheKey);
        if (cachedData) {
          console.log('Retrieved top exporters data from cache', { cacheKey });
          return cachedData;
        }
        
        const params: ComtradeParams = {
          typeCode: 'C',  // Commodities
          freqCode: 'A',  // Annual
          clCode: 'HS',   // Harmonized System classification
          period: year,
          cmdCode: hsCode,
          partnerCode: '0', // World
          reporterAreas: 'all'
        };
        
        const response = await api.get<ComtradeResponse>(`/getDA/${params.typeCode}/${params.freqCode}/${params.clCode}`, {
          params: {
            period: params.period,
            cmdCode: params.cmdCode,
            partnerCode: params.partnerCode,
            reporterAreas: params.reporterAreas
          }
        });
        
        // Sort by trade value and limit results
        const sortedData = response.data.data
          .sort((a: any, b: any) => b.primaryValue - a.primaryValue)
          .slice(0, limit);
        
        // Transform response to our data model
        const exporters = sortedData.map((item: any) => ({
          country: item.reporterCode,
          value: item.primaryValue || 0,
          share: item.primaryValuePercentage || 0
        }));
        
        // Cache the data for future requests (1 hour TTL)
        await cache.set(cacheKey, exporters, 3600);
        
        return exporters;
      } catch (error) {
        console.error('Error fetching top exporters from Comtrade API', error);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number }, message?: string };
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            throw new ApiError('Unauthorized access to Comtrade API. Check your API key.', 401);
          } else if (axiosError.response?.status === 404) {
            return []; // No data found, return empty array
          } else if (axiosError.response?.status === 429) {
            throw new ApiError('Comtrade API rate limit exceeded. Try again later.', 429);
          } else {
            throw new ApiError(`Comtrade API error: ${axiosError.message || 'Unknown error'}`, 502);
          }
        }
        
        throw new ApiError('Failed to fetch top exporters data from Comtrade API', 500);
      }
    },
    
    /**
     * Get market trends for a specific HS code and importer country
     * @param hsCode HS code
     * @param importerCountry Importer country code
     * @param startYear Start year
     * @param endYear End year
     * @returns Market trend data
     */
    getMarketTrends: async function(
      hsCode: string,
      importerCountry: string,
      startYear: number,
      endYear: number
    ): Promise<{ year: number; value: number; growth: number }[]> {
      try {
        // Create a cache key from the function name and arguments
        const cacheKey = `comtrade_getMarketTrends_${hsCode}_${importerCountry}_${startYear}_${endYear}`;
        
        // Try to get from cache
        const cachedData = await cache.get<{ year: number; value: number; growth: number }[]>(cacheKey);
        if (cachedData) {
          console.log('Retrieved market trends data from cache', { cacheKey });
          return cachedData;
        }
        
        const years = Array.from(
          { length: endYear - startYear + 1 },
          (_, i) => startYear + i
        );
        
        const results = await Promise.all(
          years.map(async (year) => {
            const params: ComtradeParams = {
              typeCode: 'C',  // Commodities
              freqCode: 'A',  // Annual
              clCode: 'HS',   // Harmonized System classification
              reporterCode: '0', // World
              partnerCode: importerCountry,
              period: year,
              cmdCode: hsCode
            };
            
            try {
              const response = await api.get<ComtradeResponse>(`/getDA/${params.typeCode}/${params.freqCode}/${params.clCode}`, {
                params: {
                  reporterCode: params.reporterCode,
                  partnerCode: params.partnerCode,
                  period: params.period,
                  cmdCode: params.cmdCode
                }
              });
              
              // Sum up all trade values for this year
              const totalValue = response.data.data.reduce(
                (sum: number, item: any) => sum + (item.primaryValue || 0),
                0
              );
              
              return {
                year,
                value: totalValue,
                growth: 0 // Will calculate growth later
              };
            } catch (error) {
              console.warn(`No data for year ${year}`, error);
              return {
                year,
                value: 0,
                growth: 0
              };
            }
          })
        );
        
        // Calculate growth rates
        const trendsWithGrowth = results
          .filter(item => item.value > 0) // Filter out years with no data
          .map((item, index, array) => {
            if (index === 0) {
              return item; // No previous year to calculate growth
            }
            
            const prevValue = array[index - 1].value;
            const growth = prevValue > 0
              ? ((item.value - prevValue) / prevValue) * 100
              : 0;
            
            return {
              ...item,
              growth: parseFloat(growth.toFixed(2))
            };
          });
        
        // Cache the data for future requests (1 hour TTL)
        await cache.set(cacheKey, trendsWithGrowth, 3600);
        
        return trendsWithGrowth;
      } catch (error) {
        console.error('Error fetching market trends from Comtrade API', error);
        
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as { response?: { status?: number }, message?: string };
          if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            throw new ApiError('Unauthorized access to Comtrade API. Check your API key.', 401);
          } else if (axiosError.response?.status === 404) {
            return []; // No data found, return empty array
          } else if (axiosError.response?.status === 429) {
            throw new ApiError('Comtrade API rate limit exceeded. Try again later.', 429);
          } else {
            throw new ApiError(`Comtrade API error: ${axiosError.message || 'Unknown error'}`, 502);
          }
        }
        
        throw new ApiError('Failed to fetch market trends data from Comtrade API', 500);
      }
    }
  };
} 