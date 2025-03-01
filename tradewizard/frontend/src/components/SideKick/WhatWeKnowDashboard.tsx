import React, { useState } from 'react';
import { Dashboard } from '../../services/sidekick';
import './WhatWeKnowDashboard.css';

interface WhatWeKnowDashboardProps {
  dashboard: Dashboard;
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
  
  const [selectedMarket, setSelectedMarket] = useState<string>(
    Object.keys(dashboard.market_intelligence)[0] || ''
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
                <div className="info-value">{dashboard.company_info.company_name}</div>
                {renderConfidenceIndicator(dashboard.company_info.confidence_scores.company_name || 0)}
              </div>
              
              <div className="info-row">
                <div className="info-label">Business Type</div>
                <div className="info-value">{dashboard.company_info.business_type}</div>
                {renderConfidenceIndicator(dashboard.company_info.confidence_scores.business_type || 0)}
              </div>
              
              <div className="info-row">
                <div className="info-label">Products</div>
                <div className="info-value">
                  <ul className="product-list">
                    {dashboard.company_info.products.map((product, index) => (
                      <li key={index}>
                        <strong>{product.name}</strong>
                        {product.description && <span> - {product.description}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                {renderConfidenceIndicator(dashboard.company_info.confidence_scores.products || 0)}
              </div>
              
              <div className="info-row">
                <div className="info-label">Capabilities</div>
                <div className="info-value">
                  <ul className="capabilities-list">
                    {dashboard.company_info.capabilities.production_capacity && (
                      <li>
                        <strong>Production Capacity:</strong>{' '}
                        {dashboard.company_info.capabilities.production_capacity}
                      </li>
                    )}
                    
                    {dashboard.company_info.capabilities.certifications && (
                      <li>
                        <strong>Certifications:</strong>{' '}
                        {dashboard.company_info.capabilities.certifications.join(', ')}
                      </li>
                    )}
                    
                    {dashboard.company_info.capabilities.current_markets && (
                      <li>
                        <strong>Current Markets:</strong>{' '}
                        {dashboard.company_info.capabilities.current_markets.join(', ')}
                      </li>
                    )}
                    
                    {dashboard.company_info.capabilities.current_retailers && (
                      <li>
                        <strong>Current Retailers:</strong>{' '}
                        {dashboard.company_info.capabilities.current_retailers.join(', ')}
                      </li>
                    )}
                  </ul>
                </div>
                {renderConfidenceIndicator(dashboard.company_info.confidence_scores.capabilities || 0)}
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
            {Object.keys(dashboard.market_intelligence).length > 0 ? (
              <>
                <div className="market-selector">
                  {Object.keys(dashboard.market_intelligence).map((market) => (
                    <button
                      key={market}
                      className={`market-button ${selectedMarket === market ? 'active' : ''}`}
                      onClick={() => setSelectedMarket(market)}
                    >
                      {market}
                    </button>
                  ))}
                </div>
                
                {selectedMarket && dashboard.market_intelligence[selectedMarket] && (
                  <div className="info-card">
                    <div className="market-header">
                      <h4>{dashboard.market_intelligence[selectedMarket].country}</h4>
                      <div className="market-stats">
                        <div className="stat">
                          <span className="stat-label">Population:</span>
                          <span className="stat-value">
                            {dashboard.market_intelligence[selectedMarket].population}
                          </span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">GDP per Capita:</span>
                          <span className="stat-value">
                            {dashboard.market_intelligence[selectedMarket].gdp_per_capita}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">Market Overview</div>
                      <div className="info-value">
                        {dashboard.market_intelligence[selectedMarket].market_overview}
                      </div>
                      {renderConfidenceIndicator(
                        dashboard.market_intelligence[selectedMarket].confidence_scores.market_overview || 0
                      )}
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">Distribution Channels</div>
                      <div className="info-value">
                        <ul>
                          {dashboard.market_intelligence[selectedMarket].distribution_channels.map(
                            (channel, index) => (
                              <li key={index}>{channel}</li>
                            )
                          )}
                        </ul>
                      </div>
                      {renderConfidenceIndicator(
                        dashboard.market_intelligence[selectedMarket].confidence_scores.distribution_channels || 0
                      )}
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">Consumer Preferences</div>
                      <div className="info-value">
                        <ul>
                          {dashboard.market_intelligence[selectedMarket].consumer_preferences.map(
                            (preference, index) => (
                              <li key={index}>{preference}</li>
                            )
                          )}
                        </ul>
                      </div>
                      {renderConfidenceIndicator(
                        dashboard.market_intelligence[selectedMarket].confidence_scores.consumer_preferences || 0
                      )}
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">Tariffs</div>
                      <div className="info-value">
                        <ul>
                          {Object.entries(dashboard.market_intelligence[selectedMarket].tariffs).map(
                            ([product, tariff], index) => (
                              <li key={index}>
                                <strong>{product}:</strong> {tariff}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      {renderConfidenceIndicator(
                        dashboard.market_intelligence[selectedMarket].confidence_scores.tariffs || 0
                      )}
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">Competitors</div>
                      <div className="info-value">
                        <div className="competitors-grid">
                          {dashboard.market_intelligence[selectedMarket].competitors.map(
                            (competitor, index) => (
                              <div key={index} className="competitor-card">
                                <div className="competitor-name">{competitor.name}</div>
                                <div className="competitor-detail">
                                  <strong>Origin:</strong> {competitor.origin}
                                </div>
                                <div className="competitor-detail">
                                  <strong>Market Share:</strong> {competitor.market_share}
                                </div>
                                <div className="competitor-detail">
                                  <strong>Strengths:</strong>{' '}
                                  {competitor.strengths.join(', ')}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                      {renderConfidenceIndicator(
                        dashboard.market_intelligence[selectedMarket].confidence_scores.competitors || 0
                      )}
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
            {Object.keys(dashboard.regulatory_requirements).length > 0 ? (
              <>
                <div className="market-selector">
                  {Object.keys(dashboard.regulatory_requirements).map((market) => (
                    <button
                      key={market}
                      className={`market-button ${selectedMarket === market ? 'active' : ''}`}
                      onClick={() => setSelectedMarket(market)}
                    >
                      {market}
                    </button>
                  ))}
                </div>
                
                {selectedMarket && dashboard.regulatory_requirements[selectedMarket] && (
                  <div className="info-card">
                    <div className="regulatory-header">
                      <h4>
                        {dashboard.regulatory_requirements[selectedMarket].country} -{' '}
                        {dashboard.regulatory_requirements[selectedMarket].product_category}
                      </h4>
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">Documentation Requirements</div>
                      <div className="info-value">
                        <ul className="documentation-list">
                          {dashboard.regulatory_requirements[selectedMarket].documentation_requirements.map(
                            (doc, index) => (
                              <li key={index}>
                                <strong>{doc.document}</strong>
                                <div className="doc-details">
                                  <span>Issuing Authority: {doc.issuing_authority}</span>
                                  <span>Description: {doc.description}</span>
                                </div>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      {renderConfidenceIndicator(
                        dashboard.regulatory_requirements[selectedMarket].confidence_scores
                          .documentation_requirements || 0
                      )}
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">Labeling Requirements</div>
                      <div className="info-value">
                        <ul>
                          {dashboard.regulatory_requirements[selectedMarket].labeling_requirements.map(
                            (requirement, index) => (
                              <li key={index}>{requirement}</li>
                            )
                          )}
                        </ul>
                      </div>
                      {renderConfidenceIndicator(
                        dashboard.regulatory_requirements[selectedMarket].confidence_scores
                          .labeling_requirements || 0
                      )}
                    </div>
                    
                    <div className="info-row">
                      <div className="info-label">Import Procedures</div>
                      <div className="info-value">
                        <ol>
                          {dashboard.regulatory_requirements[selectedMarket].import_procedures.map(
                            (procedure, index) => (
                              <li key={index}>{procedure}</li>
                            )
                          )}
                        </ol>
                      </div>
                      {renderConfidenceIndicator(
                        dashboard.regulatory_requirements[selectedMarket].confidence_scores
                          .import_procedures || 0
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-data-message">No regulatory requirements available</div>
            )}
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