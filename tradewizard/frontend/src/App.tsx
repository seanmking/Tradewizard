import React, { useState, useEffect } from 'react';
import './App.css';
import InitialAssessmentFlow from './components/Assessment/InitialAssessmentFlow';
import Dashboard from './components/Dashboard/Dashboard';
import AccountCreation from './components/Auth/AccountCreation';
import Login from './components/Auth/Login';
import Profile from './components/Auth/Profile';
import AuthService from './services/AuthService';
import { resetAssessmentState } from './services/assessment-api';

// Custom event for resetting assessment
const RESET_ASSESSMENT_EVENT = 'resetAssessment';

// Icon components
const AssessmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const DocumentsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MarketsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const ProfileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// New icon components for header
const NotificationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const HelpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Logo icon component
const LogoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

// Update TabType to remove sidekick
type TabType = 'assessment' | 'documents' | 'markets' | 'dashboard' | 'profile';

const App = () => {
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
      
      // Check for tab query parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      
      if (tabParam && ['assessment', 'dashboard', 'documents', 'markets', 'profile'].includes(tabParam)) {
        // If tab parameter is valid, use it
        setActiveTab(tabParam as TabType);
        localStorage.setItem('activeTab', tabParam);
      } else {
        // Always start on the assessment page if no valid tab parameter
        setActiveTab('assessment');
        localStorage.setItem('activeTab', 'assessment');
      }
    } else {
      // If not authenticated, always start on assessment
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
      
      // Force the dashboard to be visible
      const dashboardWrapper = document.querySelector('.dashboard-wrapper');
      if (dashboardWrapper) {
        (dashboardWrapper as HTMLElement).style.display = 'block';
      }
      
      // Update URL without reloading the page
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'dashboard');
      window.history.pushState({}, '', url);
      
      // For demo purposes, don't require authentication
      // Comment out the login modal for demo
      /*
      // If not authenticated, show login modal
      if (!isAuthenticated) {
        setShowAuthModal('login');
      }
      */
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
      localStorage.setItem('activeTab', 'dashboard');
      
      // Force the dashboard to be visible
      const dashboardWrapper = document.querySelector('.dashboard-wrapper');
      if (dashboardWrapper) {
        (dashboardWrapper as HTMLElement).style.display = 'block';
      }
      
      // Update URL without reloading the page
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'dashboard');
      window.history.pushState({}, '', url);
      
      // Ensure the tab is visually updated immediately
      const assessmentTab = document.querySelector('.assessment-tab');
      const dashboardTab = document.querySelector('.dashboard-tab');
      
      if (assessmentTab) {
        assessmentTab.classList.remove('active');
      }
      
      if (dashboardTab) {
        dashboardTab.classList.add('active');
      }
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
        <div className="logo-container">
          <div className="logo">
            <LogoIcon />
            <span>TradeWizard</span>
          </div>
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
              
              // For demo purposes, allow access to dashboard without authentication
              // If not authenticated, we'll still show the dashboard
              // Comment out the login modal for demo
              /*
              if (!isAuthenticated) {
                setShowAuthModal('login');
                return;
              }
              */
              
              // Force the dashboard to be visible
              const dashboardWrapper = document.querySelector('.dashboard-wrapper');
              if (dashboardWrapper) {
                (dashboardWrapper as HTMLElement).style.display = 'block';
              }
              
              // Update URL without reloading the page
              const url = new URL(window.location.href);
              url.searchParams.set('tab', 'dashboard');
              window.history.pushState({}, '', url);
            }}
          >
            <DashboardIcon />
            <span>Dashboard</span>
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
      </div>
      
      <div className="main-content">
        {activeTab === 'assessment' && (
          <>
            <div className="content-header">
              <div className="header-icons">
                <NotificationIcon />
                <HelpIcon />
                <div onClick={() => isAuthenticated ? setShowAuthModal('profile') : setShowAuthModal('login')}>
                  <ProfileIcon />
                </div>
              </div>
            </div>
            
            <div className="chat-wrapper">
              <InitialAssessmentFlow onComplete={handleAssessmentComplete} />
            </div>
          </>
        )}
        
        {activeTab === 'dashboard' && (
          <>
            <div className="content-header">
              <div className="header-icons">
                <NotificationIcon />
                <HelpIcon />
                <div onClick={() => isAuthenticated ? setShowAuthModal('profile') : setShowAuthModal('login')}>
                  <ProfileIcon />
                </div>
              </div>
            </div>
            
            <div className="dashboard-wrapper">
              {/* For demo purposes, always show the dashboard */}
              <Dashboard onLogout={handleLogout} />
              {/* Comment out the authentication check for demo
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
              */}
            </div>
          </>
        )}
        
        {activeTab === 'documents' && (
          <>
            <div className="content-header">
              <div className="header-icons">
                <NotificationIcon />
                <HelpIcon />
                <div onClick={() => isAuthenticated ? setShowAuthModal('profile') : setShowAuthModal('login')}>
                  <ProfileIcon />
                </div>
              </div>
            </div>
            <div className="empty-feature-placeholder">
              <p>Document management features will be available in a future update.</p>
            </div>
          </>
        )}
        
        {activeTab === 'markets' && (
          <>
            <div className="content-header">
              <div className="header-icons">
                <NotificationIcon />
                <HelpIcon />
                <div onClick={() => isAuthenticated ? setShowAuthModal('profile') : setShowAuthModal('login')}>
                  <ProfileIcon />
                </div>
              </div>
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