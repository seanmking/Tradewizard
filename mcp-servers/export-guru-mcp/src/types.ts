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

// Tool Types
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (params: any) => Promise<any>;
}

// LLM Types
export interface LLM {
  complete: (options: {
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
  }) => Promise<string>;
}

// Business Analysis Types
export interface BusinessCategory {
  mainSector: string;
  subSector: string;
  attributes: string[];
  confidence: number;
}

export interface BusinessAnalysis {
  businessName: string;
  website: string;
  categories: BusinessCategory[];
  products: ProductInfo[];
  markets: {
    current: string[];
    confidence: number;
  };
  certifications: {
    items: string[];
    confidence: number;
  };
  businessDetails: {
    estimatedSize: string;
    yearsOperating: string;
    confidence: number;
  };
}

export interface ProductInfo {
  name: string;
  description?: string;
  hsCode?: string;
  price?: string;
}

// HS Code Types
export interface HSCodeMapping {
  product: string;
  hsCode: string;
  description: string;
  confidence: number;
  metadata: Record<string, any>;
}

// Market Intelligence Types
export interface MarketInfo {
  id: string;
  name: string;
  description: string;
  confidence: number;
  marketSize?: string;
  growthRate?: string | number;
  entryBarriers?: string;
  regulatoryComplexity?: string;
  strengths?: string[];
}

export interface TradeFlowData {
  exporterCountry: string;
  importerCountry: string;
  hsCode: string;
  year: number;
  value: number;
  quantity?: number;
  unit?: string;
  growth?: number;
  marketShare?: number;
}

// Regulatory Types
export interface RegulatoryRequirement {
  country: string;
  productCategory: string;
  hsCode?: string;
  requirementType: string;
  description: string;
  agency?: string;
  url?: string;
  lastUpdated?: string;
  confidence: number;
}

// Report Types
export interface MarketReport {
  businessName: string;
  productCategories: string[];
  targetMarket: string;
  marketSize: string;
  growthRate: string;
  entryBarriers: string;
  regulatoryRequirements: RegulatoryRequirement[];
  competitorAnalysis: {
    topCompetitors: string[];
    marketShare: Record<string, number>;
    strengthsWeaknesses: Record<string, string[]>;
  };
  opportunityTimeline: {
    months: number;
    milestones: Record<string, string>;
  };
  recommendations: string[];
  generatedDate: string;
}

/**
 * Trade data record
 */
export interface TradeData {
  reporterCountry: string;
  partnerCountry: string;
  year: number;
  month?: number;
  hsCode: string;
  productDescription?: string;
  tradeFlow: string; // 'export' or 'import'
  valueUsd: number;
  quantity?: number;
  quantityUnit?: string;
  source: string;
  lastUpdated?: string;
}

/**
 * Query parameters for trade data
 */
export interface TradeDataQuery {
  reporterCountry?: string;
  partnerCountry?: string;
  hsCode?: string;
  hsCodeMatchType?: 'exact' | 'prefix';
  year?: number;
  month?: number;
  tradeFlow?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

/**
 * Trade partner information
 */
export interface TradePartner {
  countryCode: string;
  countryName: string;
}

/**
 * Trade partner statistics
 */
export interface TradePartnerStats {
  partnerCountry: string;
  totalValueUsd: number;
  productCount: number;
  year: number;
  tradeFlow: string;
}