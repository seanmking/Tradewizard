import { describe, it, expect } from 'vitest';
import { verificationService } from '../verificationService';

describe('Verification Service Tests', () => {
  describe('Business Verification', () => {
    it('should verify valid business registration number', async () => {
      const result = await verificationService.verifyBusiness('2018/123456/07');
      expect(result.is_valid).toBe(true);
      expect(result.suggestions).toContain('Valid company name');
    });

    it('should reject invalid business registration number', async () => {
      const result = await verificationService.verifyBusiness('invalid-number');
      expect(result.is_valid).toBe(false);
      expect(result.suggestions).toContain('Invalid registration number');
    });
  });

  describe('Tax Verification', () => {
    it('should verify valid tax number', async () => {
      const result = await verificationService.verifyTax('9876543210');
      expect(result.is_valid).toBe(true);
      expect(result.suggestions).toContain('Valid tax number');
    });

    it('should reject invalid tax number', async () => {
      const result = await verificationService.verifyTax('invalid-tax');
      expect(result.is_valid).toBe(false);
      expect(result.suggestions).toContain('Invalid tax number');
    });
  });

  describe('Contact Verification', () => {
    it('should verify valid contact details', async () => {
      const result = await verificationService.verifyContact({
        email: 'thandi.nkosi@globalfreshsa.co.za',
        phone: '0218555123'
      });
      expect(result.is_valid).toBe(true);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should reject invalid email', async () => {
      const result = await verificationService.verifyContact({
        email: 'invalid@email.com',
        phone: '0218555123'
      });
      expect(result.is_valid).toBe(false);
      expect(result.suggestions).toContain('Invalid email format');
    });

    it('should reject invalid phone', async () => {
      const result = await verificationService.verifyContact({
        email: 'thandi.nkosi@globalfreshsa.co.za',
        phone: '1234567890'
      });
      expect(result.is_valid).toBe(false);
      expect(result.suggestions).toContain('Invalid phone format');
    });
  });

  describe('Digital Presence', () => {
    it('should fetch digital presence information', async () => {
      const result = await verificationService.getDigitalPresence();
      expect(result.website?.exists).toBe(true);
      expect(result.website?.url).toBe('www.globalfreshsa.co.za');
    });
  });
}); 