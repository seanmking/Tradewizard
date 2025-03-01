import React, { useState } from 'react';
import './InitialInputForm.css';

interface InitialInputFormProps {
  onSubmit: (companyName: string, businessType: string) => void;
  isLoading: boolean;
}

export const InitialInputForm: React.FC<InitialInputFormProps> = ({ onSubmit, isLoading }) => {
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [errors, setErrors] = useState<{ companyName?: string; businessType?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { companyName?: string; businessType?: string } = {};
    
    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!businessType.trim()) {
      newErrors.businessType = 'Business type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(companyName, businessType);
    }
  };

  return (
    <div className="initial-input-form">
      <div className="form-header">
        <h2>Let's get started</h2>
        <p>Provide some basic information about your business to begin the export planning process.</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="companyName">Company Name</label>
          <input
            type="text"
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Enter your company name"
            disabled={isLoading}
          />
          {errors.companyName && <div className="error-message">{errors.companyName}</div>}
        </div>
        
        <div className="form-group">
          <label htmlFor="businessType">Business Type</label>
          <input
            type="text"
            id="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="e.g., Manufacturer, Retailer, Service Provider"
            disabled={isLoading}
          />
          {errors.businessType && <div className="error-message">{errors.businessType}</div>}
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </form>
      
      <div className="form-info">
        <p>
          <strong>How it works:</strong> SideKick will analyze your business information and provide 
          export recommendations tailored to your needs. We'll gather market intelligence, identify 
          regulatory requirements, and generate a comprehensive export plan.
        </p>
      </div>
    </div>
  );
}; 