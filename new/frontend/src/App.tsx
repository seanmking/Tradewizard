import React from 'react';
import Chat from './components/Chat';
import './App.css';

const App = () => {
  // This would come from your authentication system
  const [businessContext] = React.useState({
    // Use our Global Fresh SA example
    business_name: "Global Fresh SA",
    contact_name: "Sean King",
    contact_role: "CEO",
    industry: "food_processing",
    website: "www.globalfreshsa.co.za",
    // Additional context to help the LLM provide more relevant responses
    company_profile: `Global Fresh SA is a food processing company based in Stellenbosch, Western Cape. 
    Founded in 2018 by Sean King, the company specializes in producing high-quality 
    dried fruit and nut products using traditional South African ingredients with 
    modern preservation techniques. They sell to specialty food stores across Western Cape 
    and Gauteng, including select Woolworths and SPAR locations. They have some interest 
    from international markets but limited export experience.`
  });

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo">
          <img src="/logo.svg" alt="TradeWizard Logo" />
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
          <Chat businessContext={businessContext} />
        </div>
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2024 TradeWizard. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App; 