import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface ValidationError {
  code: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  details: Record<string, any>;
  errors?: ValidationError[];
}

interface VerificationState {
  step: 'business' | 'tax' | 'contact' | 'complete';
  businessVerification: ValidationResult | null;
  taxVerification: ValidationResult | null;
  contactVerification: ValidationResult | null;
  isLoading: boolean;
  error: string | null;
}

type VerificationAction =
  | { type: 'SET_STEP'; payload: VerificationState['step'] }
  | { type: 'SET_BUSINESS_VERIFICATION'; payload: ValidationResult }
  | { type: 'SET_TAX_VERIFICATION'; payload: ValidationResult }
  | { type: 'SET_CONTACT_VERIFICATION'; payload: ValidationResult }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

const initialState: VerificationState = {
  step: 'business',
  businessVerification: null,
  taxVerification: null,
  contactVerification: null,
  isLoading: false,
  error: null,
};

const verificationReducer = (
  state: VerificationState,
  action: VerificationAction
): VerificationState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'SET_BUSINESS_VERIFICATION':
      return { ...state, businessVerification: action.payload };
    case 'SET_TAX_VERIFICATION':
      return { ...state, taxVerification: action.payload };
    case 'SET_CONTACT_VERIFICATION':
      return { ...state, contactVerification: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const VerificationContext = createContext<{
  state: VerificationState;
  dispatch: React.Dispatch<VerificationAction>;
} | null>(null);

export const VerificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(verificationReducer, initialState);

  return (
    <VerificationContext.Provider value={{ state, dispatch }}>
      {children}
    </VerificationContext.Provider>
  );
};

export const useVerification = () => {
  const context = useContext(VerificationContext);
  if (!context) {
    throw new Error('useVerification must be used within a VerificationProvider');
  }
  return context;
}; 