import React, { useState } from 'react';
import './AccountCreation.css';
import AuthService from '../../services/AuthService';

interface AccountCreationProps {
  onSuccess: (username: string) => void;
  onCancel: () => void;
}

const AccountCreation: React.FC<AccountCreationProps> = ({ onSuccess, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate form
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // For POC, bypass the API call and simulate success
      setTimeout(() => {
        // Account created successfully using AuthService
        AuthService.register(email);
        onSuccess(email);
        setIsLoading(false);
      }, 1000);
      
      /* 
      // This code would be used in production
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password,
          confirm_password: confirmPassword,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Account created successfully
        onSuccess(email);
      } else {
        // Handle error
        setError(data.message || 'Failed to create account');
      }
      */
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Account creation error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="account-creation-modal">
      <div className="account-creation-card">
        <h2>Create Your Account</h2>
        <p className="subtitle">Create an account to access your export readiness report</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address (this will be your username moving forward)</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              disabled={isLoading}
            />
          </div>
          
          <div className="button-group">
            <button 
              type="button" 
              className="cancel-button" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountCreation; 