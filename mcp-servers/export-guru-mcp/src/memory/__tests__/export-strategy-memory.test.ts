import { ExportStrategyMemory } from '../export-strategy-memory';

// Define the ExportStrategyPattern interface for testing purposes
interface ExportStrategyPattern {
  id: string;
  name: string;
  description?: string;
  confidence: number;
  businessSizeRange: {
    min?: number;
    max?: number;
  };
  productCategories: string[];
  applicableMarkets: string[];
  entryStrategy: string;
  complianceApproach?: string;
  logisticsModel?: string;
  estimatedTimeline?: {
    min: number;
    max: number;
    average: number;
  };
  successRate: number;
  commonChallenges: string[];
  criticalSuccessFactors: string[];
  relevantCertifications: string[];
  applicationCount: number;
  discoveredAt?: Date;
  lastUpdated?: Date;
  metadata?: Record<string, any>;
  archived?: boolean;
  mergedInto?: string;
  archivedDate?: Date;
  market?: string; // Added for test compatibility
}

// Define the BusinessProfile interface for testing purposes
interface BusinessProfile {
  id: string;
  name: string;
  size: number;
  products: {
    name: string;
    description?: string;
    category: string;
    estimatedHsCode?: string;
  }[];
  targetMarkets: string[];
  certifications?: string[];
}

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

