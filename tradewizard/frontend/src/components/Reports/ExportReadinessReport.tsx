import React, { useState, useEffect } from 'react';
import './ExportReadinessReport.css';
import MarketService, { MarketData } from '../../services/MarketService';

interface ExportReadinessReportProps {
  userData: Record<string, any>;
  onClose: () => void;
  onGoToDashboard?: () => void;
}

const ExportReadinessReport: React.FC<ExportReadinessReportProps> = ({ userData, onClose, onGoToDashboard }) => {
  const [marketInsights, setMarketInsights] = useState<{ [key: string]: MarketData }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMarketsList, setSelectedMarketsList] = useState<string[]>([]);

  useEffect(() => {
    const loadMarketData = async () => {
      setLoading(true);
      
      // Determine which markets to load
      let selectedMarkets = [];
      
      // Handle different ways the selected markets could be stored
      if (userData.selectedMarkets && Array.isArray(userData.selectedMarkets)) {
        selectedMarkets = userData.selectedMarkets;
      } else if (userData.selected_markets) {
        // Handle if it's a string that needs parsing
        if (typeof userData.selected_markets === 'string') {
          try {
            selectedMarkets = JSON.parse(userData.selected_markets);
          } catch {
            selectedMarkets = userData.selected_markets.split(',').map((m: string) => m.trim());
          }
        } else if (Array.isArray(userData.selected_markets)) {
          selectedMarkets = userData.selected_markets;
        }
      }
      
      // Log for debugging
      console.log('Selected markets to load:', selectedMarkets);
      
      if (selectedMarkets.length === 0) {
        // Default markets for testing if none are selected
        selectedMarkets = ['United Kingdom', 'United States', 'European Union', 'United Arab Emirates'];
      }
      
      // Store the selected markets in state regardless of API success
      setSelectedMarketsList(selectedMarkets);
      
      try {
        // Fetch data for all selected markets using the MarketService
        const insights = await MarketService.fetchMultipleMarkets(selectedMarkets);
        console.log('Fetched market insights:', insights);
        setMarketInsights(insights);
      } catch (error) {
        console.error('Error loading market data:', error);
        // Set a default error state
        setMarketInsights({
          'Error': {
            market_size: 'Failed to load data',
            growth_rate: 'Failed to load data',
            key_trends: ['Please try again later'],
            regulatory_requirements: ['Data unavailable']
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadMarketData();
  }, [userData]);

  // Mock data for the report (non-market data still hard-coded for now)
  const reportData = {
    companyName: userData.companyName || 'Global Fresh SA',
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
    ]
  };

  // Determine which markets to display (use the keys from the fetched insights)
  const selectedMarkets = Object.keys(marketInsights);

  if (loading) {
    return (
      <div className="export-readiness-report">
        <h1>Loading Market Insights...</h1>
        <p>Please wait while we prepare your Export Readiness Report.</p>
      </div>
    );
  }

  return (
    <div className="export-readiness-report">
      <div className="report-header">
        <h1>Export Readiness Report</h1>
        <div className="company-info">
          <h2>{reportData.companyName}</h2>
          <p>Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="report-section">
        <h3>Selected Markets</h3>
        <div className="markets-list">
          {selectedMarketsList.length > 0 ? (
            selectedMarketsList.map((market, index) => (
              <div key={index} className="market-item">
                <span className="market-name">{market}</span>
              </div>
            ))
          ) : (
            <p>No markets selected</p>
          )}
        </div>
      </div>

      <div className="report-section">
        <h3>Export Readiness Assessment</h3>
        <div className="assessment-grid">
          <div className="assessment-column">
            <h4>Strengths</h4>
            <ul>
              {reportData.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>
          <div className="assessment-column">
            <h4>Areas for Improvement</h4>
            <ul>
              {reportData.areas_for_improvement.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h3>Market Insights</h3>
        {Object.keys(marketInsights).length > 0 ? (
          <div className="market-insights">
            {Object.keys(marketInsights).map((market, index) => (
              <div key={index} className="market-insight-card">
                <h4>{market}</h4>
                <div className="market-data">
                  {marketInsights[market]?.market_overview && (
                    <>
                      <div className="data-row">
                        <span className="data-label">Population:</span>
                        <span className="data-value">{marketInsights[market]?.market_overview?.population || 'N/A'}</span>
                      </div>
                      <div className="data-row">
                        <span className="data-label">GDP:</span>
                        <span className="data-value">{marketInsights[market]?.market_overview?.gdp || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  
                  {marketInsights[market]?.food_market_data && (
                    <>
                      <div className="data-row">
                        <span className="data-label">Market Size:</span>
                        <span className="data-value">{marketInsights[market]?.food_market_data?.market_size || 'N/A'}</span>
                      </div>
                      <div className="data-row">
                        <span className="data-label">Growth Rate:</span>
                        <span className="data-value">{marketInsights[market]?.food_market_data?.growth_rate || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Fallback to legacy fields if needed */}
                  {!marketInsights[market]?.food_market_data && (
                    <>
                      <div className="data-row">
                        <span className="data-label">Market Size:</span>
                        <span className="data-value">{marketInsights[market]?.market_size || 'N/A'}</span>
                      </div>
                      <div className="data-row">
                        <span className="data-label">Growth Rate:</span>
                        <span className="data-value">{marketInsights[market]?.growth_rate || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="data-section">
                    <span className="data-label">Key Trends:</span>
                    <ul>
                      {(() => {
                        // Get trends from either source
                        const trends = marketInsights[market]?.key_trends || 
                          (marketInsights[market]?.food_market_data?.key_trends) || [];
                        
                        if (trends && trends.length > 0) {
                          return trends.slice(0, 4).map((trend: any, i: number) => (
                            <li key={i}>{typeof trend === 'string' ? trend : JSON.stringify(trend)}</li>
                          ));
                        }
                        return <li>No trend data available</li>;
                      })()}
                    </ul>
                  </div>
                  
                  <div className="data-section">
                    <span className="data-label">Regulatory Requirements:</span>
                    <ul>
                      {(() => {
                        // Get regulatory requirements from various possible sources
                        const reqs = marketInsights[market]?.regulatory_requirements || 
                          (marketInsights[market]?.regulatory_environment?.import_regulations) || [];
                        
                        if (reqs && reqs.length > 0) {
                          return reqs.slice(0, 4).map((req: any, i: number) => (
                            <li key={i}>{typeof req === 'string' ? req : JSON.stringify(req)}</li>
                          ));
                        }
                        return <li>No regulatory data available</li>;
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="error-message">
            <p className="notice-title">Market Data Temporarily Unavailable</p>
            <p>We're currently unable to access detailed market intelligence for your selected markets:</p>
            <p className="selected-markets-list">{selectedMarketsList.join(', ')}</p>
            <p>Our team is working to restore this data, and we'll update your dashboard with the complete market insights at our earliest convenience.</p>
            <p>In the meantime, you can still review your export readiness assessment and recommended next steps below.</p>
          </div>
        )}
      </div>

      <div className="report-section">
        <h3>Recommended Next Steps</h3>
        <div className="next-steps">
          {reportData.next_steps.map((step, index) => (
            <div key={index} className="next-step-card">
              <div className="next-step-header">
                <h4>{step.title}</h4>
                <span className="timeframe">{step.timeframe}</span>
              </div>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="promotional-message">
        <p>
          Ready to take your South African exports to the next level? 
          Our team of trade specialists can help you navigate international markets with confidence.
          <strong> Upgrade to Trade King Premium for personalized market analysis and export support services.</strong>
        </p>
      </div>

      <div className="report-footer">
        <div className="button-container">
          <button className="close-button" onClick={onClose}>Back to Assessment</button>
          {onGoToDashboard && (
            <button className="dashboard-button" onClick={onGoToDashboard}>Go to Dashboard</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportReadinessReport; 