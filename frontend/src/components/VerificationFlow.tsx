import React from 'react';
import { useVerification } from '../contexts/VerificationContext';
import { verificationService } from '../services/verificationService';
import BusinessVerification from './BusinessVerification';
import TaxVerification from './TaxVerification';
import ContactVerification from './ContactVerification';
import VerificationSummary from './VerificationSummary';

const VerificationFlow: React.FC = () => {
  const { state, dispatch } = useVerification();

  const handleBusinessSubmit = async (registrationNumber: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await verificationService.verifyBusiness(registrationNumber);
      dispatch({ type: 'SET_BUSINESS_VERIFICATION', payload: result });
      if (result.isValid) {
        dispatch({ type: 'SET_STEP', payload: 'tax' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to verify business details' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleTaxSubmit = async (taxNumber: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await verificationService.verifyTax(taxNumber);
      dispatch({ type: 'SET_TAX_VERIFICATION', payload: result });
      if (result.isValid) {
        dispatch({ type: 'SET_STEP', payload: 'contact' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to verify tax compliance' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleContactSubmit = async (contactInfo: { email: string; phone: string }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const result = await verificationService.verifyContact(contactInfo);
      dispatch({ type: 'SET_CONTACT_VERIFICATION', payload: result });
      if (result.isValid) {
        dispatch({ type: 'SET_STEP', payload: 'complete' });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to verify contact information' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const renderStep = () => {
    switch (state.step) {
      case 'business':
        return <BusinessVerification onSubmit={handleBusinessSubmit} />;
      case 'tax':
        return <TaxVerification onSubmit={handleTaxSubmit} />;
      case 'contact':
        return <ContactVerification onSubmit={handleContactSubmit} />;
      case 'complete':
        return <VerificationSummary />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {state.error}
          <button
            className="float-right"
            onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {['business', 'tax', 'contact', 'complete'].map((step, index) => (
            <React.Fragment key={step}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  state.step === step
                    ? 'bg-blue-500 text-white'
                    : state[`${step}Verification`]?.isValid
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    state[`${step}Verification`]?.isValid ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {state.isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        renderStep()
      )}
    </div>
  );
};

export default VerificationFlow; 