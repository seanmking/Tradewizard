import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, Button, 
  Avatar, LinearProgress, Card, CardContent, CardActions, 
  Divider, IconButton, Drawer, List, ListItem, 
  ListItemIcon, ListItemText, Badge, Menu, MenuItem 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  BarChart as MarketIcon, 
  Gavel as RegulatoryIcon, 
  LocalShipping as OperationsIcon, 
  MenuBook as KnowledgeIcon, 
  Settings as SettingsIcon, 
  Notifications as NotificationsIcon, 
  Help as HelpIcon, 
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import AuthService from '../../services/AuthService';
import { resetAssessmentState } from '../../services/assessment-api';
import './Dashboard.css';

// Dynamically import the setup screens with error handling
const MarketPrioritizationLoader = () => {
  try {
    const Component = require('./SetupScreens/MarketPrioritization').default;
    return Component;
  } catch (error) {
    console.error('Failed to load MarketPrioritization component:', error);
    return () => <Box p={3}><Typography color="error">Error loading Market Prioritization component</Typography></Box>;
  }
};

const ExportTimelineLoader = () => {
  try {
    const Component = require('./SetupScreens/ExportTimeline').default;
    return Component;
  } catch (error) {
    console.error('Failed to load ExportTimeline component:', error);
    return () => <Box p={3}><Typography color="error">Error loading Export Timeline component</Typography></Box>;
  }
};

const RegulatoryAssessmentLoader = () => {
  try {
    const Component = require('./SetupScreens/RegulatoryAssessment').default;
    return Component;
  } catch (error) {
    console.error('Failed to load RegulatoryAssessment component:', error);
    return () => <Box p={3}><Typography color="error">Error loading Regulatory Assessment component</Typography></Box>;
  }
};

const ResourcePlanningLoader = () => {
  try {
    const Component = require('./SetupScreens/ResourcePlanning').default;
    return Component;
  } catch (error) {
    console.error('Failed to load ResourcePlanning component:', error);
    return () => <Box p={3}><Typography color="error">Error loading Resource Planning component</Typography></Box>;
  }
};

// Dynamically import the pillar components with error handling
const MarketIntelligencePillarLoader = () => {
  try {
    const Component = require('./Pillars/MarketIntelligencePillar').default;
    return Component;
  } catch (error) {
    console.error('Failed to load MarketIntelligencePillar component:', error);
    return () => <Box p={3}><Typography color="error">Error loading Market Intelligence component</Typography></Box>;
  }
};

const RegulatoryCompliancePillarLoader = () => {
  try {
    const Component = require('./Pillars/RegulatoryCompliancePillar').default;
    return Component;
  } catch (error) {
    console.error('Failed to load RegulatoryCompliancePillar component:', error);
    return () => <Box p={3}><Typography color="error">Error loading Regulatory Compliance component</Typography></Box>;
  }
};

const ExportOperationsPillarLoader = () => {
  try {
    const Component = require('./Pillars/ExportOperationsPillar').default;
    return Component;
  } catch (error) {
    console.error('Failed to load ExportOperationsPillar component:', error);
    return () => <Box p={3}><Typography color="error">Error loading Export Operations component</Typography></Box>;
  }
};

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

// Define the dashboard data type
interface DashboardData {
  business_profile: {
    name: string;
    products: {
      categories: string[];
      items: string[];
      confidence: number;
    };
    current_markets: {
      countries: string[];
      confidence: number;
    };
    certifications: {
      items: string[];
      confidence: number;
    };
    business_details: {
      founded: number;
      employees: number;
      annual_revenue: string;
      export_experience: string;
      confidence: number;
    };
  };
  selected_markets: string[];
  export_readiness: {
    overall_score: number;
    market_intelligence: number;
    regulatory_compliance: number;
    export_operations: number;
  };
  timeline: {
    target_date: Date;
    milestones: Array<{
      id: number;
      title: string;
      date: Date;
      completed: boolean;
    }>;
  };
  next_steps: Array<{
    id: number;
    title: string;
    description: string;
    pillar: string;
    estimated_time: string;
  }>;
}

