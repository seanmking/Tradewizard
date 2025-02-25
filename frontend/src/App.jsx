import React from 'react';
import { VerificationProvider } from './contexts/VerificationContext';
import { ConversationProvider } from './contexts/ConversationContext';
import { AssessmentProvider } from './contexts/AssessmentContext';
import ChatInterface from './components/Chat/ChatInterface';
import './styles/main.css';

const App = () => {
  return (
    <AssessmentProvider>
      <ConversationProvider>
        <VerificationProvider>
          <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-8">
              <ChatInterface />
            </div>
          </div>
        </VerificationProvider>
      </ConversationProvider>
    </AssessmentProvider>
  );
};

export default App; 