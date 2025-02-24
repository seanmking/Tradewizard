import React, { createContext, useContext, useState, ReactNode } from 'react';
import { assessmentApi } from '../services/api';

interface ValidationResult {
  is_valid: boolean;
  suggestions: string[];
  confidence: number;
}

interface BusinessData {
  company_name: string;
  registration_number: string;
  tax_number: string;
  sector: string;
  subcategory: string;
  entityType: string | null;
}

interface AssessmentContextType {
  validateBusiness: (field: string, value: string) => Promise<ValidationResult>;
  isAssessmentComplete: boolean;
  setAssessmentComplete: (complete: boolean) => void;
  businessData: BusinessData | null;
  setBusinessData: (data: BusinessData | null) => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

interface AssessmentProviderProps {
  children: ReactNode;
}

const INITIAL_BUSINESS_DATA: BusinessData = {
  company_name: '',
  registration_number: '',
  tax_number: '',
  sector: '',
  subcategory: '',
  entityType: null
};

export const AssessmentProvider: React.FC<AssessmentProviderProps> = ({ children }) => {
  const [isAssessmentComplete, setAssessmentComplete] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);

  const validateBusiness = async (field: string, value: string): Promise<ValidationResult> => {
    try {
      // Add field-specific validation logic here if needed
      const response = await assessmentApi.validateBusiness(field, value);
      
      // Enhanced validation response handling
      if (response.is_valid && field === 'company_name') {
        // Initialize or update business data
        setBusinessData(prev => ({
          ...(prev || INITIAL_BUSINESS_DATA),
          company_name: value
        }));
      }
      
      return response;
    } catch (error) {
      console.error('Business validation error:', error);
      return {
        is_valid: false,
        suggestions: ['Validation service error. Please try again.'],
        confidence: 0
      };
    }
  };

  return (
    <AssessmentContext.Provider 
      value={{ 
        validateBusiness,
        isAssessmentComplete,
        setAssessmentComplete,
        businessData,
        setBusinessData
      }}
    >
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessmentContext = () => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessmentContext must be used within an AssessmentProvider');
  }
  return context;
}; 