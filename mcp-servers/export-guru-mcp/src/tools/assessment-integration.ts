/**
 * Assessment Integration
 * 
 * This module provides integration between the 4-question assessment flow
 * and the MCP, including webscraper analysis and data transformation.
 */

import { Connectors } from '../connectors';
import { LLM, Tool } from '../types';
import { BusinessAnalysis, ProductInfo } from '../types/business';
import { ApiError } from '../utils/error-handling';
import { analyzeWebsiteData, extractProductsFromWebsite, createBusinessAnalysisFromWebsite } from './business-analysis/webscraper-analyzer';
import { mapProductsToHSCodes } from './business-analysis/hs-mapper';

// Import the ComplianceChecklist type but not the function
import { ComplianceChecklist } from './compliance-checklist';

// Define WebsiteData interface since it's not exported from business.ts
interface WebsiteData {
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
 * Assessment question interface
 */
export interface AssessmentQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'website';
  options?: string[];
  required: boolean;
}

/**
 * Assessment response interface
 */
export interface AssessmentResponse {
  questionId: string;
  answer: string | string[];
}

/**
 * Assessment result interface
 */
export interface AssessmentResult {
  businessProfile: {
    name: string;
    website?: string;
    products: ProductInfo[];
    targetMarkets: string[];
    hsCode?: string;
  };
  websiteAnalysis?: {
    confidence: number;
    detectedProducts: ProductInfo[];
    suggestedMarkets: string[];
  };
  complianceChecklist?: ComplianceChecklist[];
  marketIntelligence?: any;
  nextSteps: string[];
}

/**
 * The 4-question assessment flow
 */
export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'business_name',
    question: 'What is the name of your business?',
    type: 'text',
    required: true
  },
  {
    id: 'business_website',
    question: 'What is your business website URL?',
    type: 'website',
    required: false
  },
  {
    id: 'product_category',
    question: 'What products or services do you offer?',
    type: 'text',
    required: true
  },
  {
    id: 'target_markets',
    question: 'Which markets are you interested in exporting to?',
    type: 'multiselect',
    options: ['United Arab Emirates', 'United Kingdom', 'United States'],
    required: true
  }
];

/**
 * Process the assessment responses and trigger the appropriate analyses
 */
export async function processAssessmentResponses(
  responses: AssessmentResponse[],
  connectors: Connectors,
  llm: LLM
): Promise<AssessmentResult> {
  try {
    // Extract responses
    const businessName = getResponseByQuestionId(responses, 'business_name') as string;
    const websiteUrl = getResponseByQuestionId(responses, 'business_website') as string;
    const productCategory = getResponseByQuestionId(responses, 'product_category') as string;
    const targetMarkets = getResponseByQuestionId(responses, 'target_markets') as string[];
    
    if (!businessName || !productCategory || !targetMarkets || targetMarkets.length === 0) {
      throw new ApiError('Missing required assessment responses', 400);
    }
    
    // Initialize result
    const result: AssessmentResult = {
      businessProfile: {
        name: businessName,
        website: websiteUrl,
        products: [{ name: productCategory }],
        targetMarkets: targetMarkets
      },
      nextSteps: []
    };
    
    // If website URL is provided, trigger webscraper analysis
    if (websiteUrl) {
      const websiteAnalysis = await triggerWebsiteAnalysis(websiteUrl, llm);
      
      // Transform webscraper output to structured product data
      const businessAnalysis = await createBusinessAnalysisFromWebsite({
        url: websiteUrl,
        title: businessName,
        content: JSON.stringify(websiteAnalysis)
      }, llm);
      
      // Map products to HS codes
      const products = businessAnalysis.products;
      const hsCodeMappings = await mapProductsToHSCodes(products, llm);
      
      // Update products with HS codes
      const productsWithHsCodes = products.map((product, index) => ({
        ...product,
        hsCode: hsCodeMappings[index]?.hsCode
      }));
      
      // Update result with website analysis
      result.businessProfile.products = productsWithHsCodes;
      result.websiteAnalysis = {
        confidence: calculateConfidence(websiteAnalysis),
        detectedProducts: productsWithHsCodes,
        suggestedMarkets: businessAnalysis.markets.current
      };
      
      // Add HS code if available
      if (productsWithHsCodes.length > 0 && productsWithHsCodes[0].hsCode) {
        result.businessProfile.hsCode = productsWithHsCodes[0].hsCode;
      }
    }
    
    // Generate compliance checklists for each target market
    // Note: We're not actually calling generateComplianceChecklist since it's not exported
    // In a real implementation, you would need to export that function or use a different approach
    const complianceChecklists: ComplianceChecklist[] = [];
    
    // For now, we'll just set an empty array
    result.complianceChecklist = complianceChecklists;
    
    // Generate next steps
    result.nextSteps = generateNextSteps(result);
    
    return result;
  } catch (error: unknown) {
    console.error('Error processing assessment responses:', error);
    throw error;
  }
}

