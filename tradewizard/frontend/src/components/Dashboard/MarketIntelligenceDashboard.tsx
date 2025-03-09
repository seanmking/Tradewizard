import React, { useState, useEffect } from 'react';
import './MarketIntelligenceDashboard.css';

// ErrorBoundary component to catch errors in the dashboard
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, errorMessage: string}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { 
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorMessage: error.message || 'Something went wrong'
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error('Dashboard error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="dashboard-error">
          <h3>Dashboard Error</h3>
          <p>There was a problem loading the dashboard: {this.state.errorMessage}</p>
          <p>Try refreshing the page or contact support if the problem persists.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

interface DashboardData {
  business_profile?: {
    products?: {
      categories: string[];
      items: string[];
      confidence: number;
    };
    current_markets?: {
      countries: string[];
      confidence: number;
    };
    certifications?: {
      items: string[];
      confidence: number;
    };
    business_details?: {
      estimated_size: string;
      years_operating: string;
      confidence: number;
    };
  };
  market_intelligence?: {
    market_size?: {
      value: string;
      confidence: number;
    };
    growth_rate?: {
      value: string;
      confidence: number;
    };
    regulations?: {
      items: string[];
      confidence: number;
    };
    opportunity_timeline?: {
      months: number;
      confidence: number;
    };
  };
  competitor_landscape?: {
    competitors: any[];
    confidence: number;
  };
}

interface UserData {
  name?: string;
  business_name?: string;
  role?: string;
  website?: string;
  motivation?: string;
  selected_markets?: string;
  [key: string]: any;
}

interface MarketIntelligenceDashboardProps {
  dashboardData: DashboardData;
  userData: UserData;
  onClose?: () => void;
  useMockData?: boolean;
}

const ConfidenceIndicator: React.FC<{ score: number }> = ({ score }) => {
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

const Panel: React.FC<{
  title: string;
  confidence?: number;
  isExpanded?: boolean;
  toggleExpand?: () => void;
  children: React.ReactNode;
}> = ({ title, confidence, isExpanded = true, toggleExpand, children }) => {
  return (
    <div className={`dashboard-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="panel-header" onClick={toggleExpand}>
        <h3>{title}</h3>
        {confidence !== undefined && <ConfidenceIndicator score={confidence} />}
        {toggleExpand && (
          <button className="expand-toggle">
            {isExpanded ? '−' : '+'}
          </button>
        )}
      </div>
      {isExpanded && <div className="panel-content">{children}</div>}
    </div>
  );
};

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

const BusinessProfilePanel: React.FC<{ 
  businessProfile: MarketIntelligenceDashboardProps['dashboardData']['business_profile'],
  userData: UserData
}> = ({ businessProfile, userData }) => {
  if (!businessProfile) return null;
  
  // Get business name from userData or businessProfile with a fallback
  const getBestBusinessName = () => {
    // Try different ways to get business name from userData and dashboardData
    try {
      // First try userData.business_name (could be an object with a text property or a string)
      if (userData.business_name) {
        if (typeof userData.business_name === 'string') {
          return userData.business_name;
        } 
        // @ts-ignore - handle the case where business_name is an object with text property
        else if (userData.business_name.text) {
          // @ts-ignore
          return userData.business_name.text;
        }
      }
      
      // Try userData.business_name_text
      if (userData.business_name_text) {
        return userData.business_name_text;
      }
      
      // Try businessProfile
      // @ts-ignore - handle the case where businessProfile has a name property
      if (businessProfile && businessProfile.name) {
        // @ts-ignore
        return businessProfile.name;
      }
    } catch (e) {
      console.error("Error getting business name:", e);
    }
    
    // Fallback
    return 'Your Business';
  };
  
  const businessName = getBestBusinessName();
  console.log("Using business name in dashboard:", businessName);
  
  return (
    <Panel title="Business Profile" confidence={businessProfile.products?.confidence}>
      <div className="profile-content">
        <div className="profile-header">
          <h2>{safeRender(businessName)}</h2>
          <p>{safeRender(businessProfile.business_details?.estimated_size)} business, operating for {safeRender(businessProfile.business_details?.years_operating)}</p>
        </div>
        
        <div className="profile-section">
          <h4>Product Categories</h4>
          <ul className="tag-list">
            {businessProfile.products?.categories.map((category, index) => (
              <li key={index} className="tag">{safeRender(category)}</li>
            ))}
          </ul>
        </div>
        
        <div className="profile-section">
          <h4>Current Markets</h4>
          <ul className="tag-list">
            {businessProfile.current_markets?.countries.map((country, index) => (
              <li key={index} className="tag">{safeRender(country)}</li>
            ))}
          </ul>
        </div>
        
        {businessProfile.certifications?.items && businessProfile.certifications.items.length > 0 && (
          <div className="profile-section">
            <h4>Certifications</h4>
            <ul className="tag-list">
              {businessProfile.certifications?.items.map((cert, index) => (
                <li key={index} className="tag">{safeRender(cert)}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
};

const MarketIntelligencePanel: React.FC<{
  marketIntelligence: MarketIntelligenceDashboardProps['dashboardData']['market_intelligence'],
  selectedMarket: string
}> = ({ marketIntelligence, selectedMarket }) => {
  if (!marketIntelligence) return null;
  
  return (
    <Panel title="Market Intelligence" confidence={marketIntelligence.market_size?.confidence}>
      <div className="market-intelligence-content">
        <h3>{safeRender(selectedMarket)} Market Opportunity</h3>
        
        <div className="market-stats">
          <div className="stat-item">
            <h4>Market Size</h4>
            <div className="stat-value">{safeRender(marketIntelligence.market_size?.value) || 'Unknown'}</div>
          </div>
          
          <div className="stat-item">
            <h4>Growth Rate</h4>
            <div className="stat-value">{safeRender(marketIntelligence.growth_rate?.value) || 'Unknown'}</div>
          </div>
          
          <div className="stat-item">
            <h4>Entry Timeline</h4>
            <div className="stat-value">
              ~{safeRender(marketIntelligence.opportunity_timeline?.months) || '?'} months
            </div>
          </div>
        </div>
        
        <div className="market-chart">
          <div className="chart-placeholder">
            <div className="chart-bar" style={{ height: '70%' }}></div>
            <div className="chart-bar" style={{ height: '85%' }}></div>
            <div className="chart-bar" style={{ height: '60%' }}></div>
            <div className="chart-bar" style={{ height: '90%' }}></div>
            <div className="chart-bar" style={{ height: '75%' }}></div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

const RegulatoryPanel: React.FC<{
  regulations: string[];
  confidence: number;
}> = ({ regulations, confidence }) => {
  return (
    <Panel title="Regulatory Requirements" confidence={confidence}>
      <div className="regulatory-content">
        {regulations.length > 0 ? (
          <ul className="regulatory-list">
            {regulations.map((regulation, index) => (
              <li key={index} className="regulatory-item">
                <div className="requirement-icon">📋</div>
                <div className="requirement-text">{safeRender(regulation)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="placeholder-text">
            Select a market to see regulatory requirements
          </div>
        )}
      </div>
    </Panel>
  );
};

const CompetitorPanel: React.FC = () => {
  return (
    <Panel title="Competitor Landscape" confidence={0.75}>
      <div className="competitor-content">
        <div className="placeholder-text">
          Create an account to view detailed competitor analysis
        </div>
        <div className="competitor-preview">
          <div className="competitor-card locked">
            <div className="lock-icon">🔒</div>
            <h4>Market Leaders</h4>
          </div>
          <div className="competitor-card locked">
            <div className="lock-icon">🔒</div>
            <h4>Pricing Strategy</h4>
          </div>
          <div className="competitor-card locked">
            <div className="lock-icon">🔒</div>
            <h4>Distribution Channels</h4>
          </div>
        </div>
      </div>
    </Panel>
  );
};

const TimelinePanel: React.FC<{
  months: number;
  confidence: number;
}> = ({ months, confidence }) => {
  return (
    <Panel title="Opportunity Timeline" confidence={confidence}>
      <div className="timeline-content">
        <div className="timeline">
          <div className="timeline-point current">
            <div className="point-label">Current</div>
            <div className="point-marker"></div>
          </div>
          <div className="timeline-connector"></div>
          <div className="timeline-point preparation">
            <div className="point-label">Preparation</div>
            <div className="point-marker"></div>
            <div className="point-time">Month 1-2</div>
          </div>
          <div className="timeline-connector"></div>
          <div className="timeline-point certification">
            <div className="point-label">Certification</div>
            <div className="point-marker"></div>
            <div className="point-time">Month 3-4</div>
          </div>
          <div className="timeline-connector"></div>
          <div className="timeline-point export locked">
            <div className="point-label">First Export</div>
            <div className="point-marker"></div>
            <div className="point-time">Month {safeRender(months)}</div>
            <div className="lock-icon">🔒</div>
          </div>
        </div>
        <div className="timeline-cta">
          <p>Create an account to view your personalized export roadmap</p>
        </div>
      </div>
    </Panel>
  );
};

const MarketIntelligenceDashboard: React.FC<MarketIntelligenceDashboardProps> = ({
  dashboardData,
  userData,
  onClose,
  useMockData = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    regulatory: false,
    competitors: false,
    timeline: false,
  });
  const [marketData, setMarketData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Check that we have valid data before rendering
  if (!dashboardData || !userData) {
    return <div className="dashboard-error">Unable to load dashboard data. Please try again later.</div>;
  }
  
  // Extract and log selected markets to debug the issue
  console.log("UserData in Dashboard:", userData);
  console.log("Using mock data:", useMockData);
  
  let allSelectedMarkets = [];
  
  if (typeof userData.selected_markets === 'string') {
    allSelectedMarkets = userData.selected_markets.split(',').map(m => m.trim()).filter(Boolean);
    console.log("Selected markets from string:", allSelectedMarkets);
  } else if (Array.isArray(userData.selected_markets)) {
    allSelectedMarkets = userData.selected_markets;
    console.log("Selected markets from array:", allSelectedMarkets);
  } else if (typeof userData.selectedMarkets === 'string') {
    allSelectedMarkets = userData.selectedMarkets.split(',').map(m => m.trim()).filter(Boolean);
    console.log("Selected markets from selectedMarkets string:", allSelectedMarkets);
  } else if (Array.isArray(userData.selectedMarkets)) {
    allSelectedMarkets = userData.selectedMarkets;
    console.log("Selected markets from selectedMarkets array:", allSelectedMarkets);
  } else {
    console.log("No selected markets found in userData:", userData);
    allSelectedMarkets = ["United Kingdom", "United Arab Emirates", "United States"];
  }
  
  const selectedMarket = allSelectedMarkets[0] || 'Target';
  console.log("Selected primary market:", selectedMarket);
  
  // Fetch market intelligence data if not using mock data
  useEffect(() => {
    // Only fetch if not using mock data and we have a selected market
    if (!useMockData && selectedMarket) {
      setIsLoading(true);
      
      // Extract product categories
      const productCategories = 
        dashboardData.business_profile?.products?.categories || 
        userData.products?.categories || 
        [];
      
      console.log("Fetching real market intelligence data for:", selectedMarket, "with categories:", productCategories);
      
      // Import the assessment API service
      import('../../services/assessment-api').then(({ getMarketIntelligence }) => {
        getMarketIntelligence(selectedMarket, productCategories)
          .then(data => {
            console.log("Received market intelligence data:", data);
            setMarketData(data);
            setIsLoading(false);
          })
          .catch(error => {
            console.error("Error fetching market intelligence:", error);
            setIsLoading(false);
          });
      });
    }
  }, [useMockData, selectedMarket, dashboardData, userData]);
  
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };
  
  // Add this function to get the appropriate data source
  const getMarketIntelligenceData = () => {
    if (!useMockData && marketData && marketData.intelligence) {
      console.log("Using real market intelligence data");
      return marketData.intelligence;
    }
    
    console.log("Using mock market intelligence data");
    return dashboardData.market_intelligence || {};
  };
  
  return (
    <ErrorBoundary>
      <div className="market-intelligence-dashboard">
        <div className="dashboard-header">
          <h2>Market Intelligence Dashboard</h2>
          <p>Export opportunities for {safeRender(userData.business_name) || 'your business'}</p>
          {error && <div className="error-message">{error}</div>}
          {isLoading && <div className="loading-indicator">Loading market intelligence data...</div>}
          {onClose && (
            <button className="close-button" onClick={onClose}>
              &times;
            </button>
          )}
        </div>
        
        <div className="dashboard-content">
          <BusinessProfilePanel 
            businessProfile={dashboardData.business_profile} 
            userData={userData}
          />
          
          <Panel 
            title={`Market Overview: ${selectedMarket}`}
            confidence={getMarketIntelligenceData()?.market_size?.confidence || 0.7}
            isExpanded={expandedSections.overview}
            toggleExpand={() => toggleSection('overview')}
          >
            <MarketIntelligencePanel 
              marketIntelligence={getMarketIntelligenceData()}
              selectedMarket={selectedMarket}
            />
          </Panel>
          
          <Panel 
            title="Regulatory Requirements"
            confidence={getMarketIntelligenceData()?.regulations?.confidence || 0.7}
            isExpanded={expandedSections.regulatory}
            toggleExpand={() => toggleSection('regulatory')}
          >
            <RegulatoryPanel 
              regulations={getMarketIntelligenceData()?.regulations?.items || []}
              confidence={getMarketIntelligenceData()?.regulations?.confidence || 0.7}
            />
          </Panel>
          
          <Panel 
            title="Competitor Landscape"
            confidence={dashboardData.competitor_landscape?.confidence || 0.7}
            isExpanded={expandedSections.competitors}
            toggleExpand={() => toggleSection('competitors')}
          >
            <CompetitorPanel />
          </Panel>
          
          <Panel 
            title="Market Entry Timeline"
            confidence={getMarketIntelligenceData()?.opportunity_timeline?.confidence || 0.7}
            isExpanded={expandedSections.timeline}
            toggleExpand={() => toggleSection('timeline')}
          >
            <TimelinePanel 
              months={getMarketIntelligenceData()?.opportunity_timeline?.months || 9}
              confidence={getMarketIntelligenceData()?.opportunity_timeline?.confidence || 0.7}
            />
          </Panel>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default MarketIntelligenceDashboard; 