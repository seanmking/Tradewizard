import React from 'react';
import Chat from './components/Chat/Chat';
import './App.css';

const App = () => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <h1>TradeWizard</h1>
        </div>
        <nav className="main-nav">
          <a href="/" className="active">Assessment</a>
          <a href="/documents">Documents</a>
          <a href="/markets">Markets</a>
          <a href="/profile">Profile</a>
        </nav>
      </header>
      
      <main className="app-content">
        <div className="content-header">
          <h1>Export Readiness Assessment</h1>
          <p>
            Complete this interactive assessment to evaluate your export readiness and 
            receive a personalized action plan for international market entry.
          </p>
        </div>
        
        <div className="chat-wrapper">
          <Chat />
        </div>
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2024 TradeWizard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App; 