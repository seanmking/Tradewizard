import React, { useState } from 'react';
import { ExportPlan as ExportPlanType } from '../../services/sidekick';
import './ExportPlan.css';

interface ExportPlanProps {
  plan: ExportPlanType;
}

const ExportPlan: React.FC<ExportPlanProps> = ({ plan }) => {
  const [activeSection, setActiveSection] = useState<string>(
    plan.sections.length > 0 ? plan.sections[0].title : ''
  );
  
  // Format the date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  return (
    <div className="export-plan">
      <div className="plan-header">
        <h2>Your Export Plan</h2>
        <p className="plan-date">Generated on {formatDate(plan.generated_at)}</p>
      </div>
      
      <div className="plan-content">
        <div className="plan-navigation">
          <ul>
            {plan.sections.map((section) => (
              <li
                key={section.title}
                className={activeSection === section.title ? 'active' : ''}
                onClick={() => setActiveSection(section.title)}
              >
                {section.title}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="plan-section-content">
          {plan.sections.map((section) => (
            <div
              key={section.title}
              className={`plan-section ${activeSection === section.title ? 'active' : ''}`}
            >
              <h3>{section.title}</h3>
              <div className="section-body">
                {section.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="plan-actions">
        <button
          className="action-button print-button"
          onClick={() => window.print()}
        >
          Print Plan
        </button>
        <button
          className="action-button download-button"
          onClick={() => {
            // In a real implementation, this would generate and download a PDF
            alert('In a real implementation, this would download a PDF of your export plan.');
          }}
        >
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default ExportPlan; 