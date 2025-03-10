import { LearningEngine } from '../learning-engine';
import { ExportStrategyMemory } from '../export-strategy-memory';
import { RegulatoryPatternMemory } from '../regulatory-pattern-memory';
import { BusinessProfileTracker } from '../business-profile-tracker';
import { SimilarityEngine } from '../similarity-engine';
import { PatternSource, ConfidenceLevel } from '../learning-engine';

// Mock database
const mockDb = {
  collection: jest.fn().mockReturnThis(),
  findOne: jest.fn(),
  find: jest.fn().mockReturnThis(),
  toArray: jest.fn(),
  insertOne: jest.fn(),
  updateOne: jest.fn(),
  deleteOne: jest.fn()
};

// Mock database connection
jest.mock('../../db', () => ({
  getDb: jest.fn().mockReturnValue({ db: mockDb })
}));

// Mock dependencies
jest.mock('../export-strategy-memory');
jest.mock('../regulatory-pattern-memory');
jest.mock('../business-profile-tracker');
jest.mock('../similarity-engine');

describe('Memory Subsystem Integration', () => {
  let learningEngine: LearningEngine;
  let exportStrategyMemory: jest.Mocked<ExportStrategyMemory>;
  let regulatoryPatternMemory: jest.Mocked<RegulatoryPatternMemory>;
  let businessProfileTracker: jest.Mocked<BusinessProfileTracker>;
  let similarityEngine: jest.Mocked<SimilarityEngine>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    exportStrategyMemory = new (ExportStrategyMemory as any)() as jest.Mocked<ExportStrategyMemory>;
    regulatoryPatternMemory = new (RegulatoryPatternMemory as any)() as jest.Mocked<RegulatoryPatternMemory>;
    businessProfileTracker = new (BusinessProfileTracker as any)() as jest.Mocked<BusinessProfileTracker>;
    similarityEngine = new (SimilarityEngine as any)() as jest.Mocked<SimilarityEngine>;
    
    // Create learning engine instance with mocks
    learningEngine = new LearningEngine(
      exportStrategyMemory,
      regulatoryPatternMemory,
      businessProfileTracker,
      similarityEngine
    );
  });

  describe('Pattern Consolidation Flow', () => {
    it('should consolidate similar patterns across memory systems', async () => {
      // Arrange
      const exportStrategyPatterns = [
        {
          id: 'es-pattern1',
          name: 'Germany Direct Export',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          confidence: 0.8,
          applicationCount: 10,
          successRate: 0.7,
          criticalSuccessFactors: ['Quality certification', 'Local partnerships'],
          commonChallenges: ['Language barriers', 'Regulatory compliance'],
          applicableMarkets: ['Germany'],
          productCategories: ['Electronics'],
          businessSizeRange: { min: 10, max: 100 },
          relevantCertifications: ['ISO 9001']
        },
        {
          id: 'es-pattern2',
          name: 'Germany Direct Export - Similar',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          confidence: 0.7,
          applicationCount: 5,
          successRate: 0.6,
          criticalSuccessFactors: ['Quality certification', 'Market research'],
          commonChallenges: ['Language barriers', 'Cultural differences'],
          applicableMarkets: ['Germany'],
          productCategories: ['Electronics'],
          businessSizeRange: { min: 5, max: 50 },
          relevantCertifications: ['ISO 9001', 'CE Mark']
        }
      ];
      
      const regulatoryPatterns = [
        {
          id: 'reg-pattern1',
          name: 'EU Electronics Certification',
          type: 'CERTIFICATION',
          domain: 'Electronics',
          applicableMarkets: ['Germany', 'France', 'Italy'],
          confidence: 0.8,
          applicationCount: 10,
          successRate: 0.8,
          productCategories: ['Electronics'],
          regulatoryDomain: 'Electronics',
          patternCriteria: {
            requirements: [
              { name: 'CE Marking', description: 'Required for all electronic products' }
            ]
          }
        },
        {
          id: 'reg-pattern2',
          name: 'EU Electronics Certification - Similar',
          type: 'CERTIFICATION',
          domain: 'Electronics',
          applicableMarkets: ['Germany', 'France'],
          confidence: 0.75,
          applicationCount: 8,
          successRate: 0.7,
          productCategories: ['Electronics'],
          regulatoryDomain: 'Electronics',
          patternCriteria: {
            requirements: [
              { name: 'CE Marking', description: 'Required for electronic products in EU' }
            ]
          }
        }
      ];
      
      // Mock the getAllPatterns methods
      exportStrategyMemory.getAllPatterns.mockResolvedValue(exportStrategyPatterns as any);
      regulatoryPatternMemory.getAllPatterns.mockResolvedValue(regulatoryPatterns as any);
      
      // Mock the similarity calculation methods
      jest.spyOn(learningEngine as any, 'calculateExportStrategyPatternSimilarity')
        .mockReturnValue(0.9); // High similarity for export strategy patterns
      
      jest.spyOn(learningEngine as any, 'calculateRegulatoryPatternSimilarity')
        .mockReturnValue(0.9); // High similarity for regulatory patterns
      
      // Mock the merge methods
      const mergeExportStrategyPatternsSpy = jest.spyOn(
        learningEngine as any, 
        'mergeExportStrategyPatterns'
      ).mockResolvedValue(undefined);
      
      const mergeRegulatoryPatternsSpy = jest.spyOn(
        learningEngine as any, 
        'mergeRegulatoryPatterns'
      ).mockResolvedValue(undefined);
      
      // Act
      await learningEngine.consolidatePatterns();
      
      // Assert
      expect(exportStrategyMemory.getAllPatterns).toHaveBeenCalledTimes(1);
      expect(regulatoryPatternMemory.getAllPatterns).toHaveBeenCalledTimes(1);
      
      expect(mergeExportStrategyPatternsSpy).toHaveBeenCalledTimes(1);
      expect(mergeExportStrategyPatternsSpy).toHaveBeenCalledWith(
        exportStrategyPatterns[0],
        [exportStrategyPatterns[1]]
      );
      
      expect(mergeRegulatoryPatternsSpy).toHaveBeenCalledTimes(1);
      expect(mergeRegulatoryPatternsSpy).toHaveBeenCalledWith(
        regulatoryPatterns[0],
        [regulatoryPatterns[1]]
      );
    });
  });

  describe('Feedback Loop Flow', () => {
    it('should adjust pattern confidence based on feedback', async () => {
      // Arrange
      const patternApplicationId = 'app-123';
      const patternId = 'pattern-456';
      const businessId = 'business-789';
      const isHelpful = true;
      const feedbackDetails = 'This recommendation was very helpful';
      
      // Mock pattern application
      const patternApplication = {
        id: patternApplicationId,
        patternId,
        confidence: 0.8,
        source: PatternSource.EXPORT_STRATEGY,
        explanation: 'This pattern was applied because...',
        appliedTo: 'market-recommendation',
        metadata: {}
      };
      
      // Mock pattern
      const pattern = {
        id: patternId,
        name: 'Germany Direct Export',
        confidence: 0.75,
        applicationCount: 10,
        successRate: 0.7,
        metadata: {}
      };
      
      // Mock getPatternApplication
      jest.spyOn(learningEngine as any, 'getPatternApplication')
        .mockResolvedValue(patternApplication);
      
      // Mock findPatternById
      exportStrategyMemory.findPatternById.mockResolvedValue([pattern] as any);
      
      // Mock adjustPatternConfidence
      const adjustPatternConfidenceSpy = jest.spyOn(
        learningEngine as any, 
        'adjustPatternConfidence'
      ).mockReturnValue(0.82); // Increased confidence due to positive feedback
      
      // Mock recordFeedback
      const recordFeedbackSpy = jest.spyOn(
        learningEngine as any, 
        'recordFeedback'
      ).mockResolvedValue(undefined);
      
      // Act
      await learningEngine.processFeedback(
        businessId,
        patternApplicationId,
        isHelpful,
        feedbackDetails
      );
      
      // Assert
      expect(exportStrategyMemory.findPatternById).toHaveBeenCalledWith(patternId);
      
      expect(adjustPatternConfidenceSpy).toHaveBeenCalledWith(
        pattern.confidence,
        pattern.applicationCount,
        isHelpful,
        patternApplication.confidence
      );
      
      expect(exportStrategyMemory.updatePattern).toHaveBeenCalledTimes(1);
      expect(exportStrategyMemory.updatePattern).toHaveBeenCalledWith(expect.objectContaining({
        id: patternId,
        confidence: 0.82, // Updated confidence
        applicationCount: 11, // Incremented
        successRate: expect.any(Number),
        metadata: expect.objectContaining({
          feedback: expect.arrayContaining([
            expect.objectContaining({
              businessId,
              patternApplicationId,
              isHelpful,
              feedbackDetails
            })
          ])
        })
      }));
      
      expect(recordFeedbackSpy).toHaveBeenCalledWith(
        businessId,
        patternApplicationId,
        isHelpful,
        feedbackDetails
      );
    });
    
    it('should handle negative feedback appropriately', async () => {
      // Arrange
      const patternApplicationId = 'app-123';
      const patternId = 'pattern-456';
      const businessId = 'business-789';
      const isHelpful = false;
      const feedbackDetails = 'This recommendation was not relevant';
      
      // Mock pattern application
      const patternApplication = {
        id: patternApplicationId,
        patternId,
        confidence: 0.8,
        source: PatternSource.REGULATORY,
        explanation: 'This pattern was applied because...',
        appliedTo: 'compliance-recommendation',
        metadata: {}
      };
      
      // Mock pattern
      const pattern = {
        id: patternId,
        name: 'EU Electronics Certification',
        confidence: 0.75,
        applicationCount: 10,
        successRate: 0.7,
        metadata: {}
      };
      
      // Mock getPatternApplication
      jest.spyOn(learningEngine as any, 'getPatternApplication')
        .mockResolvedValue(patternApplication);
      
      // Mock findPatternById
      regulatoryPatternMemory.findPatternById.mockResolvedValue([pattern] as any);
      
      // Mock adjustPatternConfidence
      const adjustPatternConfidenceSpy = jest.spyOn(
        learningEngine as any, 
        'adjustPatternConfidence'
      ).mockReturnValue(0.68); // Decreased confidence due to negative feedback
      
      // Mock recordFeedback
      const recordFeedbackSpy = jest.spyOn(
        learningEngine as any, 
        'recordFeedback'
      ).mockResolvedValue(undefined);
      
      // Act
      await learningEngine.processFeedback(
        businessId,
        patternApplicationId,
        isHelpful,
        feedbackDetails
      );
      
      // Assert
      expect(regulatoryPatternMemory.findPatternById).toHaveBeenCalledWith(patternId);
      
      expect(adjustPatternConfidenceSpy).toHaveBeenCalledWith(
        pattern.confidence,
        pattern.applicationCount,
        isHelpful,
        patternApplication.confidence
      );
      
      expect(regulatoryPatternMemory.updatePattern).toHaveBeenCalledTimes(1);
      expect(regulatoryPatternMemory.updatePattern).toHaveBeenCalledWith(expect.objectContaining({
        id: patternId,
        confidence: 0.68, // Updated confidence (decreased)
        applicationCount: 11, // Incremented
        successRate: expect.any(Number), // Should be decreased
        metadata: expect.objectContaining({
          feedback: expect.arrayContaining([
            expect.objectContaining({
              businessId,
              patternApplicationId,
              isHelpful,
              feedbackDetails
            })
          ])
        })
      }));
      
      expect(recordFeedbackSpy).toHaveBeenCalledWith(
        businessId,
        patternApplicationId,
        isHelpful,
        feedbackDetails
      );
    });
  });

  describe('Recommendation Enhancement Flow', () => {
    it('should enhance market recommendations with pattern insights', async () => {
      // Arrange
      const businessId = 'business-123';
      const businessProfile = {
        id: businessId,
        name: 'Test Electronics',
        size: 50,
        products: [
          { name: 'Test Product', category: 'Electronics', description: 'Electronic device' }
        ],
        targetMarkets: ['Germany', 'France']
      };
      
      const recommendations = [
        {
          market: 'Germany',
          score: 85,
          reasons: ['Large market for electronics', 'Growing demand']
        },
        {
          market: 'France',
          score: 75,
          reasons: ['Established distribution networks', 'Favorable regulations']
        }
      ];
      
      // Mock relevant patterns
      const relevantPatterns = [
        {
          id: 'pattern1',
          name: 'Germany Electronics Success',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          confidence: 0.85,
          successRate: 0.8,
          criticalSuccessFactors: ['Quality certification', 'Local partnerships']
        }
      ];
      
      // Mock findRelevantPatterns
      exportStrategyMemory.findRelevantPatterns.mockResolvedValue(relevantPatterns as any);
      
      // Mock isPatternApplicable and applyStrategyPattern
      jest.spyOn(learningEngine as any, 'isPatternApplicable').mockReturnValue(true);
      
      jest.spyOn(learningEngine as any, 'applyStrategyPattern').mockImplementation((pattern, recommendation) => {
        if (recommendation.market === 'Germany') {
          return {
            patternId: pattern.id,
            confidence: pattern.confidence,
            confidenceLevel: ConfidenceLevel.HIGH,
            source: PatternSource.EXPORT_STRATEGY,
            explanation: `${pattern.entryStrategy} has been successful for similar businesses`,
            appliedTo: 'market-recommendation',
            beforeEnhancement: { score: recommendation.score },
            afterEnhancement: { score: recommendation.score + 5 },
            metadata: {}
          };
        }
        return null;
      });
      
      // Mock recordPatternApplications
      jest.spyOn(learningEngine as any, 'recordPatternApplications').mockResolvedValue(undefined);
      
      // Act
      const result = await learningEngine.enhanceMarketRecommendations(
        businessId,
        businessProfile as any,
        recommendations
      );
      
      // Assert
      expect(exportStrategyMemory.findRelevantPatterns).toHaveBeenCalledWith(businessProfile);
      
      expect(result.enhancedRecommendations).toHaveLength(2);
      expect(result.enhancedRecommendations[0].score).toBeGreaterThan(recommendations[0].score);
      expect(result.enhancedRecommendations[0].patternInsights).toBeDefined();
      expect(result.enhancedRecommendations[1].score).toBe(recommendations[1].score);
      
      expect(result.patternApplications).toHaveLength(1);
      expect(result.patternApplications[0].patternId).toBe('pattern1');
      expect(result.patternApplications[0].source).toBe(PatternSource.EXPORT_STRATEGY);
    });
  });
}); 