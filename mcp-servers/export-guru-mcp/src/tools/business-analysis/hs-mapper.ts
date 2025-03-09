/**
 * HS Code Mapper
 * 
 * This module provides functionality for mapping products to HS codes
 * and retrieving information about HS codes.
 */

import { LLM } from '../../types/common';
import { HSCodeMapping, ProductInfo } from '../../types/business';
import { completeWithRetry, parseStructuredResponse } from '../../utils/llm-helpers';
import { trackResponseTime } from '../../utils/monitoring';

/**
 * Maps a product to an HS code
 */
export async function mapProductToHSCode(
  product: ProductInfo,
  llm: LLM
): Promise<HSCodeMapping> {
  return trackResponseTime('mapProductToHSCode', async () => {
    const prompt = generateHSCodePrompt(product);
    const response = await completeWithRetry(llm, prompt);
    
    try {
      const mapping = parseStructuredResponse<HSCodeMapping>(response);
      return mapping;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to parse HS code mapping: ${errorMessage}`);
      
      // Fallback to a basic mapping with low confidence
      return {
        product: product.name,
        hsCode: '',
        description: '',
        confidence: 0.1,
        metadata: {
          error: errorMessage,
          rawResponse: response
        }
      };
    }
  }, { productName: product.name });
}

/**
 * Maps multiple products to HS codes
 */
export async function mapProductsToHSCodes(
  products: ProductInfo[],
  llm: LLM
): Promise<HSCodeMapping[]> {
  const mappings: HSCodeMapping[] = [];
  
  for (const product of products) {
    try {
      const mapping = await mapProductToHSCode(product, llm);
      mappings.push(mapping);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to map product ${product.name} to HS code: ${errorMessage}`);
      
      // Add a failed mapping
      mappings.push({
        product: product.name,
        hsCode: '',
        description: '',
        confidence: 0,
        metadata: {
          error: errorMessage
        }
      });
    }
  }
  
  return mappings;
}

/**
 * Validates an HS code
 */
export async function validateHSCode(
  hsCode: string,
  llm: LLM
): Promise<{
  valid: boolean;
  correctedHSCode?: string;
  description?: string;
  confidence: number;
}> {
  return trackResponseTime('validateHSCode', async () => {
    const prompt = `
Please validate the following HS (Harmonized System) code: ${hsCode}

If the code is valid, provide its description. If it's invalid or incomplete, suggest the correct code.

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "valid": boolean,
  "correctedHSCode": "string", // Only if the original code is invalid
  "description": "string",
  "confidence": number // 0-1 scale
}
\`\`\`
`;
    
    const response = await completeWithRetry(llm, prompt);
    
    try {
      return parseStructuredResponse<{
        valid: boolean;
        correctedHSCode?: string;
        description?: string;
        confidence: number;
      }>(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to parse HS code validation: ${errorMessage}`);
      
      // Return a default response
      return {
        valid: false,
        confidence: 0.1
      };
    }
  }, { hsCode });
}

/**
 * Gets information about an HS code
 */
export async function getHSCodeInfo(
  hsCode: string,
  llm: LLM
): Promise<{
  hsCode: string;
  description: string;
  category: string;
  subCategory: string;
  notes: string;
  confidence: number;
}> {
  return trackResponseTime('getHSCodeInfo', async () => {
    const prompt = `
Please provide detailed information about the following HS (Harmonized System) code: ${hsCode}

Include the following information:
- Full description of the code
- Product category and subcategory
- Any notes or special considerations for this code

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "hsCode": "string",
  "description": "string",
  "category": "string",
  "subCategory": "string",
  "notes": "string",
  "confidence": number // 0-1 scale
}
\`\`\`
`;
    
    const response = await completeWithRetry(llm, prompt);
    
    try {
      return parseStructuredResponse<{
        hsCode: string;
        description: string;
        category: string;
        subCategory: string;
        notes: string;
        confidence: number;
      }>(response);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to parse HS code info: ${errorMessage}`);
      
      // Return a default response
      return {
        hsCode,
        description: '',
        category: '',
        subCategory: '',
        notes: '',
        confidence: 0.1
      };
    }
  }, { hsCode });
}

/**
 * Generates a prompt for HS code mapping
 */
function generateHSCodePrompt(product: ProductInfo): string {
  return `
Please map the following product to the most appropriate HS (Harmonized System) code:

Product Name: ${product.name}
${product.description ? `Description: ${product.description}` : ''}
${product.price ? `Price: ${product.price}` : ''}

Provide the 6-digit HS code that best matches this product. If you're uncertain, provide your best guess with a lower confidence score.

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "product": "string",
  "hsCode": "string",
  "description": "string",
  "confidence": number, // 0-1 scale
  "metadata": {
    "alternativeCodes": ["string"],
    "notes": "string"
  }
}
\`\`\`
`;
} 