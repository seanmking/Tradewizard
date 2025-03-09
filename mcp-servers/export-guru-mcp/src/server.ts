import express from 'express';
import cors from 'cors';
import { createMCPServer } from '@smithery/mcp-server';
import { registerTools } from './tools';
import { setupConnectors } from './connectors';
import { setupOllama } from './utils/ollama';
import { errorHandler } from './utils/error-handling';
import { Config } from './types';

export async function startServer(config: Config) {
  // Create Express app
  const app = express();
  
  // Apply middleware
  app.use(cors());
  app.use(express.json());
  
  // Set up Ollama LLM connection
  const llm = await setupOllama(config.ollama);
  
  // Set up data connectors
  const connectors = await setupConnectors(config.connectors);
  
  // Create MCP server
  const mcpServer = createMCPServer({
    tools: registerTools(connectors, llm),
    llm,
    debug: config.debug,
    cache: config.cache.enabled ? {
      ttl: config.cache.ttl,
      maxSize: config.cache.maxSize
    } : undefined
  });
  
  // Register MCP routes
  app.use('/api/mcp', mcpServer.router);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // Error handling
  app.use(errorHandler);
  
  // Start server
  const server = app.listen(config.port);
  
  return server;
}