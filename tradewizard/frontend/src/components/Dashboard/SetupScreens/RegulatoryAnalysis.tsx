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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Description as DocumentIcon,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import analysisService, { RegulatoryRequirement, ComplianceStatus, Document } from '../../../services/analysis-service';

interface RegulatoryAnalysisProps {
  onContinue: () => void;
  onBack?: () => void;
  useMockData?: boolean;
}

const RegulatoryAnalysis: React.FC<RegulatoryAnalysisProps> = ({ onContinue, onBack, useMockData = false }) => {
  const [requirements, setRequirements] = useState<RegulatoryRequirement[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [overallCompliance, setOverallCompliance] = useState<number>(0);

  // Load regulatory requirements from the API
  useEffect(() => {
    const fetchRegulatoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get cached markets and other user data from localStorage
        const savedData = localStorage.getItem('tradewizard_user_data');
        const userData = savedData ? JSON.parse(savedData) : {};
        
        const markets = userData.selectedMarkets || ['United Kingdom'];
        const industry = userData.industry || 'Food Products';
        
        console.log(`Fetching regulatory data for markets: ${markets}, industry: ${industry}, useMockData: ${useMockData}`);
        
        if (useMockData) {
          console.log("Using mock regulatory data");
          // Use mock data
          const mockRequirements: RegulatoryRequirement[] = [
            {
              category: 'Food Safety',
              requirements: [
                'Food Safety Management System (HACCP)',
                'Product Labeling Requirements',
                'Nutritional Information Compliance'
              ],
              complexity: 'High',
              timeToObtain: '3-4 months',
              estimatedCost: 5000
            },
            {
              category: 'Import Regulations',
              requirements: [
                'Import License',
                'Customs Registration',
                'Tariff Classification'
              ],
              complexity: 'Medium',
              timeToObtain: '1-2 months',
              estimatedCost: 2500
            },
            {
              category: 'Product Standards',
              requirements: [
                'Quality Certification',
                'Packaging Requirements',
                'Product Testing'
              ],
              complexity: 'Medium',
              timeToObtain: '2-3 months',
              estimatedCost: 3500
            }
          ];
          
          const mockComplianceStatus: ComplianceStatus[] = [
            {
              requirement: 'Food Safety Management System (HACCP)',
              status: 'In Progress',
              progress: 40,
              nextSteps: ['Complete documentation', 'Schedule audit', 'Implement corrective actions']
            },
            {
              requirement: 'Product Labeling Requirements',
              status: 'Not Started',
              progress: 0,
              nextSteps: ['Review target market requirements', 'Design compliant labels', 'Verify with regulatory expert']
            },
            {
              requirement: 'Import License',
              status: 'Complete',
              progress: 100
            }
          ];
          
          const mockDocuments: Document[] = [
            {
              id: 'doc-1',
              name: 'Health Certificate',
              description: 'Official document certifying that the products are fit for human consumption',
              importance: 'critical',
              estimatedCost: 500,
              estimatedTimeInWeeks: 4,
              details: 'Required for all food products entering the market. Must be issued by authorized government agency.'
            },
            {
              id: 'doc-2',
              name: 'Certificate of Origin',
              description: 'Document certifying the country of origin of the goods',
              importance: 'high',
              estimatedCost: 200,
              estimatedTimeInWeeks: 2,
              details: 'Needed to determine applicable tariffs and trade agreements benefits.'
            },
            {
              id: 'doc-3',
              name: 'Import Permit',
              description: 'Authorization to import specific products into the country',
              importance: 'critical',
              estimatedCost: 350,
              estimatedTimeInWeeks: 6,
              details: 'Must be obtained before shipping. Valid for 6 months from date of issue.'
            }
          ];
          
          setRequirements(mockRequirements);
          setComplianceStatus(mockComplianceStatus);
          setDocuments(mockDocuments);
          
          // Calculate overall compliance
          const totalRequirements = mockComplianceStatus.length;
          const completedRequirements = mockComplianceStatus.filter(item => item.status === 'Complete').length;
          const inProgressRequirements = mockComplianceStatus.filter(item => item.status === 'In Progress');
          const inProgressValue = inProgressRequirements.reduce((sum, item) => sum + (item.progress / 100), 0);
          
          const overallValue = Math.round(((completedRequirements + inProgressValue) / totalRequirements) * 100);
          setOverallCompliance(overallValue);
          
          setLoading(false);
        } else {
          // Fetch regulatory data from the API
          const regulatoryData = await analysisService.getRegulatoryRequirements(industry, markets);
          const complianceData = await analysisService.getComplianceStatus(industry, markets);
          
          // Process the regulatory data
          const allRequirements: RegulatoryRequirement[] = [];
          const allDocuments: Document[] = [];
          
          // Extract requirements and documents from the API response
          Object.keys(regulatoryData.markets).forEach(market => {
            allDocuments.push(...regulatoryData.markets[market].documents);
          });
          
          // Set the data
          setRequirements(allRequirements);
          setDocuments(allDocuments);
          setComplianceStatus(complianceData || []);
          
          // Calculate overall compliance
          if (complianceData && complianceData.length > 0) {
            const totalRequirements = complianceData.length;
            const completedRequirements = complianceData.filter(item => item.status === 'Complete').length;
            const inProgressRequirements = complianceData.filter(item => item.status === 'In Progress');
            const inProgressValue = inProgressRequirements.reduce((sum, item) => sum + (item.progress / 100), 0);
            
            const overallValue = Math.round(((completedRequirements + inProgressValue) / totalRequirements) * 100);
            setOverallCompliance(overallValue);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching regulatory data:', error);
        setError('Failed to load regulatory data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchRegulatoryData();
  }, [useMockData]);

  const renderComplianceOverview = () => {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Export Compliance Overview
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Overall Compliance: {overallCompliance.toFixed(0)}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={overallCompliance} 
              sx={{ 
                height: 10, 
                borderRadius: 5,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 
                    overallCompliance < 40 ? '#f44336' :
                    overallCompliance < 70 ? '#ff9800' : 
                    '#4caf50'
                }
              }}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {overallCompliance < 40 ? 'Significant regulatory gaps to address before export.' :
               overallCompliance < 70 ? 'Making progress, but several requirements still need attention.' :
               'Good progress on compliance. A few requirements remain.'}
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Completed</Typography>
                  </Box>
                  
                  <Typography variant="h5" color="success.main">
                    {complianceStatus.filter(item => item.status === 'Complete').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    requirements fully addressed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">In Progress</Typography>
                  </Box>
                  
                  <Typography variant="h5" color="warning.main">
                    {complianceStatus.filter(item => item.status === 'In Progress').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    requirements being addressed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ErrorIcon color="error" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Not Started</Typography>
                  </Box>
                  
                  <Typography variant="h5" color="error.main">
                    {complianceStatus.filter(item => item.status === 'Not Started').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    requirements to be addressed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  };

  const renderRequirementsList = () => {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Regulatory Requirements
        </Typography>
        
        {requirements.map((req, index) => (
          <Accordion key={index} defaultExpanded={index === 0} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                <Typography variant="subtitle1">{req.category}</Typography>
                <Chip 
                  label={req.complexity} 
                  size="small"
                  color={
                    req.complexity === 'High' ? 'error' :
                    req.complexity === 'Medium' ? 'warning' : 
                    'success'
                  }
                  sx={{ ml: 2 }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2" gutterBottom>Requirements:</Typography>
                  <List dense>
                    {req.requirements.map((item, idx) => {
                      const status = complianceStatus.find(
                        s => s.requirement === item || s.requirement.includes(item)
                      );
                      
                      return (
                        <ListItem key={idx}>
                          <ListItemIcon>
                            {status?.status === 'Complete' ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : status?.status === 'In Progress' ? (
                              <WarningIcon color="warning" fontSize="small" />
                            ) : (
                              <ErrorIcon color="error" fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText 
                            primary={item}
                            secondary={
                              status ? 
                              <Box sx={{ mt: 0.5 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={status.progress} 
                                  sx={{ height: 4, borderRadius: 2 }}
                                />
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                  {status.status}: {status.progress}% complete
                                </Typography>
                              </Box> : 
                              'Not tracked'
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">Estimated Timeline:</Typography>
                      <Typography variant="body2">{req.timeToObtain}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2">Estimated Cost:</Typography>
                      <Typography variant="body2">${req.estimatedCost.toLocaleString()}</Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const renderNextSteps = () => {
    // Find not started and in progress items
    const incompleteItems = complianceStatus.filter(
      item => item.status !== 'Complete'
    );
    
    // Sort by priority (not started first, then by progress)
    incompleteItems.sort((a, b) => {
      if (a.status === 'Not Started' && b.status !== 'Not Started') return -1;
      if (a.status !== 'Not Started' && b.status === 'Not Started') return 1;
      return a.progress - b.progress;
    });
    
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Next Steps
        </Typography>
        
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="subtitle2">Requirement</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
                <TableCell><Typography variant="subtitle2">Next Actions</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incompleteItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DocumentIcon color="primary" sx={{ mr: 1, fontSize: '1.2rem' }} />
                      <Typography variant="body2">{item.requirement}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.status} 
                      size="small"
                      color={
                        item.status === 'In Progress' ? 'warning' : 'error'
                      }
                    />
                    <Box sx={{ mt: 1, width: '100%', maxWidth: 100 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={item.progress} 
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {item.nextSteps ? (
                      <List dense disablePadding>
                        {item.nextSteps.map((step, idx) => (
                          <ListItem key={idx} disablePadding disableGutters>
                            <Typography variant="body2" sx={{ '&:before': { content: '"• "' } }}>
                              {step}
                            </Typography>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2">Start compliance process</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {incompleteItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Box sx={{ py: 2 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: '2rem', mb: 1 }} />
                      <Typography variant="body1">
                        All regulatory requirements are complete!
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
        Regulatory & Compliance Analysis
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {renderComplianceOverview()}
        <Divider sx={{ my: 3 }} />
        {renderRequirementsList()}
        <Divider sx={{ my: 3 }} />
        {renderNextSteps()}
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
          onClick={onContinue}
          sx={{ ml: 'auto' }}
        >
          Continue to Resource Planning
        </Button>
      </Box>
    </Box>
  );
};

export default RegulatoryAnalysis; 