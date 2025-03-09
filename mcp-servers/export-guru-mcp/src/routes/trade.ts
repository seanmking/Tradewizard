import express, { Request, Response, NextFunction } from 'express';
import { setupTradeDbConnector } from '../connectors/trade-db';
import { ApiError } from '../utils/error-handling';

const router = express.Router();

// Initialize the trade database connector
const tradeDb = setupTradeDbConnector({
  connectionString: process.env.TRADE_DB_URL || 'postgresql://postgres:postgres@localhost:5432/trade_db'
});

/**
 * @route GET /api/trade/data
 * @desc Query trade data based on specified parameters
 * @access Public
 */
router.get('/data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      reporterCountry,
      partnerCountry,
      hsCode,
      hsCodeMatchType,
      year,
      month,
      tradeFlow,
      sortBy,
      sortDirection,
      limit,
      offset
    } = req.query;
    
    const query = {
      reporterCountry: reporterCountry as string | undefined,
      partnerCountry: partnerCountry as string | undefined,
      hsCode: hsCode as string | undefined,
      hsCodeMatchType: hsCodeMatchType as 'exact' | 'prefix' | undefined,
      year: year ? parseInt(year as string) : undefined,
      month: month ? parseInt(month as string) : undefined,
      tradeFlow: tradeFlow as string | undefined,
      sortBy: sortBy as string | undefined,
      sortDirection: sortDirection as 'ASC' | 'DESC' | undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    };
    
    const tradeData = await tradeDb.queryTradeData(query);
    
    res.json({
      success: true,
      data: tradeData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/trade/partners
 * @desc Get top trade partners for a specific country
 * @access Public
 */
router.get('/partners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { countryCode, year, tradeFlow, limit } = req.query;
    
    if (!countryCode || !year || !tradeFlow) {
      throw new ApiError('Country code, year, and trade flow are required', 400);
    }
    
    const partners = await tradeDb.getTopTradePartners(
      countryCode as string,
      parseInt(year as string),
      tradeFlow as string,
      limit ? parseInt(limit as string) : 10
    );
    
    res.json({
      success: true,
      data: partners
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/trade/products
 * @desc Get top products traded between two countries
 * @access Public
 */
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reporterCountry, partnerCountry, year, tradeFlow, limit } = req.query;
    
    if (!reporterCountry || !partnerCountry || !year || !tradeFlow) {
      throw new ApiError('Reporter country, partner country, year, and trade flow are required', 400);
    }
    
    const products = await tradeDb.getTopProducts(
      reporterCountry as string,
      partnerCountry as string,
      parseInt(year as string),
      tradeFlow as string,
      limit ? parseInt(limit as string) : 10
    );
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/trade/historical
 * @desc Get historical trade data for a specific product
 * @access Public
 */
router.get('/historical', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reporterCountry, partnerCountry, hsCode, tradeFlow, years } = req.query;
    
    if (!reporterCountry || !partnerCountry || !hsCode || !tradeFlow) {
      throw new ApiError('Reporter country, partner country, HS code, and trade flow are required', 400);
    }
    
    const historicalData = await tradeDb.getHistoricalData(
      reporterCountry as string,
      partnerCountry as string,
      hsCode as string,
      tradeFlow as string,
      years ? parseInt(years as string) : 5
    );
    
    res.json({
      success: true,
      data: historicalData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/trade/data
 * @desc Add trade data to the database
 * @access Private
 */
router.post('/data', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tradeData = req.body;
    
    if (!tradeData.reporterCountry || !tradeData.partnerCountry || !tradeData.year || 
        !tradeData.hsCode || !tradeData.tradeFlow || tradeData.valueUsd === undefined) {
      throw new ApiError('Missing required fields', 400);
    }
    
    const success = await tradeDb.addTradeData(tradeData);
    
    res.status(201).json({
      success,
      message: 'Trade data added successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/trade/bulk
 * @desc Add multiple trade data records in bulk
 * @access Private
 */
router.post('/bulk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data } = req.body;
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new ApiError('Invalid data format. Expected an array of trade data records', 400);
    }
    
    const addedCount = await tradeDb.bulkAddTradeData(data);
    
    res.status(201).json({
      success: true,
      message: `Successfully added ${addedCount} trade data records`,
      count: addedCount
    });
  } catch (error) {
    next(error);
  }
});

export default router; 