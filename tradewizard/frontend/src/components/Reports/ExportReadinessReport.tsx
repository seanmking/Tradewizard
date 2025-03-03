import React from 'react';
import './ExportReadinessReport.css';

interface MarketData {
  market_size: string;
  growth_rate: string;
  key_trends: string[];
  regulatory_requirements: string[];
}

interface MarketInsights {
  [key: string]: MarketData;
}

interface ExportReadinessReportProps {
  userData: Record<string, any>;
  onClose: () => void;
  onGoToDashboard?: () => void;
}

const ExportReadinessReport: React.FC<ExportReadinessReportProps> = ({ userData, onClose, onGoToDashboard }) => {
  // Mock data for the report
  const reportData = {
    companyName: userData.companyName || 'Global Fresh SA',
    selectedMarkets: userData.selectedMarkets || ['European Union', 'United Arab Emirates'],
    strengths: [
      'HACCP Level 1 certification',
      'Premium product positioning',
      'Sustainable packaging initiatives',
      'Unique South African flavor profiles'
    ],
    areas_for_improvement: [
      'ISO 22000 certification (in progress)',
      'EU labeling compliance',
      'Halal certification for UAE market',
      'Export documentation processes'
    ],
    next_steps: [
      {
        title: 'Complete ISO 22000 certification',
        description: 'Finalize the ISO 22000 certification process to strengthen food safety credentials for EU market entry.',
        timeframe: '3-6 months'
      },
      {
        title: 'Obtain Halal certification',
        description: 'Pursue Halal certification for products targeting the UAE market.',
        timeframe: '2-4 months'
      },
      {
        title: 'Update packaging for EU compliance',
        description: 'Revise product labels to meet EU regulations including nutrition facts, allergen information, and language requirements.',
        timeframe: '1-2 months'
      },
      {
        title: 'Establish export documentation process',
        description: 'Develop standardized procedures for managing export documentation including certificates of origin, phytosanitary certificates, and commercial invoices.',
        timeframe: '1 month'
      }
    ],
    market_insights: {
      'European Union': {
        market_size: '€42.7 billion (dried fruits & nuts)',
        growth_rate: '5.8% annually',
        key_trends: [
          'Growing demand for ethically-sourced products',
          'Premium positioning for exotic dried fruits',
          'Increasing interest in sustainable packaging',
          'Rising consumer awareness of health benefits'
        ],
        regulatory_requirements: [
          'EU Food Safety Regulations (EC 178/2002)',
          'Packaging and labeling directives',
          'Maximum residue levels compliance',
          'Sustainability reporting for larger operations'
        ]
      },
      'United Arab Emirates': {
        market_size: '$1.2 billion (dried fruits & nuts)',
        growth_rate: '7.2% annually',
        key_trends: [
          'Premium imported food products gaining market share',
          'Strong demand for healthy snacking options',
          'Growing retail sector with international chains',
          'Increasing focus on food security and quality imports'
        ],
        regulatory_requirements: [
          'Halal certification',
          'UAE.S GSO 9/2013 labeling standard',
          'Food import permits',
          'Product registration with municipalities'
        ]
      }
    } as MarketInsights
  };

  return (
    <div className="report-modal">
      <div className="report-container">
        <div className="report-header">
          <h1>Export Readiness Report</h1>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="report-content">
          <div className="report-section company-overview">
            <h2>Company Overview</h2>
            <p><strong>Company:</strong> {reportData.companyName}</p>
            <p><strong>Target Markets:</strong> {reportData.selectedMarkets.join(', ')}</p>
          </div>
          
          <div className="report-section strengths-weaknesses">
            <div className="strengths">
              <h3>Strengths</h3>
              <ul>
                {reportData.strengths.map((strength: string, index: number) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
            <div className="areas-improvement">
              <h3>Areas for Improvement</h3>
              <ul>
                {reportData.areas_for_improvement.map((area: string, index: number) => (
                  <li key={index}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="report-section market-insights">
            <h2>Market Insights</h2>
            {reportData.selectedMarkets.map((market: string) => {
              const marketData = reportData.market_insights[market];
              return (
                <div className="market-card" key={market}>
                  <h3>{market}</h3>
                  <div className="market-stats">
                    <div className="stat">
                      <span className="stat-label">Market Size</span>
                      <span className="stat-value">{marketData.market_size}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Growth Rate</span>
                      <span className="stat-value">{marketData.growth_rate}</span>
                    </div>
                  </div>
                  
                  <div className="market-details">
                    <div className="trends">
                      <h4>Key Trends</h4>
                      <ul>
                        {marketData.key_trends.map((trend: string, index: number) => (
                          <li key={index}>{trend}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="regulations">
                      <h4>Regulatory Requirements</h4>
                      <ul>
                        {marketData.regulatory_requirements.map((req: string, index: number) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="report-section next-steps">
            <h2>Recommended Next Steps</h2>
            <div className="steps-timeline">
              {reportData.next_steps.map((step, index) => (
                <div className="step-item" key={index}>
                  <div className="step-number">{index + 1}</div>
                  <div className="step-content">
                    <h4>{step.title}</h4>
                    <p>{step.description}</p>
                    <span className="timeframe">Timeframe: {step.timeframe}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="report-footer">
          <button className="download-pdf-button">Download PDF Report</button>
          {onGoToDashboard ? (
            <button className="go-to-dashboard-button" onClick={onGoToDashboard}>
              Go to your Dashboard
            </button>
          ) : (
            <button className="close-report-button" onClick={onClose}>Close Report</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportReadinessReport; 