// Define mock data outside the component
const mockDashboardData: DashboardData = {
  business_profile: {
    name: 'Global Fresh SA',
    products: {
      categories: ['Fresh Fruits', 'Vegetables', 'Organic Produce'],
      items: ['Apples', 'Oranges', 'Grapes', 'Lettuce', 'Tomatoes'],
      confidence: 90
    },
    current_markets: {
      countries: ['Spain', 'France', 'Italy'],
      confidence: 85
    },
    certifications: {
      items: ['GlobalGAP', 'Organic EU', 'ISO 9001'],
      confidence: 80
    },
    business_details: {
      founded: 2005,
      employees: 120,
      annual_revenue: '€15M - €20M',
      export_experience: 'Moderate',
      confidence: 95
    }
  },
  selected_markets: ['United Kingdom', 'Germany', 'United Arab Emirates'],
  export_readiness: {
    overall_score: 42,
    market_intelligence: 65,
    regulatory_compliance: 35,
    export_operations: 25
  },
  timeline: {
    target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
    milestones: [
      {
        id: 1,
        title: 'Market Research',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        completed: true
      },
      {
        id: 2,
        title: 'Regulatory Compliance',
        date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        completed: false
      },
      {
        id: 3,
        title: 'First Shipment',
        date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
        completed: false
      }
    ]
  },
  next_steps: [
    {
      id: 1,
      title: 'Complete UK Market Analysis',
      description: 'Review pricing data and competitor analysis for the UK market.',
      pillar: 'market_intelligence',
      estimated_time: '2-3 hours'
    },
    {
      id: 2,
      title: 'Submit Food Safety Certification',
      description: 'Complete and submit the food safety certification for EU exports.',
      pillar: 'regulatory_compliance',
      estimated_time: '4-5 hours'
    },
    {
      id: 3,
      title: 'Select Logistics Partner',
      description: 'Review and select a logistics partner for your first shipment.',
      pillar: 'export_operations',
      estimated_time: '1-2 hours'
    }
  ]
};

interface DashboardProps {
  onLogout?: () => void;
}

// Setup step type
type SetupStep = 'market_prioritization' | 'export_timeline' | 'regulatory_assessment' | 'resource_planning' | 'complete';

