import React, { useState, useEffect } from 'react';
import MarketIntelligenceDashboard from './MarketIntelligenceDashboard';
import AuthService from '../../services/AuthService';

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
  
  useEffect(() => {
    // Get the current user information
    const user = AuthService.getCurrentUser();
    if (user) {
      setUsername(user.username);
    }
  }, []);

  return (
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
  );
};

export default Dashboard; 