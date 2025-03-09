import axios from 'axios';
import { TradeFlowData } from '../types';
import { cache, cacheable } from '../utils/cache';
import { ApiError } from '../utils/error-handling';

interface TradeMapConfig {
  apiKey: string;
  baseUrl: string;
}

interface TradeMapResponse {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

// Define AxiosError interface if not available from axios
interface AxiosError {
  response?: {
    status: number;
    data: any;
  };
  message: string;
}

export function setupTradeMapConnector(config: TradeMapConfig) {
  // Create axios instance with base configuration
  const api = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    }
  });
  
  // Define the functions without cacheable first
  const getTradeFlowByHsCodeFn = async (
    hsCode: string,
    exporterCountry?: string,
    importerCountry?: string,
    year?: number
  ): Promise<TradeFlowData[]> => {
    try {
      // Build query parameters
      const params: Record<string, any> = {
        reporter: exporterCountry,
        partner: importerCountry,
        productCode: hsCode,
        year: year
      };
      
      // Remove undefined parameters
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) {
          delete params[key];
        }
      });
      
      // Make API request
      const response = await api.get('/tradedata', { params });
      
      // Transform response to our data model
      const responseData = response.data as TradeMapResponse;
      return responseData.data.map((item: any) => ({
        exporterCountry: item.reporterCode,
        importerCountry: item.partnerCode,
        hsCode: item.productCode,
        year: item.year,
        value: item.tradeValue,
        quantity: item.quantity,
        unit: item.quantityUnit
      }));
    } catch (error) {
      console.error('Error fetching trade flow data:', error);
      
      // Type guard for AxiosError
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          throw new ApiError('Unauthorized access to Trade Map API. Check your API key.', 401);
        } else if (axiosError.response?.status === 404) {
          return []; // No data found, return empty array
        } else {
          throw new ApiError(`Trade Map API error: ${axiosError.message || 'Unknown error'}`, 502);
        }
      }
      
      throw new ApiError('Failed to fetch trade flow data', 500);
    }
  };
  
  const getMarketTrendsFn = async (
    hsCode: string,
    importerCountry: string,
    years: number = 5
  ): Promise<any[]> => {
    try {
      // Calculate start year
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - years;
      
      // Build query parameters
      const params = {
        productCode: hsCode,
        partner: importerCountry,
        startYear: startYear,
        endYear: currentYear
      };
      
      // Make API request
      const response = await api.get('/trends', { params });
      
      // Transform response to our data model
      const responseData = response.data as TradeMapResponse;
      return responseData.data.map((item: any) => ({
        year: item.year,
        value: item.tradeValue,
        growth: item.growthRate
      }));
    } catch (error) {
      console.error('Error fetching market trends:', error);
      
      // Type guard for AxiosError
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 401) {
          throw new ApiError('Unauthorized access to Trade Map API. Check your API key.', 401);
        } else if (axiosError.response?.status === 404) {
          return []; // No data found, return empty array
        } else {
          throw new ApiError(`Trade Map API error: ${axiosError.message || 'Unknown error'}`, 502);
        }
      }
      
      throw new ApiError('Failed to fetch market trends data', 500);
    }
  };
  
  // Create a simple wrapper function for cacheable
  const createCachedFunction = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
    // @ts-ignore - We know this is safe
    return cacheable(3600)(fn);
  };
  
  return {
    /**
     * Get trade flow data for a specific HS code
     * @param hsCode HS code (6 digits)
     * @param exporterCountry Exporter country code (ISO)
     * @param importerCountry Importer country code (ISO)
     * @param year Year (default: latest available)
     * @returns Trade flow data
     */
    getTradeFlowByHsCode: createCachedFunction(getTradeFlowByHsCodeFn),
    
    /**
     * Get market trends for a specific HS code and importer country
     * @param hsCode HS code (6 digits)
     * @param importerCountry Importer country code (ISO)
     * @param years Number of years to include (default: 5)
     * @returns Market trend data
     */
    getMarketTrends: createCachedFunction(getMarketTrendsFn)
  };
}