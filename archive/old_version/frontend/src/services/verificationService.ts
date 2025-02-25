import axios from 'axios';
import {
  MOCK_COMPANY_DATA,
  MOCK_TAX_DATA,
  MOCK_CONTACT_DATA,
  MOCK_DIGITAL_PRESENCE
} from './mockData';
import { getFeatureFlag } from '../config/features';

// When using Vite's proxy, we use a relative URL
const API_BASE_URL = '/api';
const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

interface ValidationError {
  code: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  details: Record<string, any>;
  errors?: ValidationError[];
}

export interface ContactInfo {
  email: string;
  phone: string;
}

export interface ServiceValidationResult {
  is_valid: boolean;
  suggestions: string[];
  details?: {
    companyName?: string;
    entityType?: string;
    status?: string;
  };
}

export interface DigitalPresenceResult {
  website?: {
    exists: boolean;
    url?: string;
    score?: number;
  };
  socialMedia?: {
    platform: string;
    url?: string;
    active: boolean;
  }[];
}

// Mock data for testing
const MOCK_VALID_COMPANIES = {
  '2023/123456/07': {
    companyName: 'Test Company (Pty) Ltd',
    entityType: 'PTY_LTD',
    status: 'Active'
  },
  '2022/654321/23': {
    companyName: 'Mock Business CC',
    entityType: 'CC',
    status: 'Active'
  }
};

const MOCK_VALID_TAX_NUMBERS = ['9876543210', '1234567890'];

class VerificationService {
  private async mockVerifyBusiness(registrationNumber: string): Promise<ServiceValidationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockCompany = MOCK_VALID_COMPANIES[registrationNumber];
    
    if (mockCompany) {
      return {
        is_valid: true,
        suggestions: ['Valid registration number'],
        details: mockCompany
      };
    }
    
    return {
      is_valid: false,
      suggestions: ['Invalid registration number format', 'Company not found']
    };
  }

  private async mockVerifyTax(taxNumber: string): Promise<ServiceValidationResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      is_valid: MOCK_VALID_TAX_NUMBERS.includes(taxNumber),
      suggestions: MOCK_VALID_TAX_NUMBERS.includes(taxNumber) 
        ? ['Valid tax number'] 
        : ['Invalid tax number', 'Please check the format']
    };
  }

  private async realVerifyBusiness(registrationNumber: string): Promise<ServiceValidationResult> {
    try {
      const response = await fetch('/api/verify/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrationNumber })
      });
      
      if (!response.ok) {
        throw new Error('Verification service error');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Business verification error:', error);
      return {
        is_valid: false,
        suggestions: ['Service temporarily unavailable']
      };
    }
  }

  private async realVerifyTax(taxNumber: string): Promise<ServiceValidationResult> {
    try {
      const response = await fetch('/api/verify/tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taxNumber })
      });
      
      if (!response.ok) {
        throw new Error('Verification service error');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Tax verification error:', error);
      return {
        is_valid: false,
        suggestions: ['Service temporarily unavailable']
      };
    }
  }

  async verifyBusiness(registrationNumber: string): Promise<ServiceValidationResult> {
    return getFeatureFlag('useMockValidation')
      ? this.mockVerifyBusiness(registrationNumber)
      : this.realVerifyBusiness(registrationNumber);
  }

  async verifyTax(taxNumber: string): Promise<ServiceValidationResult> {
    return getFeatureFlag('useMockValidation')
      ? this.mockVerifyTax(taxNumber)
      : this.realVerifyTax(taxNumber);
  }

  async verifyContact(contactInfo: ContactInfo): Promise<ServiceValidationResult> {
    // Mock implementation for now
    const { email, phone } = contactInfo;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = /^\+?[\d\s-]{10,}$/.test(phone);

    return {
      is_valid: emailValid && phoneValid,
      suggestions: [
        ...(emailValid ? [] : ['Invalid email format']),
        ...(phoneValid ? [] : ['Invalid phone format'])
      ]
    };
  }

  async getDigitalPresence(): Promise<DigitalPresenceResult> {
    // Mock implementation for now
    return {
      website: {
        exists: true,
        url: 'https://example.com',
        score: 85
      },
      socialMedia: [
        {
          platform: 'LinkedIn',
          url: 'https://linkedin.com/company/example',
          active: true
        },
        {
          platform: 'Twitter',
          url: 'https://twitter.com/example',
          active: true
        }
      ]
    };
  }
}

export const verificationService = new VerificationService();

export const isValidationError = (error: unknown): boolean => {
  return error instanceof Error && error.message.includes('Verification service error');
}; 