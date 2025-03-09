/**
 * LLM Integration Utilities
 * 
 * This module provides utilities for integrating with LLMs,
 * including prompt generation, response parsing, and error handling.
 */

import { LLM } from '../types/common';

/**
 * Options for LLM completion
 */
export interface LLMCompletionOptions {
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  timeout?: number;
  retries?: number;
}

/**
 * Default LLM completion options
 */
const DEFAULT_COMPLETION_OPTIONS: LLMCompletionOptions = {
  max_tokens: 1000,
  temperature: 0.7,
  top_p: 0.95,
  timeout: 30000,
  retries: 3
};

/**
 * Completes a prompt with the LLM with error handling and retries
 */
export async function completeWithRetry(
  llm: LLM,
  prompt: string,
  options: Partial<LLMCompletionOptions> = {}
): Promise<string> {
  const mergedOptions = { ...DEFAULT_COMPLETION_OPTIONS, ...options };
  const { retries, timeout, ...llmOptions } = mergedOptions;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < (retries || 1); attempt++) {
    try {
      // Create a promise that resolves with the LLM completion
      const completionPromise = llm.complete({
        prompt,
        ...llmOptions
      });
      
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LLM request timed out')), timeout);
      });
      
      // Race the completion against the timeout
      const result = await Promise.race([completionPromise, timeoutPromise]);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`LLM completion attempt ${attempt + 1} failed: ${lastError.message}`);
      
      // If this was the last attempt, don't wait
      if (attempt < (retries || 1) - 1) {
        // Exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
  
  throw lastError || new Error('LLM completion failed');
}

/**
 * Parses a structured response from an LLM
 */
export function parseStructuredResponse<T>(
  response: string,
  validator?: (data: any) => boolean
): T {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                      response.match(/\{[\s\S]*\}/);
    
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    const data = JSON.parse(jsonStr);
    
    // Validate the data if a validator is provided
    if (validator && !validator(data)) {
      throw new Error('Response validation failed');
    }
    
    return data as T;
  } catch (error) {
    throw new Error(`Failed to parse LLM response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generates a prompt for regulatory data
 */
export function generateRegulatoryPrompt(
  country: string,
  productCategory: string,
  hsCode?: string,
  additionalContext?: string
): string {
  return `
Please provide detailed regulatory requirements for exporting ${productCategory}${hsCode ? ` (HS Code: ${hsCode})` : ''} to ${country}.

Include the following information:
- Import regulations and restrictions
- Required certifications and standards
- Labeling and packaging requirements
- Documentation requirements
- Relevant government agencies
- Estimated timeline for compliance
${additionalContext ? `\nAdditional context: ${additionalContext}` : ''}

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "requirements": [
    {
      "requirementType": "string",
      "description": "string",
      "agency": "string",
      "url": "string",
      "timeline": "string",
      "confidence": number
    }
  ],
  "summary": "string"
}
\`\`\`
`;
}

/**
 * Generates a prompt for market intelligence
 */
export function generateMarketIntelligencePrompt(
  country: string,
  productCategory: string,
  hsCode?: string,
  additionalContext?: string
): string {
  return `
Please provide detailed market intelligence for exporting ${productCategory}${hsCode ? ` (HS Code: ${hsCode})` : ''} to ${country}.

Include the following information:
- Market size and growth rate
- Key competitors and market share
- Consumer preferences and trends
- Distribution channels
- Pricing strategies
- Market entry barriers
${additionalContext ? `\nAdditional context: ${additionalContext}` : ''}

Format your response as a structured JSON object with the following schema:
\`\`\`json
{
  "marketSize": "string",
  "growthRate": "string",
  "competitors": [
    {
      "name": "string",
      "marketShare": number,
      "strengths": ["string"],
      "weaknesses": ["string"]
    }
  ],
  "consumerTrends": ["string"],
  "distributionChannels": ["string"],
  "pricingStrategies": ["string"],
  "entryBarriers": ["string"],
  "confidence": number
}
\`\`\`
`;
}

/**
 * Calculates confidence score for LLM-generated data
 */
export function calculateConfidence(
  response: string,
  keywords: string[],
  uncertaintyPhrases: string[] = ['uncertain', 'unclear', 'unknown', 'not sure', 'might', 'may', 'could', 'possibly']
): number {
  // Base confidence
  let confidence = 0.7;
  
  // Increase confidence for each keyword found
  for (const keyword of keywords) {
    if (response.toLowerCase().includes(keyword.toLowerCase())) {
      confidence += 0.05;
    }
  }
  
  // Decrease confidence for uncertainty phrases
  for (const phrase of uncertaintyPhrases) {
    if (response.toLowerCase().includes(phrase.toLowerCase())) {
      confidence -= 0.1;
    }
  }
  
  // Ensure confidence is between 0 and 1
  return Math.max(0, Math.min(1, confidence));
} 