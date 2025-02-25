import React, { useEffect, useState } from 'react';
import { useAssessment } from '../contexts/AssessmentContext';
import { AssessmentStep } from '../services/api';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

const FIELD_CONFIG: Record<string, FormField> = {
  company_name: {
    name: 'company_name',
    label: 'Company Name',
    type: 'text',
    placeholder: 'Enter company name',
    required: true
  },
  registration_number: {
    name: 'registration_number',
    label: 'Registration Number',
    type: 'text',
    placeholder: 'YYYY/XXXXXX/XX',
    required: true
  },
  tax_number: {
    name: 'tax_number',
    label: 'Tax Number',
    type: 'text',
    placeholder: '10 digit number',
    required: true
  },
  email: {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'company@example.com',
    required: true
  },
  sector: {
    name: 'sector',
    label: 'Business Sector',
    type: 'select',
    options: [
      { value: 'technology', label: 'Technology' },
      { value: 'retail', label: 'Retail' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'services', label: 'Services' },
      { value: 'other', label: 'Other' }
    ],
    required: true
  },
  subcategory: {
    name: 'subcategory',
    label: 'Business Subcategory',
    type: 'select',
    options: [], // Will be populated based on sector
    required: true
  }
};

// Subcategory options by sector
const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  technology: [
    { value: 'software', label: 'Software Development' },
    { value: 'hardware', label: 'Hardware Manufacturing' },
    { value: 'consulting', label: 'IT Consulting' },
    { value: 'cloud', label: 'Cloud Services' }
  ],
  retail: [
    { value: 'online', label: 'Online Retail' },
    { value: 'brick_mortar', label: 'Brick and Mortar' },
    { value: 'wholesale', label: 'Wholesale' }
  ],
  manufacturing: [
    { value: 'automotive', label: 'Automotive' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'textiles', label: 'Textiles' },
    { value: 'food', label: 'Food Processing' }
  ],
  services: [
    { value: 'financial', label: 'Financial Services' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'consulting', label: 'Consulting' }
  ],
  other: [
    { value: 'other', label: 'Other' }
  ]
};

export const AssessmentForm: React.FC = () => {
  const {
    isLoading,
    error,
    currentStep,
    progress,
    businessInfo,
    validationStatus,
    startAssessment,
    validateField,
    validateStep,
    nextStep,
    updateBusinessInfo
  } = useAssessment();
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Start assessment when component mounts
  useEffect(() => {
    if (!currentStep) {
      startAssessment();
    }
  }, [currentStep, startAssessment]);
  
  // Get fields for current step
  const getCurrentFields = (step: AssessmentStep): FormField[] => {
    return step.required_fields.map(fieldName => {
      if (fieldName === 'contact_details') {
        return FIELD_CONFIG['email']; // Special case for contact details
      }
      return FIELD_CONFIG[fieldName];
    });
  };
  
  // Handle field change
  const handleFieldChange = async (field: string, value: string) => {
    try {
      if (field === 'email') {
        // Special handling for email field
        await updateBusinessInfo('contact_details', { email: value });
      } else {
        await updateBusinessInfo(field, value);
      }
      
      // Clear field error
      setFieldErrors(prev => ({
        ...prev,
        [field]: ''
      }));
      
      // Update subcategory options if sector changes
      if (field === 'sector') {
        FIELD_CONFIG.subcategory.options = SUBCATEGORIES[value] || [];
      }
    } catch (error: any) {
      setFieldErrors(prev => ({
        ...prev,
        [field]: error.message
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate current step
      const isValid = await validateStep();
      
      if (isValid) {
        // Move to next step
        await nextStep();
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }
  
  if (!currentStep) {
    return null;
  }
  
  const fields = getCurrentFields(currentStep);
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">{currentStep.name}</h2>
        <p className="text-gray-600">{currentStep.description}</p>
        
        {/* Progress indicator */}
        {progress && (
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current_step_index / progress.total_steps) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Step {progress.current_step_index} of {progress.total_steps}
            </p>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map(field => (
          <div key={field.name} className="space-y-2">
            <label 
              htmlFor={field.name}
              className="block text-sm font-medium text-gray-700"
            >
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'select' ? (
              <select
                id={field.name}
                name={field.name}
                value={field.name === 'email' ? 
                  businessInfo.contact_details?.email || '' : 
                  businessInfo[field.name] || ''
                }
                onChange={e => handleFieldChange(field.name, e.target.value)}
                className={`
                  mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                  ${fieldErrors[field.name] ? 'border-red-500' : ''}
                `}
                required={field.required}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                id={field.name}
                name={field.name}
                value={field.name === 'email' ? 
                  businessInfo.contact_details?.email || '' : 
                  businessInfo[field.name] || ''
                }
                onChange={e => handleFieldChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className={`
                  mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500
                  ${fieldErrors[field.name] ? 'border-red-500' : ''}
                `}
                required={field.required}
              />
            )}
            
            {/* Field error message */}
            {fieldErrors[field.name] && (
              <p className="text-sm text-red-600">{fieldErrors[field.name]}</p>
            )}
            
            {/* Validation suggestions */}
            {validationStatus.suggestions.length > 0 && (
              <ul className="mt-2 text-sm text-gray-600">
                {validationStatus.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="text-blue-500">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        
        {/* Validation errors */}
        {validationStatus.errors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <h3 className="text-sm font-medium text-red-800">
              Please fix the following errors:
            </h3>
            <ul className="mt-2 text-sm text-red-700">
              {validationStatus.errors.map((error, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span>•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end space-x-4">
          {progress && progress.current_step_index > 1 && (
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {/* Add back functionality */}}
            >
              Back
            </button>
          )}
          
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
}; 