import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { assessmentApi, AssessmentStep, AssessmentProgress, BusinessInfo, ValidationResult } from '../services/api';

interface ValidationStatus {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface AssessmentContextType {
  // State
  isLoading: boolean;
  error: string | null;
  currentStep: AssessmentStep | null;
  progress: AssessmentProgress | null;
  businessInfo: BusinessInfo;
  validationStatus: ValidationStatus;
  
  // Actions
  startAssessment: () => Promise<void>;
  validateField: (field: string, value: any) => Promise<ValidationResult>;
  validateStep: () => Promise<boolean>;
  nextStep: () => Promise<boolean>;
  updateBusinessInfo: (field: string, value: any) => Promise<void>;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};

interface AssessmentProviderProps {
  children: React.ReactNode;
}

export const AssessmentProvider: React.FC<AssessmentProviderProps> = ({ children }) => {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<AssessmentStep | null>(null);
  const [progress, setProgress] = useState<AssessmentProgress | null>(null);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({});
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({
    is_valid: false,
    errors: [],
    warnings: [],
    suggestions: []
  });
  
  // Error handling helper
  const handleError = useCallback((error: any) => {
    console.error('Assessment error:', error);
    setError(error.message || 'An unexpected error occurred');
    setIsLoading(false);
  }, []);
  
  // Load initial state
  useEffect(() => {
    const loadAssessmentState = async () => {
      try {
        const state = await assessmentApi.getProgress();
        setCurrentStep(state.current_step);
        setProgress(state.progress);
        setBusinessInfo(state.business_info);
        setValidationStatus(state.validation_status);
      } catch (error: any) {
        // If no active session, ignore error
        if (!error.message?.includes('No active session')) {
          handleError(error);
        }
      }
    };
    
    loadAssessmentState();
  }, [handleError]);
  
  // Start new assessment
  const startAssessment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await assessmentApi.startAssessment();
      setCurrentStep(response.current_step);
      setProgress(response.progress);
      setBusinessInfo({});
      setValidationStatus({
        is_valid: false,
        errors: [],
        warnings: [],
        suggestions: []
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);
  
  // Validate single field
  const validateField = useCallback(async (field: string, value: any): Promise<ValidationResult> => {
    setError(null);
    
    try {
      return await assessmentApi.validateField(field, value);
    } catch (error) {
      handleError(error);
      throw error;
    }
  }, [handleError]);
  
  // Validate current step
  const validateStep = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await assessmentApi.validateStep();
      
      // Update validation status
      setValidationStatus({
        is_valid: results.is_valid,
        errors: results.missing_fields,
        warnings: [],
        suggestions: Object.values(results.field_results)
          .flatMap(result => result.suggestions)
      });
      
      return results.is_valid;
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);
  
  // Advance to next step
  const nextStep = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await assessmentApi.nextStep();
      
      if (response.success) {
        setCurrentStep(response.current_step);
        setProgress(response.progress);
        return true;
      }
      
      return false;
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);
  
  // Update business info
  const updateBusinessInfo = useCallback(async (field: string, value: any) => {
    setError(null);
    
    try {
      // Validate field
      const validation = await validateField(field, value);
      
      // Update state if valid
      if (validation.is_valid) {
        setBusinessInfo(prev => ({
          ...prev,
          [field]: value
        }));
      }
      
      // Update validation status
      setValidationStatus(prev => ({
        ...prev,
        suggestions: validation.suggestions
      }));
    } catch (error) {
      handleError(error);
    }
  }, [handleError, validateField]);
  
  const value = {
    // State
    isLoading,
    error,
    currentStep,
    progress,
    businessInfo,
    validationStatus,
    
    // Actions
    startAssessment,
    validateField,
    validateStep,
    nextStep,
    updateBusinessInfo
  };
  
  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
};

export default AssessmentContext; 