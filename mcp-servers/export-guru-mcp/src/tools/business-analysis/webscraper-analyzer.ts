/**
 * Webscraper Analyzer
 * 
 * This module provides functionality for analyzing website data
 * to extract business insights and regulatory implications.
 */

import { LLM } from '../../types/common';
import { WebsiteAnalysis, BusinessAnalysis, ProductInfo } from '../../types/business';
import { completeWithRetry, parseStructuredResponse } from '../../utils/llm-helpers';
import { trackResponseTime } from '../../utils/monitoring';

/**
 * Interface for website data
 */
export interface WebsiteData {
  url: string;
  title: string;
  description?: string;
  content: string;
  links?: string[];
  images?: {
    url: string;
    alt?: string;
  }[];
  metadata?: Record<string, string>;
}

/**
 * Analyzes website data to extract business insights
 */
export async function analyzeWebsiteData(
  websiteData: WebsiteData,
  llm: LLM
): Promise<WebsiteAnalysis> {
  return trackResponseTime('analyzeWebsiteData', async () => {
    const prompt = generateWebsiteAnalysisPrompt(websiteData);
    const response = await completeWithRetry(llm, prompt, {
      max_tokens: 2000,
      temperature: 0.3
    });
    
    try {
      const analysis = parseStructuredResponse<WebsiteAnalysis>(response);
      return analysis;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to parse website analysis: ${errorMessage}`);
      
      // Return a default analysis
      return {
        businessProfile: {
          products: [],
          certifications: [],
          marketFocus: []
        },
        regulatoryImplications: {
          suggestedRequirements: [],
          potentialCompliance: [],
          riskAreas: []
        }
      };
    }
  }, { url: websiteData.url });
}

/**
 * Extracts product information from website data
 */
export async function extractProductsFromWebsite(
  websiteData: WebsiteData,
  llm: LLM
): Promise<ProductInfo[]> {
  return trackResponseTime('extractProductsFromWebsite', async () => {
    const prompt = `
Please extract product information from the following website content:

URL: ${websiteData.url}
Title: ${websiteData.title}
${websiteData.description ? `Description: ${websiteData.description}` : ''}

Content:
${websiteData.content.substring(0, 5000)}

Identify all products mentioned on this website. For each product, provide:
- Product name
- Description (if available)
- Estimated HS code (if you can determine it)
- Price (if mentioned)

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "products": [
    {
      "name": "string",
      "description": "string",
      "hsCode": "string",
      "price": "string"
    }
  ]
}
\`\`\`
`;
    
    const response = await completeWithRetry(llm, prompt, {
      max_tokens: 1500,
      temperature: 0.3
    });
    
    try {
      const result = parseStructuredResponse<{ products: ProductInfo[] }>(response);
      return result.products;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to extract products from website: ${errorMessage}`);
      
      // Return an empty array
      return [];
    }
  }, { url: websiteData.url });
}

/**
 * Creates a business analysis from website data
 */
export async function createBusinessAnalysisFromWebsite(
  websiteData: WebsiteData,
  llm: LLM
): Promise<BusinessAnalysis> {
  return trackResponseTime('createBusinessAnalysisFromWebsite', async () => {
    // First analyze the website
    const websiteAnalysis = await analyzeWebsiteData(websiteData, llm);
    
    // Then extract products
    const products = await extractProductsFromWebsite(websiteData, llm);
    
    // Generate the business analysis
    const prompt = `
Please create a comprehensive business analysis for the following company:

URL: ${websiteData.url}
Title: ${websiteData.title}
${websiteData.description ? `Description: ${websiteData.description}` : ''}

Products:
${products.map(p => `- ${p.name}${p.description ? `: ${p.description}` : ''}`).join('\n')}

Certifications:
${websiteAnalysis.businessProfile.certifications.map(c => `- ${c}`).join('\n')}

Market Focus:
${websiteAnalysis.businessProfile.marketFocus.map(m => `- ${m}`).join('\n')}

Based on this information, provide a comprehensive business analysis including:
- Business name
- Categories (main sector, sub-sector, attributes)
- Current markets
- Business details (estimated size, years operating)

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "businessName": "string",
  "website": "string",
  "categories": [
    {
      "mainSector": "string",
      "subSector": "string",
      "attributes": ["string"],
      "confidence": number
    }
  ],
  "markets": {
    "current": ["string"],
    "confidence": number
  },
  "certifications": {
    "items": ["string"],
    "confidence": number
  },
  "businessDetails": {
    "estimatedSize": "string",
    "yearsOperating": "string",
    "confidence": number
  }
}
\`\`\`
`;
    
    const response = await completeWithRetry(llm, prompt, {
      max_tokens: 1500,
      temperature: 0.3
    });
    
    try {
      const analysis = parseStructuredResponse<BusinessAnalysis>(response);
      
      // Add the products to the analysis
      analysis.products = products;
      
      return analysis;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to create business analysis from website: ${errorMessage}`);
      
      // Return a default analysis
      return {
        businessName: websiteData.title || 'Unknown',
        website: websiteData.url,
        categories: [{
          mainSector: 'Unknown',
          subSector: 'Unknown',
          attributes: [],
          confidence: 0.1
        }],
        products,
        markets: {
          current: [],
          confidence: 0.1
        },
        certifications: {
          items: websiteAnalysis.businessProfile.certifications || [],
          confidence: 0.1
        },
        businessDetails: {
          estimatedSize: 'Unknown',
          yearsOperating: 'Unknown',
          confidence: 0.1
        }
      };
    }
  }, { url: websiteData.url });
}

/**
 * Analyzes regulatory implications from website data
 */
export async function analyzeRegulatoryImplications(
  websiteData: WebsiteData,
  targetMarket: string,
  llm: LLM
): Promise<{
  suggestedRequirements: string[];
  potentialCompliance: string[];
  riskAreas: string[];
  confidence: number;
}> {
  return trackResponseTime('analyzeRegulatoryImplications', async () => {
    // First analyze the website
    const websiteAnalysis = await analyzeWebsiteData(websiteData, llm);
    
    // Then extract products
    const products = await extractProductsFromWebsite(websiteData, llm);
    
    // Generate the regulatory analysis
    const prompt = `
Please analyze the regulatory implications for exporting the following products to ${targetMarket}:

Products:
${products.map(p => `- ${p.name}${p.description ? `: ${p.description}` : ''}`).join('\n')}

Certifications:
${websiteAnalysis.businessProfile.certifications.map(c => `- ${c}`).join('\n')}

Based on this information, provide:
- Suggested regulatory requirements for exporting to ${targetMarket}
- Potential compliance areas based on existing certifications
- Risk areas that need attention

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "suggestedRequirements": ["string"],
  "potentialCompliance": ["string"],
  "riskAreas": ["string"],
  "confidence": number
}
\`\`\`
`;
    
    const response = await completeWithRetry(llm, prompt, {
      max_tokens: 1500,
      temperature: 0.3
    });
    
    try {
      return parseStructuredResponse<{
        suggestedRequirements: string[];
        potentialCompliance: string[];
        riskAreas: string[];
        confidence: number;
      }>(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to analyze regulatory implications: ${errorMessage}`);
      
      // Return a default analysis
      return {
        suggestedRequirements: [],
        potentialCompliance: [],
        riskAreas: [],
        confidence: 0.1
      };
    }
  }, { url: websiteData.url, targetMarket });
}

/**
 * Generates a prompt for website analysis
 */
function generateWebsiteAnalysisPrompt(websiteData: WebsiteData): string {
  return `
Please analyze the following website content to extract business insights:

URL: ${websiteData.url}
Title: ${websiteData.title}
${websiteData.description ? `Description: ${websiteData.description}` : ''}

Content:
${websiteData.content.substring(0, 5000)}

Analyze this content to identify:
1. Products or services offered
2. Certifications or standards mentioned
3. Markets or countries the business focuses on

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "businessProfile": {
    "products": [
      {
        "name": "string",
        "description": "string",
        "category": "string",
        "estimatedHsCode": "string"
      }
    ],
    "certifications": ["string"],
    "marketFocus": ["string"]
  },
  "regulatoryImplications": {
    "suggestedRequirements": ["string"],
    "potentialCompliance": ["string"],
    "riskAreas": ["string"]
  }
}
\`\`\`
`;
} 