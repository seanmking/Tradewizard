import { Connectors } from '../connectors';
import { LLM, Tool } from '../types';
import { ApiError } from '../utils/error-handling';

/**
 * Execute a SQL query against the internal database
 * @param query SQL query to execute
 * @param params Query parameters
 * @param connectors Data connectors
 * @returns Query results
 */
async function executeSqlQuery(
  query: string,
  params: any[],
  connectors: Connectors
): Promise<any[]> {
  try {
    // This is a placeholder implementation
    // In a real implementation, this would execute the query against the database
    console.log('Executing SQL query:', query, 'with params:', params);
    
    // For now, return an empty array
    return [];
  } catch (error) {
    console.error('Error executing SQL query:', error);
    throw new ApiError('Failed to execute SQL query', 500);
  }
}

/**
 * Generate a SQL query using LLM
 * @param description Natural language description of the query
 * @param llm LLM for query generation
 * @returns Generated SQL query
 */
async function generateSqlQuery(
  description: string,
  llm: LLM
): Promise<string> {
  try {
    // Create a prompt for the LLM
    const prompt = `
      Generate a SQL query based on the following description:
      ${description}
      
      The database has the following tables:
      - users (id, name, email, created_at)
      - businesses (id, user_id, name, industry, size, created_at)
      - markets (id, name, region, country_code)
      - products (id, business_id, name, category, hs_code)
      - market_entries (id, business_id, market_id, entry_date, status)
      
      Return only the SQL query without any explanation.
    `;
    
    // Get LLM response
    const response = await llm.complete({
      prompt,
      max_tokens: 300,
      temperature: 0.3
    });
    
    // Clean up the response
    return response.trim();
  } catch (error) {
    console.error('Error generating SQL query:', error);
    throw new ApiError('Failed to generate SQL query', 500);
  }
}

export function registerSqlTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'executeSqlQuery',
      description: 'Execute a SQL query against the internal database',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'SQL query to execute' },
          params: { 
            type: 'array', 
            items: { type: 'any' }, 
            description: 'Query parameters' 
          }
        },
        required: ['query']
      },
      handler: async (params) => executeSqlQuery(
        params.query,
        params.params || [],
        connectors
      )
    },
    {
      name: 'generateSqlQuery',
      description: 'Generate a SQL query from a natural language description',
      parameters: {
        type: 'object',
        properties: {
          description: { 
            type: 'string', 
            description: 'Natural language description of the query' 
          }
        },
        required: ['description']
      },
      handler: async (params) => generateSqlQuery(
        params.description,
        llm
      )
    }
  ];
} 