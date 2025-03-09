import { Connectors } from '../../connectors';
import { LLM, Tool } from '../../types';
import { categorizeBusiness } from './categorize';
import { mapToHsCodes } from './hs-mapper';
import { analyzeWebsite } from './webscraper';

export function registerBusinessAnalysisTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'categorizeBusiness',
      description: 'Categorize a business based on its description and products',
      parameters: {
        type: 'object',
        properties: {
          businessName: { type: 'string', description: 'Name of the business' },
          description: { type: 'string', description: 'Description of the business' },
          products: { type: 'array', items: { type: 'string' }, description: 'List of products' }
        },
        required: ['businessName', 'description']
      },
      handler: async (params) => categorizeBusiness(params, connectors, llm)
    },
    {
      name: 'mapToHsCodes',
      description: 'Map products to HS (Harmonized System) codes',
      parameters: {
        type: 'object',
        properties: {
          products: { type: 'array', items: { type: 'string' }, description: 'List of products to map' },
          businessCategory: { type: 'string', description: 'Business category for context' }
        },
        required: ['products']
      },
      handler: async (params) => mapToHsCodes(params, connectors, llm)
    },
    {
      name: 'analyzeWebsite',
      description: 'Analyze a business website to extract product and business information',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL of the business website' },
          depth: { type: 'number', description: 'Depth of analysis (1-3)', default: 2 }
        },
        required: ['url']
      },
      handler: async (params) => analyzeWebsite(params, connectors, llm)
    }
  ];
}