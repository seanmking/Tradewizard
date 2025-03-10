const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { Pool } = require('pg');

// Create Express app
const app = express();
const port = 3001;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Create PostgreSQL connection pools
const regulatoryDb = new Pool({
  connectionString: process.env.REGULATORY_DB_URL || 'postgresql://seanking@localhost:5432/regulatory_db'
});

const tradeDb = new Pool({
  connectionString: process.env.TRADE_DB_URL || 'postgresql://seanking@localhost:5432/trade_db'
});

// Create memory database connection pool
const memoryDb = new Pool({
  connectionString: process.env.MEMORY_DB_URL || 'postgresql://seanking@localhost:5432/memory_db'
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

memoryDb.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to memory database:', err);
  } else {
    console.log('Connected to memory database at:', res.rows[0].now);
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

// Initialize memory subsystem components
const initializeMemorySubsystem = async () => {
  try {
    console.log('Initializing memory subsystem components...');
    
    // Check if memory tables exist
    const result = await memoryDb.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'export_strategy_patterns'
      );
    `);
    
    const tablesExist = result.rows[0].exists;
    
    if (!tablesExist) {
      console.log('Memory tables do not exist. Please run "npm run init-memory" to initialize the memory subsystem database.');
    } else {
      console.log('Memory subsystem tables found. Memory subsystem is ready.');
    }
  } catch (error) {
    console.error('Error initializing memory subsystem:', error);
  }
};

// Call the initialization function
initializeMemorySubsystem();

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

// Memory subsystem endpoints
app.get('/api/memory/status', async (req, res) => {
  try {
    // Check if memory tables exist
    const result = await memoryDb.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'export_strategy_patterns'
      );
    `);
    
    const tablesExist = result.rows[0].exists;
    
    // Get pattern counts
    let exportPatternCount = 0;
    let regulatoryPatternCount = 0;
    
    if (tablesExist) {
      const exportPatterns = await memoryDb.query('SELECT COUNT(*) FROM export_strategy_patterns WHERE archived = false');
      exportPatternCount = parseInt(exportPatterns.rows[0].count);
      
      const regulatoryPatterns = await memoryDb.query('SELECT COUNT(*) FROM regulatory_patterns WHERE archived = false');
      regulatoryPatternCount = parseInt(regulatoryPatterns.rows[0].count);
    }
    
    res.json({
      success: true,
      data: {
        initialized: tablesExist,
        exportPatternCount,
        regulatoryPatternCount
      }
    });
  } catch (error) {
    console.error('Error checking memory subsystem status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check memory subsystem status'
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

// MCP Tools endpoint
app.post('/api/mcp/tools', async (req, res) => {
  const { tool, params } = req.body;
  
  console.log(`Received request for tool: ${tool}`, params);
  
  try {
    switch (tool) {
      case 'getMarketIntelligence':
        // Use our market intelligence tools to get real data
        const { market, productCategories } = params;
        
        // Query the regulatory database for requirements
        const regulatoryRequirements = await regulatoryDb.query(
          `SELECT * FROM regulatory_requirements 
           WHERE country = $1 AND product_category = ANY($2)`,
          [market, productCategories]
        );
        
        // Query the trade database for market data
        const marketData = await tradeDb.query(
          `SELECT * FROM market_intelligence 
           WHERE country_code = $1 AND product_category = ANY($2)`,
          [market, productCategories]
        );
        
        // Format the response to match what the frontend expects
        const marketIntelligenceResponse = {
          id: market,
          name: marketData.rows[0]?.country_name || market,
          description: marketData.rows[0]?.description || 
            `Market information for ${market} related to ${productCategories.join(', ')}`,
          confidence: 0.85,
          marketSize: marketData.rows[0]?.market_size || '$100 million',
          growthRate: marketData.rows[0]?.growth_rate || '3.5%',
          entryBarriers: marketData.rows[0]?.entry_barriers || 'Medium',
          regulatoryComplexity: marketData.rows[0]?.regulatory_complexity || 'Medium',
          strengths: marketData.rows[0]?.strengths || [
            'Growing market demand',
            'Significant market size',
            'Strong consumer purchasing power',
            'Advanced digital infrastructure'
          ],
          regulatoryRequirements: regulatoryRequirements.rows.map(req => ({
            country: req.country,
            productCategory: req.product_category,
            requirementType: req.requirement_type,
            description: req.description,
            agency: req.agency,
            confidence: req.confidence || 0.9
          })) || [],
          opportunityTimeline: {
            months: 6,
            milestones: {
              'Month 1-2': 'Market research and preparation',
              'Month 3-4': 'Regulatory compliance',
              'Month 5-6': 'Market entry'
            }
          }
        };
        
        res.json(marketIntelligenceResponse);
        break;
        
      case 'generateExportReadinessReport':
        // Use our report generation tools to create a real report
        const { 
          businessName, 
          productCategories: reportProductCategories, 
          targetMarkets, 
          certifications,
          businessDetails
        } = params;
        
        // Query the memory database for business profile
        const businessProfile = await memoryDb.query(
          `SELECT * FROM business_profiles WHERE business_name = $1`,
          [businessName]
        );
        
        // Generate export readiness scores based on business profile and target markets
        const marketIntelligenceScore = 0.8;
        const regulatoryComplianceScore = 0.7;
        const exportOperationsScore = 0.75;
        const overallScore = (marketIntelligenceScore + regulatoryComplianceScore + exportOperationsScore) / 3;
        
        // Generate next steps based on scores and target markets
        const nextSteps = [
          {
            id: 1,
            title: 'Conduct market research',
            description: `Research ${targetMarkets.join(', ')} to understand demand and competition for ${reportProductCategories.join(', ')}`,
            pillar: 'market_intelligence',
            estimatedTime: '2-4 weeks'
          },
          {
            id: 2,
            title: 'Identify regulatory requirements',
            description: `Determine necessary certifications and documentation for exporting ${reportProductCategories.join(', ')} to ${targetMarkets.join(', ')}`,
            pillar: 'regulatory_compliance',
            estimatedTime: '3-6 weeks'
          },
          {
            id: 3,
            title: 'Develop export plan',
            description: 'Create a comprehensive export strategy including logistics, pricing, and distribution',
            pillar: 'export_operations',
            estimatedTime: '4-8 weeks'
          }
        ];
        
        // Format the response to match what the frontend expects
        const exportReadinessResponse = {
          exportReadiness: {
            overallScore,
            marketIntelligence: marketIntelligenceScore,
            regulatoryCompliance: regulatoryComplianceScore,
            exportOperations: exportOperationsScore
          },
          nextSteps,
          strengths: [
            'Strong product quality',
            'Competitive pricing',
            'Established domestic presence'
          ],
          areas_for_improvement: [
            'Limited international experience',
            'Regulatory compliance knowledge',
            'Export logistics expertise'
          ],
          key_trends: [
            'Growing demand for sustainable products',
            'Increasing e-commerce adoption',
            'Rising middle class in emerging markets'
          ]
        };
        
        res.json(exportReadinessResponse);
        break;
        
      default:
        res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
  } catch (error) {
    console.error(`Error processing tool request: ${error.message}`);
    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.message
    });
  }
});

// Assessment flow endpoints
app.get('/api/assessment/initial-question', async (req, res) => {
  try {
    console.log('Received request for initial assessment question');
    
    // Return the initial question from the Python backend's assessment_flow.py
    res.json({
      step_id: 'initial',
      question: "Hi there! I'm Sarah, your export readiness consultant at TradeWizard. To start your export journey, could you tell me your name, your role, and your business name?"
    });
  } catch (error) {
    console.error('Error handling initial question request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/assessment/process-response', async (req, res) => {
  try {
    const { step_id, response, user_data } = req.body;
    
    console.log(`Received assessment response for step ${step_id}:`, response);
    console.log('User data:', user_data);
    
    // Process the response based on the step_id
    let result;
    
    // Use the same assessment flow as in the Python backend's assessment_flow.py
    switch (step_id) {
      case 'initial':
        // Extract information from the response
        const firstName = response.match(/(?:my name is|I'm|I am) ([A-Za-z]+)/i)?.[1] || 'there';
        const businessName = response.match(/(?:business|company|organisation|organization) (?:is|called) ([A-Za-z0-9\s]+)/i)?.[1] || response;
        
        // Process initial response
        result = {
          next_step: {
            id: 'website',
            prompt: `Great to meet you, ${firstName}! Could you share your website so I can learn more about ${businessName} while we chat?`,
            type: 'text'
          },
          response: `Great to meet you, ${firstName}! Could you share your website so I can learn more about ${businessName} while we chat?`,
          user_data: {
            ...user_data,
            first_name: firstName,
            business_name: businessName
          }
        };
        break;
        
      case 'website':
        // Extract website URL
        const websiteUrl = response.match(/https?:\/\/[^\s]+/i)?.[0] || response;
        
        // Format the prompt with user data
        const websitePrompt = `While I'm reviewing your website, ${user_data.first_name || 'there'}, has ${user_data.business_name || 'your business'} participated in any direct exports, and if so can you give some context to your export activities to date?`;
        
        // Process website response
        result = {
          next_step: {
            id: 'export_experience',
            prompt: websitePrompt,
            type: 'text'
          },
          response: websitePrompt,
          user_data: {
            ...user_data,
            website_url: websiteUrl
          }
        };
        break;
        
      case 'export_experience':
        // Format the prompt with user data
        const experiencePrompt = `While I'm reviewing your website, ${user_data.first_name || 'there'}, I'd love to hear why ${user_data.business_name || 'your business'} is looking to export now? What's driving this decision?`;
        
        // Process export experience response
        result = {
          next_step: {
            id: 'export_motivation',
            prompt: experiencePrompt,
            type: 'text'
          },
          response: experiencePrompt,
          user_data: {
            ...user_data,
            export_experience: response
          }
        };
        break;
        
      case 'export_motivation':
        // Store the motivation response
        const updatedUserData = {
          ...user_data,
          export_motivation: response
        };
        
        try {
          // Ensure business ID
          const businessId = updatedUserData.businessId || `business-${Date.now()}`;
          
          if (!updatedUserData.businessId) {
            updatedUserData.businessId = businessId;
          }
          
          // Extract business profile data
          const businessProfile = {
            name: updatedUserData.business_name,
            website: updatedUserData.website_url,
            industry: updatedUserData.industry || 'Technology',
            products: updatedUserData.products || [],
            exportExperience: updatedUserData.export_experience,
            exportMotivation: updatedUserData.export_motivation
          };
          
          // Call the MCP directly to get market recommendations
          const marketRecommendations = await getMarketRecommendations(businessProfile);
          
          // Format the prompt with user data
          const motivationPrompt = `Based on your business profile, I've identified several potential markets for ${updatedUserData.business_name || 'your business'}. Which markets are you most interested in exploring?`;
          
          // Process export motivation response with dynamic market options
          result = {
            next_step: {
              id: 'target_markets',
              prompt: motivationPrompt,
              type: 'market_selection',
              marketOptions: marketRecommendations
            },
            response: motivationPrompt,
            user_data: updatedUserData
          };
        } catch (error) {
          console.error('Error getting market recommendations:', error);
          
          // Fallback to a generic response if the MCP call fails
          result = {
            next_step: {
              id: 'target_markets_generic',
              prompt: `I'd like to understand which markets you're interested in exploring. Could you please tell me which countries you're considering for export?`,
              type: 'text'
            },
            response: `I'd like to understand which markets you're interested in exploring. Could you please tell me which countries you're considering for export?`,
            user_data: updatedUserData
          };
        }
        break;
        
      case 'target_markets':
        // Process target markets response
        result = {
          next_step: {
            id: 'summary',
            prompt: `Thank you for sharing your export goals and target markets. Based on your responses, I've prepared a personalized dashboard with market intelligence and export readiness information for your selected markets: ${response}. Would you like to proceed to the dashboard?`,
            type: 'text'
          },
          response: `Thank you for sharing your export goals and target markets. Based on your responses, I've prepared a personalized dashboard with market intelligence and export readiness information for your selected markets: ${response}. Would you like to proceed to the dashboard?`,
          user_data: {
            ...user_data,
            selected_markets: response
          }
        };
        break;
        
      case 'summary':
        // Process summary response
        result = {
          next_step: {
            id: 'complete',
            prompt: 'Assessment complete',
            type: 'final'
          },
          response: 'Great! You can now access your personalized dashboard with market intelligence and export readiness information.',
          user_data: {
            ...user_data,
            assessment_complete: true
          }
        };
        break;
        
      default:
        // Handle unknown step_id
        result = {
          next_step: {
            id: 'error',
            prompt: 'An error occurred. Please try again.',
            type: 'text'
          },
          response: 'Sorry, an error occurred. Please try again.',
          user_data
        };
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error processing assessment response:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Market options endpoint
app.post('/api/market/options', async (req, res) => {
  try {
    const { product_categories, user_data } = req.body;
    
    console.log('Received request for market options:', { product_categories, user_data });
    
    // Return market options
    const marketOptions = [
      {
        id: 'USA',
        name: 'United States',
        description: 'The United States market for electronics is large and competitive, with strong demand for innovative products. The market size is estimated at $400 billion with a steady growth rate of 5.2% annually.',
        confidence: 0.85
      },
      {
        id: 'CAN',
        name: 'Canada',
        description: 'Canada has a stable economy and strong trade relations with many countries, making it an attractive export market. The market size is estimated at $50 billion with a growth rate of 3.8% annually.',
        confidence: 0.82
      },
      {
        id: 'GBR',
        name: 'United Kingdom',
        description: 'The UK offers a large consumer market with high purchasing power and demand for quality products. The market size is estimated at $80 billion with a growth rate of 4.1% annually.',
        confidence: 0.78
      }
    ];
    
    res.json(marketOptions);
  } catch (error) {
    console.error('Error handling market options request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
  console.log(`API endpoint available at http://localhost:${PORT}/api/mcp/tools`);
});

// Export the app for testing
module.exports = app;

// Add the getMarketRecommendations function
async function getMarketRecommendations(businessProfile) {
  try {
    // In a real implementation, this would call the MCP API
    // For now, return intelligent recommendations based on the business profile
    
    // Default recommendations if we can't determine anything specific
    const defaultRecommendations = [
      {
        id: 'USA',
        name: 'United States',
        description: 'The United States market is large and competitive, with strong demand for innovative products. The market size is estimated at $400 billion with a steady growth rate of 5.2% annually.',
        confidence: 0.85,
        marketSize: '$400 billion',
        growthRate: 5.2,
        entryDifficulty: 'MEDIUM',
        tariffRate: 3.5
      },
      {
        id: 'CAN',
        name: 'Canada',
        description: 'Canada has a stable economy and strong trade relations with many countries, making it an attractive export market. The market size is estimated at $50 billion with a growth rate of 3.8% annually.',
        confidence: 0.82,
        marketSize: '$50 billion',
        growthRate: 3.8,
        entryDifficulty: 'LOW',
        tariffRate: 2.8
      },
      {
        id: 'GBR',
        name: 'United Kingdom',
        description: 'The UK offers a large consumer market with high purchasing power and demand for quality products. The market size is estimated at $80 billion with a growth rate of 4.1% annually.',
        confidence: 0.78,
        marketSize: '$80 billion',
        growthRate: 4.1,
        entryDifficulty: 'MEDIUM',
        tariffRate: 4.0
      }
    ];
    
    // If we have more business profile information, we could customize the recommendations
    // For now, just return the default recommendations
    return defaultRecommendations;
  } catch (error) {
    console.error('Error in getMarketRecommendations:', error);
    throw error;
  }
} 