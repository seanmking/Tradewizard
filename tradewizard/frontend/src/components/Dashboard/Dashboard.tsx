import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Container, Grid, Paper, Typography, Button, 
  Avatar, LinearProgress, Card, CardContent, CardActions, 
  Divider, IconButton, Menu, MenuItem, List, ListItem, ListItemIcon, ListItemText, Alert,
  CircularProgress
} from '@mui/material';
import { 
  Notifications as NotificationsIcon, 
  Help as HelpIcon, 
  ArrowForward as ArrowForwardIcon,
  BarChart as MarketIcon, 
  Gavel as GavelIcon, 
  LocalShipping as OperationsIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  Flag as FlagIcon,
  Insights as InsightsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import AuthService from '../../services/AuthService';
import { resetAssessmentState } from '../../services/assessment-api';
import './Dashboard.css';
import { withCache } from '../../utils/cache';

// Custom circular progress component with label
const CircularProgressWithLabel = (props: { value: number, size: number, thickness: number }) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <Box
        sx={{
          position: 'relative',
          display: 'inline-flex',
          borderRadius: '50%',
          background: `conic-gradient(#4f46e5 ${props.value * 3.6}deg, #e0e0e0 ${props.value * 3.6}deg 360deg)`,
          width: props.size,
          height: props.size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h4" component="div" color="primary.main">
            {`${Math.round(props.value)}%`}
          </Typography>
          <Typography variant="caption" component="div" color="text.secondary">
            Readiness
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePillar, setActivePillar] = useState<PillarType>('dashboard');
  const [setupStep, setSetupStep] = useState<SetupStep>('market_prioritization');
  const [setupComplete, setSetupComplete] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('Sarah');
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [welcomeBannerDismissed, setWelcomeBannerDismissed] = useState(false);
  const [useMockData, setUseMockData] = useState<boolean>(false);
  
  // Dashboard data state (moved inside the component)
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData);

  // Add state for API data
  const [marketIntelligenceData, setMarketIntelligenceData] = useState<any>(null);
  const [regulatoryData, setRegulatoryData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
      
      // Check if we have user assessment data in localStorage
      const savedAssessmentData = localStorage.getItem('assessmentUserData');
      if (savedAssessmentData) {
        try {
          const parsedData = JSON.parse(savedAssessmentData);
          console.log('Found saved assessment data:', parsedData);
          
          // Extract business name
          let businessName = 'Global Fresh SA'; // Default fallback
          
          if (parsedData.business_name) {
            if (typeof parsedData.business_name === 'string') {
              businessName = parsedData.business_name;
            } else if (parsedData.business_name.text) {
              businessName = parsedData.business_name.text;
            }
          } else if (parsedData.business_name_text) {
            businessName = parsedData.business_name_text;
          }
          
          console.log('Using business name from assessment:', businessName);
          
          // Check if this is the demo company (Global Fresh SA)
          const isGlobalFreshSA = 
            businessName.toLowerCase().includes('global fresh') || 
            (parsedData.website_url && 
             (parsedData.website_url.toLowerCase().includes('globalfresh') || 
              parsedData.website_url.toLowerCase() === 'globalfreshsa.co.za'));
          
          setUseMockData(isGlobalFreshSA);
          console.log(`Company is ${businessName}. Using mock data: ${isGlobalFreshSA}`);
          
          if (isGlobalFreshSA) {
            // For Global Fresh SA, use the mock data
            setDashboardData(prev => ({
              ...mockDashboardData,
              business_profile: {
                ...mockDashboardData.business_profile,
                name: businessName
              }
            }));
            setIsLoading(false);
          } else {
            // For real companies, fetch data from the API
            console.log('Fetching real data from export_intelligence for:', businessName);
            
            // Extract product categories
            const productCategories = parsedData.products?.categories || [];
            
            // Extract selected markets
            let selectedMarkets: string[] = [];
            if (typeof parsedData.selected_markets === 'string') {
              selectedMarkets = parsedData.selected_markets.split(',').map((m: string) => m.trim()).filter(Boolean);
            } else if (Array.isArray(parsedData.selected_markets)) {
              selectedMarkets = parsedData.selected_markets;
            } else if (typeof parsedData.selectedMarkets === 'string') {
              selectedMarkets = parsedData.selectedMarkets.split(',').map((m: string) => m.trim()).filter(Boolean);
            } else if (Array.isArray(parsedData.selectedMarkets)) {
              selectedMarkets = parsedData.selectedMarkets;
            }
            
            // Create a basic dashboard structure with the company info
            const basicDashboardData: DashboardData = {
              business_profile: {
                name: businessName,
                products: {
                  categories: productCategories,
                  items: parsedData.products?.items || [],
                  confidence: parsedData.products?.confidence || 90
                },
                current_markets: {
                  countries: parsedData.current_markets?.countries || ['South Africa'],
                  confidence: parsedData.current_markets?.confidence || 85
                },
                certifications: {
                  items: parsedData.certifications?.items || [],
                  confidence: parsedData.certifications?.confidence || 80
                },
                business_details: {
                  founded: parsedData.business_details?.founded || new Date().getFullYear() - 5,
                  employees: parsedData.business_details?.employees || 20,
                  annual_revenue: parsedData.business_details?.annual_revenue || 'Unknown',
                  export_experience: parsedData.export_experience || 'Beginner',
                  confidence: parsedData.business_details?.confidence || 95
                }
              },
              selected_markets: selectedMarkets,
              export_readiness: {
                overall_score: 42,
                market_intelligence: 65,
                regulatory_compliance: 35,
                export_operations: 25
              },
              timeline: mockDashboardData.timeline,
              next_steps: mockDashboardData.next_steps
            };
            
            setDashboardData(basicDashboardData);
            setIsLoading(false);
            
            // In a real implementation, we would fetch additional data from the API
            // For example:
            // fetchMarketIntelligence(selectedMarkets[0], productCategories)
            //   .then(data => {
            //     // Update dashboard with real market intelligence data
            //   })
            //   .catch(err => {
            //     console.error('Error fetching market intelligence:', err);
            //   });
          }
        } catch (e) {
          console.error('Error parsing saved assessment data:', e);
          setIsLoading(false);
        }
      } else {
        // No assessment data, use mock data
        setUseMockData(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      setError('Failed to load dashboard data. Please try again later.');
      setIsLoading(false);
    }
  }, []);

  // Add a utility function for retrying API calls
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3, delay = 1000) => {
    let retries = 0;
    
    // Ensure we're using the full URL for the MCP server
    const fullUrl = url.startsWith('http') ? url : `http://localhost:3001${url}`;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(fullUrl, options);
        
        if (response.ok) {
          return await response.json();
        }
        
        // Handle different HTTP error codes
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication error. Please log in again.');
        } else if (response.status === 429) {
          // Rate limiting - wait longer before retrying
          await new Promise(resolve => setTimeout(resolve, delay * 2));
          retries++;
          continue;
        } else if (response.status >= 500) {
          // Server error - retry
          await new Promise(resolve => setTimeout(resolve, delay));
          retries++;
          continue;
        } else {
          throw new Error(`API request failed: ${response.statusText}`);
        }
      } catch (error) {
        if (retries >= maxRetries - 1) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
      }
    }
    
    throw new Error('Maximum retries exceeded');
  };

  // Create a cached version of the fetch function
  const fetchExportReadinessReportWithCache = withCache(
    async (
      businessName: string,
      productCategories: string[],
      targetMarkets: string[],
      certifications: string[],
      businessDetails: any
    ) => {
      // Use the retry mechanism for the API call
      return await fetchWithRetry(
        '/api/mcp/tools',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'generateExportReadinessReport',
            params: {
              businessName,
              productCategories,
              targetMarkets,
              certifications,
              businessDetails
            }
          }),
        }
      );
    },
    (businessName, productCategories, targetMarkets, certifications, businessDetails) => 
      `dashboard_export_readiness_${businessName}_${targetMarkets.join('_')}_${productCategories.join('_')}`,
    { ttl: 1800000 } // 30 minutes cache
  );

  // Function to fetch dashboard data from MCP server
  const fetchDashboardData = useCallback(async () => {
    if (!dashboardData || !dashboardData.business_profile) {
      return;
    }
    
    setIsLoadingData(true);
    setApiError(null);
    
    try {
      // Extract data from dashboardData
      const businessName = dashboardData.business_profile.name || '';
      const productCategories = dashboardData.business_profile.products?.categories || [];
      const targetMarkets = dashboardData.selected_markets || [];
      const certifications = dashboardData.business_profile.certifications?.items || [];
      const businessDetails = {
        founded: dashboardData.business_profile.business_details?.founded || 0,
        employees: dashboardData.business_profile.business_details?.employees || 0,
        annual_revenue: dashboardData.business_profile.business_details?.annual_revenue || '',
        export_experience: dashboardData.business_profile.business_details?.export_experience || ''
      };
      
      // Use the cached fetch function
      const data = await fetchExportReadinessReportWithCache(
        businessName,
        productCategories,
        targetMarkets,
        certifications,
        businessDetails
      );
      
      // Check if the response contains an error
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update dashboard data with the fetched data
      setDashboardData(prevData => {
        if (!prevData) return mockDashboardData; // Return mock data as fallback
        
        return {
          ...prevData,
          export_readiness: {
            overall_score: data.exportReadiness.overallScore * 100,
            market_intelligence: data.exportReadiness.marketIntelligence * 100,
            regulatory_compliance: data.exportReadiness.regulatoryCompliance * 100,
            export_operations: data.exportReadiness.exportOperations * 100
          },
          next_steps: data.nextSteps.map((step: any, index: number) => ({
            id: index + 1,
            title: step.title,
            description: step.description,
            pillar: step.pillar,
            estimated_time: step.estimatedTime
          }))
        };
      });
      
      // Store the data for use in other components
      setMarketIntelligenceData(data.marketIntelligence || null);
      setRegulatoryData(data.regulatoryCompliance || null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      // Set a user-friendly error message
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('Failed to fetch dashboard data. Please try again later.');
      }
    } finally {
      setIsLoadingData(false);
    }
  }, [dashboardData, fetchExportReadinessReportWithCache, mockDashboardData, setDashboardData, setMarketIntelligenceData, setRegulatoryData]);

  useEffect(() => {
    // Fetch dashboard data when the component mounts
    if (dashboardData && dashboardData.business_profile) {
      fetchDashboardData();
    }
  }, [dashboardData, fetchDashboardData]);

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

  // Add handler for going back to previous step
  const handlePreviousSetupStep = () => {
    switch (setupStep) {
      case 'export_timeline':
        setSetupStep('market_prioritization');
        break;
      case 'regulatory_assessment':
        setSetupStep('export_timeline');
        break;
      case 'resource_planning':
        setSetupStep('regulatory_assessment');
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
    
    switch (setupStep) {
      case 'market_prioritization':
        return (
          <DashboardErrorBoundary>
            <MarketPrioritization 
              markets={dashboardData.selected_markets} 
              onContinue={handleNextSetupStep}
              useMockData={useMockData}
            />
          </DashboardErrorBoundary>
        );
      case 'export_timeline':
        return (
          <DashboardErrorBoundary>
            <ExportTimeline 
              onContinue={handleNextSetupStep} 
              onBack={handlePreviousSetupStep}
              useMockData={useMockData}
            />
          </DashboardErrorBoundary>
        );
      case 'regulatory_assessment':
        return (
          <DashboardErrorBoundary>
            <RegulatoryAssessment 
              onContinue={handleNextSetupStep} 
              onBack={handlePreviousSetupStep}
              useMockData={useMockData}
            />
          </DashboardErrorBoundary>
        );
      case 'resource_planning':
        return (
          <DashboardErrorBoundary>
            <ResourcePlanning 
              onContinue={handleSetupComplete} 
              onBack={handlePreviousSetupStep}
              useMockData={useMockData}
            />
          </DashboardErrorBoundary>
        );
      case 'complete':
      default:
        return renderDashboardContent();
    }
  };

  const renderDashboardContent = () => {
    if (isLoadingData) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (apiError) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">{apiError}</Alert>
        </Box>
      );
    }

    switch (activePillar) {
      case 'dashboard':
        return (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Welcome banner */}
            {!welcomeBannerDismissed && (
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  mb: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'primary.light',
                  color: 'white'
                }}
              >
                <Box>
                  <Typography variant="h5" component="h2" gutterBottom>
                    Welcome to your Export Dashboard, {username}!
                  </Typography>
                  <Typography variant="body1">
                    Your export journey is underway. Explore the tools and insights to help you succeed in international markets.
                  </Typography>
                </Box>
                <IconButton 
                  onClick={dismissWelcomeBanner}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </Paper>
            )}
            
            {/* Export Readiness Score */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                mb: 4,
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Box sx={{ mb: { xs: 2, md: 0 } }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Export Readiness Score
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your overall export readiness is currently at {dashboardData.export_readiness.overall_score}%. 
                  Continue improving your score by completing the recommended actions.
                </Typography>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '40%' }, minWidth: '200px' }}>
                <CircularProgressWithLabel 
                  value={dashboardData.export_readiness.overall_score} 
                  size={160}
                  thickness={5}
                />
              </Box>
            </Paper>
            
            {/* Main dashboard grid */}
            <Grid container spacing={3}>
              {/* Business Profile */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <BusinessIcon />
                      </Avatar>
                      <Typography variant="h6">Business Profile</Typography>
                    </Box>
                    
                    <Typography variant="body1" gutterBottom>
                      <strong>{dashboardData.business_profile.name}</strong>
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Products: {dashboardData.business_profile.products.categories.join(', ')}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Current Markets: {dashboardData.business_profile.current_markets.countries.join(', ')}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      Founded: {dashboardData.business_profile.business_details.founded} | 
                      Employees: {dashboardData.business_profile.business_details.employees} | 
                      Revenue: {dashboardData.business_profile.business_details.annual_revenue}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Target Markets */}
              <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                        <PublicIcon />
                      </Avatar>
                      <Typography variant="h6">Target Markets</Typography>
                    </Box>
                    
                    <List>
                      {dashboardData.selected_markets.map((market, index) => (
                        <ListItem key={index} disablePadding>
                          <ListItemIcon>
                            <FlagIcon color={index === 0 ? 'primary' : 'action'} />
                          </ListItemIcon>
                          <ListItemText 
                            primary={market} 
                            secondary={index === 0 ? 'Primary Target Market' : 'Secondary Target Market'} 
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Export Pillars */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                        <InsightsIcon />
                      </Avatar>
                      <Typography variant="h6">Market Intelligence</Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Understand your target markets, competition, and opportunities.
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
                      View intelligence
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                        <GavelIcon />
                      </Avatar>
                      <Typography variant="h6">Regulatory Compliance</Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Navigate regulations, standards, and certification requirements.
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
                      View compliance
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
      case 'market_intelligence':
        const MarketIntelligencePillar = MarketIntelligencePillarLoader();
        return <MarketIntelligencePillar 
          dashboardData={dashboardData} 
          userData={{
            business_name: dashboardData.business_profile.name,
            selected_markets: dashboardData.selected_markets.join(','),
            products: dashboardData.business_profile.products
          }}
          useMockData={useMockData}
        />;
      case 'regulatory_compliance':
        const RegulatoryCompliancePillar = RegulatoryCompliancePillarLoader();
        return <RegulatoryCompliancePillar 
          dashboardData={dashboardData} 
          userData={{
            business_name: dashboardData.business_profile.name,
            selected_markets: dashboardData.selected_markets.join(','),
            products: dashboardData.business_profile.products
          }}
          useMockData={useMockData}
        />;
      case 'export_operations':
        const ExportOperationsPillar = ExportOperationsPillarLoader();
        return <ExportOperationsPillar 
          dashboardData={dashboardData} 
          userData={{
            business_name: dashboardData.business_profile.name,
            selected_markets: dashboardData.selected_markets.join(','),
            products: dashboardData.business_profile.products
          }}
          useMockData={useMockData}
        />;
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
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {/* Main Content - Removed legacy sidebar */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
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