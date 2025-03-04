import React, { useState, useEffect } from 'react';
import MarketIntelligenceDashboard from './MarketIntelligenceDashboard';
import AuthService from '../../services/AuthService';

// Add an error boundary component for the Dashboard
class DashboardErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Dashboard error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="dashboard-error">Something went wrong with the dashboard. Please try refreshing the page.</div>;
    }

    return this.props.children;
  }
}

// Mock data for the dashboard - in a real app, this would come from an API
const mockDashboardData = {
  business_profile: {
    products: {
      categories: ['Electronics', 'Consumer Goods'],
      items: ['Smartphones', 'Tablets', 'Accessories'],
      confidence: 0.85
    },
    current_markets: {
      countries: ['United States', 'Canada', 'Mexico'],
      confidence: 0.92
    },
    certifications: {
      items: ['ISO 9001', 'CE Mark', 'FCC Certification'],
      confidence: 0.78
    },
    business_details: {
      estimated_size: 'Medium Enterprise (50-250 employees)',
      years_operating: '5-10 years',
      confidence: 0.88
    }
  },
  market_intelligence: {
    market_size: {
      value: '$450 billion annually',
      confidence: 0.76
    },
    growth_rate: {
      value: '12% year-over-year',
      confidence: 0.82
    },
    regulations: {
      items: [
        'Electronic Equipment Safety Standards',
        'Consumer Protection Regulations',
        'Import Duties: 5-12% depending on product category'
      ],
      confidence: 0.85
    },
    opportunity_timeline: {
      months: 6,
      confidence: 0.72
    }
  },
  competitor_landscape: {
    competitors: [
      {
        name: 'TechGlobal Inc.',
        market_share: '15%',
        strengths: ['Established distribution network', 'Strong brand recognition'],
        weaknesses: ['Higher price points', 'Slower product cycle']
      },
      {
        name: 'InnovateTech',
        market_share: '8%',
        strengths: ['Cutting-edge technology', 'Young demographic appeal'],
        weaknesses: ['Limited market presence', 'Less established supply chain']
      }
    ],
    confidence: 0.79
  }
};

const mockUserData = {
  name: 'John Smith',
  business_name: 'TechExport Solutions',
  role: 'Export Manager',
  website: 'www.techexport.com',
  motivation: 'Expand market reach and increase revenue',
  selected_markets: 'European Union'
};

interface DashboardProps {
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    try {
      // Get the current user information
      const user = AuthService.getCurrentUser();
      if (user) {
        setUsername(user.username);
      }
      
      // Ensure the app container is visible
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        (appContainer as HTMLElement).style.display = 'flex';
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard. Please try refreshing the page.');
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <div className="dashboard-loading">Loading your dashboard...</div>;
  }
  
  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <DashboardErrorBoundary>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Export Market Dashboard</h1>
          <p>Welcome, {username || 'User'}! Here's your export market intelligence.</p>
        </div>
        
        <div className="dashboard-content">
          <MarketIntelligenceDashboard 
            dashboardData={mockDashboardData} 
            userData={mockUserData} 
          />
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default Dashboard; 