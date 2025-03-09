import dotenv from 'dotenv';
import { startServer } from './server';
import { Config } from './types';

// Load environment variables
dotenv.config();

// Server configuration
const config: Config = {
  port: parseInt(process.env.PORT || '3001'),
  debug: process.env.DEBUG === 'true',
  ollama: {
    endpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'mistral',
    parameters: {
      temperature: 0.7,
      top_p: 0.9
    }
  },
  connectors: {
    tradeMap: {
      apiKey: process.env.TRADE_MAP_API_KEY || '',
      baseUrl: process.env.TRADE_MAP_BASE_URL || 'https://api.trademap.org/api/v1'
    },
    comtrade: {
      apiKey: process.env.COMTRADE_API_KEY || '',
      baseUrl: process.env.COMTRADE_BASE_URL || 'https://comtrade.un.org/api/get'
    },
    regulatoryDb: {
      connectionString: process.env.REGULATORY_DB_CONNECTION_STRING || 'postgresql://seanking@localhost:5432/regulatory_db'
    },
    internalDb: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'export_guru',
      user: process.env.DB_USER || 'seanking',
      password: process.env.DB_PASSWORD || ''
    },
    wits: {
      baseUrl: 'https://wits.worldbank.org'
    }
  },
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000')
  }
};

// Start the server
function main() {
  try {
    const app = startServer(config);
    const server = app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();