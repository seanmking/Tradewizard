// Configuration Types
export interface Config {
  port: number;
  debug: boolean;
  ollama: OllamaConfig;
  connectors: ConnectorsConfig;
  cache: CacheConfig;
}

export interface OllamaConfig {
  endpoint: string;
  model: string;
  parameters: {
    temperature: number;
    top_p: number;
  };
}

export interface ConnectorsConfig {
  tradeMap: {
    apiKey: string;
    baseUrl: string;
  };
  comtrade: {
    apiKey: string;
    baseUrl: string;
  };
  regulatoryDb: {
    connectionString: string;
  };
  internalDb: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
  wits: {
    baseUrl: string;
  };
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
} 