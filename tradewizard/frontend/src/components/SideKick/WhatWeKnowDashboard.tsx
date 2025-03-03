import React, { useState } from 'react';
import { SimplifiedDashboard, SimplifiedMarket } from '../../services/simplifiedSidekick';
import './WhatWeKnowDashboard.css';

interface WhatWeKnowDashboardProps {
  dashboard: SimplifiedDashboard;
  onProceed: () => void;
  isLoading: boolean;
}

const WhatWeKnowDashboard: React.FC<WhatWeKnowDashboardProps> = ({
  dashboard,
  onProceed,
  isLoading,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    company: true,
    market: false,
    regulatory: false,
  });
  
  // Get the first market from potential_markets array
  const potentialMarkets = dashboard.market_intelligence.potential_markets;
  const [selectedMarket, setSelectedMarket] = useState<string>(
    potentialMarkets.length > 0 ? potentialMarkets[0].name : ''
  );
  
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };
  
  const renderConfidenceIndicator = (score: number) => {
    let className = 'confidence-indicator';
    let label = '';
    
    if (score >= 0.9) {
      className += ' high';
      label = 'High Confidence';
    } else if (score >= 0.7) {
      className += ' medium';
      label = 'Medium Confidence';
    } else {
      className += ' low';
      label = 'Low Confidence';
    }
    
    return (
      <div className={className}>
        <div className="confidence-bar" style={{ width: `${score * 100}%` }}></div>
        <span className="confidence-label">{label}</span>
      </div>
    );
  };

  // Find the selected market object
  const selectedMarketData = potentialMarkets.find(market => market.name === selectedMarket);
  
  return (
    <div className="what-we-know-dashboard">
      <h2>What We Think We Know</h2>
      <p className="dashboard-description">
        Based on our analysis, here's what we've gathered about your business and export opportunities.
        Please review this information and proceed when you're ready to verify it.
      </p>
      
      {/* Company Information Section */}
      <div className={`dashboard-section ${expandedSections.company ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('company')}>
          <h3>Business Information</h3>
          <div className="expand-icon">{expandedSections.company ? '−' : '+'}</div>
        </div>
        
        {expandedSections.company && (
          <div className="section-content">
            <div className="info-card">
              <div className="info-row">
                <div className="info-label">Company Name</div>
                <div className="info-value">{dashboard.company_info.name}</div>
                {renderConfidenceIndicator(dashboard.company_info.confidence_score)}
              </div>
              
              <div className="info-row">
                <div className="info-label">Business Type</div>
                <div className="info-value">{dashboard.company_info.business_type}</div>
                {renderConfidenceIndicator(dashboard.company_info.confidence_score)}
              </div>
              
              <div className="info-row">
                <div className="info-label">Products</div>
                <div className="info-value">
                  <ul className="product-list">
                    {dashboard.company_info.products.map((product, index) => (
                      <li key={index}>{product}</li>
                    ))}
                  </ul>
                </div>
                {renderConfidenceIndicator(dashboard.company_info.confidence_score)}
              </div>
              
              <div className="info-row">
                <div className="info-label">Capabilities</div>
                <div className="info-value">
                  <ul className="capabilities-list">
                    {dashboard.company_info.capabilities.map((capability, index) => (
                      <li key={index}>{capability}</li>
                    ))}
                  </ul>
                </div>
                {renderConfidenceIndicator(dashboard.company_info.confidence_score)}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Market Intelligence Section */}
      <div className={`dashboard-section ${expandedSections.market ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('market')}>
          <h3>Market Intelligence</h3>
          <div className="expand-icon">{expandedSections.market ? '−' : '+'}</div>
        </div>
        
        {expandedSections.market && (
          <div className="section-content">
            {potentialMarkets.length > 0 ? (
              <>
                <div className="market-selector">
                  {potentialMarkets.map((market) => (
                    <button
                      key={market.name}
                      className={`market-button ${selectedMarket === market.name ? 'active' : ''}`}
                      onClick={() => setSelectedMarket(market.name)}
                    >
                      {market.name}
                    </button>
                  ))}
                </div>
                
                {selectedMarketData && (
                  <div className="info-card">
                    <div className="market-header">
                      <h4>{selectedMarketData.name}</h4>
                      <div className="market-stats">
                        <div className="stat">
                          <span className="stat-label">Market Size:</span>
                          <span className="stat-value">
                            {selectedMarketData.market_size}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Growth Rate:</span>
                          <span className="stat-value">
                            {selectedMarketData.growth_rate}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">Competitors</div>
                      <div className="info-value">
                        <div className="competitors-grid">
                          {selectedMarketData.competitors.map(
                            (competitor, index) => (
                              <div key={index} className="competitor-card">
                                <div className="competitor-name">{competitor.name}</div>
                                <div className="competitor-detail">
                                  <strong>Market Share:</strong> {competitor.market_share}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      {renderConfidenceIndicator(selectedMarketData.confidence_score)}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-data-message">No market intelligence available</div>
            )}
          </div>
        )}
      </div>
      
      {/* Regulatory Requirements Section */}
      <div className={`dashboard-section ${expandedSections.regulatory ? 'expanded' : ''}`}>
        <div className="section-header" onClick={() => toggleSection('regulatory')}>
          <h3>Regulatory Requirements</h3>
          <div className="expand-icon">{expandedSections.regulatory ? '−' : '+'}</div>
        </div>
        
        {expandedSections.regulatory && (
          <div className="section-content">
            <div className="info-card">
              <div className="info-row">
                <div className="info-label">Certifications</div>
                <div className="info-value">
                  <ul className="certification-list">
                    {dashboard.regulatory_requirements.certifications.map(
                      (certification, index) => (
                        <li key={index}>{certification}</li>
                      )
                    )}
                  </ul>
                </div>
                {renderConfidenceIndicator(dashboard.regulatory_requirements.confidence_score)}
              </div>
              
              <div className="info-row">
                <div className="info-label">Import Duties</div>
                <div className="info-value">
                  {dashboard.regulatory_requirements.import_duties}
                </div>
                {renderConfidenceIndicator(dashboard.regulatory_requirements.confidence_score)}
              </div>
              
              <div className="info-row">
                <div className="info-label">Documentation</div>
                <div className="info-value">
                  <ul>
                    {dashboard.regulatory_requirements.documentation.map(
                      (doc, index) => (
                        <li key={index}>{doc}</li>
                      )
                    )}
                  </ul>
                </div>
                {renderConfidenceIndicator(dashboard.regulatory_requirements.confidence_score)}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="dashboard-actions">
        <button
          className="primary-button"
          onClick={onProceed}
          disabled={isLoading}
        >
          Proceed to Verification
        </button>
      </div>
    </div>
  );
};

export default WhatWeKnowDashboard; 