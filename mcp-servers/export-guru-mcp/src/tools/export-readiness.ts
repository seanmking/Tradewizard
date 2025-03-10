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
      parameters: [],
      handler: async () => getExportReadinessFramework()
    },
    {
      name: 'getExportReadinessDimensionQuestions',
      description: 'Get questions for a specific dimension of the export readiness assessment',
      parameters: [
        {
          name: 'dimensionName',
          description: 'Name of the dimension (e.g., "Financial Readiness", "Operational Capability", etc.)',
          type: 'string',
          required: true
        }
      ],
      handler: async (params) => getQuestionsForDimension(params.dimensionName)
    },
    {
      name: 'calculateExportReadinessScore',
      description: 'Calculate export readiness score based on assessment responses',
      parameters: [
        {
          name: 'responses',
          description: 'Object containing responses to questions, keyed by question ID with values from 1-5',
          type: 'object',
          required: true
        }
      ],
      handler: async (params) => calculateExportReadinessScore(params.responses)
    }
  ];
} 