import React, { useState } from 'react';
import './AccountCreation.css'; // We can reuse the CSS from account creation
import AuthService from '../../services/AuthService';

interface LoginProps {
  onSuccess: (username: string) => void;
  onCancel: () => void;
  onRegister: () => void; // To navigate to registration if needed
}

const Login: React.FC<LoginProps> = ({ onSuccess, onCancel, onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validate form
    if (!email || !password) {
      setError('All fields are required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // For POC, bypass the API call and simulate success
      // In a real implementation, this would call an API endpoint
      setTimeout(() => {
        // Login successful using AuthService
        AuthService.login(email);
        onSuccess(email);
        setIsLoading(false);
      }, 1000);
      
      /* 
      // This code would be used in production
      const response = await fetch('/api/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Login successful
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', email);
        localStorage.setItem('hasCompletedAssessment', 'true');
        onSuccess(email);
      } else {
        // Handle error
        setError(data.message || 'Invalid username or password');
      }
      */
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="account-creation-modal">
      <div className="account-creation-card">
        <h2>Log In</h2>
        <p className="subtitle">Log in to access your export dashboard</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
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
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </div>
          
          <div className="register-link">
            <p>Don't have an account? <button type="button" onClick={() => {
              onCancel(); // Close the login modal
              // This will navigate to the assessment tab
              window.dispatchEvent(new CustomEvent('navigateToAssessment'));
            }}>Complete the assessment</button></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 