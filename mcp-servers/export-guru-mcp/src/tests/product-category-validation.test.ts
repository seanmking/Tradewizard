/**
 * Product Category Validation Tests
 * 
 * This test suite validates the correct category assignment for products
 * across key sectors (agro-processing, textiles, electronics).
 */

import { expect } from 'chai';
import { mapToStandardCategory } from '../tools/compliance-checklist';
import { categorizeBusiness } from '../tools/business-analysis/categorize';
import { mockConnectors } from './mocks/connectors';
import { mockLLM } from './mocks/llm';

describe('Product Category Validation', () => {
  // Test standard category mapping
  describe('Standard Category Mapping', () => {
    // Agro-processing tests
    it('should map food products to the food category', () => {
      const foodProducts = [
        'Fresh fruits',
        'Processed meat',
        'Dairy products',
        'Canned vegetables',
        'Fruit juices',
        'Organic produce',
        'Dried fruits',
        'Frozen vegetables'
      ];
      
      foodProducts.forEach(product => {
        expect(mapToStandardCategory(product)).to.equal('food');
      });
    });
    
    // Textiles tests
    it('should map textile products to the textiles category', () => {
      const textileProducts = [
        'Cotton fabrics',
        'Wool garments',
        'Synthetic textiles',
        'Clothing items',
        'Apparel accessories',
        'Fashion garments',
        'Textile materials',
        'Fabric rolls'
      ];
      
      textileProducts.forEach(product => {
        expect(mapToStandardCategory(product)).to.equal('textiles');
      });
    });
    
    // Electronics tests
    it('should map electronic products to the electronics category', () => {
      const electronicProducts = [
        'Smartphones',
        'Computer parts',
        'Electronic devices',
        'Electrical appliances',
        'Circuit boards',
        'Audio equipment',
        'Television sets',
        'Computing devices'
      ];
      
      electronicProducts.forEach(product => {
        expect(mapToStandardCategory(product)).to.equal('electronics');
      });
    });
    
    // Medical products tests
    it('should map medical products to the medical category', () => {
      const medicalProducts = [
        'Medical devices',
        'Pharmaceutical products',
        'Healthcare equipment',
        'Medicine supplies',
        'Surgical instruments',
        'Medical diagnostic tools',
        'Healthcare products',
        'Medical equipment'
      ];
      
      medicalProducts.forEach(product => {
        expect(mapToStandardCategory(product)).to.equal('medical');
      });
    });
    
    // Chemical products tests
    it('should map chemical products to the chemicals category', () => {
      const chemicalProducts = [
        'Industrial chemicals',
        'Cosmetic products',
        'Cleaning solutions',
        'Paint products',
        'Chemical solvents',
        'Adhesive materials',
        'Chemical compounds',
        'Cosmetics and toiletries'
      ];
      
      chemicalProducts.forEach(product => {
        expect(mapToStandardCategory(product)).to.equal('chemicals');
      });
    });
    
    // Edge cases
    it('should handle edge cases and ambiguous products', () => {
      // Products that could fall into multiple categories
      expect(mapToStandardCategory('Food processing equipment')).to.equal('food');
      expect(mapToStandardCategory('Medical textiles')).to.equal('medical');
      expect(mapToStandardCategory('Electronic medical devices')).to.equal('medical');
      expect(mapToStandardCategory('Chemical food additives')).to.equal('chemicals');
      
      // Default case for unknown categories
      expect(mapToStandardCategory('Unknown product')).to.equal('default');
      expect(mapToStandardCategory('Miscellaneous items')).to.equal('default');
    });
  });
  
  // Test business categorization
  describe('Business Categorization', () => {
    it('should categorize a food business correctly', async () => {
      const params = {
        businessName: 'Fresh Harvest Foods',
        description: 'We produce and export high-quality fresh and processed fruits and vegetables.',
        products: ['Fresh fruits', 'Canned vegetables', 'Fruit juices']
      };
      
      const result = await categorizeBusiness(params, mockConnectors, mockLLM);
      expect(result.categories[0].mainSector).to.equal('Agriculture & Food');
      expect(result.categories[0].confidence).to.be.greaterThan(0.7);
    });
    
    it('should categorize a textile business correctly', async () => {
      const params = {
        businessName: 'African Textiles Ltd',
        description: 'Manufacturer and exporter of high-quality cotton and synthetic fabrics and garments.',
        products: ['Cotton fabrics', 'Synthetic textiles', 'Clothing items']
      };
      
      const result = await categorizeBusiness(params, mockConnectors, mockLLM);
      expect(result.categories[0].mainSector).to.equal('Textiles & Apparel');
      expect(result.categories[0].confidence).to.be.greaterThan(0.7);
    });
    
    it('should categorize an electronics business correctly', async () => {
      const params = {
        businessName: 'TechElectronics SA',
        description: 'Leading manufacturer of consumer electronics and electrical appliances.',
        products: ['Smartphones', 'Television sets', 'Audio equipment']
      };
      
      const result = await categorizeBusiness(params, mockConnectors, mockLLM);
      expect(result.categories[0].mainSector).to.equal('Electronics & Technology');
      expect(result.categories[0].confidence).to.be.greaterThan(0.7);
    });
    
    it('should handle businesses with mixed product categories', async () => {
      const params = {
        businessName: 'Diversified Exports Inc',
        description: 'We export a diverse range of products including food, textiles, and electronics.',
        products: ['Fresh fruits', 'Cotton fabrics', 'Smartphones']
      };
      
      const result = await categorizeBusiness(params, mockConnectors, mockLLM);
      expect(result.categories.length).to.be.greaterThan(1);
      expect(result.categories[0].confidence).to.be.lessThan(0.9); // Lower confidence due to mixed categories
    });
  });
}); 