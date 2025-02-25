import React from 'react';
import { AssessmentProvider } from './contexts/AssessmentContext';
import AssessmentFlow from './components/Assessment/AssessmentFlow';

const App: React.FC = () => {
  return (
    <AssessmentProvider>
      <div className="app-container">
        <header className="app-header">
          <h1>Export Readiness Assessment</h1>
        </header>
        <main>
          <AssessmentFlow />
        </main>
      </div>
    </AssessmentProvider>
  );
};

export default App; 