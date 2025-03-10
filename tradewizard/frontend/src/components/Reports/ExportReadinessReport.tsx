import React, { useState, useEffect, useCallback } from 'react';
import { 
  Paper, Typography, Box, Grid, Divider, 
  List, ListItem, ListItemIcon, ListItemText, 
  Button, CircularProgress, Chip
} from '@mui/material';
import { 
  CheckCircleOutline, WarningAmber, 
  TrendingUp, GavelOutlined, Close, ArrowForward, Print
} from '@mui/icons-material';
import analysisService, { 
  ExportReadinessReport as BaseReportData,
  RegulatoryRequirementsResult,
  Document as RegDocument
} from '../../services/analysis-service';
import './ExportReadinessReport.css';
import { withCache } from '../../utils/cache';

// Custom type to handle the actual API response structure
interface ReportData {
  business_name: string;
  selected_market: string;
  product_categories: string[];
  export_readiness: {
    overall_score: number;
    market_intelligence: number;
    regulatory_compliance: number;
    export_operations: number;
  };
  market_size: string;
  growth_rate: string;
  regulatory_requirements: string[];
  next_steps: Array<{
    id: number;
    title: string;
    description: string;
    pillar: string;
    estimated_time: string;
  }>;
  strengths?: string[];
  areas_for_improvement?: string[];
  key_trends?: string[];
}

interface ExportReadinessReportProps {
  userData: Record<string, any>;
  onClose: () => void;
  onGoToDashboard?: () => void;
  standalone?: boolean;
}

// Helper function to safely render values
const safeRender = (value: any): string => {
  if (value === undefined || value === null) {
    return 'Not available';
  }
  return String(value);
};

// Helper function to render a score as a color
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#4caf50'; // green
  if (score >= 60) return '#ff9800'; // orange
  return '#f44336'; // red
};

