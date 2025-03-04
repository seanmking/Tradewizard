import React, { useState } from 'react';
import './MarketIntelligenceDashboard.css';

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
  
  return (
    <Panel title="Business Profile" confidence={businessProfile.products?.confidence}>
      <div className="profile-content">
        <div className="profile-header">
          <h2>{safeRender(userData.business_name) || 'Your Business'}</h2>
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
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    regulatory: false,
    competitors: false,
    timeline: false,
  });
  
  const selectedMarket = typeof userData.selected_markets === 'string' 
    ? userData.selected_markets.split(',')[0].trim() 
    : (Array.isArray(userData.selected_markets) 
        ? userData.selected_markets[0] 
        : 'Target');
  
  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };
  
  return (
    <div className="market-intelligence-dashboard">
      <div className="dashboard-header">
        <h2>Market Intelligence Dashboard</h2>
        <p>Export opportunities for {safeRender(userData.business_name) || 'your business'}</p>
        {onClose && (
          <button className="close-dashboard-button" onClick={onClose}>×</button>
        )}
      </div>
      
      <div className="dashboard-content">
        <BusinessProfilePanel 
          businessProfile={dashboardData.business_profile} 
          userData={userData}
        />
        
        <MarketIntelligencePanel 
          marketIntelligence={dashboardData.market_intelligence} 
          selectedMarket={safeRender(selectedMarket)}
        />
        
        <RegulatoryPanel 
          regulations={dashboardData.market_intelligence?.regulations?.items.map(item => safeRender(item)) || []} 
          confidence={dashboardData.market_intelligence?.regulations?.confidence || 0.7}
        />
        
        <CompetitorPanel />
        
        <TimelinePanel 
          months={dashboardData.market_intelligence?.opportunity_timeline?.months || 6}
          confidence={dashboardData.market_intelligence?.opportunity_timeline?.confidence || 0.75}
        />
      </div>
      
      <div className="dashboard-footer">
        <button className="signup-button">Create Account for Full Analysis</button>
      </div>
    </div>
  );
};

export default MarketIntelligenceDashboard; 