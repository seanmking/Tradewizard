import { RegulatoryPatternMemory } from '../regulatory-pattern-memory';

// Define the RegulatoryPatternType enum for testing purposes
enum RegulatoryPatternType {
  CROSS_MARKET = 'CROSS_MARKET',
  TEMPORAL = 'TEMPORAL',
  COMPLIANCE_BARRIER = 'COMPLIANCE_BARRIER',
  HARMONIZATION = 'HARMONIZATION',
  CERTIFICATION = 'CERTIFICATION' // Added for test compatibility
}

// Define the RegulatoryPattern interface for testing purposes
interface RegulatoryPattern {
  id: string;
  type: RegulatoryPatternType | string;
  name: string;
  description?: string;
  confidence: number;
  applicableMarkets: string[];
  productCategories: string[];
  hsCodePatterns?: string[];
  regulatoryDomain: string;
  patternCriteria: Record<string, any>;
  discoveredAt?: Date;
  lastUpdated?: Date;
  applicationCount: number;
  successRate: number;
  metadata?: Record<string, any>;
  archived?: boolean;
  mergedInto?: string;
  archivedDate?: Date;
  domain?: string; // Added for test compatibility
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
  certifications?: {
    name: string;
    issuer: string;
    validUntil?: string;
    verificationUrl?: string;
  }[];
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

describe('RegulatoryPatternMemory', () => {
  let regulatoryPatternMemory: RegulatoryPatternMemory;
  
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
    regulatoryPatternMemory = new RegulatoryPatternMemory(mockSimilarityEngine as any, mockDb);
  });
  
