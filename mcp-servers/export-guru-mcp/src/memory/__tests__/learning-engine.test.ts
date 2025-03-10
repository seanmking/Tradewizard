import { LearningEngine } from '../learning-engine';
import { ExportStrategyMemory } from '../export-strategy-memory';
import { RegulatoryPatternMemory } from '../regulatory-pattern-memory';
import { BusinessProfileTracker } from '../business-profile-tracker';
import { SimilarityEngine } from '../similarity-engine';

// Mock dependencies
jest.mock('../export-strategy-memory');
jest.mock('../regulatory-pattern-memory');
jest.mock('../business-profile-tracker');
jest.mock('../similarity-engine');

describe('LearningEngine', () => {
  let learningEngine: LearningEngine;
  let mockExportStrategyMemory: jest.Mocked<ExportStrategyMemory>;
  let mockRegulatoryPatternMemory: jest.Mocked<RegulatoryPatternMemory>;
  let mockBusinessProfileTracker: jest.Mocked<BusinessProfileTracker>;
  let mockSimilarityEngine: jest.Mocked<SimilarityEngine>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances - using mocked constructors without arguments
    // The jest.mock() calls above will ensure these constructors don't require real arguments
    mockExportStrategyMemory = new (ExportStrategyMemory as any)() as jest.Mocked<ExportStrategyMemory>;
    mockRegulatoryPatternMemory = new (RegulatoryPatternMemory as any)() as jest.Mocked<RegulatoryPatternMemory>;
    mockBusinessProfileTracker = new (BusinessProfileTracker as any)() as jest.Mocked<BusinessProfileTracker>;
    mockSimilarityEngine = new (SimilarityEngine as any)() as jest.Mocked<SimilarityEngine>;
    
    // Create learning engine instance with mocks
    learningEngine = new LearningEngine(
      mockExportStrategyMemory,
      mockRegulatoryPatternMemory,
      mockBusinessProfileTracker,
      mockSimilarityEngine
    );
  });

  describe('getSimilarityEngine', () => {
    it('should return the similarity engine instance', () => {
      // Act
      const result = learningEngine.getSimilarityEngine();
      
      // Assert
      expect(result).toBe(mockSimilarityEngine);
    });
  });

  describe('consolidatePatterns', () => {
    it('should call consolidateExportStrategyPatterns and consolidateRegulatoryPatterns', async () => {
      // Arrange
      const consolidateExportStrategyPatternsSpy = jest.spyOn(
        learningEngine as any, 
        'consolidateExportStrategyPatterns'
      ).mockResolvedValue(undefined);
      
      const consolidateRegulatoryPatternsSpy = jest.spyOn(
        learningEngine as any, 
        'consolidateRegulatoryPatterns'
      ).mockResolvedValue(undefined);
      
      // Act
      await learningEngine.consolidatePatterns();
      
      // Assert
      expect(consolidateExportStrategyPatternsSpy).toHaveBeenCalledTimes(1);
      expect(consolidateRegulatoryPatternsSpy).toHaveBeenCalledTimes(1);
    });
    
    it('should handle errors gracefully', async () => {
      // Arrange
      const consolidateExportStrategyPatternsSpy = jest.spyOn(
        learningEngine as any, 
        'consolidateExportStrategyPatterns'
      ).mockRejectedValue(new Error('Test error'));
      
      const consolidateRegulatoryPatternsSpy = jest.spyOn(
        learningEngine as any, 
        'consolidateRegulatoryPatterns'
      ).mockResolvedValue(undefined);
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Act
      await learningEngine.consolidatePatterns();
      
      // Assert
      expect(consolidateExportStrategyPatternsSpy).toHaveBeenCalledTimes(1);
      expect(consolidateRegulatoryPatternsSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error consolidating patterns')
      );
    });
  });

  describe('consolidateExportStrategyPatterns', () => {
    it('should consolidate similar export strategy patterns', async () => {
      // Arrange
      const mockPatterns = [
        {
          id: 'pattern1',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          confidence: 0.8,
          applicationCount: 10,
          successRate: 0.7,
          criticalSuccessFactors: ['Quality certification', 'Local partnerships'],
          commonChallenges: ['Language barriers', 'Regulatory compliance']
        },
        {
          id: 'pattern2',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          confidence: 0.7,
          applicationCount: 5,
          successRate: 0.6,
          criticalSuccessFactors: ['Quality certification', 'Market research'],
          commonChallenges: ['Language barriers', 'Cultural differences']
        },
        {
          id: 'pattern3',
          market: 'France',
          entryStrategy: 'Joint Venture',
          confidence: 0.9,
          applicationCount: 15,
          successRate: 0.8,
          criticalSuccessFactors: ['Strong partner selection', 'Clear agreements'],
          commonChallenges: ['Profit sharing disputes', 'Management control']
        }
      ];
      
      mockExportStrategyMemory.getAllPatterns.mockResolvedValue(mockPatterns as any);
      
      const calculatePatternSimilaritySpy = jest.spyOn(
        learningEngine as any, 
        'calculateExportStrategyPatternSimilarity'
      ).mockReturnValue(0.9); // High similarity for the first two patterns
      
      const mergeExportStrategyPatternsSpy = jest.spyOn(
        learningEngine as any, 
        'mergeExportStrategyPatterns'
      ).mockResolvedValue(undefined);
      
      // Act
      await (learningEngine as any).consolidateExportStrategyPatterns();
      
      // Assert
      expect(mockExportStrategyMemory.getAllPatterns).toHaveBeenCalledTimes(1);
      expect(calculatePatternSimilaritySpy).toHaveBeenCalledTimes(1);
      expect(mergeExportStrategyPatternsSpy).toHaveBeenCalledTimes(1);
      expect(mergeExportStrategyPatternsSpy).toHaveBeenCalledWith(
        mockPatterns[0],
        [mockPatterns[1]]
      );
    });
    
    it('should not merge patterns with low similarity', async () => {
      // Arrange
      const mockPatterns = [
        {
          id: 'pattern1',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          confidence: 0.8,
          applicationCount: 10,
          successRate: 0.7,
          criticalSuccessFactors: ['Quality certification', 'Local partnerships'],
          commonChallenges: ['Language barriers', 'Regulatory compliance']
        },
        {
          id: 'pattern2',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          confidence: 0.7,
          applicationCount: 5,
          successRate: 0.6,
          criticalSuccessFactors: ['Quality certification', 'Market research'],
          commonChallenges: ['Language barriers', 'Cultural differences']
        }
      ];
      
      mockExportStrategyMemory.getAllPatterns.mockResolvedValue(mockPatterns as any);
      
      const calculatePatternSimilaritySpy = jest.spyOn(
        learningEngine as any, 
        'calculateExportStrategyPatternSimilarity'
      ).mockReturnValue(0.7); // Below threshold
      
      const mergeExportStrategyPatternsSpy = jest.spyOn(
        learningEngine as any, 
        'mergeExportStrategyPatterns'
      ).mockResolvedValue(undefined);
      
      // Act
      await (learningEngine as any).consolidateExportStrategyPatterns();
      
      // Assert
      expect(mockExportStrategyMemory.getAllPatterns).toHaveBeenCalledTimes(1);
      expect(calculatePatternSimilaritySpy).toHaveBeenCalledTimes(1);
      expect(mergeExportStrategyPatternsSpy).not.toHaveBeenCalled();
    });
  });

  describe('mergeExportStrategyPatterns', () => {
    it('should merge patterns correctly', async () => {
      // Arrange
      const primaryPattern = {
        id: 'pattern1',
        market: 'Germany',
        entryStrategy: 'Direct Export',
        confidence: 0.8,
        applicationCount: 10,
        successRate: 0.7,
        criticalSuccessFactors: ['Quality certification', 'Local partnerships'],
        commonChallenges: ['Language barriers', 'Regulatory compliance'],
        relevantCertifications: ['ISO 9001']
      };
      
      const patternsToMerge = [
        {
          id: 'pattern2',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          confidence: 0.7,
          applicationCount: 5,
          successRate: 0.6,
          criticalSuccessFactors: ['Quality certification', 'Market research'],
          commonChallenges: ['Language barriers', 'Cultural differences'],
          relevantCertifications: ['ISO 9001', 'CE Mark']
        }
      ];
      
      const calculateConfidenceSpy = jest.spyOn(
        learningEngine as any, 
        'calculateConfidence'
      ).mockReturnValue(0.85);
      
      // Act
      await (learningEngine as any).mergeExportStrategyPatterns(primaryPattern, patternsToMerge);
      
      // Assert
      expect(mockExportStrategyMemory.updatePattern).toHaveBeenCalledTimes(1);
      expect(mockExportStrategyMemory.updatePattern).toHaveBeenCalledWith({
        ...primaryPattern,
        applicationCount: 15, // 10 + 5
        successRate: expect.any(Number), // Weighted average
        confidence: 0.85,
        criticalSuccessFactors: expect.arrayContaining([
          'Quality certification', 'Local partnerships', 'Market research'
        ]),
        commonChallenges: expect.arrayContaining([
          'Language barriers', 'Regulatory compliance', 'Cultural differences'
        ]),
        relevantCertifications: expect.arrayContaining([
          'ISO 9001', 'CE Mark'
        ])
      });
      
      expect(mockExportStrategyMemory.archivePattern).toHaveBeenCalledTimes(1);
      expect(mockExportStrategyMemory.archivePattern).toHaveBeenCalledWith(
        'pattern2', 'pattern1'
      );
    });
  });

  describe('calculatePatternSimilarity', () => {
    it('should call the appropriate similarity calculation method based on pattern type', () => {
      // Arrange
      const exportStrategyPattern1 = { type: 'EXPORT_STRATEGY' };
      const exportStrategyPattern2 = { type: 'EXPORT_STRATEGY' };
      
      const regulatoryPattern1 = { type: 'REGULATORY' };
      const regulatoryPattern2 = { type: 'REGULATORY' };
      
      const calculateExportStrategyPatternSimilaritySpy = jest.spyOn(
        learningEngine as any, 
        'calculateExportStrategyPatternSimilarity'
      ).mockReturnValue(0.8);
      
      const calculateRegulatoryPatternSimilaritySpy = jest.spyOn(
        learningEngine as any, 
        'calculateRegulatoryPatternSimilarity'
      ).mockReturnValue(0.7);
      
      // Act
      const exportSimilarity = (learningEngine as any).calculatePatternSimilarity(
        exportStrategyPattern1, 
        exportStrategyPattern2
      );
      
      const regulatorySimilarity = (learningEngine as any).calculatePatternSimilarity(
        regulatoryPattern1, 
        regulatoryPattern2
      );
      
      // Assert
      expect(calculateExportStrategyPatternSimilaritySpy).toHaveBeenCalledWith(
        exportStrategyPattern1, 
        exportStrategyPattern2
      );
      
      expect(calculateRegulatoryPatternSimilaritySpy).toHaveBeenCalledWith(
        regulatoryPattern1, 
        regulatoryPattern2
      );
      
      expect(exportSimilarity).toBe(0.8);
      expect(regulatorySimilarity).toBe(0.7);
    });
    
    it('should return 0 for unknown pattern types', () => {
      // Arrange
      const unknownPattern1 = { type: 'UNKNOWN' };
      const unknownPattern2 = { type: 'UNKNOWN' };
      
      // Act
      const similarity = (learningEngine as any).calculatePatternSimilarity(
        unknownPattern1, 
        unknownPattern2
      );
      
      // Assert
      expect(similarity).toBe(0);
    });
  });

  describe('calculateSetSimilarity', () => {
    it('should calculate Jaccard similarity between two sets correctly', () => {
      // Arrange
      const set1 = ['apple', 'banana', 'orange'];
      const set2 = ['banana', 'orange', 'grape'];
      
      // Act
      const similarity = (learningEngine as any).calculateSetSimilarity(set1, set2);
      
      // Assert
      // Intersection: ['banana', 'orange'] (2 elements)
      // Union: ['apple', 'banana', 'orange', 'grape'] (4 elements)
      // Jaccard similarity: 2/4 = 0.5
      expect(similarity).toBe(0.5);
    });
    
    it('should handle empty sets correctly', () => {
      // Arrange
      const set1: string[] = [];
      const set2 = ['banana', 'orange', 'grape'];
      
      // Act
      const similarity1 = (learningEngine as any).calculateSetSimilarity(set1, set2);
      const similarity2 = (learningEngine as any).calculateSetSimilarity(set2, set1);
      const similarity3 = (learningEngine as any).calculateSetSimilarity(set1, []);
      
      // Assert
      expect(similarity1).toBe(0);
      expect(similarity2).toBe(0);
      expect(similarity3).toBe(0);
    });
    
    it('should handle identical sets correctly', () => {
      // Arrange
      const set1 = ['apple', 'banana', 'orange'];
      const set2 = ['apple', 'banana', 'orange'];
      
      // Act
      const similarity = (learningEngine as any).calculateSetSimilarity(set1, set2);
      
      // Assert
      expect(similarity).toBe(1);
    });
  });

  describe('getTopFrequentItems', () => {
    it('should return the top N most frequent items', () => {
      // Arrange
      const items = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple', 'grape', 'orange'];
      
      // Act
      const topItems = (learningEngine as any).getTopFrequentItems(items, 2);
      
      // Assert
      // Frequencies: apple (3), banana (2), orange (2), grape (1)
      // Top 2: apple, banana or orange (tie)
      expect(topItems).toHaveLength(2);
      expect(topItems).toContain('apple');
      // Fix for the .or property not existing on type 'void'
      expect(topItems.includes('banana') || topItems.includes('orange')).toBe(true);
    });
    
    it('should handle empty arrays correctly', () => {
      // Arrange
      const items: string[] = [];
      
      // Act
      const topItems = (learningEngine as any).getTopFrequentItems(items, 3);
      
      // Assert
      expect(topItems).toEqual([]);
    });
    
    it('should handle N larger than unique items count', () => {
      // Arrange
      const items = ['apple', 'banana', 'orange'];
      
      // Act
      const topItems = (learningEngine as any).getTopFrequentItems(items, 5);
      
      // Assert
      expect(topItems).toHaveLength(3);
      expect(topItems).toContain('apple');
      expect(topItems).toContain('banana');
      expect(topItems).toContain('orange');
    });
  });

  describe('calculateConfidence', () => {
    it('should calculate confidence based on success rate and application count', () => {
      // Arrange
      const successRate = 0.8;
      const applicationCount = 20;
      
      // Act
      const confidence = (learningEngine as any).calculateConfidence(successRate, applicationCount);
      
      // Assert
      // For high application count and success rate, confidence should be high
      expect(confidence).toBeGreaterThan(0.8);
    });
    
    it('should reduce confidence for low application counts', () => {
      // Arrange
      const successRate = 0.8;
      const lowApplicationCount = 2;
      
      // Act
      const confidence = (learningEngine as any).calculateConfidence(successRate, lowApplicationCount);
      
      // Assert
      // For low application count, confidence should be lower than success rate
      expect(confidence).toBeLessThan(successRate);
    });
    
    it('should handle edge cases correctly', () => {
      // Arrange & Act
      const confidenceZeroSuccess = (learningEngine as any).calculateConfidence(0, 10);
      const confidenceZeroApplications = (learningEngine as any).calculateConfidence(0.8, 0);
      
      // Assert
      expect(confidenceZeroSuccess).toBeLessThan(0.5); // Low confidence for zero success
      expect(confidenceZeroApplications).toBeLessThan(0.5); // Low confidence for zero applications
    });
  });
}); 