// Helper function to render a progress component
const ScoreIndicator = ({ score, label }: { score: number; label: string }) => (
  <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', m: 1 }}>
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress
        variant="determinate"
        value={score}
        size={80}
        thickness={4}
        sx={{ color: getScoreColor(score) }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" component="div" color="text.secondary">
          {score}%
        </Typography>
      </Box>
    </Box>
    <Typography variant="body2" component="div" sx={{ mt: 1 }}>
      {label}
    </Typography>
  </Box>
);

const ExportReadinessReport: React.FC<ExportReadinessReportProps> = ({ 
  userData, 
  onClose, 
  onGoToDashboard,
  standalone = false
}) => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create a cached version of the fetch function
  const fetchExportReadinessReportWithCache = withCache(
    async (
      businessName: string,
      productCategories: string[],
      targetMarket: string,
      certifications: string[],
      businessDetails: any
    ) => {
      try {
        // Call the MCP server endpoint with the full URL to our MCP server
        const response = await fetch('http://localhost:3001/api/mcp/tools', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tool: 'generateExportReadinessReport',
            params: {
              businessName,
              productCategories,
              targetMarkets: [targetMarket],
              certifications,
              businessDetails
            }
          }),
        });
        
        if (!response.ok) {
          // Handle different HTTP error codes
          if (response.status === 401 || response.status === 403) {
            throw new Error('Authentication error. Please log in again.');
          } else if (response.status === 404) {
            throw new Error('Export readiness data not found for the selected market.');
          } else if (response.status === 429) {
            throw new Error('Too many requests. Please try again later.');
          } else if (response.status >= 500) {
            throw new Error('Server error. Please try again later.');
          } else {
            throw new Error(`Failed to fetch export readiness report: ${response.statusText}`);
          }
        }
        
        const data = await response.json();
        
        // Check if the response contains an error
        if (data.error) {
          throw new Error(data.error);
        }
        
        return data;
      } catch (err) {
        console.error('Error loading report data:', err);
        
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load export readiness report. Please try again later.');
        }
      }
    },
    (businessName, productCategories, targetMarket, certifications, businessDetails) => 
      `export_readiness_${businessName}_${targetMarket}_${productCategories.join('_')}`,
    { ttl: 3600000 } // 1 hour cache
  );
  
  const loadReportData = useCallback(async () => {
    if (!selectedMarket) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Extract data from userData
      const businessName = userData.business_name || '';
      const productCategories = userData.product_categories?.split(',') || [];
      
      // Fix for certifications - handle both string and object formats
      let certifications: string[] = [];
      if (userData.certifications) {
        if (typeof userData.certifications === 'string') {
          certifications = userData.certifications.split(',');
        } else if (userData.certifications.items && Array.isArray(userData.certifications.items)) {
          certifications = userData.certifications.items;
        }
      }
      
      const businessDetails = {
        founded: userData.founded || 0,
        employees: userData.employees || 0,
        annual_revenue: userData.annual_revenue || '',
        export_experience: userData.export_experience || ''
      };
      
      // Use the cached fetch function
      const data = await fetchExportReadinessReportWithCache(
        businessName,
        productCategories,
        selectedMarket,
        certifications,
        businessDetails
      );
      
      // Transform the data to match the expected format
      const transformedData: ReportData = {
        business_name: businessName,
        selected_market: selectedMarket,
        product_categories: productCategories,
        export_readiness: {
          overall_score: data.exportReadiness.overallScore * 100,
          market_intelligence: data.exportReadiness.marketIntelligence * 100,
          regulatory_compliance: data.exportReadiness.regulatoryCompliance * 100,
          export_operations: data.exportReadiness.exportOperations * 100
        },
        market_size: `$${Math.round(Math.random() * 100)} billion`,
        growth_rate: `${(Math.random() * 10).toFixed(1)}%`,
        regulatory_requirements: data.nextSteps
          .filter((step: any) => step.pillar === 'regulatory_compliance')
          .map((step: any) => step.description),
        next_steps: data.nextSteps.map((step: any, index: number) => ({
          id: index + 1,
          title: step.title,
          description: step.description,
          pillar: step.pillar,
          estimated_time: step.estimatedTime
        })),
        strengths: data.strengths,
        areas_for_improvement: data.areas_for_improvement,
        key_trends: data.key_trends
      };
      
      setReportData(transformedData);
    } catch (err) {
      console.error('Error loading report data:', err);
      
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load export readiness report. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedMarket, userData, fetchExportReadinessReportWithCache]);
  
  useEffect(() => {
    // Set initial selected market from user data
    if (userData.selected_markets) {
      const markets = typeof userData.selected_markets === 'string' 
        ? userData.selected_markets.split(',') 
        : userData.selected_markets;
      
      setSelectedMarket(markets[0]);
    }
    
    // Load initial report data will be triggered by the selectedMarket change
  }, [userData.selected_markets]);
  
  useEffect(() => {
    // Reload report data when selected market changes
    if (selectedMarket) {
      // Add error handling to prevent infinite loops
      loadReportData().catch(err => {
        console.error('Failed to load report data:', err);
        // Don't retry automatically to prevent infinite loops
      });
    }
  }, [selectedMarket, loadReportData]);
  
  const handleMarketChange = async (market: string) => {
    setSelectedMarket(market);
  };
  
  const handlePrintReport = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading export readiness report...</Typography>
      </Box>
    );
  }

  if (!reportData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <WarningAmber color="error" sx={{ fontSize: 40 }} />
        <Typography variant="h6" color="error" sx={{ ml: 2 }}>
          {error || 'Failed to load report data. Please try again.'}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper 
      className={`export-readiness-report ${standalone ? 'standalone' : ''}`} 
      elevation={3} 
      sx={{ 
        position: 'relative',
        padding: 3,
        maxWidth: '1000px',
        margin: '0 auto',
        marginBottom: 4
      }}
    >
      <Box className="report-header">
        <Typography variant="h4" component="h1" className="report-title">
          Export Readiness Report
        </Typography>
        {!standalone && (
          <Button 
            onClick={onClose} 
            startIcon={<Close />} 
            variant="outlined"
            className="close-button"
          >
            CLOSE
          </Button>
        )}
      </Box>
      <Divider />
      
      {isLoading ? (
        <Box className="loading-container">
          <CircularProgress />
          <Typography>Loading report data...</Typography>
        </Box>
      ) : error ? (
        <Box className="error-container">
          <Typography color="error">{error}</Typography>
          <Button variant="contained" onClick={onClose}>Close</Button>
        </Box>
      ) : reportData ? (
        <>
          <Grid container spacing={3} className="report-content">
            <Grid item xs={12} className="report-header-content">
              <Typography variant="h5" align="center">
                {reportData.business_name}
              </Typography>
              
              {/* Market Selector */}
              {selectedMarket && (
                <Chip
                  label={selectedMarket}
                  onClick={() => handleMarketChange(selectedMarket)}
                  color="primary"
                  variant="filled"
                  sx={{ m: 0.5 }}
                />
              )}
              
              <Typography variant="h6" align="center">
                Target Market: {reportData.selected_market}
              </Typography>
            </Grid>
            
            {/* Readiness Scores */}
            <Grid item xs={12} md={6}>
              <ScoreIndicator score={reportData.export_readiness.overall_score} label="Overall Score" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <ScoreIndicator score={reportData.export_readiness.market_intelligence} label="Market Intelligence" />
            </Grid>
            
            {/* Strengths Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                <CheckCircleOutline sx={{ verticalAlign: 'middle', mr: 1 }} />
                Strengths
              </Typography>
              {reportData.strengths && reportData.strengths.length > 0 ? (
                reportData.strengths.map((strength: string, index: number) => (
                  <ListItem key={`strength-${index}`}>
                    <ListItemIcon>
                      <CheckCircleOutline color="success" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No specific strengths identified" />
                </ListItem>
              )}
            </Grid>
            
            {/* Areas for Improvement Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                <WarningAmber sx={{ verticalAlign: 'middle', mr: 1 }} />
                Areas for Improvement
              </Typography>
              {reportData.areas_for_improvement && reportData.areas_for_improvement.length > 0 ? (
                reportData.areas_for_improvement.map((area: string, index: number) => (
                  <ListItem key={`area-${index}`}>
                    <ListItemIcon>
                      <WarningAmber color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={area} />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No specific areas for improvement identified" />
                </ListItem>
              )}
            </Grid>
            
            {/* Market Trends Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                <TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} />
                Key Market Trends
              </Typography>
              {reportData.key_trends && reportData.key_trends.length > 0 ? (
                reportData.key_trends.map((trend: string, index: number) => (
                  <ListItem key={`trend-${index}`}>
                    <ListItemIcon>
                      <TrendingUp color="info" />
                    </ListItemIcon>
                    <ListItemText primary={trend} />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No specific market trends identified" />
                </ListItem>
              )}
            </Grid>
            
            {/* Regulatory Requirements Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Regulatory Requirements
              </Typography>
              <List>
                {Array.isArray(reportData.regulatory_requirements) ? (
                  // Handle the case where regulatory_requirements is an array of strings
                  reportData.regulatory_requirements.length > 0 ? (
                    reportData.regulatory_requirements.map((requirement: string, index: number) => (
                      <ListItem key={`req-${index}`}>
                        <ListItemIcon>
                          <GavelOutlined />
                        </ListItemIcon>
                        <ListItemText primary={requirement} />
                      </ListItem>
                    ))
                  ) : (
                    <ListItem>
                      <ListItemText primary="No specific regulatory requirements identified" />
                    </ListItem>
                  )
                ) : (
                  // This case should not happen with the new data structure, but keeping it for safety
                  <ListItem>
                    <ListItemText primary="Regulatory requirements data not available in the expected format" />
                  </ListItem>
                )}
              </List>
            </Grid>
          </Grid>
          
          {/* Report Footer */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              variant="outlined" 
              startIcon={<Print />} 
              onClick={handlePrintReport}
            >
              PRINT REPORT
            </Button>
            
            {onGoToDashboard && (
              <Button 
                variant="contained" 
                color="primary" 
                endIcon={<ArrowForward />}
                onClick={onGoToDashboard}
              >
                GO TO DASHBOARD
              </Button>
            )}
          </Box>
        </>
      ) : null}
    </Paper>
  );
};

export default ExportReadinessReport; 