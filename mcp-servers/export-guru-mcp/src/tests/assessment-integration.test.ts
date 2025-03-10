/**
 * Assessment Integration Tests
 * 
 * This test suite validates the end-to-end assessment flow,
 * from user input to report generation.
 */

import { expect } from 'chai';
import { processAssessmentResponses, AssessmentResponse } from '../tools/assessment-integration';
import { mockConnectors } from './mocks/connectors';
import { mockLLM } from './mocks/llm';

describe('Assessment Integration', () => {
  describe('End-to-End Assessment Flow', () => {
    it('should process a complete assessment with website URL', async () => {
      const responses: AssessmentResponse[] = [
        { questionId: 'business_name', answer: 'Test Business' },
        { questionId: 'business_website', answer: 'https://www.testbusiness.com' },
        { questionId: 'product_category', answer: 'Fresh Fruits' },
        { questionId: 'target_markets', answer: ['United Arab Emirates', 'United Kingdom'] }
      ];
      
      const result = await processAssessmentResponses(responses, mockConnectors, mockLLM);
      
      // Validate business profile
      expect(result.businessProfile).to.exist;
      expect(result.businessProfile.name).to.equal('Test Business');
      expect(result.businessProfile.website).to.equal('https://www.testbusiness.com');
      expect(result.businessProfile.products).to.be.an('array').that.is.not.empty;
      expect(result.businessProfile.targetMarkets).to.deep.equal(['United Arab Emirates', 'United Kingdom']);
      
      // Validate website analysis
      expect(result.websiteAnalysis).to.exist;
      expect(result.websiteAnalysis?.confidence).to.be.a('number');
      expect(result.websiteAnalysis?.detectedProducts).to.be.an('array');
      
      // Validate next steps
      expect(result.nextSteps).to.be.an('array').that.is.not.empty;
    });
    
    it('should process an assessment without website URL', async () => {
      const responses: AssessmentResponse[] = [
        { questionId: 'business_name', answer: 'Test Business' },
        { questionId: 'business_website', answer: '' },
        { questionId: 'product_category', answer: 'Cotton Textiles' },
        { questionId: 'target_markets', answer: ['United States'] }
      ];
      
      const result = await processAssessmentResponses(responses, mockConnectors, mockLLM);
      
      // Validate business profile
      expect(result.businessProfile).to.exist;
      expect(result.businessProfile.name).to.equal('Test Business');
      expect(result.businessProfile.products).to.be.an('array').that.is.not.empty;
      expect(result.businessProfile.products[0].name).to.equal('Cotton Textiles');
      expect(result.businessProfile.targetMarkets).to.deep.equal(['United States']);
      
      // No website analysis should be present
      expect(result.websiteAnalysis).to.not.exist;
      
      // Validate next steps
      expect(result.nextSteps).to.be.an('array').that.is.not.empty;
      expect(result.nextSteps.some(step => step.includes('website'))).to.be.true;
    });
    
    it('should handle missing required responses', async () => {
      const responses: AssessmentResponse[] = [
        { questionId: 'business_name', answer: 'Test Business' },
        // Missing product_category
        { questionId: 'target_markets', answer: ['United Kingdom'] }
      ];
      
      try {
        await processAssessmentResponses(responses, mockConnectors, mockLLM);
        // Should not reach here
        expect.fail('Should have thrown an error for missing required responses');
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });
  
  describe('State Persistence', () => {
    it('should maintain state across conversation turns', async () => {
      // First turn: Initial assessment
      const initialResponses: AssessmentResponse[] = [
        { questionId: 'business_name', answer: 'Persistent Business' },
        { questionId: 'business_website', answer: 'https://www.persistentbusiness.com' },
        { questionId: 'product_category', answer: 'Electronic Devices' },
        { questionId: 'target_markets', answer: ['United Arab Emirates'] }
      ];
      
      const initialResult = await processAssessmentResponses(initialResponses, mockConnectors, mockLLM);
      
      // Store the business profile ID for later retrieval
      const businessProfileId = initialResult.businessProfile.id;
      expect(businessProfileId).to.exist;
      
      // Simulate a second turn: Update target markets
      const updatedResponses: AssessmentResponse[] = [
        { questionId: 'business_name', answer: 'Persistent Business' },
        { questionId: 'target_markets', answer: ['United Arab Emirates', 'United Kingdom'] }
      ];
      
      const updatedResult = await processAssessmentResponses(updatedResponses, mockConnectors, mockLLM);
      
      // Verify that the business profile was updated
      expect(updatedResult.businessProfile.id).to.equal(businessProfileId);
      expect(updatedResult.businessProfile.targetMarkets).to.include('United Kingdom');
      
      // Original data should still be present
      expect(updatedResult.businessProfile.products).to.deep.equal(initialResult.businessProfile.products);
    });
  });
  
  describe('Product Verification', () => {
    it('should handle user confirmation of detected products', async () => {
      // TODO: Implement this test when the product verification functionality is complete
    });
    
    it('should handle user corrections to detected products', async () => {
      // TODO: Implement this test when the product verification functionality is complete
    });
  });
}); 