import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAssessmentContext } from '../../contexts/AssessmentContext';
import { Spinner } from '../common/Spinner';

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
  onValidationComplete?: () => void;
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

interface ValidationResult {
  is_valid: boolean;
  suggestions: string[];
  confidence: number;
}

export const BusinessValidationForm: React.FC<BusinessValidationFormProps> = ({ onValidationComplete }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<Record<string, ValidationResult>>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});
  const [detectedEntityType, setDetectedEntityType] = useState<string | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('Food Products');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const { validateBusiness, businessData, setBusinessData } = useAssessmentContext();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize form with business data from context
  useEffect(() => {
    if (businessData) {
      if (businessData.company_name) {
        setFormData(prev => ({ ...prev, company_name: businessData.company_name }));
        // Trigger entity detection
        const entityType = detectEntityType(businessData.company_name);
        setDetectedEntityType(entityType);
        if (entityType) {
          setSelectedEntityType(entityType);
        }
      }
      
      // Set sector and subcategory if available
      if (businessData.sector) {
        setSelectedSector(businessData.sector);
      }
      if (businessData.subcategory) {
        setSelectedSubcategory(businessData.subcategory);
      }
    }
  }, [businessData]);

  // Detect entity type from company name
  const detectEntityType = (companyName: string): string | null => {
    for (const [type, pattern] of Object.entries(ENTITY_TYPE_PATTERNS)) {
      if (pattern.test(companyName)) {
        // Automatically set the selected entity type when detected
        setSelectedEntityType(type);
        return type;
      }
    }
    return null;
  };

  // Pre-validate input before sending to API
  const preValidateInput = (field: ValidationField, value: string): { isValid: boolean; message: string } => {
    switch (field.name) {
      case 'registration_number':
        if (!value.trim()) {
          return {
            isValid: false,
            message: 'Registration number is required'
          };
        }
        if (!VALIDATION_PATTERNS.REGISTRATION.test(value)) {
          return {
            isValid: false,
            message: 'Registration number must be in format YYYY/XXXXXX/XX'
          };
        }
        const year = parseInt(value.split('/')[0]);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1900 || year > currentYear) {
          return {
            isValid: false,
            message: `Year must be between 1900 and ${currentYear}`
          };
        }
        return { isValid: true, message: '' };
      case 'tax_number':
        if (!value.trim()) {
          return {
            isValid: false,
            message: 'Tax number is required'
          };
        }
        if (!/^\d*$/.test(value)) {
          return {
            isValid: false,
            message: 'Tax number must contain only digits'
          };
        }
        if (!VALIDATION_PATTERNS.TAX_NUMBER.test(value)) {
          return {
            isValid: false,
            message: value.length < 10 
              ? 'Tax number is too short - must be exactly 10 digits'
              : value.length > 10 
                ? 'Tax number is too long - must be exactly 10 digits'
                : 'Tax number must be exactly 10 digits'
          };
        }
        return { isValid: true, message: '' };
      case 'company_name':
        if (!value.trim()) {
          return {
            isValid: false,
            message: 'Company name is required'
          };
        }
        if (value.length < 3) {
          return {
            isValid: false,
            message: 'Company name must be at least 3 characters long'
          };
        }
        break;
    }
    return { isValid: true, message: '' };
  };

  const handleChange = useCallback(async (field: ValidationField, value: string) => {
    setFormData(prev => ({ ...prev, [field.name]: value }));
    
    // Update detected entity type for company name
    if (field.name === 'company_name') {
      const entityType = detectEntityType(value);
      setDetectedEntityType(entityType);
      
      // Only auto-select if no manual selection has been made
      if (entityType && !selectedEntityType) {
        setSelectedEntityType(entityType);
      }
    }

    // Don't validate empty fields unless they're required
    if (!value && !field.required) {
      return;
    }

    // Pre-validate input
    const preValidation = preValidateInput(field, value);
    if (!preValidation.isValid) {
      setValidation(prev => ({
        ...prev,
        [field.name]: {
          is_valid: false,
          suggestions: [preValidation.message],
          confidence: 0
        }
      }));
      return;
    }

    // Clear existing timer for this field
    if (debounceTimers.current[field.name]) {
      clearTimeout(debounceTimers.current[field.name]);
    }

    // Set new timer
    debounceTimers.current[field.name] = setTimeout(async () => {
      setIsValidating(prev => ({ ...prev, [field.name]: true }));
      
      try {
        // For registration number and tax number, use local validation first
        if (field.name === 'registration_number' || field.name === 'tax_number') {
          const isValid = VALIDATION_PATTERNS[field.name === 'registration_number' ? 'REGISTRATION' : 'TAX_NUMBER'].test(value);
          if (isValid) {
            setValidation(prev => ({
              ...prev,
              [field.name]: {
                is_valid: true,
                suggestions: [`Valid ${field.name.replace('_', ' ')}`],
                confidence: 0.95
              }
            }));
            setIsValidating(prev => ({ ...prev, [field.name]: false }));
            return;
          }
        }

        // For other fields or if local validation fails, call the API
        const result = await validateBusiness(field.name, value);
        
        // If it's the company name field and we detected an entity type, increase confidence
        if (field.name === 'company_name' && detectedEntityType) {
          result.confidence = Math.min(1, result.confidence + 0.1);
          result.suggestions = [
            ...result.suggestions,
            `Detected business entity type: ${BUSINESS_ENTITY_TYPES.find(t => t.value === detectedEntityType)?.label}`
          ];
        }
        
        setValidation(prev => ({ ...prev, [field.name]: result }));
      } catch (error) {
        console.error('Validation error:', error);
        setValidation(prev => ({
          ...prev,
          [field.name]: {
            is_valid: false,
            suggestions: ['Validation service error. Please try again.'],
            confidence: 0
          }
        }));
      } finally {
        setIsValidating(prev => ({ ...prev, [field.name]: false }));
      }
    }, 300);
  }, [validateBusiness, selectedEntityType, detectedEntityType]);

  const getFieldValidationState = (field: ValidationField) => {
    const validationResult = validation[field.name];
    if (!validationResult) return '';
    return validationResult.is_valid ? 'is-valid' : 'is-invalid';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isFormValid = () => {
    return VALIDATION_FIELDS.every(field => {
      const validationResult = validation[field.name];
      return validationResult && validationResult.is_valid;
    }) && selectedSubcategory && selectedEntityType;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid() && selectedSubcategory && onValidationComplete) {
      // Store the validated data
      const validatedData = {
        ...formData,
        sector: selectedSector,
        subcategory: selectedSubcategory,
        entityType: selectedEntityType,
        company_name: formData.company_name || '',
        registration_number: formData.registration_number || '',
        tax_number: formData.tax_number || ''
      };
      
      // Update business data in context
      setBusinessData(validatedData);
      
      // Call the completion handler which will handle the transition
      onValidationComplete();
    }
  };

  // Helper function to get validation message class
  const getValidationMessageClass = (field: ValidationField) => {
    const validationResult = validation[field.name];
    if (!validationResult) return '';
    return validationResult.is_valid 
      ? 'text-green-600'
      : validationResult.confidence > 0 
        ? 'text-yellow-600' 
        : 'text-red-600';
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
        {/* Business Entity Type Selection */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Entity Type
            <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={selectedEntityType}
            onChange={(e) => setSelectedEntityType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select business entity type</option>
            {BUSINESS_ENTITY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {detectedEntityType && selectedEntityType !== detectedEntityType && (
            <p className="mt-2 text-sm text-yellow-600">
              Note: We detected {BUSINESS_ENTITY_TYPES.find(t => t.value === detectedEntityType)?.label} in your company name, 
              but you can override this selection if needed.
            </p>
          )}
        </div>

        {/* Industry Sector Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry Sector
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                setSelectedSubcategory('');
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {Object.entries(INDUSTRY_SECTORS).map(([sector, { active }]) => (
                <option key={sector} value={sector} disabled={!active}>
                  {sector} {!active && '(Coming Soon)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategory
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select a subcategory</option>
              {INDUSTRY_SECTORS[selectedSector]?.subcategories.map(subcategory => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Existing validation fields */}
        {VALIDATION_FIELDS.map(field => (
          <div key={field.name} className="form-group">
            <label 
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            <div className="relative">
              <input
                id={field.name}
                type={field.type}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field, e.target.value)}
                placeholder={field.placeholder}
                aria-label={field.label}
                className={`
                  mt-1 block w-full rounded-md shadow-sm
                  ${getFieldValidationState(field)}
                  ${validation[field.name]?.is_valid 
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  }
                `}
              />
              
              {isValidating[field.name] && (
                <div className="absolute right-3 top-3" role="status" aria-label="Loading">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            {/* Help text */}
            <p className="mt-1 text-sm text-gray-500" id={`${field.name}-help`}>
              {field.helpText}
            </p>

            {/* Entity type detection feedback */}
            {field.name === 'company_name' && detectedEntityType && (
              <div className="mt-2">
                <p className="text-sm text-blue-600">
                  Detected entity type: {detectedEntityType.replace('_', ' ')}
                </p>
              </div>
            )}

            {/* Enhanced validation feedback */}
            {validation[field.name] && (
              <div className="mt-2" aria-live="polite">
                {validation[field.name].suggestions.map((suggestion, idx) => (
                  <p 
                    key={idx} 
                    className={`text-sm ${getValidationMessageClass(field)}`}
                    role="alert"
                  >
                    {suggestion}
                  </p>
                ))}
                
                {/* Enhanced confidence indicator */}
                {validation[field.name].confidence > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center">
                      <div className="flex-grow h-2 rounded-full bg-gray-200">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            validation[field.name].confidence >= 0.8 ? 'bg-green-500' :
                            validation[field.name].confidence >= 0.5 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.round(validation[field.name].confidence * 100)}%` }}
                        />
                      </div>
                      <span 
                        className={`ml-2 text-sm ${getConfidenceColor(validation[field.name].confidence)}`}
                        role="status"
                      >
                        {Math.round(validation[field.name].confidence * 100)}% match
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Submit button with enhanced messaging */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={!isFormValid() || !selectedSubcategory}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors
              ${isFormValid() && selectedSubcategory
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'}`}
          >
            {isFormValid() && selectedSubcategory
              ? 'Continue to Assessment'
              : 'Please Complete All Required Fields'}
          </button>
        </div>
      </form>
    </div>
  );
};