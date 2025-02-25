import React from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import ChatInterface from '../Chat/ChatInterface';

const AssessmentFlow: React.FC = () => {
  const { 
    isLoading,
    error,
    businessInfo,
    startAssessment
  } = useAssessment();

  React.useEffect(() => {
    // Start assessment when component mounts
    startAssessment();
  }, [startAssessment]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="assessment-flow">
      {isLoading ? (
        <div className="loading">Loading assessment...</div>
      ) : (
        <ChatInterface />
      )}
    </div>
  );
};

export default AssessmentFlow; 