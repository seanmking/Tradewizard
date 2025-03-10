/**
 * Common types used throughout the application
 */

import { StandardDataStructures } from './utils/data-standards';

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
  parameters: ToolParameter[];
  handler: (params: any) => Promise<any>;
}

// LLM Types
export interface LLM {
  complete: (prompt: string | { 
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
  id?: string;
  country: string;
  productCategory: string;
  hsCode?: string;
  requirementType: string;
  description: string;
  agency: string | {
    name: string;
    country: string;
    contactEmail?: string;
    contactPhone?: string;
    website: string;
  };
  documentationRequired?: string[];
  estimatedTimeline?: string;
  estimatedCost?: string;
  confidenceLevel?: number;
  frequency?: "once-off" | "ongoing" | "periodic";
  updateFrequency?: {
    recommendedSchedule: string;
    sourcesToMonitor: string[];
    countrySpecificNotes?: string;
  };
  validationStatus?: "verified" | "unverified" | "outdated";
  lastVerifiedDate?: string;
  verificationSource?: string;
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

/**
 * Tool parameter interface
 */
export interface ToolParameter {
  name: string;
  description: string;
  type: string;
  required: boolean;
}

/**
 * Market data interface
 */
export interface MarketData {
  id: string;
  name: string;
  description: string;
  marketSize: number;
  growthRate: number;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: string[];
  threats?: string[];
  regulatoryComplexity?: number;
  tariffRate?: number;
  competitivePosition?: string;
}

/**
 * Business profile interface
 */
export interface BusinessProfile {
  id?: string;
  name: string;
  description?: string;
  products: {
    name: string;
    description?: string;
    category: string;
    estimatedHsCode?: string;
  }[];
  certifications?: Array<{
    name: string;
    issuer: string;
    validUntil?: string;
    verificationUrl?: string;
  }>;
  marketFocus?: string[];
  targetMarkets?: string[];
  exportExperience?: string;
  size?: number;
  website?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Export readiness assessment interface
 */
export interface ExportReadinessAssessment {
  overallScore: number;
  dimensionScores: Record<string, number>;
  regulatoryCompliance?: number;
  recommendations?: string[];
}

/**
 * Compliance assessment interface
 */
export interface ComplianceAssessment {
  overallScore: number;
  weightedScore: number;
  satisfiedRequirements: RegulatoryRequirement[];
  missingRequirements: RegulatoryRequirement[];
  partiallyCompliantRequirements?: RegulatoryRequirement[];
  timeline?: number;
  estimatedCost?: string;
  recommendations?: string[];
}

/**
 * Assessment integration interface
 */
export interface AssessmentIntegration {
  exportReadiness: ExportReadinessAssessment;
  marketIntelligence: {
    marketAccessScore: number;
    regulatoryBarriers: number;
    competitivePosition: string;
  };
  regulatoryCompliance: {
    complianceScore: number;
    missingRequirements: number;
    timeline: number;
    estimatedCost: string;
  };
}