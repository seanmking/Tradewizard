/**
 * HS Code Assignment Tests
 * 
 * This test suite validates the correct assignment of HS codes to products
 * with varying levels of detail and tests the confidence scoring mechanism.
 */

import { expect } from 'chai';
import { mapProductToHSCode, mapProductsToHSCodes } from '../tools/business-analysis/hs-mapper';
import { mockLLM } from './mocks/llm';
import { ProductInfo } from '../types/business';

describe('HS Code Assignment', () => {
  // Test single product mapping
  describe('Single Product Mapping', () => {
    it('should map a well-described food product to the correct HS code with high confidence', async () => {
      const product: ProductInfo = {
        name: 'Fresh Apples',
        description: 'Organically grown fresh apples from South African orchards, ready for export.'
      };
      
      const result = await mapProductToHSCode(product, mockLLM);
      expect(result.hsCode).to.not.be.empty;
      expect(result.confidence).to.be.greaterThan(0.7);
      expect(result.hsCode.startsWith('08')).to.be.true; // HS chapter for fruits
    });
    
    it('should map a well-described textile product to the correct HS code with high confidence', async () => {
      const product: ProductInfo = {
        name: 'Cotton Fabric',
        description: 'High-quality woven cotton fabric, 100% cotton, suitable for garment manufacturing.'
      };
      
      const result = await mapProductToHSCode(product, mockLLM);
      expect(result.hsCode).to.not.be.empty;
      expect(result.confidence).to.be.greaterThan(0.7);
      expect(result.hsCode.startsWith('52')).to.be.true; // HS chapter for cotton
    });
    
    it('should map a well-described electronic product to the correct HS code with high confidence', async () => {
      const product: ProductInfo = {
        name: 'Smartphone',
        description: 'Modern smartphone with touchscreen, camera, and wireless connectivity features.'
      };
      
      const result = await mapProductToHSCode(product, mockLLM);
      expect(result.hsCode).to.not.be.empty;
      expect(result.confidence).to.be.greaterThan(0.7);
      expect(result.hsCode.startsWith('85')).to.be.true; // HS chapter for electrical machinery
    });
    
    it('should handle a vaguely described product with lower confidence', async () => {
      const product: ProductInfo = {
        name: 'Processing Equipment',
        description: 'Industrial equipment for processing.'
      };
      
      const result = await mapProductToHSCode(product, mockLLM);
      expect(result.confidence).to.be.lessThan(0.7); // Lower confidence due to vague description
    });
    
    it('should handle a product with minimal information', async () => {
      const product: ProductInfo = {
        name: 'Miscellaneous Items'
      };
      
      const result = await mapProductToHSCode(product, mockLLM);
      expect(result.confidence).to.be.lessThan(0.5); // Very low confidence due to minimal info
    });
  });
  
  // Test multiple products mapping
  describe('Multiple Products Mapping', () => {
    it('should map multiple products to their respective HS codes', async () => {
      const products: ProductInfo[] = [
        {
          name: 'Fresh Oranges',
          description: 'Fresh citrus fruits grown in South Africa.'
        },
        {
          name: 'Cotton T-shirts',
          description: 'Cotton garments, printed with South African designs.'
        },
        {
          name: 'Solar Panels',
          description: 'Photovoltaic panels for renewable energy generation.'
        }
      ];
      
      const results = await mapProductsToHSCodes(products, mockLLM);
      expect(results).to.have.lengthOf(3);
      
      // Check first product (fruits)
      expect(results[0].hsCode).to.not.be.empty;
      expect(results[0].hsCode.startsWith('08')).to.be.true;
      
      // Check second product (garments)
      expect(results[1].hsCode).to.not.be.empty;
      expect(results[1].hsCode.startsWith('61') || results[1].hsCode.startsWith('62')).to.be.true;
      
      // Check third product (solar panels)
      expect(results[2].hsCode).to.not.be.empty;
      expect(results[2].hsCode.startsWith('85')).to.be.true;
    });
    
    it('should handle an empty products array', async () => {
      const products: ProductInfo[] = [];
      const results = await mapProductsToHSCodes(products, mockLLM);
      expect(results).to.be.an('array').that.is.empty;
    });
  });
  
  // Test fallback mechanism
  describe('Fallback Mechanism', () => {
    it('should provide a fallback when product description is ambiguous', async () => {
      const product: ProductInfo = {
        name: 'Multi-purpose Device',
        description: 'Can be used for various applications in different industries.'
      };
      
      const result = await mapProductToHSCode(product, mockLLM);
      expect(result).to.have.property('hsCode');
      expect(result).to.have.property('confidence');
      expect(result.confidence).to.be.lessThan(0.7);
    });
    
    it('should handle errors gracefully', async () => {
      // Create a product that might cause an error in the LLM
      const product: ProductInfo = {
        name: 'Error Product',
        description: 'This product description is designed to trigger an error in processing.'
      };
      
      // Should not throw an error
      const result = await mapProductToHSCode(product, mockLLM);
      expect(result).to.have.property('hsCode');
      expect(result).to.have.property('confidence');
    });
  });
}); 