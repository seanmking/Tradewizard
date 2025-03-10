/**
 * Mock LLM for Testing
 */

import { LLM } from '../../types';

export const mockLLM: LLM = {
  complete: async (options) => {
    // Extract prompt from options, handling both string and object formats
    const prompt = typeof options === 'string' ? options : options.prompt;
    
    // Mock responses based on prompt content
    if (prompt.includes('categorize') || prompt.includes('business')) {
      if (prompt.toLowerCase().includes('food') || prompt.toLowerCase().includes('fruit') || prompt.toLowerCase().includes('vegetable')) {
        return JSON.stringify({
          categories: [
            {
              mainSector: 'Agriculture & Food',
              subSector: 'Food Processing',
              attributes: ['Export-Ready', 'Processed Foods', 'Fresh Produce'],
              confidence: 0.85
            }
          ]
        });
      }
      
      if (prompt.toLowerCase().includes('textile') || prompt.toLowerCase().includes('fabric') || prompt.toLowerCase().includes('clothing')) {
        return JSON.stringify({
          categories: [
            {
              mainSector: 'Textiles & Apparel',
              subSector: 'Fabric Manufacturing',
              attributes: ['Export-Ready', 'Cotton Products', 'Garments'],
              confidence: 0.82
            }
          ]
        });
      }
      
      if (prompt.toLowerCase().includes('electronic') || prompt.toLowerCase().includes('device') || prompt.toLowerCase().includes('technology')) {
        return JSON.stringify({
          categories: [
            {
              mainSector: 'Electronics & Technology',
              subSector: 'Consumer Electronics',
              attributes: ['Export-Ready', 'Digital Devices', 'Home Appliances'],
              confidence: 0.88
            }
          ]
        });
      }
      
      // Mixed categories
      if (prompt.includes('diverse') || prompt.includes('mixed')) {
        return JSON.stringify({
          categories: [
            {
              mainSector: 'Diversified',
              subSector: 'Multiple Products',
              attributes: ['Export-Ready', 'Mixed Portfolio'],
              confidence: 0.75
            },
            {
              mainSector: 'Agriculture & Food',
              subSector: 'Food Processing',
              attributes: ['Export-Ready', 'Fresh Produce'],
              confidence: 0.65
            },
            {
              mainSector: 'Textiles & Apparel',
              subSector: 'Fabric Manufacturing',
              attributes: ['Export-Ready', 'Garments'],
              confidence: 0.60
            }
          ]
        });
      }
    }
    
    if (prompt.includes('HS code') || prompt.includes('classify')) {
      if (prompt.toLowerCase().includes('fruit') || prompt.toLowerCase().includes('vegetable')) {
        return JSON.stringify({
          hsCode: '0810.90',
          description: 'Fresh fruits, not elsewhere specified',
          confidence: 0.85
        });
      }
      
      if (prompt.toLowerCase().includes('textile') || prompt.toLowerCase().includes('fabric')) {
        return JSON.stringify({
          hsCode: '5208.12',
          description: 'Woven fabrics of cotton, containing 85% or more by weight of cotton',
          confidence: 0.82
        });
      }
      
      if (prompt.toLowerCase().includes('electronic') || prompt.toLowerCase().includes('device')) {
        return JSON.stringify({
          hsCode: '8517.12',
          description: 'Telephones for cellular networks or for other wireless networks',
          confidence: 0.88
        });
      }
    }
    
    if (prompt.includes('website') || prompt.includes('analyze')) {
      return JSON.stringify({
        businessProfile: {
          products: [
            {
              name: 'Sample Product',
              description: 'This is a sample product description',
              category: 'Sample Category',
              estimatedHsCode: '1234.56'
            }
          ],
          certifications: ['ISO 9001', 'HACCP'],
          marketFocus: ['Local', 'Regional', 'International']
        },
        regulatoryImplications: {
          suggestedRequirements: ['Certification', 'Labeling', 'Import License'],
          potentialCompliance: ['Medium difficulty', 'Estimated 2-3 months'],
          riskAreas: ['Documentation', 'Product Standards']
        }
      });
    }
    
    // Default response
    return JSON.stringify({
      result: 'This is a mock response',
      confidence: 0.75
    });
  }
}; 