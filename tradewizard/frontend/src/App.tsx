import React, { useState } from 'react';
import './App.css';
import Chat from './components/Chat/Chat';
import { SideKick } from './components/SideKick/SideKick';
import InitialAssessmentFlow from './components/Assessment/InitialAssessmentFlow';

const App = () => {
  const [activeTab, setActiveTab] = useState<'assessment' | 'sidekick' | 'documents' | 'markets' | 'profile'>('assessment');
  
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <h1>TradeWizard</h1>
        </div>
        <nav className="main-nav">
          <a 
            href="#" 
            className={activeTab === 'assessment' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('assessment');
            }}
          >
            Assessment
          </a>
          <a 
            href="#" 
            className={activeTab === 'sidekick' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('sidekick');
            }}
          >
            SideKick
          </a>
          <a 
            href="#" 
            className={activeTab === 'documents' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('documents');
            }}
          >
            Documents
          </a>
          <a 
            href="#" 
            className={activeTab === 'markets' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('markets');
            }}
          >
            Markets
          </a>
          <a 
            href="#" 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('profile');
            }}
          >
            Profile
          </a>
        </nav>
      </header>
      
      <main className="app-content">
        {activeTab === 'assessment' && (
          <>
            <div className="content-header">
              <h1>Export Readiness Assessment</h1>
              <p>
                Complete this interactive assessment to evaluate your export readiness and 
                receive a personalized action plan for international market entry.
              </p>
            </div>
            
            <div className="chat-wrapper">
              <InitialAssessmentFlow />
            </div>
          </>
        )}
        
        {activeTab === 'sidekick' && (
          <>
            <div className="content-header">
              <h1>SideKick - Intelligent Export Planning</h1>
              <p>
                SideKick analyzes your business and target markets to create a comprehensive 
                export plan with minimal input required from you.
              </p>
            </div>
            
            <div className="sidekick-wrapper">
              <SideKick />
            </div>
          </>
        )}
        
        {activeTab === 'documents' && (
          <div className="content-header">
            <h1>Documents</h1>
            <p>This feature is coming soon.</p>
          </div>
        )}
        
        {activeTab === 'markets' && (
          <div className="content-header">
            <h1>Markets</h1>
            <p>This feature is coming soon.</p>
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div className="content-header">
            <h1>Profile</h1>
            <p>This feature is coming soon.</p>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2024 TradeWizard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App; 