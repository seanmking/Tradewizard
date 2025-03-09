import express, { Request, Response } from 'express';
import cors from 'cors';
// import { createMCPServer } from '@smithery/mcp-server';
import { registerTools } from './tools';
import { setupConnectors } from './connectors';
import { setupOllama } from './utils/ollama';
import { errorHandler } from './utils/error-handling';
import { Config } from './types';
import { setupRegulatoryDbConnector } from './connectors/regulatory-db';
import { setupTradeDbConnector } from './connectors/trade-db';
import regulatoryRoutes from './routes/regulatory';
import tradeRoutes from './routes/trade';

export function startServer(config: Config) {
  // Create Express app
  const app = express();
  
  // Apply middleware
  app.use(cors());
  app.use(express.json());
  
  // Set up LLM
  const llm = setupOllama(config.ollama);
  
  // Set up data connectors
  const connectors = setupConnectors(config.connectors);
  
  // Initialize database connectors
  const regulatoryDb = setupRegulatoryDbConnector({
    connectionString: process.env.REGULATORY_DB_URL || 'postgresql://seanking@localhost:5432/regulatory_db'
  });

  const tradeDb = setupTradeDbConnector({
    connectionString: process.env.TRADE_DB_URL || 'postgresql://seanking@localhost:5432/trade_db'
  });
  
  // Create MCP server
  // const mcpServer = createMCPServer();
  
  // Register tools
  // registerTools(mcpServer, { llm, connectors });
  
  // Register MCP routes
  // app.use('/api/mcp', mcpServer.router);
  
  // Set up routes
  app.use('/api/regulatory', regulatoryRoutes);
  app.use('/api/trade', tradeRoutes);
  
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });
  
  // Error handling middleware
  app.use(errorHandler);
  
  return app;
}