// Pillar type
type PillarType = 'market_intelligence' | 'regulatory_compliance' | 'export_operations' | 'dashboard';

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  // State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activePillar, setActivePillar] = useState<PillarType>('dashboard');
  const [setupStep, setSetupStep] = useState<SetupStep>('market_prioritization');
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('Sarah');
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [welcomeBannerDismissed, setWelcomeBannerDismissed] = useState(false);
  
  // Dashboard data state (moved inside the component)
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData);

  useEffect(() => {
    try {
      // Get the current user information
      const user = AuthService.getCurrentUser();
      if (user) {
        setUsername(user.username || 'Thandi Nkosi');
      } else {
        setUsername('Thandi Nkosi'); // Default for demo
      }
      
      // Ensure the app container is visible
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        (appContainer as HTMLElement).style.display = 'flex';
      }
      
      // In a real app, we would fetch the dashboard data from an API
      // For now, we'll use the mock data
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard. Please try refreshing the page.');
      setIsLoading(false);
    }
  }, []);

  const handleSetupComplete = () => {
    setSetupComplete(true);
    setActivePillar('dashboard');
  };

  const handleNextSetupStep = () => {
    switch (setupStep) {
      case 'market_prioritization':
        setSetupStep('export_timeline');
        break;
      case 'export_timeline':
        setSetupStep('regulatory_assessment');
        break;
      case 'regulatory_assessment':
        setSetupStep('resource_planning');
        break;
      case 'resource_planning':
        setSetupStep('complete');
        handleSetupComplete();
        break;
      default:
        break;
    }
  };

  const handlePillarChange = (pillar: PillarType) => {
    setActivePillar(pillar);
  };

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const dismissWelcomeBanner = () => {
    setWelcomeBannerDismissed(true);
  };

  const handleNavigateToAssessment = () => {
    // Reset all assessment state first
    resetAssessmentState();
    
    // Wait a moment before dispatching events
    setTimeout(() => {
      // Ensure the assessment tab is active
      const assessmentTab = document.querySelector('.assessment-tab');
      const dashboardTab = document.querySelector('.dashboard-tab');
      
      if (assessmentTab) {
        assessmentTab.classList.add('active');
      }
      
      if (dashboardTab) {
        dashboardTab.classList.remove('active');
      }
      
      // Dispatch event to navigate to assessment
      window.dispatchEvent(new CustomEvent('navigateToAssessment'));
      
      // Also reset assessment for demo purposes
      window.dispatchEvent(new CustomEvent('resetAssessment'));
    }, 100);
  };

  const renderSetupScreen = () => {
    // Get the components from the loaders
    const MarketPrioritization = MarketPrioritizationLoader();
    const ExportTimeline = ExportTimelineLoader();
    const RegulatoryAssessment = RegulatoryAssessmentLoader();
    const ResourcePlanning = ResourcePlanningLoader();
    
    switch(setupStep) {
      case 'market_prioritization':
        return (
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
            <Paper 
              elevation={0} 
              sx={{ 
                width: '100%', 
                p: 3, 
                mb: 4, 
                bgcolor: '#f8f9fa', 
                borderRadius: 2,
                border: '1px solid #e0e4e8'
              }}
            >
              <Typography variant="h6" gutterBottom>
                Export Readiness Setup
              </Typography>
              <Typography variant="body1">
                Let's assess {dashboardData.business_profile.name}'s basics in order to create a detailed export-readiness workflow. We will focus on three areas: Market Prioritization, your Export Timeline, and a quick Regulatory Assessment. This will give you a clear understanding of resource requirements.
              </Typography>
            </Paper>
            <MarketPrioritization 
              markets={dashboardData.selected_markets || ["United Kingdom", "Germany", "United Arab Emirates", "United States"]} 
              onContinue={handleNextSetupStep} 
            />
          </Box>
        );
      case 'export_timeline':
        return <ExportTimeline onContinue={handleNextSetupStep} />;
      case 'regulatory_assessment':
        return <RegulatoryAssessment markets={dashboardData.selected_markets} onContinue={handleNextSetupStep} />;
      case 'resource_planning':
        return <ResourcePlanning onContinue={handleNextSetupStep} />;
      case 'complete':
        return <Typography>Setup complete</Typography>;
      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  const renderDashboardContent = () => {
    // Get the components from the loaders
    const MarketIntelligencePillar = MarketIntelligencePillarLoader();
    const RegulatoryCompliancePillar = RegulatoryCompliancePillarLoader();
    const ExportOperationsPillar = ExportOperationsPillarLoader();
    
    switch (activePillar) {
      case 'market_intelligence':
        return <MarketIntelligencePillar markets={dashboardData.selected_markets} businessProfile={dashboardData.business_profile} />;
      case 'regulatory_compliance':
        return <RegulatoryCompliancePillar markets={dashboardData.selected_markets} businessProfile={dashboardData.business_profile} />;
      case 'export_operations':
        return <ExportOperationsPillar markets={dashboardData.selected_markets} businessProfile={dashboardData.business_profile} />;
      case 'dashboard':
        return (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Export readiness summary */}
            <Paper
              sx={{
                p: 3,
                mb: 4,
              }}
            >
              <Typography variant="h5" gutterBottom>
                Export Readiness: {username}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Target markets: {dashboardData.selected_markets.join(', ')}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={dashboardData.export_readiness.overall_score} 
                sx={{ 
                  height: 10, 
                  borderRadius: 5,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4f46e5'
                  }
                }} 
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Export readiness: {dashboardData.export_readiness.overall_score}% complete
              </Typography>
            </Paper>

            <Grid container spacing={4}>
              {/* Pillar Cards */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <MarketIcon />
                      </Avatar>
                      <Typography variant="h6">Market Intelligence</Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Access market research, competitor analysis, and price benchmarks for your target markets.
                    </Typography>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={dashboardData.export_readiness.market_intelligence} 
                      sx={{ height: 8, borderRadius: 5, mb: 1 }} 
                    />
                    
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.export_readiness.market_intelligence}% complete
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => handlePillarChange('market_intelligence')}
                    >
                      Access intelligence
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                        <RegulatoryIcon />
                      </Avatar>
                      <Typography variant="h6">Regulatory Compliance</Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Manage certifications, standards, and compliance requirements for your exports.
                    </Typography>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={dashboardData.export_readiness.regulatory_compliance} 
                      sx={{ height: 8, borderRadius: 5, mb: 1 }} 
                    />
                    
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.export_readiness.regulatory_compliance}% complete
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => handlePillarChange('regulatory_compliance')}
                    >
                      Manage compliance
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                        <OperationsIcon />
                      </Avatar>
                      <Typography variant="h6">Export Operations</Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Track shipments, manage logistics, and handle export documentation.
                    </Typography>
                    
                    <LinearProgress 
                      variant="determinate" 
                      value={dashboardData.export_readiness.export_operations} 
                      sx={{ height: 8, borderRadius: 5, mb: 1 }} 
                    />
                    
                    <Typography variant="body2" color="text.secondary">
                      {dashboardData.export_readiness.export_operations}% complete
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => handlePillarChange('export_operations')}
                    >
                      View operations
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          </Container>
        );
      default:
        return <Typography variant="h6">Unknown pillar</Typography>;
    }
  };

  if (isLoading) {
    return <div className="dashboard-loading">Loading your dashboard...</div>;
  }
  
  if (error) {
    return <div className="dashboard-error">{error}</div>;
  }

  return (
    <DashboardErrorBoundary>
      <Box sx={{ display: 'flex' }}>
        {/* Side Navigation */}
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
          }}
        >
          <Box sx={{ overflow: 'auto', mt: 2 }}>
            <List>
              <ListItem 
                button 
                selected={activePillar === 'dashboard'} 
                onClick={() => handlePillarChange('dashboard')}
              >
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
              
              <ListItem 
                button 
                selected={activePillar === 'market_intelligence'} 
                onClick={() => handlePillarChange('market_intelligence')}
              >
                <ListItemIcon>
                  <MarketIcon />
                </ListItemIcon>
                <ListItemText primary="Market Intelligence" />
              </ListItem>
              
              <ListItem 
                button 
                selected={activePillar === 'regulatory_compliance'} 
                onClick={() => handlePillarChange('regulatory_compliance')}
              >
                <ListItemIcon>
                  <RegulatoryIcon />
                </ListItemIcon>
                <ListItemText primary="Regulatory Compliance" />
              </ListItem>
              
              <ListItem 
                button 
                selected={activePillar === 'export_operations'} 
                onClick={() => handlePillarChange('export_operations')}
              >
                <ListItemIcon>
                  <OperationsIcon />
                </ListItemIcon>
                <ListItemText primary="Export Operations" />
              </ListItem>
            </List>
            
            <Divider />
            
            <List>
              <ListItem button>
                <ListItemIcon>
                  <KnowledgeIcon />
                </ListItemIcon>
                <ListItemText primary="Knowledge Base" />
              </ListItem>
              
              <ListItem button>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItem>
            </List>
          </Box>
        </Drawer>
        
        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          {!setupComplete ? (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              {renderSetupScreen()}
            </Container>
          ) : (
            renderDashboardContent()
          )}
        </Box>
      </Box>
    </DashboardErrorBoundary>
  );
};

export default Dashboard; 