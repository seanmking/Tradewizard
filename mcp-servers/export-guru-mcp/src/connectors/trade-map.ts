import axios from 'axios';
import { TradeFlowData } from '../types';
import { cache, cacheable } from '../utils/cache';
import { ApiError } from '../utils/error-handling';

interface TradeMapConfig {
  apiKey: string;
  baseUrl: string;
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
  
  return {
    /**
     * Get trade flow data for a specific HS code
     * @param hsCode HS code (6 digits)
     * @param exporterCountry Exporter country code (ISO)
     * @param importerCountry Importer country code (ISO)
     * @param year Year (default: latest available)
     * @returns Trade flow data
     */
    getTradeFlowByHsCode: cacheable(3600)(async (
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
        return response.data.data.map((item: any) => ({
          exporterCountry: item.reporterCode,
          importerCountry: item.partnerCode,
          hsCode: item.productCode,
          year: item.year,
          value: item.tradeValue,
          quantity: item.quantity,
          unit: item.quantityUnit,
          growth: item.growthRate,
          marketShare: item.marketShare
        }));
      } catch (error) {
        console.error('Error fetching trade flow data:', error);
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            throw new ApiError('Unauthorized access to Trade Map API. Check your API key.', 401);
          } else if (error.response?.status === 404) {
            return []; // No data found, return empty array
          } else {
            throw new ApiError(`Trade Map API error: ${error.message}`, 502);
          }
        }
        
        throw new ApiError('Failed to fetch trade flow data', 500);
      }
    }),
    
    /**
     * Get top exporters for a specific HS code
     * @param hsCode HS code (6 digits)
     * @param limit Number of results to return (default: 10)
     * @param year Year (default: latest available)
     * @returns List of top exporters with trade values
     */
    getTopExportersByHsCode: cacheable(3600)(async (
      hsCode: string,
      limit: number = 10,
      year?: number
    ): Promise<{ country: string; value: number; share: number }[]> => {
      try {
        // Build query parameters
        const params: Record<string, any> = {
          productCode: hsCode,
          year: year,
          limit
        };
        
        // Remove undefined parameters
        Object.keys(params).forEach(key => {
          if (params[key] === undefined) {
            delete params[key];
          }
        });
        
        // Make API request
        const response = await api.get('/exporters', { params });
        
        // Transform response to our data model
        return response.data.data.map((item: any) => ({
          country: item.reporterCode,
          value: item.tradeValue,
          share: item.shareInWorld
        }));
      } catch (error) {
        console.error('Error fetching top exporters:', error);
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            throw new ApiError('Unauthorized access to Trade Map API. Check your API key.', 401);
          } else if (error.response?.status === 404) {
            return []; // No data found, return empty array
          } else {
            throw new ApiError(`Trade Map API error: ${error.message}`, 502);
          }
        }
        
        throw new ApiError('Failed to fetch top exporters data', 500);
      }
    }),
    
    /**
     * Get market trends for a specific HS code
     * @param hsCode HS code (6 digits)
     * @param importerCountry Importer country code (ISO)
     * @param years Number of years to analyze (default: 5)
     * @returns Market trend data
     */
    getMarketTrends: cacheable(3600)(async (
      hsCode: string,
      importerCountry: string,
      years: number = 5
    ): Promise<{ year: number; value: number; growth: number }[]> => {
      try {
        // Calculate start year
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - years;
        
        // Build query parameters
        const params: Record<string, any> = {
          productCode: hsCode,
          partner: importerCountry,
          startYear,
          endYear: currentYear
        };
        
        // Make API request
        const response = await api.get('/trends', { params });
        
        // Transform response to our data model
        return response.data.data.map((item: any) => ({
          year: item.year,
          value: item.tradeValue,
          growth: item.growthRate
        }));
      } catch (error) {
        console.error('Error fetching market trends:', error);
        
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            throw new ApiError('Unauthorized access to Trade Map API. Check your API key.', 401);
          } else if (error.response?.status === 404) {
            return []; // No data found, return empty array
          } else {
            throw new ApiError(`Trade Map API error: ${error.message}`, 502);
          }
        }
        
        throw new ApiError('Failed to fetch market trends data', 500);
      }
    })
  };
}