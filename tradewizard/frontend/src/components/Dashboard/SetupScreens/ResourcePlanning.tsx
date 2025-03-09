import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AttachMoney as MoneyIcon,
  People as PeopleIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import analysisService, { ResourceEstimateResult, FundingOption, ROIEstimate } from '../../../services/analysis-service';

interface ResourcePlanningProps {
  onContinue: () => void;
  onBack?: () => void;
  useMockData?: boolean;
}

// Local interfaces to handle transformed data
interface StaffingItem {
  role: string;
  count: number;
  cost: number;
  type: 'internal' | 'consultant' | 'agency';
}

interface MaterialItem {
  name: string;
  cost: number;
}

interface ServiceItem {
  name: string;
  cost: number;
}

// Internal transformed structure for easier UI rendering
interface ResourceEstimate {
  totalCost: number;
  staffing: StaffingItem[];
  materials: MaterialItem[];
  services: ServiceItem[];
  timeframe: string;
}

const ResourcePlanning: React.FC<ResourcePlanningProps> = ({ onContinue, onBack, useMockData = false }) => {
  const [resourceEstimate, setResourceEstimate] = useState<ResourceEstimate | null>(null);
  const [roiEstimate, setRoiEstimate] = useState<ROIEstimate | null>(null);
  const [fundingOptions, setFundingOptions] = useState<FundingOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFundingOption, setSelectedFundingOption] = useState<string | null>(null);
  const [customBudget, setCustomBudget] = useState<number | ''>('');
  const [budgetView, setBudgetView] = useState<'recommended' | 'custom'>('recommended');

  // Transform API response to internal format
  const transformResourceData = (data: ResourceEstimateResult): ResourceEstimate => {
    // Calculate total cost from min and max
    const totalCost = Math.round((data.cost_estimate.min + data.cost_estimate.max) / 2);
    
    // Create staffing from team requirements
    const staffing: StaffingItem[] = data.team_requirements.map(team => ({
      role: team.role,
      count: 1, // Default
      cost: Math.round(totalCost * 0.4 / data.team_requirements.length), // Estimate 40% for staffing
      type: team.commitment.includes('full') ? 'internal' : 'consultant'
    }));
    
    // Create materials from breakdown
    const materials: MaterialItem[] = [
      { 
        name: 'Product Adaptation', 
        cost: data.cost_estimate.breakdown.product_adaptation 
      },
      { 
        name: 'Certification & Testing', 
        cost: data.cost_estimate.breakdown.certification 
      }
    ];
    
    // Create services from breakdown
    const services: ServiceItem[] = [
      { 
        name: 'Marketing & Promotion', 
        cost: data.cost_estimate.breakdown.marketing 
      },
      { 
        name: 'Logistics Setup', 
        cost: data.cost_estimate.breakdown.logistics 
      },
      { 
        name: 'Other Services', 
        cost: data.cost_estimate.breakdown.other 
      }
    ];
    
    // Calculate timeframe from timeline estimate
    const timeframe = `${data.timeline_estimate.total_weeks / 4}-${Math.ceil(data.timeline_estimate.total_weeks / 3)} months`;
    
    return {
      totalCost,
      staffing,
      materials,
      services,
      timeframe
    };
  };

  // Load resource estimates from the API
  useEffect(() => {
    const fetchResourceEstimates = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get cached markets and other user data from localStorage
        const savedData = localStorage.getItem('tradewizard_user_data');
        const userData = savedData ? JSON.parse(savedData) : {};
        
        const markets = userData.selectedMarkets || ['United Kingdom'];
        const industry = userData.industry || 'Food Products';
        const timelineOption = userData.selectedTimelineOption || 'standard';
        
        console.log(`Fetching resource estimates for markets: ${markets}, industry: ${industry}, timeline: ${timelineOption}, useMockData: ${useMockData}`);
        
        if (useMockData) {
          console.log("Using mock resource data");
          // Use mock data
          const mockResourceData: ResourceEstimateResult = {
            cost_estimate: {
              currency: 'USD',
              min: 50000,
              max: 75000,
              breakdown: {
                product_adaptation: 15000,
                certification: 12000,
                logistics: 18000,
                marketing: 20000,
                other: 10000
              }
            },
            timeline_estimate: {
              timeline_option: 'standard',
              total_weeks: 24,
              start_date: new Date().toISOString(),
              estimated_completion_date: new Date(Date.now() + 24 * 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            team_requirements: [
              { role: 'Export Manager', commitment: 'Full-time' },
              { role: 'Regulatory Specialist', commitment: 'Part-time' },
              { role: 'Marketing Coordinator', commitment: 'Part-time' },
              { role: 'Logistics Coordinator', commitment: 'Part-time' }
            ]
          };
          
          const mockROI: ROIEstimate = {
            investmentAmount: 65000,
            projectedReturns: 130000,
            projectedROI: 100,
            paybackPeriod: 12,
            breakEvenPoint: {
              units: 5000,
              revenue: 75000
            },
            riskAssessment: 'Medium'
          };
          
          const mockFunding: FundingOption[] = [
            {
              id: 'self-funding',
              title: 'Self-Funding',
              description: 'Use existing company resources to fund the export initiative',
              pros: ['No debt or equity dilution', 'Complete control over timeline and decisions', 'No application process'],
              cons: ['Limited by available cash reserves', 'Opportunity cost of capital', 'All risk borne by the company'],
              suitability: 'High',
              applicationProcess: 'N/A - Internal decision and allocation of funds'
            },
            {
              id: 'export-grant',
              title: 'Export Development Grant',
              description: 'Government grant program to support export market development',
              pros: ['Non-repayable funding', 'Additional credibility', 'Access to government resources and networks'],
              cons: ['Competitive application process', 'Reporting requirements', 'Specific eligibility criteria'],
              suitability: 'Medium',
              applicationProcess: 'Submit application with export plan, financial projections, and market research. 6-8 week review process.'
            },
            {
              id: 'trade-finance',
              title: 'Trade Finance Loan',
              description: 'Specialized loan for international trade activities',
              pros: ['Designed specifically for export activities', 'Flexible repayment terms', 'Can cover various export costs'],
              cons: ['Interest costs', 'May require collateral', 'Application and approval process'],
              suitability: 'High',
              applicationProcess: 'Apply through banks or specialized trade finance institutions. Requires business plan, financial statements, and export contracts.'
            }
          ];
          
          // Transform API response to our internal format
          const resources = transformResourceData(mockResourceData);
          
          setResourceEstimate(resources);
          setRoiEstimate(mockROI);
          setFundingOptions(mockFunding);
          
          if (mockFunding.length > 0) {
            setSelectedFundingOption(mockFunding[0].id);
          }
          
          // Set the custom budget initial value to the recommended budget
          if (resources) {
            setCustomBudget(resources.totalCost);
          }
          
          setLoading(false);
        } else {
          // Fetch resource estimates from the API
          const resourcesData = await analysisService.getResourceEstimate(industry, markets, timelineOption);
          const roi = await analysisService.getROIEstimate(industry, markets, timelineOption);
          const funding = await analysisService.getFundingOptions(industry, markets);
          
          // Transform API response to our internal format
          const resources = transformResourceData(resourcesData);
          
          setResourceEstimate(resources);
          setRoiEstimate(roi);
          setFundingOptions(funding);
          
          if (funding.length > 0) {
            setSelectedFundingOption(funding[0].id);
          }
          
          // Set the custom budget initial value to the recommended budget
          if (resources) {
            setCustomBudget(resources.totalCost);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching resource estimates:', error);
        setError('Failed to load resource estimates. Please try again.');
        setLoading(false);
      }
    };
    
    fetchResourceEstimates();
  }, [useMockData]);

  const handleBudgetViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'recommended' | 'custom'
  ) => {
    if (newView !== null) {
      setBudgetView(newView);
    }
  };

  const handleCustomBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === '' || !isNaN(Number(value))) {
      setCustomBudget(value === '' ? '' : Number(value));
    }
  };

  const handleFundingOptionChange = (optionId: string) => {
    setSelectedFundingOption(optionId);
  };

  const handleContinue = () => {
    // Save the resource planning data to localStorage
    const savedData = localStorage.getItem('tradewizard_user_data');
    const userData = savedData ? JSON.parse(savedData) : {};
    
    userData.selectedBudget = budgetView === 'recommended' 
      ? resourceEstimate?.totalCost 
      : customBudget;
    userData.budgetType = budgetView;
    userData.selectedFundingOption = selectedFundingOption;
    
    localStorage.setItem('tradewizard_user_data', JSON.stringify(userData));
    
    // Continue to the next step
    onContinue();
  };

  const renderResourceBreakdown = () => {
    if (!resourceEstimate) return null;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Resource Breakdown
        </Typography>
        
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Category</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Details</Typography></TableCell>
                <TableCell align="right"><Typography variant="subtitle2">Cost</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resourceEstimate.staffing.map((item: StaffingItem, index: number) => (
                <TableRow key={`staff-${index}`}>
                  {index === 0 && (
                    <TableCell rowSpan={resourceEstimate.staffing.length}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PeopleIcon color="primary" sx={{ mr: 1 }} />
                        <Typography>Personnel</Typography>
                      </Box>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2">
                      {item.role} ({item.type === 'internal' ? 'Internal' : 'External'})
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">${item.cost.toLocaleString()}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              
              {resourceEstimate.materials.map((item: MaterialItem, index: number) => (
                <TableRow key={`material-${index}`}>
                  {index === 0 && (
                    <TableCell rowSpan={resourceEstimate.materials.length}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MoneyIcon color="primary" sx={{ mr: 1 }} />
                        <Typography>Materials</Typography>
                      </Box>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2">{item.name}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">${item.cost.toLocaleString()}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              
              {resourceEstimate.services.map((item: ServiceItem, index: number) => (
                <TableRow key={`service-${index}`}>
                  {index === 0 && (
                    <TableCell rowSpan={resourceEstimate.services.length}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MoneyIcon color="primary" sx={{ mr: 1 }} />
                        <Typography>Services</Typography>
                      </Box>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2">{item.name}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">${item.cost.toLocaleString()}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              
              <TableRow>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                  <Typography variant="subtitle1">Total Estimated Budget</Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  <Typography variant="subtitle1">${resourceEstimate.totalCost.toLocaleString()}</Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Estimated timeframe for resource allocation: {resourceEstimate.timeframe}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderROIProjection = () => {
    if (!roiEstimate) return null;
    
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          ROI Projection
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Financial Returns</Typography>
                  </Box>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Investment:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        ${roiEstimate.investmentAmount.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Projected Returns (24 months):
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        ${roiEstimate.projectedReturns.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Projected ROI:
                      </Typography>
                      <Typography variant="body1" fontWeight={500} color="success.main">
                        {roiEstimate.projectedROI}%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimeIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Timeline & Risk</Typography>
                  </Box>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Payback Period:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {roiEstimate.paybackPeriod} months
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Break-Even Point:
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {roiEstimate.breakEvenPoint.units.toLocaleString()} units (${roiEstimate.breakEvenPoint.revenue.toLocaleString()} revenue)
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Risk Assessment:
                      </Typography>
                      <Chip 
                        label={roiEstimate.riskAssessment} 
                        color={
                          roiEstimate.riskAssessment === "Low" ? "success" : 
                          roiEstimate.riskAssessment === "Medium" ? "warning" : 
                          "error"
                        }
                        size="small"
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  const renderBudgetPlanner = () => {
    if (!resourceEstimate) return null;
    
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Budget Planner
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <ToggleButtonGroup
              value={budgetView}
              exclusive
              onChange={handleBudgetViewChange}
              aria-label="budget view"
              fullWidth
            >
              <ToggleButton value="recommended">
                Recommended Budget
              </ToggleButton>
              <ToggleButton value="custom">
                Custom Budget
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {budgetView === 'recommended' ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="primary" gutterBottom>
                ${resourceEstimate.totalCost.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recommended budget based on your selected markets, products, and timeline
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <TextField
                label="Custom Budget"
                value={customBudget}
                onChange={handleCustomBudgetChange}
                variant="outlined"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ width: '200px' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Enter your planned export budget
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  const renderFundingOptions = () => {
    if (fundingOptions.length === 0) return null;
    
    const selectedOption = fundingOptions.find(option => option.id === selectedFundingOption);
    
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Funding Options
        </Typography>
        
        <Grid container spacing={2}>
          {fundingOptions.map((option: FundingOption) => (
            <Grid item xs={12} md={4} key={option.id}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  borderColor: selectedFundingOption === option.id ? 'primary.main' : 'divider',
                  borderWidth: selectedFundingOption === option.id ? 2 : 1,
                  backgroundColor: selectedFundingOption === option.id ? 'rgba(25, 118, 210, 0.05)' : 'white'
                }}
                onClick={() => handleFundingOptionChange(option.id)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">{option.title}</Typography>
                    <Chip 
                      size="small" 
                      label={`Suitability: ${option.suitability}`}
                      color={
                        option.suitability === "High" ? "success" : 
                        option.suitability === "Medium" ? "warning" : 
                        "error"
                      }
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {option.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {selectedOption && (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{selectedOption.title} Details</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Pros</Typography>
                  <ul>
                    {selectedOption.pros.map((pro: string, index: number) => (
                      <li key={`pro-${index}`}><Typography variant="body2">{pro}</Typography></li>
                    ))}
                  </ul>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Cons</Typography>
                  <ul>
                    {selectedOption.cons.map((con: string, index: number) => (
                      <li key={`con-${index}`}><Typography variant="body2">{con}</Typography></li>
                    ))}
                  </ul>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>Application Process</Typography>
                  <Typography variant="body2">
                    {selectedOption.applicationProcess}
                  </Typography>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Resource Planning & Funding
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {renderBudgetPlanner()}
        <Divider sx={{ my: 3 }} />
        {renderResourceBreakdown()}
        <Divider sx={{ my: 3 }} />
        {renderROIProjection()}
        <Divider sx={{ my: 3 }} />
        {renderFundingOptions()}
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        {onBack && (
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            onClick={onBack}
          >
            Back
          </Button>
        )}
        <Button
          variant="contained"
          endIcon={<NavigateNext />}
          onClick={handleContinue}
          sx={{ ml: 'auto' }}
        >
          Complete Setup
        </Button>
      </Box>
    </Box>
  );
};

export default ResourcePlanning; 