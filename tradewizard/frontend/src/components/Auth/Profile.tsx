import React, { useState, useEffect } from 'react';
import AuthService from '../../services/AuthService';
import './AccountCreation.css'; // We can reuse the CSS from account creation

interface ProfileProps {
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const [username, setUsername] = useState<string>('');
  
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setUsername(user.username);
    }
  }, []);
  
  const handleLogout = () => {
    AuthService.logout();
    onLogout();
  };
  
  return (
    <div className="account-creation-modal">
      <div className="account-creation-card">
        <h2>User Profile</h2>
        <p className="subtitle">Manage your account settings</p>
        
        <div className="profile-info">
          <div className="profile-item">
            <strong>Username:</strong>
            <span>{username}</span>
          </div>
          
          <div className="profile-item">
            <strong>Assessment Status:</strong>
            <span>Completed</span>
          </div>
        </div>
        
        <div className="button-group" style={{ marginTop: '20px' }}>
          <button 
            type="button" 
            className="submit-button" 
            onClick={handleLogout}
            style={{ width: '100%' }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile; 