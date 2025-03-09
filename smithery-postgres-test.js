const axios = require('axios');

async function testSmitheryPostgresServer() {
  try {
    // Test the Smithery PostgreSQL MCP Server
    console.log('Testing Smithery PostgreSQL MCP Server...');
    
    // Example 1: Get PostgreSQL setup instructions
    const setupResponse = await axios.post('http://localhost:8080/v1/tools', {
      name: 'postgres_setup_instructions',
      input: {
        platform: 'macos',
        version: '15',
        purpose: 'development'
      }
    });
    
    console.log('Setup instructions response:', setupResponse.data);
    
    // Example 2: Analyze database performance
    const analysisResponse = await axios.post('http://localhost:8080/v1/tools', {
      name: 'analyze_database',
      input: {
        connectionString: 'postgresql://seanking@localhost:5432/regulatory_db',
        analysisType: 'performance'
      }
    });
    
    console.log('Analysis response:', analysisResponse.data);
    
    // Example 3: Get query optimization suggestions
    const optimizationResponse = await axios.post('http://localhost:8080/v1/tools', {
      name: 'optimize_query',
      input: {
        connectionString: 'postgresql://seanking@localhost:5432/regulatory_db',
        query: 'SELECT * FROM regulatory_requirements WHERE country = $1 AND product_category = $2',
        parameters: ['ZAF', 'Food and Beverage']
      }
    });
    
    console.log('Query optimization response:', optimizationResponse.data);
    
  } catch (error) {
    console.error('Error testing Smithery PostgreSQL MCP Server:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received. Is the server running?');
    } else {
      console.error('Error setting up request:', error.message);
    }
  }
}

testSmitheryPostgresServer(); 