  describe('getAllPatterns', () => {
    it('should retrieve all non-archived patterns from the database', async () => {
      // Arrange
      const mockPatterns: Partial<RegulatoryPattern>[] = [
        {
          id: 'pattern1',
          name: 'EU Electronics Certification',
          type: RegulatoryPatternType.CERTIFICATION,
          domain: 'Electronics',
          applicableMarkets: ['Germany', 'France', 'Italy'],
          confidence: 0.8,
          archived: false,
          productCategories: ['Electronics'],
          regulatoryDomain: 'Electronics',
          patternCriteria: {},
          applicationCount: 10,
          successRate: 0.8
        },
        {
          id: 'pattern2',
          name: 'US Food Import Regulations',
          type: RegulatoryPatternType.COMPLIANCE_BARRIER,
          domain: 'Food & Beverage',
          applicableMarkets: ['United States'],
          confidence: 0.7,
          archived: false,
          productCategories: ['Food & Beverage'],
          regulatoryDomain: 'Food & Beverage',
          patternCriteria: {},
          applicationCount: 5,
          successRate: 0.7
        }
      ];
      
      mockDb.toArray.mockResolvedValue(mockPatterns);
      
      // Act
      const result = await regulatoryPatternMemory.getAllPatterns();
      
      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('regulatoryPatterns');
      expect(mockDb.find).toHaveBeenCalledWith({ archived: false });
      expect(mockDb.toArray).toHaveBeenCalled();
      expect(result).toEqual(mockPatterns);
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockDb.toArray.mockRejectedValue(new Error('Database error'));
      
      // Act
      const result = await regulatoryPatternMemory.getAllPatterns();
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error retrieving regulatory patterns')
      );
      expect(result).toEqual([]);
    });
  });
  
  describe('updatePattern', () => {
    it('should update an existing pattern in the database', async () => {
      // Arrange
      const mockPattern: Partial<RegulatoryPattern> = {
        id: 'pattern1',
        name: 'EU Electronics Certification',
        type: RegulatoryPatternType.CERTIFICATION,
        domain: 'Electronics',
        applicableMarkets: ['Germany', 'France', 'Italy', 'Spain'], // Updated markets
        confidence: 0.85, // Updated confidence
        patternCriteria: {
          requirements: [
            { name: 'CE Marking', description: 'Required for all electronic products' }
          ]
        },
        productCategories: ['Electronics'],
        regulatoryDomain: 'Electronics',
        applicationCount: 10,
        successRate: 0.8
      };
      
      mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      await regulatoryPatternMemory.updatePattern(mockPattern as RegulatoryPattern);
      
      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('regulatoryPatterns');
      expect(mockDb.updateOne).toHaveBeenCalledWith(
        { id: 'pattern1' },
        { $set: mockPattern }
      );
    });
    
    it('should log when pattern is successfully updated', async () => {
      // Arrange
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockPattern: Partial<RegulatoryPattern> = {
        id: 'pattern1',
        name: 'EU Electronics Certification',
        type: RegulatoryPatternType.CERTIFICATION,
        productCategories: ['Electronics'],
        applicableMarkets: ['EU'],
        regulatoryDomain: 'Electronics',
        patternCriteria: {},
        applicationCount: 10,
        successRate: 0.8
      };
      
      mockDb.updateOne.mockResolvedValue({ modifiedCount: 1 });
      
      // Act
      await regulatoryPatternMemory.updatePattern(mockPattern as RegulatoryPattern);
      
      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Updated regulatory pattern')
      );
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockPattern: Partial<RegulatoryPattern> = {
        id: 'pattern1',
        name: 'EU Electronics Certification',
        type: RegulatoryPatternType.CERTIFICATION,
        productCategories: ['Electronics'],
        applicableMarkets: ['EU'],
        regulatoryDomain: 'Electronics',
        patternCriteria: {},
        applicationCount: 10,
        successRate: 0.8
      };
      
      mockDb.updateOne.mockRejectedValue(new Error('Database error'));
      
      // Act
      await regulatoryPatternMemory.updatePattern(mockPattern as RegulatoryPattern);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error updating regulatory pattern')
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
      await regulatoryPatternMemory.archivePattern(patternId, mergedIntoId);
      
      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('regulatoryPatterns');
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
      await regulatoryPatternMemory.archivePattern('pattern1', 'pattern2');
      
      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Archived regulatory pattern')
      );
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockDb.updateOne.mockRejectedValue(new Error('Database error'));
      
      // Act
      await regulatoryPatternMemory.archivePattern('pattern1', 'pattern2');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error archiving regulatory pattern')
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
      
      const mockPatterns: Partial<RegulatoryPattern>[] = [
        {
          id: 'pattern1',
          name: 'EU Electronics Certification',
          type: RegulatoryPatternType.CERTIFICATION,
          domain: 'Electronics',
          applicableMarkets: ['Germany', 'France', 'Italy'],
          productCategories: ['Electronics'],
          confidence: 0.8,
          archived: false,
          regulatoryDomain: 'Electronics',
          patternCriteria: {},
          applicationCount: 10,
          successRate: 0.8
        },
        {
          id: 'pattern2',
          name: 'US Food Import Regulations',
          type: RegulatoryPatternType.COMPLIANCE_BARRIER,
          domain: 'Food & Beverage',
          applicableMarkets: ['United States'],
          productCategories: ['Food & Beverage'],
          confidence: 0.7,
          archived: false,
          regulatoryDomain: 'Food & Beverage',
          patternCriteria: {},
          applicationCount: 5,
          successRate: 0.7
        },
        {
          id: 'pattern3',
          name: 'EU Software Licensing',
          type: RegulatoryPatternType.LICENSING,
          domain: 'Software',
          applicableMarkets: ['Germany', 'France'],
          productCategories: ['Software'],
          confidence: 0.9,
          archived: false,
          regulatoryDomain: 'Software',
          patternCriteria: {},
          applicationCount: 15,
          successRate: 0.9
        }
      ];
      
      mockDb.toArray.mockResolvedValue(mockPatterns);
      
      // Act
      const result = await regulatoryPatternMemory.findRelevantPatterns(businessProfile);
      
      // Assert
      expect(mockDb.collection).toHaveBeenCalledWith('regulatoryPatterns');
      expect(mockDb.find).toHaveBeenCalledWith({ archived: false });
      
      // Should return only the patterns relevant to the business profile
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('pattern1'); // EU Electronics
      expect(result[1].id).toBe('pattern3'); // EU Software
    });
    
    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const businessProfile: BusinessProfile = {
        id: 'business1',
        name: 'Test Business',
        size: 50,
        products: [
          { name: 'Test Product', category: 'Electronics', description: 'Electronic device' }
        ],
        targetMarkets: ['Germany']
      };
      
      mockDb.toArray.mockRejectedValue(new Error('Database error'));
      
      // Act
      const result = await regulatoryPatternMemory.findRelevantPatterns(businessProfile);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error finding relevant regulatory patterns')
      );
      expect(result).toEqual([]);
    });
  });
  
  describe('calculateStringSimilarity', () => {
    it('should calculate similarity between two strings', () => {
      // Arrange
      const str1 = 'electronics';
      const str2 = 'electronic';
      
      // Act
      const similarity = (regulatoryPatternMemory as any).calculateStringSimilarity(str1, str2);
      
      // Assert
      expect(similarity).toBeGreaterThan(0.8); // High similarity
    });
    
    it('should return 1 for identical strings', () => {
      // Arrange
      const str = 'electronics';
      
      // Act
      const similarity = (regulatoryPatternMemory as any).calculateStringSimilarity(str, str);
      
      // Assert
      expect(similarity).toBe(1);
    });
    
    it('should return 0 for completely different strings', () => {
      // Arrange
      const str1 = 'electronics';
      const str2 = 'food';
      
      // Act
      const similarity = (regulatoryPatternMemory as any).calculateStringSimilarity(str1, str2);
      
      // Assert
      expect(similarity).toBeLessThan(0.2); // Low similarity
    });
    
    it('should handle empty strings', () => {
      // Arrange
      const str1 = '';
      const str2 = 'electronics';
      
      // Act
      const similarity1 = (regulatoryPatternMemory as any).calculateStringSimilarity(str1, str2);
      const similarity2 = (regulatoryPatternMemory as any).calculateStringSimilarity(str2, str1);
      const similarity3 = (regulatoryPatternMemory as any).calculateStringSimilarity('', '');
      
      // Assert
      expect(similarity1).toBe(0);
      expect(similarity2).toBe(0);
      expect(similarity3).toBe(1); // Empty strings are identical
    });
  });
  
  describe('levenshteinDistance', () => {
    it('should calculate the correct distance between two strings', () => {
      // Arrange
      const str1 = 'kitten';
      const str2 = 'sitting';
      
      // Act
      const distance = (regulatoryPatternMemory as any).levenshteinDistance(str1, str2);
      
      // Assert
      expect(distance).toBe(3); // 3 operations needed to transform kitten to sitting
    });
    
    it('should return 0 for identical strings', () => {
      // Arrange
      const str = 'electronics';
      
      // Act
      const distance = (regulatoryPatternMemory as any).levenshteinDistance(str, str);
      
      // Assert
      expect(distance).toBe(0);
    });
    
    it('should handle empty strings', () => {
      // Arrange
      const str1 = '';
      const str2 = 'electronics';
      
      // Act
      const distance1 = (regulatoryPatternMemory as any).levenshteinDistance(str1, str2);
      const distance2 = (regulatoryPatternMemory as any).levenshteinDistance(str2, str1);
      const distance3 = (regulatoryPatternMemory as any).levenshteinDistance('', '');
      
      // Assert
      expect(distance1).toBe(str2.length); // All characters need to be inserted
      expect(distance2).toBe(str2.length); // All characters need to be deleted
      expect(distance3).toBe(0); // Empty strings are identical
    });
  });
}); 