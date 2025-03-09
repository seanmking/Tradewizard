import dotenv from 'dotenv';
import { Config } from './types';

export async function loadConfig(): Promise<Config> {
  // Load environment variables
  dotenv.config();
  
  // Default configuration
  const defaultConfig: Config = {
    port: 3000,
    debug: false,
    ollama: {
      endpoint: 'http://localhost:11434',
      model: 'mistral',
      parameters: {
        temperature: 0.7,
        top_p: 0.9
      }
    },
    connectors: {
      tradeMap: {
        apiKey: '',
        baseUrl: 'https://api.trademap.org/api/v1'
      },
      comtrade: {
        apiKey: '',
        baseUrl: 'https://comtrade.un.org/api/get'
      },
      regulatoryDb: {
        connectionString: ''
      },
      internalDb: {
        host: 'localhost',
        port: 5432,
        database: 'export_guru',
        user: '',
        password: ''
      }
    },
    cache: {
      enabled: true,
      ttl: 3600, // 1 hour in seconds
      maxSize: 1000 // Maximum number of items in cache
    }
  };
  
  // Override with environment variables
  const config: Config = {
    ...defaultConfig,
    port: parseInt(process.env.PORT || defaultConfig.port.toString()),
    debug: process.env.DEBUG === 'true',
    ollama: {
      ...defaultConfig.ollama,
      endpoint: process.env.OLLAMA_ENDPOINT || defaultConfig.ollama.endpoint,
      model: process.env.OLLAMA_MODEL || defaultConfig.ollama.model
    },
    connectors: {
      tradeMap: {
        ...defaultConfig.connectors.tradeMap,
        apiKey: process.env.TRADE_MAP_API_KEY || defaultConfig.connectors.tradeMap.apiKey,
        baseUrl: process.env.TRADE_MAP_BASE_URL || defaultConfig.connectors.tradeMap.baseUrl
      },
      comtrade: {
        ...defaultConfig.connectors.comtrade,
        apiKey: process.env.COMTRADE_API_KEY || defaultConfig.connectors.comtrade.apiKey,
        baseUrl: process.env.COMTRADE_BASE_URL || defaultConfig.connectors.comtrade.baseUrl
      },
      regulatoryDb: {
        ...defaultConfig.connectors.regulatoryDb,
        connectionString: process.env.REGULATORY_DB_CONNECTION_STRING || defaultConfig.connectors.regulatoryDb.connectionString
      },
      internalDb: {
        ...defaultConfig.connectors.internalDb,
        host: process.env.DB_HOST || defaultConfig.connectors.internalDb.host,
        port: parseInt(process.env.DB_PORT || defaultConfig.connectors.internalDb.port.toString()),
        database: process.env.DB_NAME || defaultConfig.connectors.internalDb.database,
        user: process.env.DB_USER || defaultConfig.connectors.internalDb.user,
        password: process.env.DB_PASSWORD || defaultConfig.connectors.internalDb.password
      }
    },
    cache: {
      ...defaultConfig.cache,
      enabled: process.env.CACHE_ENABLED === 'true',
      ttl: parseInt(process.env.CACHE_TTL || defaultConfig.cache.ttl.toString()),
      maxSize: parseInt(process.env.CACHE_MAX_SIZE || defaultConfig.cache.maxSize.toString())
    }
  };
  
  return config;
}