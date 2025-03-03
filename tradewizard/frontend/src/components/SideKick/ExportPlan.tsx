import React, { useState } from 'react';
import { SimplifiedExportPlanType } from '../../services/simplifiedSidekick';
import './ExportPlan.css';

interface ExportPlanProps {
  plan: SimplifiedExportPlanType;
}

const ExportPlan: React.FC<ExportPlanProps> = ({ plan }) => {
  // Get the first section title as the default active section
  const sectionTitles = Object.keys(plan.sections);
  const [activeSection, setActiveSection] = useState<string>(
    sectionTitles.length > 0 ? sectionTitles[0] : ''
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
        <h1>{plan.title}</h1>
        <p className="plan-date">Generated on {formatDate(plan.generated_at)}</p>
      </div>
      
      <div className="plan-content">
        <div className="plan-navigation">
          <h3>Sections</h3>
          <ul>
            {sectionTitles.map((sectionTitle) => (
              <li 
                key={sectionTitle}
                className={activeSection === sectionTitle ? 'active' : ''}
                onClick={() => setActiveSection(sectionTitle)}
              >
                {sectionTitle.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="plan-section-content">
          <h2>{activeSection.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
          <div className="section-text">
            {plan.sections[activeSection as keyof typeof plan.sections].split('\n\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
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