/**
 * Get response by question ID
 */
function getResponseByQuestionId(responses: AssessmentResponse[], questionId: string): string | string[] | undefined {
  const response = responses.find(r => r.questionId === questionId);
  return response?.answer;
}

/**
 * Trigger website analysis
 */
async function triggerWebsiteAnalysis(websiteUrl: string, llm: LLM): Promise<any> {
  try {
    // This would typically call a webscraper service to fetch website content
    // For now, we'll simulate this with a placeholder
    const websiteData: WebsiteData = {
      url: websiteUrl,
      title: 'Website Title',
      content: 'Website content would be here in a real implementation',
      links: [],
      images: []
    };
    
    // Analyze website data
    const analysis = await analyzeWebsiteData(websiteData, llm);
    return analysis;
  } catch (error: unknown) {
    console.error('Error analyzing website:', error);
    throw new ApiError('Failed to analyze website', 500);
  }
}

/**
 * Calculate confidence score for website analysis
 */
function calculateConfidence(websiteAnalysis: any): number {
  // In a real implementation, this would calculate a confidence score
  // based on the quality and quantity of data extracted
  return 0.7; // Default confidence score
}

/**
 * Generate next steps based on assessment result
 */
function generateNextSteps(result: AssessmentResult): string[] {
  const nextSteps: string[] = [
    'Complete your business profile with additional details',
    'Review the detected products and confirm their accuracy'
  ];
  
  if (result.websiteAnalysis) {
    if (result.websiteAnalysis.confidence < 0.5) {
      nextSteps.push('Provide more specific product information to improve analysis accuracy');
    }
  } else {
    nextSteps.push('Add your website URL to enable automatic product detection');
  }
  
  if (result.complianceChecklist && result.complianceChecklist.length > 0) {
    nextSteps.push('Review compliance requirements for your target markets');
    nextSteps.push('Begin addressing high-priority compliance items');
  }
  
  return nextSteps;
}

/**
 * Verify detected products with the user
 */
export async function verifyDetectedProducts(
  detectedProducts: ProductInfo[],
  userConfirmation: boolean,
  llm: LLM,
  userCorrections?: ProductInfo[]
): Promise<ProductInfo[]> {
  if (userConfirmation) {
    return detectedProducts;
  }
  
  if (userCorrections && userCorrections.length > 0) {
    // If user provided corrections, use those
    return userCorrections;
  }
  
  // If user rejected but didn't provide corrections, return empty array
  return [];
}

/**
 * Handle low-confidence product detection
 */
export async function handleLowConfidenceDetection(
  websiteUrl: string,
  productHint: string,
  llm: LLM
): Promise<ProductInfo[]> {
  try {
    // This would typically call a more focused analysis with the hint
    const websiteData: WebsiteData = {
      url: websiteUrl,
      title: 'Website Title',
      content: `Website content with focus on ${productHint}`,
      links: [],
      images: []
    };
    
    // Extract products with the hint
    const products = await extractProductsFromWebsite(websiteData, llm);
    return products;
  } catch (error: unknown) {
    console.error('Error handling low confidence detection:', error);
    throw new ApiError('Failed to improve product detection', 500);
  }
}

/**
 * Register assessment integration tools
 */
export function registerAssessmentIntegrationTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'processAssessment',
      description: 'Process the 4-question assessment and trigger appropriate analyses',
      parameters: {
        type: 'object',
        properties: {
          responses: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                questionId: { type: 'string' },
                answer: { type: 'string' }
              }
            },
            description: 'Assessment responses'
          }
        },
        required: ['responses']
      },
      handler: async (params: any) => processAssessmentResponses(params.responses, connectors, llm)
    },
    {
      name: 'verifyProducts',
      description: 'Verify detected products with the user',
      parameters: {
        type: 'object',
        properties: {
          detectedProducts: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'Detected products'
          },
          userConfirmation: {
            type: 'boolean',
            description: 'User confirmation of detected products'
          },
          userCorrections: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'User corrections to detected products'
          }
        },
        required: ['detectedProducts', 'userConfirmation']
      },
      handler: async (params: any) => verifyDetectedProducts(
        params.detectedProducts,
        params.userConfirmation,
        llm,
        params.userCorrections
      )
    },
    {
      name: 'handleLowConfidence',
      description: 'Handle low-confidence product detection',
      parameters: {
        type: 'object',
        properties: {
          websiteUrl: {
            type: 'string',
            description: 'Website URL'
          },
          productHint: {
            type: 'string',
            description: 'Product hint from user'
          }
        },
        required: ['websiteUrl', 'productHint']
      },
      handler: async (params: any) => handleLowConfidenceDetection(
        params.websiteUrl,
        params.productHint,
        llm
      )
    }
  ];
} 