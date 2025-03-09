import { Pool } from 'pg';
import { TradeData, TradeDataQuery, TradePartner, TradePartnerStats } from '../types';
import { ApiError } from '../utils/error-handling';

interface TradeDbConfig {
  connectionString: string;
}

/**
 * Sets up the Trade Database connector
 * @param config Configuration for the Trade DB connector
 * @returns Object with methods to interact with the Trade DB
 */
export function setupTradeDbConnector(config: TradeDbConfig) {
  // Create a connection pool
  const pool = new Pool({
    connectionString: config.connectionString,
  });
  
  // Test the connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Error connecting to trade database:', err);
    } else {
      console.log('Connected to trade database at:', res.rows[0].now);
    }
  });
  
  // Initialize the database schema if it doesn't exist
  const initializeDatabase = async () => {
    try {
      // Create the trade_data table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS trade_data (
          id SERIAL PRIMARY KEY,
          reporter_country VARCHAR(3) NOT NULL,
          partner_country VARCHAR(3) NOT NULL,
          year INTEGER NOT NULL,
          month INTEGER,
          hs_code VARCHAR(10) NOT NULL,
          product_description TEXT,
          trade_flow VARCHAR(10) NOT NULL,
          value_usd NUMERIC(15,2) NOT NULL,
          quantity NUMERIC(15,2),
          quantity_unit VARCHAR(20),
          source VARCHAR(100) NOT NULL,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create index for faster queries
      await pool.query(`
        CREATE INDEX IF NOT EXISTS trade_data_query_idx ON trade_data 
        (reporter_country, partner_country, hs_code, year, trade_flow)
      `);
      
      console.log('Trade database schema initialized');
    } catch (error) {
      console.error('Error initializing trade database schema:', error);
    }
  };
  
  // Initialize the database
  initializeDatabase();
  
  return {
    /**
     * Query trade data based on specified parameters
     * @param query Trade data query parameters
     * @returns Array of trade data matching the query
     */
    queryTradeData: async function(query: TradeDataQuery): Promise<TradeData[]> {
      try {
        const conditions: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        
        if (query.reporterCountry) {
          conditions.push(`reporter_country = $${paramIndex++}`);
          params.push(query.reporterCountry);
        }
        
        if (query.partnerCountry) {
          conditions.push(`partner_country = $${paramIndex++}`);
          params.push(query.partnerCountry);
        }
        
        if (query.hsCode) {
          // Handle partial HS code matching (e.g., first 2, 4, or 6 digits)
          if (query.hsCodeMatchType === 'prefix') {
            conditions.push(`hs_code LIKE $${paramIndex++}`);
            params.push(`${query.hsCode}%`);
          } else {
            conditions.push(`hs_code = $${paramIndex++}`);
            params.push(query.hsCode);
          }
        }
        
        if (query.year) {
          conditions.push(`year = $${paramIndex++}`);
          params.push(query.year);
        }
        
        if (query.month) {
          conditions.push(`month = $${paramIndex++}`);
          params.push(query.month);
        }
        
        if (query.tradeFlow) {
          conditions.push(`trade_flow = $${paramIndex++}`);
          params.push(query.tradeFlow);
        }
        
        // Build the WHERE clause
        const whereClause = conditions.length > 0 
          ? `WHERE ${conditions.join(' AND ')}` 
          : '';
        
        // Add sorting and limits
        const orderBy = query.sortBy 
          ? `ORDER BY ${query.sortBy} ${query.sortDirection || 'DESC'}` 
          : 'ORDER BY year DESC, month DESC';
        
        const limit = query.limit ? `LIMIT ${query.limit}` : 'LIMIT 100';
        const offset = query.offset ? `OFFSET ${query.offset}` : '';
        
        const sqlQuery = `
          SELECT * FROM trade_data 
          ${whereClause} 
          ${orderBy} 
          ${limit} 
          ${offset}
        `;
        
        const result = await pool.query(sqlQuery, params);
        
        // Map the database results to the TradeData interface
        return result.rows.map(row => ({
          reporterCountry: row.reporter_country,
          partnerCountry: row.partner_country,
          year: row.year,
          month: row.month,
          hsCode: row.hs_code,
          productDescription: row.product_description,
          tradeFlow: row.trade_flow,
          valueUsd: parseFloat(row.value_usd),
          quantity: row.quantity ? parseFloat(row.quantity) : undefined,
          quantityUnit: row.quantity_unit,
          source: row.source,
          lastUpdated: row.last_updated ? new Date(row.last_updated).toISOString() : undefined
        }));
      } catch (error) {
        console.error('Error querying trade data:', error);
        throw new ApiError('Failed to query trade data', 500);
      }
    },
    
    /**
     * Get top trade partners for a specific country
     * @param countryCode Country code
     * @param year Year for the data
     * @param tradeFlow Trade flow (export/import)
     * @param limit Number of partners to return
     * @returns Array of top trade partners with statistics
     */
    getTopTradePartners: async function(
      countryCode: string,
      year: number,
      tradeFlow: string,
      limit: number = 10
    ): Promise<TradePartnerStats[]> {
      try {
        const query = `
          SELECT 
            partner_country, 
            SUM(value_usd) as total_value,
            COUNT(DISTINCT hs_code) as product_count
          FROM trade_data
          WHERE reporter_country = $1 AND year = $2 AND trade_flow = $3
          GROUP BY partner_country
          ORDER BY total_value DESC
          LIMIT $4
        `;
        
        const result = await pool.query(query, [countryCode, year, tradeFlow, limit]);
        
        return result.rows.map(row => ({
          partnerCountry: row.partner_country,
          totalValueUsd: parseFloat(row.total_value),
          productCount: parseInt(row.product_count),
          year: year,
          tradeFlow: tradeFlow
        }));
      } catch (error) {
        console.error('Error fetching top trade partners:', error);
        throw new ApiError('Failed to fetch top trade partners', 500);
      }
    },
    
    /**
     * Get top products traded between two countries
     * @param reporterCountry Reporter country code
     * @param partnerCountry Partner country code
     * @param year Year for the data
     * @param tradeFlow Trade flow (export/import)
     * @param limit Number of products to return
     * @returns Array of top traded products
     */
    getTopProducts: async function(
      reporterCountry: string,
      partnerCountry: string,
      year: number,
      tradeFlow: string,
      limit: number = 10
    ): Promise<TradeData[]> {
      try {
        const query = `
          SELECT 
            hs_code,
            product_description,
            SUM(value_usd) as total_value,
            reporter_country,
            partner_country,
            year,
            trade_flow
          FROM trade_data
          WHERE 
            reporter_country = $1 AND 
            partner_country = $2 AND 
            year = $3 AND 
            trade_flow = $4
          GROUP BY 
            hs_code, product_description, reporter_country, partner_country, year, trade_flow
          ORDER BY total_value DESC
          LIMIT $5
        `;
        
        const result = await pool.query(query, [
          reporterCountry, 
          partnerCountry, 
          year, 
          tradeFlow, 
          limit
        ]);
        
        return result.rows.map(row => ({
          reporterCountry: row.reporter_country,
          partnerCountry: row.partner_country,
          year: row.year,
          hsCode: row.hs_code,
          productDescription: row.product_description,
          tradeFlow: row.trade_flow,
          valueUsd: parseFloat(row.total_value),
          source: 'Aggregated'
        }));
      } catch (error) {
        console.error('Error fetching top products:', error);
        throw new ApiError('Failed to fetch top products', 500);
      }
    },
    
    /**
     * Get historical trade data for a specific product
     * @param reporterCountry Reporter country code
     * @param partnerCountry Partner country code
     * @param hsCode HS code
     * @param tradeFlow Trade flow (export/import)
     * @param years Number of years to include
     * @returns Array of historical trade data
     */
    getHistoricalData: async function(
      reporterCountry: string,
      partnerCountry: string,
      hsCode: string,
      tradeFlow: string,
      years: number = 5
    ): Promise<TradeData[]> {
      try {
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - years;
        
        const query = `
          SELECT 
            reporter_country,
            partner_country,
            year,
            hs_code,
            product_description,
            trade_flow,
            SUM(value_usd) as total_value,
            source
          FROM trade_data
          WHERE 
            reporter_country = $1 AND 
            partner_country = $2 AND 
            hs_code = $3 AND 
            trade_flow = $4 AND
            year >= $5
          GROUP BY 
            reporter_country, partner_country, year, hs_code, product_description, trade_flow, source
          ORDER BY year ASC
        `;
        
        const result = await pool.query(query, [
          reporterCountry, 
          partnerCountry, 
          hsCode, 
          tradeFlow, 
          startYear
        ]);
        
        return result.rows.map(row => ({
          reporterCountry: row.reporter_country,
          partnerCountry: row.partner_country,
          year: row.year,
          hsCode: row.hs_code,
          productDescription: row.product_description,
          tradeFlow: row.trade_flow,
          valueUsd: parseFloat(row.total_value),
          source: row.source
        }));
      } catch (error) {
        console.error('Error fetching historical data:', error);
        throw new ApiError('Failed to fetch historical trade data', 500);
      }
    },
    
    /**
     * Add trade data to the database
     * @param data Trade data to add
     * @returns Success status
     */
    addTradeData: async function(data: TradeData): Promise<boolean> {
      try {
        const query = `
          INSERT INTO trade_data (
            reporter_country, partner_country, year, month, hs_code,
            product_description, trade_flow, value_usd, quantity, quantity_unit, source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        
        await pool.query(query, [
          data.reporterCountry,
          data.partnerCountry,
          data.year,
          data.month || null,
          data.hsCode,
          data.productDescription || null,
          data.tradeFlow,
          data.valueUsd,
          data.quantity || null,
          data.quantityUnit || null,
          data.source
        ]);
        
        return true;
      } catch (error) {
        console.error('Error adding trade data:', error);
        throw new ApiError('Failed to add trade data', 500);
      }
    },
    
    /**
     * Add multiple trade data records in bulk
     * @param dataArray Array of trade data to add
     * @returns Number of records added
     */
    bulkAddTradeData: async function(dataArray: TradeData[]): Promise<number> {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        let addedCount = 0;
        
        for (const data of dataArray) {
          const query = `
            INSERT INTO trade_data (
              reporter_country, partner_country, year, month, hs_code,
              product_description, trade_flow, value_usd, quantity, quantity_unit, source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `;
          
          await client.query(query, [
            data.reporterCountry,
            data.partnerCountry,
            data.year,
            data.month || null,
            data.hsCode,
            data.productDescription || null,
            data.tradeFlow,
            data.valueUsd,
            data.quantity || null,
            data.quantityUnit || null,
            data.source
          ]);
          
          addedCount++;
        }
        
        await client.query('COMMIT');
        return addedCount;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error bulk adding trade data:', error);
        throw new ApiError('Failed to bulk add trade data', 500);
      } finally {
        client.release();
      }
    },
    
    /**
     * Close the database connection pool
     */
    close: async function(): Promise<void> {
      await pool.end();
    }
  };
} 