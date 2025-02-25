import React, { useState } from 'react';
import { useVerification } from '../contexts/VerificationContext';

interface ContactVerificationProps {
  onSubmit: (contactInfo: { email: string; phone: string }) => Promise<void>;
}

const ContactVerification: React.FC<ContactVerificationProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const { state } = useVerification();
  const errors = state.contactVerification?.errors || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ email, phone });
  };

  const getErrorByCode = (code: string) => {
    return errors.find(error => error.code === code)?.message;
  };

  return (
    <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-2xl font-bold mb-6">Contact Information Verification</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              getErrorByCode('INVALID_EMAIL') ? 'border-red-500' : ''
            }`}
            id="email"
            type="email"
            placeholder="e.g., business@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {getErrorByCode('INVALID_EMAIL') && (
            <p className="text-red-500 text-xs italic mt-1">
              {getErrorByCode('INVALID_EMAIL')}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="phone"
          >
            Phone Number
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
              getErrorByCode('INVALID_PHONE') ? 'border-red-500' : ''
            }`}
            id="phone"
            type="tel"
            placeholder="e.g., 0123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          {getErrorByCode('INVALID_PHONE') && (
            <p className="text-red-500 text-xs italic mt-1">
              {getErrorByCode('INVALID_PHONE')}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Verify Contact Information
          </button>
        </div>
      </form>
      
      {state.contactVerification?.isValid && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
          <h3 className="font-bold text-green-800 mb-2">Verification Successful</h3>
          <div className="text-sm text-green-700">
            <p>Email: {email}</p>
            <p>Phone: {phone}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactVerification; 