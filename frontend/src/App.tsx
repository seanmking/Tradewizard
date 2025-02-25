import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AssessmentProvider } from './contexts/AssessmentContext';
import { AssessmentForm } from './components/AssessmentForm';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold text-gray-900">
              Business Assessment
            </h1>
          </div>
        </header>
        
        <main className="py-10">
          <AssessmentProvider>
            <Routes>
              <Route path="/assessment" element={<AssessmentForm />} />
              <Route path="/" element={<Navigate to="/assessment" replace />} />
            </Routes>
          </AssessmentProvider>
        </main>
        
        <footer className="bg-white mt-auto">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} TradeKing. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App; 