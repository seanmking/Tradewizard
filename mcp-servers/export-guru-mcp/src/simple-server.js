const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create PostgreSQL connection pools
const regulatoryDb = new Pool({
  connectionString: process.env.REGULATORY_DB_URL || 'postgresql://seanking@localhost:5432/regulatory_db'
});

const tradeDb = new Pool({
  connectionString: process.env.TRADE_DB_URL || 'postgresql://seanking@localhost:5432/trade_db'
});

// Test database connections
regulatoryDb.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to regulatory database:', err);
  } else {
    console.log('Connected to regulatory database at:', res.rows[0].now);
  }
});

tradeDb.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to trade database:', err);
  } else {
    console.log('Connected to trade database at:', res.rows[0].now);
  }
});

// Smithery PostgreSQL MCP Server client
const smitheryPostgresClient = {
  analyzeDatabase: async (connectionString, analysisType) => {
    try {
      const response = await axios.post('http://localhost:3002/mcp', {
        tool: 'analyze_database',
        params: {
          connectionString,
          analysisType
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error calling Smithery PostgreSQL MCP Server:', error.message);
      throw new Error('Failed to analyze database');
    }
  },
  
  optimizeQuery: async (connectionString, query, parameters) => {
    try {
      const response = await axios.post('http://localhost:3002/mcp', {
        tool: 'optimize_query',
        params: {
          connectionString,
          query,
          parameters
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error calling Smithery PostgreSQL MCP Server:', error.message);
      throw new Error('Failed to optimize query');
    }
  },
  
  getSetupInstructions: async (platform, version, purpose) => {
    try {
      const response = await axios.post('http://localhost:3002/mcp', {
        tool: 'postgres_setup_instructions',
        params: {
          platform,
          version,
          purpose
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error calling Smithery PostgreSQL MCP Server:', error.message);
      throw new Error('Failed to get setup instructions');
    }
  }
};

// Regulatory requirements endpoint
app.get('/api/regulatory/requirements', async (req, res) => {
  try {
    const { country, productCategory, hsCode } = req.query;
    
    if (!country || !productCategory) {
      return res.status(400).json({
        success: false,
        error: 'Country and product category are required'
      });
    }
    
    let query = `
      SELECT * FROM regulatory_requirements 
      WHERE country = $1 AND product_category = $2
    `;
    
    const params = [country, productCategory];
    
    if (hsCode) {
      query += ` AND (hs_code = $3 OR hs_code IS NULL)`;
      params.push(hsCode);
    }
    
    // Try to optimize the query using Smithery PostgreSQL MCP Server
    try {
      const optimizationResult = await smitheryPostgresClient.optimizeQuery(
        process.env.REGULATORY_DB_URL || 'postgresql://seanking@localhost:5432/regulatory_db',
        query,
        params
      );
      
      console.log('Query optimization result:', optimizationResult);
      
      // Use the optimized query if available
      if (optimizationResult && optimizationResult.optimizedQuery) {
        query = optimizationResult.optimizedQuery;
      }
    } catch (error) {
      console.warn('Could not optimize query:', error.message);
    }
    
    const result = await regulatoryDb.query(query, params);
    
    // Map the database results to the response format
    const requirements = result.rows.map(row => ({
      country: row.country,
      productCategory: row.product_category,
      hsCode: row.hs_code,
      requirementType: row.requirement_type,
      description: row.description,
      agency: row.agency,
      url: row.url,
      lastUpdated: row.last_updated ? new Date(row.last_updated).toISOString() : undefined,
      confidence: row.confidence
    }));
    
    res.json({
      success: true,
      data: requirements
    });
  } catch (error) {
    console.error('Error fetching regulatory requirements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch regulatory requirements'
    });
  }
});

// Trade data endpoint
app.get('/api/trade/data', async (req, res) => {
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
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    
    if (reporterCountry) {
      conditions.push(`reporter_country = $${paramIndex++}`);
      params.push(reporterCountry);
    }
    
    if (partnerCountry) {
      conditions.push(`partner_country = $${paramIndex++}`);
      params.push(partnerCountry);
    }
    
    if (hsCode) {
      // Handle partial HS code matching (e.g., first 2, 4, or 6 digits)
      if (hsCodeMatchType === 'prefix') {
        conditions.push(`hs_code LIKE $${paramIndex++}`);
        params.push(`${hsCode}%`);
      } else {
        conditions.push(`hs_code = $${paramIndex++}`);
        params.push(hsCode);
      }
    }
    
    if (year) {
      conditions.push(`year = $${paramIndex++}`);
      params.push(parseInt(year));
    }
    
    if (month) {
      conditions.push(`month = $${paramIndex++}`);
      params.push(parseInt(month));
    }
    
    if (tradeFlow) {
      conditions.push(`trade_flow = $${paramIndex++}`);
      params.push(tradeFlow);
    }
    
    // Build the WHERE clause
    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}` 
      : '';
    
    // Add sorting and limits
    const orderBy = sortBy 
      ? `ORDER BY ${sortBy} ${sortDirection || 'DESC'}` 
      : 'ORDER BY year DESC, month DESC';
    
    const limitClause = limit ? `LIMIT ${parseInt(limit)}` : 'LIMIT 100';
    const offsetClause = offset ? `OFFSET ${parseInt(offset)}` : '';
    
    const sqlQuery = `
      SELECT * FROM trade_data 
      ${whereClause} 
      ${orderBy} 
      ${limitClause} 
      ${offsetClause}
    `;
    
    // Try to optimize the query using Smithery PostgreSQL MCP Server
    let optimizedQuery = sqlQuery;
    try {
      const optimizationResult = await smitheryPostgresClient.optimizeQuery(
        process.env.TRADE_DB_URL || 'postgresql://seanking@localhost:5432/trade_db',
        sqlQuery,
        params
      );
      
      console.log('Query optimization result:', optimizationResult);
      
      // Use the optimized query if available
      if (optimizationResult && optimizationResult.optimizedQuery) {
        optimizedQuery = optimizationResult.optimizedQuery;
      }
    } catch (error) {
      console.warn('Could not optimize query:', error.message);
    }
    
    const result = await tradeDb.query(optimizedQuery, params);
    
    // Map the database results to the response format
    const tradeData = result.rows.map(row => ({
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
    
    res.json({
      success: true,
      data: tradeData
    });
  } catch (error) {
    console.error('Error querying trade data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to query trade data'
    });
  }
});

// PostgreSQL analysis endpoint
app.get('/api/postgres/analyze', async (req, res) => {
  try {
    const { database, analysisType } = req.query;
    
    if (!database) {
      return res.status(400).json({
        success: false,
        error: 'Database parameter is required (regulatory or trade)'
      });
    }
    
    const connectionString = database === 'regulatory'
      ? (process.env.REGULATORY_DB_URL || 'postgresql://seanking@localhost:5432/regulatory_db')
      : (process.env.TRADE_DB_URL || 'postgresql://seanking@localhost:5432/trade_db');
    
    const analysisResult = await smitheryPostgresClient.analyzeDatabase(
      connectionString,
      analysisType || 'performance'
    );
    
    res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    console.error('Error analyzing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze database'
    });
  }
});

// PostgreSQL setup instructions endpoint
app.get('/api/postgres/setup', async (req, res) => {
  try {
    const { platform, version, purpose } = req.query;
    
    const setupInstructions = await smitheryPostgresClient.getSetupInstructions(
      platform || 'macos',
      version || '15',
      purpose || 'development'
    );
    
    res.json({
      success: true,
      data: setupInstructions
    });
  } catch (error) {
    console.error('Error getting setup instructions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get setup instructions'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 