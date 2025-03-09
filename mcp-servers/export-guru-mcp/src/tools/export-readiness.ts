import { Connectors } from '../connectors';
import { LLM, Tool } from '../types';
import { getExportReadinessFramework, getQuestionsForDimension, calculateExportReadinessScore } from './business-analysis/export-readiness-assessment';

/**
 * Register export readiness assessment tools
 * 
 * These tools provide functionality to assess the export readiness of South African SMEs
 * using a comprehensive framework based on academic research and industry best practices.
 */
export function registerExportReadinessTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'getExportReadinessFramework',
      description: 'Get the complete export readiness assessment framework for South African SMEs',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      handler: async () => getExportReadinessFramework()
    },
    {
      name: 'getExportReadinessDimensionQuestions',
      description: 'Get questions for a specific dimension of the export readiness assessment',
      parameters: {
        type: 'object',
        properties: {
          dimensionName: { 
            type: 'string', 
            description: 'Name of the dimension (e.g., "Financial Readiness", "Operational Capability", etc.)' 
          }
        },
        required: ['dimensionName']
      },
      handler: async (params) => getQuestionsForDimension(params.dimensionName)
    },
    {
      name: 'calculateExportReadinessScore',
      description: 'Calculate export readiness score based on assessment responses',
      parameters: {
        type: 'object',
        properties: {
          responses: { 
            type: 'object', 
            description: 'Object containing responses to questions, keyed by question ID with values from 1-5' 
          }
        },
        required: ['responses']
      },
      handler: async (params) => calculateExportReadinessScore(params.responses)
    }
  ];
} 