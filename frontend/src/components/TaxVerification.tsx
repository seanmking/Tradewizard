import React, { useState } from 'react';
import { useVerification } from '../contexts/VerificationContext';

interface TaxVerificationProps {
  onSubmit: (taxNumber: string) => Promise<void>;
}

const TaxVerification: React.FC<TaxVerificationProps> = ({ onSubmit }) => {
  const [taxNumber, setTaxNumber] = useState('');
  const { state } = useVerification();
  const errors = state.taxVerification?.errors || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(taxNumber);
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-6">Tax Compliance Verification</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="taxNumber"
          >
            Tax Reference Number
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              errors.length > 0 ? 'border-red-500' : ''
            }`}
            id="taxNumber"
            type="text"
            placeholder="e.g., 9012345678"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            required
          />
          {errors.map((error, index) => (
            <p key={index} className="text-red-500 text-xs italic mt-1">
              {error.message}
            </p>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Verify Tax Compliance
          </button>
        </div>
      </form>
      
      {state.taxVerification?.isValid && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-bold text-green-800 mb-2">Verification Successful</h3>
          <div className="text-sm text-green-700">
            <p>Tax Compliance: {state.taxVerification.details.compliant ? 'Yes' : 'No'}</p>
            <p>VAT Registered: {state.taxVerification.details.vatRegistered ? 'Yes' : 'No'}</p>
            <p>Last Filing Date: {state.taxVerification.details.lastFilingDate}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxVerification; 