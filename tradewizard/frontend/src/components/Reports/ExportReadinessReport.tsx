import React, { useState, useEffect } from 'react';
import './ExportReadinessReport.css';
import MarketService, { MarketData } from '../../services/MarketService';

interface ExportReadinessReportProps {
  userData: Record<string, any>;
  onClose: () => void;
  onGoToDashboard?: () => void;
  standalone?: boolean;
}

// Helper function to safely render any value as a string
const safeRender = (value: any): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }
  if (typeof value === 'object') {
    // Handle objects with confidence and text properties
    if (value.text !== undefined) {
      return value.text.toString();
    }
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => safeRender(item)).join(', ');
    }
    // Handle other objects
    return JSON.stringify(value);
  }
  return String(value);
};

const ExportReadinessReport: React.FC<ExportReadinessReportProps> = ({ 
  userData, 
  onClose, 
  onGoToDashboard,
  standalone = false
}) => {
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

  // Function to handle printing the report
  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const reportContent = document.querySelector('.export-readiness-report')?.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Export Readiness Report - ${reportData.companyName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            .report-header {
              padding: 20px;
              background-color: #4f46e5;
              color: white;
              margin-bottom: 20px;
            }
            .report-section {
              margin-bottom: 30px;
            }
            .report-section h3 {
              color: #4f46e5;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 10px;
            }
            .assessment-grid {
              display: flex;
              gap: 20px;
            }
            .assessment-column {
              flex: 1;
            }
            .market-insights {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 20px;
            }
            .market-insight-card {
              border: 1px solid #e0e0e0;
              padding: 15px;
              border-radius: 8px;
            }
            .next-steps {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 20px;
            }
            .next-step-card {
              border: 1px solid #e0e0e0;
              padding: 15px;
              border-radius: 8px;
            }
            .timeframe {
              display: inline-block;
              background-color: #ebf4ff;
              color: #4f46e5;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 14px;
            }
            @media print {
              body {
                font-size: 12pt;
              }
              .report-header {
                background-color: #4f46e5 !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Add a slight delay to ensure content is loaded before printing
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <div className={`export-readiness-report ${standalone ? 'standalone-report' : ''}`}>
        <h1>Loading Market Insights...</h1>
        <p>Please wait while we prepare your Export Readiness Report.</p>
      </div>
    );
  }

  return (
    <div className={`export-readiness-report ${standalone ? 'standalone-report' : ''}`}>
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
                <span className="market-name">{safeRender(market)}</span>
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
            <ul className="strengths-list">
              {reportData.strengths.map((strength, index) => (
                <li key={index}>{safeRender(strength)}</li>
              ))}
            </ul>
          </div>
          <div className="assessment-column">
            <h4>Areas for Improvement</h4>
            <ul className="improvement-list">
              {reportData.areas_for_improvement.map((area, index) => (
                <li key={index}>{safeRender(area)}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h3>Export Goals</h3>
        <div className="export-goals-container">
          <div className="export-goals-content">
            <p className="export-vision">
              <strong>Our Vision:</strong> To share South Africa's unique flavors and premium food products with the global market, 
              particularly focusing on reaching the South African diaspora who cherish authentic tastes from home.
            </p>
            <p>
              With our exceptional product quality and distinctive South African flavor profiles, we aim to establish 
              Global Fresh SA as a recognized brand in international markets. By leveraging our sustainable packaging initiatives 
              and premium positioning, we will create export channels that not only drive business growth but also 
              connect South Africans abroad with the authentic tastes they miss.
            </p>
            <div className="export-goals-highlights">
              <div className="goal-highlight">
                <span className="goal-icon">🌍</span>
                <span className="goal-text">Connect with South African diaspora communities</span>
              </div>
              <div className="goal-highlight">
                <span className="goal-icon">🌱</span>
                <span className="goal-text">Promote sustainable South African food products globally</span>
              </div>
              <div className="goal-highlight">
                <span className="goal-icon">🚀</span>
                <span className="goal-text">Establish premium positioning in selected international markets</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="report-section">
        <h3>Market Insights</h3>
        {Object.keys(marketInsights).length > 0 ? (
          <div className="market-insights">
            {Object.keys(marketInsights).map((market, index) => (
              <div key={index} className="market-insight-card">
                <h4>{safeRender(market)}</h4>
                <div className="market-data">
                  {/* Diaspora Information */}
                  <div className="data-section diaspora-section">
                    <span className="data-label">South African Diaspora:</span>
                    <div className="diaspora-info">
                      {market === 'United Kingdom' && (
                        <p>Approximately 220,000 South Africans live in the UK, with major communities in London, Manchester, and Edinburgh.</p>
                      )}
                      {market === 'United Arab Emirates' && (
                        <p>Around 100,000 South Africans reside in the UAE, primarily in Dubai and Abu Dhabi, forming one of the largest expat communities.</p>
                      )}
                      {market === 'United States' && (
                        <p>An estimated 85,000 South Africans live in the US, with significant communities in New York, California, and Texas.</p>
                      )}
                      {market === 'European Union' && (
                        <p>Over 150,000 South Africans are spread across EU countries, with notable communities in the Netherlands, Germany, and Portugal.</p>
                      )}
                      {!['United Kingdom', 'United Arab Emirates', 'United States', 'European Union'].includes(market) && (
                        <p>South African diaspora data not available for this market.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Market Overview */}
                  {marketInsights[market]?.market_overview && (
                    <>
                      <div className="data-row">
                        <span className="data-label">Population:</span>
                        <span className="data-value">{safeRender(marketInsights[market]?.market_overview?.population) || 'N/A'}</span>
                      </div>
                      <div className="data-row">
                        <span className="data-label">GDP:</span>
                        <span className="data-value">{safeRender(marketInsights[market]?.market_overview?.gdp) || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Food Market Data */}
                  {marketInsights[market]?.food_market_data && (
                    <>
                      <div className="data-row">
                        <span className="data-label">Market Size:</span>
                        <span className="data-value">{safeRender(marketInsights[market]?.food_market_data?.market_size) || 'N/A'}</span>
                      </div>
                      <div className="data-row">
                        <span className="data-label">Growth Rate:</span>
                        <span className="data-value">{safeRender(marketInsights[market]?.food_market_data?.growth_rate) || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Fallback to legacy fields if needed */}
                  {!marketInsights[market]?.food_market_data && (
                    <>
                      <div className="data-row">
                        <span className="data-label">Market Size:</span>
                        <span className="data-value">{safeRender(marketInsights[market]?.market_size) || 'N/A'}</span>
                      </div>
                      <div className="data-row">
                        <span className="data-label">Growth Rate:</span>
                        <span className="data-value">{safeRender(marketInsights[market]?.growth_rate) || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Market Opportunities Section */}
                  <div className="data-section">
                    <span className="data-label">Market Opportunities:</span>
                    <div className="market-opportunities">
                      {market === 'United Kingdom' && (
                        <ul>
                          <li><strong>Specialty Food Stores:</strong> Growing demand for South African products in specialty stores frequented by expatriates.</li>
                          <li><strong>Gift Packaging:</strong> Opportunity to market products as gift packages for South Africans to send to family and friends.</li>
                          <li><strong>Online Retail:</strong> Strong e-commerce market allows for direct-to-consumer sales to diaspora communities.</li>
                        </ul>
                      )}
                      {market === 'United Arab Emirates' && (
                        <ul>
                          <li><strong>Premium Positioning:</strong> High-income South African expatriates seeking premium products from home.</li>
                          <li><strong>Cultural Events:</strong> Opportunities to showcase products at South African cultural events in Dubai and Abu Dhabi.</li>
                          <li><strong>Luxury Gift Market:</strong> Potential for high-end gift packages featuring South African delicacies.</li>
                        </ul>
                      )}
                      {market === 'United States' && (
                        <ul>
                          <li><strong>Ethnic Food Sections:</strong> Growing presence of international foods in mainstream supermarkets.</li>
                          <li><strong>Subscription Boxes:</strong> Potential for "Taste of South Africa" subscription services targeting diaspora.</li>
                          <li><strong>Health Food Market:</strong> Position South African products within the growing health food segment.</li>
                        </ul>
                      )}
                      {market === 'European Union' && (
                        <ul>
                          <li><strong>Sustainable Packaging:</strong> Leverage your sustainable initiatives to appeal to environmentally conscious European consumers.</li>
                          <li><strong>Diaspora Networks:</strong> Utilize South African community networks for product distribution and marketing.</li>
                          <li><strong>African Cuisine Trend:</strong> Growing interest in authentic African flavors among European consumers.</li>
                        </ul>
                      )}
                      {!['United Kingdom', 'United Arab Emirates', 'United States', 'European Union'].includes(market) && (
                        <ul>
                          <li>Market opportunity data not available for this region.</li>
                        </ul>
                      )}
                    </div>
                  </div>
                  
                  {/* Key Trends Section */}
                  <div className="data-section">
                    <span className="data-label">Key Trends:</span>
                    <ul>
                      {(() => {
                        // Get trends from either source
                        const trends = marketInsights[market]?.key_trends || 
                          (marketInsights[market]?.food_market_data?.key_trends) || [];
                        
                        if (trends && trends.length > 0) {
                          return trends.slice(0, 4).map((trend: any, i: number) => (
                            <li key={i}>{safeRender(trend)}</li>
                          ));
                        }
                        return <li>No trend data available</li>;
                      })()}
                    </ul>
                  </div>
                  
                  {/* Regulatory Requirements Section */}
                  <div className="data-section">
                    <span className="data-label">Regulatory Requirements:</span>
                    <ul>
                      {(() => {
                        // Get regulatory requirements from various possible sources
                        const reqs = marketInsights[market]?.regulatory_requirements || 
                          (marketInsights[market]?.regulatory_environment?.import_regulations) || [];
                        
                        if (reqs && reqs.length > 0) {
                          return reqs.slice(0, 4).map((req: any, i: number) => (
                            <li key={i}>{safeRender(req)}</li>
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
                <h4>{safeRender(step.title)}</h4>
                <span className="timeframe">{safeRender(step.timeframe)}</span>
              </div>
              <p>{safeRender(step.description)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="promotional-message">
        <p>
          Would you like to continue to your dashboard to explore more market insights?
        </p>
      </div>

      <div className="report-footer">
        <div className="button-container">
          {!standalone && (
            <button className="close-button" onClick={onClose}>Back to Assessment</button>
          )}
          <button className="print-button" onClick={handlePrintReport}>
            Print Report
          </button>
          {onGoToDashboard && (
            <button className="dashboard-button" onClick={onGoToDashboard}>Continue to Dashboard</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportReadinessReport; 