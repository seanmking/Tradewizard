import React, { useState, useEffect } from 'react';
import './App.css';
import Chat from './components/Chat/Chat';
import { SideKick } from './components/SideKick/SideKick';
import InitialAssessmentFlow from './components/Assessment/InitialAssessmentFlow';
import Dashboard from './components/Dashboard/Dashboard';
import AccountCreation from './components/Auth/AccountCreation';
import Login from './components/Auth/Login';
import Profile from './components/Auth/Profile';
import AuthService from './services/AuthService';
import { resetAssessmentState } from './services/assessment-api';

// Custom event for resetting assessment
const RESET_ASSESSMENT_EVENT = 'resetAssessment';

// Simple icon components
const AssessmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
    <path d="M9 14l2 2 4-4"></path>
  </svg>
);

const SideKickIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

const DocumentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const MarketsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const App = () => {
  type TabType = 'assessment' | 'sidekick' | 'documents' | 'markets' | 'dashboard' | 'profile';
  
  // State for managing current user
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [hasCompletedAssessment, setHasCompletedAssessment] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<'none' | 'login' | 'register' | 'profile'>('none');
  
  const [activeTab, setActiveTab] = useState<TabType>('assessment');
  
  // Check authentication state on load
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setUsername(user.username);
      setHasCompletedAssessment(user.hasCompletedAssessment);
      
      // Store the current active tab in localStorage
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab && ['assessment', 'dashboard', 'sidekick', 'documents', 'markets', 'profile'].includes(savedTab)) {
        setActiveTab(savedTab as TabType);
      } else {
        // Default to assessment if no valid tab is saved
        setActiveTab('assessment');
        localStorage.setItem('activeTab', 'assessment');
      }
    } else {
      // For users that aren't logged in, always show assessment
      setActiveTab('assessment');
      localStorage.setItem('activeTab', 'assessment');
    }
    
    // Add event listener for navigating to assessment
    const handleNavigateToAssessment = () => {
      setActiveTab('assessment');
      localStorage.setItem('activeTab', 'assessment');
    };
    
    // Add event listener for navigating to dashboard
    const handleNavigateToDashboard = () => {
      setActiveTab('dashboard');
      localStorage.setItem('activeTab', 'dashboard');
      
      // Ensure the tab is visually updated immediately
      const assessmentTab = document.querySelector('.assessment-tab');
      const dashboardTab = document.querySelector('.dashboard-tab');
      
      if (assessmentTab) {
        assessmentTab.classList.remove('active');
      }
      
      if (dashboardTab) {
        dashboardTab.classList.add('active');
      }
    };
    
    window.addEventListener('navigateToAssessment', handleNavigateToAssessment);
    window.addEventListener('navigateToDashboard', handleNavigateToDashboard);
    
    // Set up beforeunload event to save the active tab
    const handleBeforeUnload = () => {
      localStorage.setItem('activeTab', activeTab);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('navigateToAssessment', handleNavigateToAssessment);
      window.removeEventListener('navigateToDashboard', handleNavigateToDashboard);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [activeTab]);
  
  // Handle successful login
  const handleLoginSuccess = (username: string) => {
    setIsAuthenticated(true);
    setUsername(username);
    setHasCompletedAssessment(true);
    setShowAuthModal('none');
    setActiveTab('dashboard');
    
    // Ensure the user is marked as having completed the assessment
    AuthService.setCompletedAssessment(true);
  };
  
  // Handle successful account creation
  const handleAccountCreationSuccess = (username: string) => {
    setIsAuthenticated(true);
    setUsername(username);
    setHasCompletedAssessment(true);
    setShowAuthModal('none');
    setActiveTab('dashboard');
  };
  
  // Handle assessment completion
  const handleAssessmentComplete = () => {
    setHasCompletedAssessment(true);
    AuthService.setCompletedAssessment(true);
    
    // Show account creation modal if not authenticated
    if (!isAuthenticated) {
      setShowAuthModal('register');
    } else {
      // Just set active tab to dashboard but allow returning to assessment later
      setActiveTab('dashboard');
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setShowAuthModal('none');
    setActiveTab('assessment');
  };
  
  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>TradeWizard</h1>
        </div>
        <nav className="sidebar-nav">
          <a 
            href="#" 
            className={`${activeTab === 'assessment' ? 'active' : ''} assessment-tab`}
            onClick={(e) => {
              e.preventDefault();
              
              // First set the active tab
              setActiveTab('assessment');
              localStorage.setItem('activeTab', 'assessment');
              
              // For demo purposes, allow restarting the assessment even if completed
              if (hasCompletedAssessment) {
                // Reset all assessment state first
                resetAssessmentState();
                
                // Then dispatch the reset event for the component to handle
                setTimeout(() => {
                  window.dispatchEvent(new CustomEvent(RESET_ASSESSMENT_EVENT));
                  console.log('Restarting assessment for demo purposes');
                }, 100);
              }
            }}
          >
            <AssessmentIcon />
            <span>Assessment</span>
          </a>
          <a 
            href="#" 
            className={`${activeTab === 'dashboard' ? 'active' : ''} dashboard-tab`}
            onClick={(e) => {
              e.preventDefault();
              
              // Store the previous tab
              const previousTab = activeTab;
              
              // Update active tab
              setActiveTab('dashboard');
              localStorage.setItem('activeTab', 'dashboard');
              
              // If not authenticated, show login modal
              if (!isAuthenticated) {
                setShowAuthModal('login');
              }
            }}
          >
            <DashboardIcon />
            <span>Dashboard</span>
          </a>
          <a 
            href="#" 
            className={activeTab === 'sidekick' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('sidekick');
            }}
          >
            <SideKickIcon />
            <span>SideKick</span>
          </a>
          <a 
            href="#" 
            className={activeTab === 'documents' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('documents');
            }}
          >
            <DocumentsIcon />
            <span>Documents</span>
          </a>
          <a 
            href="#" 
            className={activeTab === 'markets' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('markets');
            }}
          >
            <MarketsIcon />
            <span>Markets</span>
          </a>
        </nav>
        
        {/* Profile section at bottom of sidebar */}
        <div className="sidebar-profile">
          <a 
            href="#" 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              
              if (isAuthenticated) {
                setShowAuthModal('profile');
              } else {
                setShowAuthModal('login');
              }
            }}
          >
            <ProfileIcon />
            <span>{isAuthenticated ? username : 'Login'}</span>
          </a>
        </div>
      </div>
      
      <div className="main-content">
        {activeTab === 'assessment' && (
          <>
            <div className="content-header">
              <h1>Export Readiness Assessment</h1>
              <p>Complete this interactive assessment to evaluate your export readiness.</p>
            </div>
            
            <div className="chat-wrapper">
              <InitialAssessmentFlow onComplete={handleAssessmentComplete} />
            </div>
          </>
        )}
        
        {activeTab === 'dashboard' && (
          <>
            <div className="content-header">
              <h1>Export Market Dashboard</h1>
              <p>View your export readiness analysis and market intelligence.</p>
            </div>
            
            <div className="dashboard-wrapper">
              {isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <div className="empty-feature-placeholder">
                  <p>Please log in to access your dashboard.</p>
                  <div className="button-group">
                    <button 
                      onClick={() => setShowAuthModal('login')}
                      className="action-button"
                    >
                      Log In
                    </button>
                    <button 
                      onClick={() => {
                        setActiveTab('assessment');
                      }}
                      className="secondary-button"
                      style={{ marginLeft: '10px' }}
                    >
                      Complete Assessment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeTab === 'sidekick' && (
          <>
            <div className="content-header">
              <h1>SideKick - Intelligent Export Planning</h1>
              <p>SideKick analyzes your business and target markets to create a comprehensive export plan.</p>
            </div>
            
            <div className="sidekick-wrapper">
              <SideKick />
            </div>
          </>
        )}
        
        {activeTab === 'documents' && (
          <>
            <div className="content-header">
              <h1>Documents</h1>
              <p>This feature is coming soon.</p>
            </div>
            <div className="empty-feature-placeholder">
              <p>Document management features will be available in a future update.</p>
            </div>
          </>
        )}
        
        {activeTab === 'markets' && (
          <>
            <div className="content-header">
              <h1>Markets</h1>
              <p>This feature is coming soon.</p>
            </div>
            <div className="empty-feature-placeholder">
              <p>Market exploration features will be available in a future update.</p>
            </div>
          </>
        )}
      </div>
      
      {/* Authentication Modals */}
      {showAuthModal === 'login' && (
        <Login 
          onSuccess={handleLoginSuccess}
          onCancel={() => {
            setShowAuthModal('none');
            // If on dashboard tab without authentication, redirect to assessment
            if (activeTab === 'dashboard' && !isAuthenticated) {
              setActiveTab('assessment');
              localStorage.setItem('activeTab', 'assessment');
            }
          }}
          onRegister={() => setShowAuthModal('register')}
        />
      )}
      
      {showAuthModal === 'register' && (
        <AccountCreation 
          onSuccess={handleAccountCreationSuccess}
          onCancel={() => setShowAuthModal('none')}
        />
      )}
      
      {showAuthModal === 'profile' && (
        <Profile onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App; 