import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAssessmentContext } from '../../contexts/AssessmentContext';
import { Spinner } from '../common/Spinner';
import { verificationService, ServiceValidationResult } from '../../services/verificationService';

// Industry sectors configuration
const INDUSTRY_SECTORS = {
  'Food Products': {
    active: true,
    subcategories: ['Processed Foods', 'Fresh Produce']
  },
  'Beverages': {
    active: false,
    subcategories: ['Alcoholic Beverages', 'Non-alcoholic Beverages']
  },
  'Ready-to-Wear': {
    active: false,
    subcategories: ['Apparel', 'Jewellery']
  },
  'Home Goods': {
    active: false,
    subcategories: ['Leather Goods', 'Gifting', 'Decor']
  },
  'Non-Prescription Health': {
    active: false,
    subcategories: ['Beauty Products', 'Over-the-counter Health', 'Wellness Products', 'Vitamin Products']
  }
};

// Entity type detection regex patterns
const ENTITY_TYPE_PATTERNS = {
  PTY_LTD: /\b(pty\.?\s*ltd\.?|proprietary\s+limited)\b/i,
  CC: /\b(cc|close\s+corporation)\b/i,
  INC: /\b(inc|incorporated)\b/i,
  LTD: /\b(ltd\.?|limited)\b/i,
};

// Business entity types for dropdown
const BUSINESS_ENTITY_TYPES = [
  { value: 'PTY_LTD', label: 'Proprietary Limited (Pty Ltd)' },
  { value: 'CC', label: 'Close Corporation (CC)' },
  { value: 'SOLE_PROP', label: 'Sole Proprietor' },
  { value: 'INC', label: 'Incorporated (Inc)' },
  { value: 'LTD', label: 'Limited (Ltd)' },
];

// Validation patterns
const VALIDATION_PATTERNS = {
  REGISTRATION: /^\d{4}\/\d{6}\/\d{2}$/,
  TAX_NUMBER: /^\d{10}$/
};

interface ValidationField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
  helpText: string;
}

interface BusinessValidationFormProps {
  onValidationComplete: (data: any) => void;
  initialData?: {
    business_name?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    website_url?: string;
    export_goals?: string;
    entity_type?: string;
    full_name?: string;
  };
}

// Form-level validation result
interface FormValidationResult {
  isValid: boolean;
  message: string;
}

const VALIDATION_FIELDS: ValidationField[] = [
  {
    name: 'company_name',
    label: 'Company Name',
    type: 'text',
    required: true,
    placeholder: 'Enter your registered company name',
    helpText: 'Must match your CIPC registration'
  },
  {
    name: 'registration_number',
    label: 'Registration Number',
    type: 'text',
    required: true,
    placeholder: 'YYYY/XXXXXX/XX',
    helpText: 'Format: YYYY/XXXXXX/XX (e.g. 2023/123456/07)'
  },
  {
    name: 'tax_number',
    label: 'Tax Number',
    type: 'text',
    required: true,
    placeholder: 'Enter your 10-digit tax number',
    helpText: '10-digit SARS tax reference number'
  }
];

export const BusinessValidationForm: React.FC<BusinessValidationFormProps> = ({ 
  onValidationComplete,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    entityType: initialData.entity_type || '',
    sector: '',
    subcategory: '',
    companyName: initialData.business_name || '',
    registrationNumber: '',
    taxNumber: '',
    contactName: initialData.full_name || '',
    contactRole: initialData.role || '',
    website: initialData.website_url || '',
    exportGoals: initialData.export_goals || ''
  });

  const [validationResults, setValidationResults] = useState<{
    registration: FormValidationResult;
    tax: FormValidationResult;
  }>({
    registration: { isValid: false, message: '' },
    tax: { isValid: false, message: '' }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert service validation result to form validation result
  const convertValidationResult = (result: ServiceValidationResult): FormValidationResult => ({
    isValid: result.is_valid,
    message: result.suggestions[0] || ''
  });

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Validate registration number and tax number as they're entered
    if (name === 'registrationNumber' && value.length > 0) {
      try {
        const result: ServiceValidationResult = await verificationService.verifyBusiness(value);
        setValidationResults(prev => ({
          ...prev,
          registration: convertValidationResult(result)
        }));
      } catch (error) {
        console.error('Registration validation error:', error);
        setValidationResults(prev => ({
          ...prev,
          registration: { isValid: false, message: 'Validation service error' }
        }));
      }
    }

    if (name === 'taxNumber' && value.length > 0) {
      try {
        const result: ServiceValidationResult = await verificationService.verifyTax(value);
        setValidationResults(prev => ({
          ...prev,
          tax: convertValidationResult(result)
        }));
      } catch (error) {
        console.error('Tax validation error:', error);
        setValidationResults(prev => ({
          ...prev,
          tax: { isValid: false, message: 'Validation service error' }
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Final validation check
      const registrationResult: ServiceValidationResult = await verificationService.verifyBusiness(formData.registrationNumber);
      const taxResult: ServiceValidationResult = await verificationService.verifyTax(formData.taxNumber);

      if (!registrationResult.is_valid || !taxResult.is_valid) {
        setValidationResults({
          registration: convertValidationResult(registrationResult),
          tax: convertValidationResult(taxResult)
        });
        return;
      }

      // If all validations pass, call the completion handler
      onValidationComplete(formData);
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResults({
        registration: { isValid: false, message: 'Validation service error' },
        tax: { isValid: false, message: 'Validation service error' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Business Validation</h2>
        <p className="mt-2 text-sm text-gray-600">
          Let's validate your business details to proceed with the assessment.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Business Entity Type
            </label>
            <select
              name="entityType"
              value={formData.entityType}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select type</option>
              <option value="PTY LTD">Private Company (Pty) Ltd</option>
              <option value="LTD">Public Company (Ltd)</option>
              <option value="CC">Close Corporation (CC)</option>
              <option value="SOLE PROP">Sole Proprietorship</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Registration Number
            </label>
            <input
              type="text"
              name="registrationNumber"
              value={formData.registrationNumber}
              onChange={handleInputChange}
              required
              placeholder="2018/123456/07"
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
                validationResults.registration.isValid
                  ? 'border-green-300 focus:border-green-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {validationResults.registration.message && (
              <p className={`mt-1 text-sm ${
                validationResults.registration.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {validationResults.registration.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tax Number
            </label>
            <input
              type="text"
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleInputChange}
              required
              placeholder="9876543210"
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 ${
                validationResults.tax.isValid
                  ? 'border-green-300 focus:border-green-500'
                  : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            {validationResults.tax.message && (
              <p className={`mt-1 text-sm ${
                validationResults.tax.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {validationResults.tax.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact Name
            </label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact Role
            </label>
            <input
              type="text"
              name="contactRole"
              value={formData.contactRole}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Export Goals
            </label>
            <textarea
              name="exportGoals"
              value={formData.exportGoals}
              onChange={handleInputChange as any}
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !validationResults.registration.isValid || !validationResults.tax.isValid}
            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Validating...' : 'Validate & Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};