/**
 * Product Categorization
 * 
 * This module provides functionality for categorizing products
 * and mapping them to business sectors and attributes.
 */

import { LLM } from '../../types/common';
import { BusinessCategory, ProductInfo } from '../../types/business';
import { completeWithRetry, parseStructuredResponse } from '../../utils/llm-helpers';
import { trackResponseTime } from '../../utils/monitoring';

/**
 * Categorizes a product
 */
export async function categorizeProduct(
  product: ProductInfo,
  llm: LLM
): Promise<BusinessCategory[]> {
  return trackResponseTime('categorizeProduct', async () => {
    const prompt = generateCategorizationPrompt(product);
    const response = await completeWithRetry(llm, prompt);
    
    try {
      const result = parseStructuredResponse<{ categories: BusinessCategory[] }>(response);
      return result.categories;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to parse product categorization: ${errorMessage}`);
      
      // Return a default category with low confidence
      return [{
        mainSector: 'Unknown',
        subSector: 'Unknown',
        attributes: [],
        confidence: 0.1
      }];
    }
  }, { productName: product.name });
}

/**
 * Categorizes multiple products
 */
export async function categorizeProducts(
  products: ProductInfo[],
  llm: LLM
): Promise<Record<string, BusinessCategory[]>> {
  const categorizations: Record<string, BusinessCategory[]> = {};
  
  for (const product of products) {
    try {
      const categories = await categorizeProduct(product, llm);
      categorizations[product.name] = categories;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to categorize product ${product.name}: ${errorMessage}`);
      
      // Add a default category with low confidence
      categorizations[product.name] = [{
        mainSector: 'Unknown',
        subSector: 'Unknown',
        attributes: [],
        confidence: 0.1
      }];
    }
  }
  
  return categorizations;
}

/**
 * Gets the main business category from product categories
 */
export function getMainBusinessCategory(
  productCategories: Record<string, BusinessCategory[]>
): BusinessCategory {
  // Flatten all categories
  const allCategories = Object.values(productCategories).flat();
  
  if (allCategories.length === 0) {
    return {
      mainSector: 'Unknown',
      subSector: 'Unknown',
      attributes: [],
      confidence: 0
    };
  }
  
  // Group by main sector
  const sectorCounts: Record<string, {
    count: number;
    subSectors: Record<string, number>;
    attributes: Set<string>;
    totalConfidence: number;
  }> = {};
  
  for (const category of allCategories) {
    if (!sectorCounts[category.mainSector]) {
      sectorCounts[category.mainSector] = {
        count: 0,
        subSectors: {},
        attributes: new Set(),
        totalConfidence: 0
      };
    }
    
    sectorCounts[category.mainSector].count++;
    sectorCounts[category.mainSector].totalConfidence += category.confidence;
    
    // Track sub-sectors
    if (!sectorCounts[category.mainSector].subSectors[category.subSector]) {
      sectorCounts[category.mainSector].subSectors[category.subSector] = 0;
    }
    sectorCounts[category.mainSector].subSectors[category.subSector]++;
    
    // Track attributes
    for (const attribute of category.attributes) {
      sectorCounts[category.mainSector].attributes.add(attribute);
    }
  }
  
  // Find the most common main sector
  let mainSector = '';
  let maxCount = 0;
  
  for (const sector in sectorCounts) {
    if (sectorCounts[sector].count > maxCount) {
      mainSector = sector;
      maxCount = sectorCounts[sector].count;
    }
  }
  
  // Find the most common sub-sector for the main sector
  let subSector = '';
  maxCount = 0;
  
  for (const sub in sectorCounts[mainSector].subSectors) {
    if (sectorCounts[mainSector].subSectors[sub] > maxCount) {
      subSector = sub;
      maxCount = sectorCounts[mainSector].subSectors[sub];
    }
  }
  
  // Calculate average confidence
  const avgConfidence = sectorCounts[mainSector].totalConfidence / sectorCounts[mainSector].count;
  
  return {
    mainSector,
    subSector,
    attributes: Array.from(sectorCounts[mainSector].attributes),
    confidence: avgConfidence
  };
}

/**
 * Gets related business categories based on a main category
 */
export async function getRelatedCategories(
  mainCategory: BusinessCategory,
  llm: LLM
): Promise<BusinessCategory[]> {
  return trackResponseTime('getRelatedCategories', async () => {
    const prompt = `
Please provide related business categories for the following main category:

Main Sector: ${mainCategory.mainSector}
Sub-Sector: ${mainCategory.subSector}
Attributes: ${mainCategory.attributes.join(', ')}

Suggest 3-5 related business categories that might be relevant for a business in this sector.
Each category should include a main sector, sub-sector, and relevant attributes.

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "relatedCategories": [
    {
      "mainSector": "string",
      "subSector": "string",
      "attributes": ["string"],
      "confidence": number, // 0-1 scale
      "relevance": "string" // Brief explanation of relevance
    }
  ]
}
\`\`\`
`;
    
    const response = await completeWithRetry(llm, prompt);
    
    try {
      const result = parseStructuredResponse<{ relatedCategories: (BusinessCategory & { relevance: string })[] }>(response);
      return result.relatedCategories;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to parse related categories: ${errorMessage}`);
      
      // Return an empty array
      return [];
    }
  }, { mainSector: mainCategory.mainSector, subSector: mainCategory.subSector });
}

/**
 * Generates a prompt for product categorization
 */
function generateCategorizationPrompt(product: ProductInfo): string {
  return `
Please categorize the following product into appropriate business sectors:

Product Name: ${product.name}
${product.description ? `Description: ${product.description}` : ''}
${product.hsCode ? `HS Code: ${product.hsCode}` : ''}
${product.price ? `Price: ${product.price}` : ''}

Provide 1-3 possible business categories for this product, with the most likely one first.
Each category should include a main sector, sub-sector, and relevant attributes.

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "categories": [
    {
      "mainSector": "string",
      "subSector": "string",
      "attributes": ["string"],
      "confidence": number // 0-1 scale
    }
  ]
}
\`\`\`
`;
} 