describe('ExportStrategyMemory', () => {
  let exportStrategyMemory: ExportStrategyMemory;
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock implementation for db methods
    mockDb.findOne.mockReset();
    mockDb.toArray.mockReset();
    mockDb.insertOne.mockReset();
    mockDb.updateOne.mockReset();
    mockDb.deleteOne.mockReset();
    
    // Create instance with mock similarity engine
    const mockSimilarityEngine = {
      calculateBusinessSimilarity: jest.fn()
    };
    exportStrategyMemory = new ExportStrategyMemory(mockSimilarityEngine as any, mockDb);
  });
  
  describe('getAllPatterns', () => {
    it('should retrieve all non-archived patterns from the database', async () => {
      // Arrange
      const mockPatterns: Partial<ExportStrategyPattern>[] = [
        {
          id: 'pattern1',
          name: 'Germany Direct Export',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          confidence: 0.8,
          archived: false
        },
        {
          id: 'pattern2',
          name: 'France Distribution',
          market: 'France',
          entryStrategy: 'Distribution Agreement',
          confidence: 0.7,
          archived: false
        }
      ];
      
      mockDb.toArray.mockResolvedValue(mockPatterns);
      
      // Act
      const result = await exportStrategyMemory.getAllPatterns();
      
      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('exportStrategyPatterns');
      expect(mockDb.find).toHaveBeenCalledWith({ archived: false });
      expect(mockDb.toArray).toHaveBeenCalled();
      expect(result).toEqual(mockPatterns);
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDb.toArray.mockRejectedValue(new Error('Database error'));
      
      // Act
      const result = await exportStrategyMemory.getAllPatterns();
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error retrieving export strategy patterns')
      );
      expect(result).toEqual([]);
    });
  });
  
  describe('updatePattern', () => {
    it('should update an existing pattern in the database', async () => {
      // Arrange
      const mockPattern: Partial<ExportStrategyPattern> = {
        id: 'pattern1',
        name: 'Germany Direct Export',
        market: 'Germany',
        entryStrategy: 'Direct Export',
        confidence: 0.85, // Updated confidence
        applicationCount: 15, // Updated application count
        productCategories: [],
        applicableMarkets: [],
        businessSizeRange: {},
        commonChallenges: [],
        criticalSuccessFactors: [],
        relevantCertifications: [],
        successRate: 0.8
      };
      
      mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      await exportStrategyMemory.updatePattern(mockPattern as ExportStrategyPattern);
      
      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('exportStrategyPatterns');
      expect(mockDb.updateOne).toHaveBeenCalledWith(
        { id: 'pattern1' },
        { $set: mockPattern }
      );
    });
    
    it('should log when pattern is successfully updated', async () => {
      // Arrange
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockPattern: Partial<ExportStrategyPattern> = {
        id: 'pattern1',
        name: 'Germany Direct Export',
        productCategories: [],
        applicableMarkets: [],
        businessSizeRange: {},
        commonChallenges: [],
        criticalSuccessFactors: [],
        relevantCertifications: [],
        successRate: 0.8,
        entryStrategy: 'Direct'
      };
      
      mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      await exportStrategyMemory.updatePattern(mockPattern as ExportStrategyPattern);
      
      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated export strategy pattern')
      );
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockPattern: Partial<ExportStrategyPattern> = {
        id: 'pattern1',
        name: 'Germany Direct Export',
        productCategories: [],
        applicableMarkets: [],
        businessSizeRange: {},
        commonChallenges: [],
        criticalSuccessFactors: [],
        relevantCertifications: [],
        successRate: 0.8,
        entryStrategy: 'Direct'
      };
      
      mockDb.updateOne.mockRejectedValue(new Error('Database error'));
      
      // Act
      await exportStrategyMemory.updatePattern(mockPattern as ExportStrategyPattern);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error updating export strategy pattern')
      );
    });
  });
  
  describe('archivePattern', () => {
    it('should archive a pattern by marking it as merged into another pattern', async () => {
      // Arrange
      const patternId = 'pattern1';
      const mergedIntoId = 'pattern2';
      
      mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      await exportStrategyMemory.archivePattern(patternId, mergedIntoId);
      
      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('exportStrategyPatterns');
      expect(mockDb.updateOne).toHaveBeenCalledWith(
        { id: patternId },
        { 
          $set: { 
            archived: true, 
            mergedInto: mergedIntoId,
            archivedDate: expect.any(Date)
          } 
        }
      );
    });
    
    it('should log when pattern is successfully archived', async () => {
      // Arrange
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      await exportStrategyMemory.archivePattern('pattern1', 'pattern2');
      
      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Archived export strategy pattern')
      );
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockDb.updateOne.mockRejectedValue(new Error('Database error'));
      
      // Act
      await exportStrategyMemory.archivePattern('pattern1', 'pattern2');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error archiving export strategy pattern')
      );
    });
  });
  
  describe('findRelevantPatterns', () => {
    it('should find patterns relevant to a business profile', async () => {
      // Arrange
      const businessProfile: BusinessProfile = {
        id: 'business1',
        name: 'Test Business',
        size: 50,
        products: [
          { name: 'Test Product', category: 'Electronics', description: 'Electronic device' },
          { name: 'Test Software', category: 'Software', description: 'Software product' }
        ],
        targetMarkets: ['Germany', 'France']
      };
      
      const mockPatterns: Partial<ExportStrategyPattern>[] = [
        {
          id: 'pattern1',
          name: 'Germany Electronics Export',
          market: 'Germany',
          entryStrategy: 'Direct Export',
          businessSizeRange: { min: 10, max: 100 },
          productCategories: ['Electronics'],
          confidence: 0.8,
          archived: false,
          applicableMarkets: ['Germany'],
          commonChallenges: [],
          criticalSuccessFactors: [],
          relevantCertifications: [],
          successRate: 0.8
        },
        {
          id: 'pattern2',
          name: 'France Software Distribution',
          market: 'France',
          entryStrategy: 'Distribution Agreement',
          businessSizeRange: { min: 20, max: 200 },
          productCategories: ['Software'],
          confidence: 0.7,
          archived: false,
          applicableMarkets: ['France'],
          commonChallenges: [],
          criticalSuccessFactors: [],
          relevantCertifications: [],
          successRate: 0.7
        },
        {
          id: 'pattern3',
          name: 'Japan Hardware Export',
          market: 'Japan',
          entryStrategy: 'Direct Export',
          businessSizeRange: { min: 30, max: 300 },
          productCategories: ['Hardware'],
          confidence: 0.9,
          archived: false,
          applicableMarkets: ['Japan'],
          commonChallenges: [],
          criticalSuccessFactors: [],
          relevantCertifications: [],
          successRate: 0.9
        }
      ];
      
      mockDb.toArray.mockResolvedValue(mockPatterns);
      
      // Mock similarity calculation
      const calculateSimilaritySpy = jest.spyOn(
        exportStrategyMemory as any, 
        'calculateBusinessSimilarity'
      ).mockImplementation((pattern, profile) => {
        // Return high similarity for Germany and France patterns, low for Japan
        if (pattern.market === 'Japan') return 0.3;
        return 0.8;
      });
      
      // Act
      const result = await exportStrategyMemory.findRelevantPatterns(businessProfile);
      
      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('exportStrategyPatterns');
      expect(mockDb.find).toHaveBeenCalledWith({ archived: false });
      expect(calculateSimilaritySpy).toHaveBeenCalledTimes(3);
      
      // Should return only the patterns with high similarity (Germany and France)
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('pattern1');
      expect(result[1].id).toBe('pattern2');
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const businessProfile: BusinessProfile = {
        id: 'business1',
        name: 'Test Business',
        size: 50,
        products: [{ name: 'Test Product', category: 'Electronics', description: 'Electronic device' }],
        targetMarkets: ['Germany']
      };
      
      mockDb.toArray.mockRejectedValue(new Error('Database error'));
      
      // Act
      const result = await exportStrategyMemory.findRelevantPatterns(businessProfile);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error finding relevant export strategy patterns')
      );
      expect(result).toEqual([]);
    });
  });
}); 