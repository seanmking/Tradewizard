import React, { useState, useEffect } from 'react';
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

// Custom type to handle the actual API response structure
interface ReportData extends Omit<BaseReportData, 'regulatory_requirements'> {
  regulatory_requirements: string[] | RegulatoryRequirementsResult;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [currentMarket, setCurrentMarket] = useState<string>('');

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all selected markets
        let markets: string[] = [];
        
        // Check both versions of the property name
        if (Array.isArray(userData.selectedMarkets)) {
          markets = userData.selectedMarkets;
          console.log("Using selectedMarkets array:", markets);
        } else if (typeof userData.selectedMarkets === 'string') {
          markets = userData.selectedMarkets.split(',').map((m: string) => m.trim()).filter(Boolean);
          console.log("Using selectedMarkets string:", markets);
        } else if (Array.isArray(userData.selected_markets)) {
          markets = userData.selected_markets;
          console.log("Using selected_markets array:", markets);
        } else if (typeof userData.selected_markets === 'string') {
          markets = userData.selected_markets.split(',').map((m: string) => m.trim()).filter(Boolean);
          console.log("Using selected_markets string:", markets);
        }
        
        // Ensure that all our target markets are included
        const targetMarkets = ["United Kingdom", "United Arab Emirates", "United States"];
        const missingMarkets = targetMarkets.filter(m => !markets.includes(m));
        
        if (missingMarkets.length > 0) {
          console.log("Adding missing markets:", missingMarkets);
          markets = [...markets, ...missingMarkets];
        }
        
        setSelectedMarkets(markets);
        
        if (!markets.length) {
          setError('No target markets selected');
          setLoading(false);
          return;
        }
        
        // Set the first market as current by default
        const targetMarket = markets[0];
        setCurrentMarket(targetMarket);
        
        console.log('Loading market data for:', targetMarket);
        
        // Call the API to get market data
        const marketData = await analysisService.getExportReadinessReport(userData, targetMarket);
        
        console.log('Market data received:', marketData);
        setReportData(marketData);
      } catch (err) {
        console.error('Error loading market data:', err);
        setError('Failed to load market data. Please try again later.');
        
        // Determine the market for fallback data
        const fallbackMarket = 
          Array.isArray(userData.selectedMarkets) && userData.selectedMarkets.length > 0
            ? userData.selectedMarkets[0]
            : (userData.selected_markets || '').split(',')[0].trim() || 'Target Market';
        
        // Set fallback data for demo purposes
        setReportData({
          company_name: userData.business_name || 'Your Company',
          target_market: fallbackMarket,
          analysis_date: new Date().toISOString().split('T')[0],
          market_fit_score: 75,
          regulatory_readiness: 60,
          strengths: ['Quality products', 'Established domestic presence', 'Strong brand values'],
          areas_for_improvement: ['International certifications needed', 'Export documentation experience', 'International marketing strategy'],
          key_trends: [],
          regulatory_requirements: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadMarketData();
  }, [userData]);

  // Add this useEffect to ensure visibility when component mounts
  useEffect(() => {
    // Ensure report is visible when component mounts
    const reportElement = document.querySelector('.export-readiness-report');
    if (reportElement) {
      // Force visibility
      (reportElement as HTMLElement).style.display = 'block';
      (reportElement as HTMLElement).style.visibility = 'visible';
      (reportElement as HTMLElement).style.opacity = '1';
      console.log("Report visibility enforced on mount");
    }
  }, []); // Empty dependency array ensures this runs once on mount

  // Function to handle printing the report
  const handlePrintReport = () => {
    window.print();
  };

  const handleMarketChange = async (market: string) => {
    if (market === currentMarket) return;
    
    setLoading(true);
    setCurrentMarket(market);
    
    try {
      console.log('Switching to market data for:', market);
      
      // Call the API to get market data for the new market
      const response = await analysisService.getExportReadinessReport(
        userData,
        market
      );
      
      console.log('Market data received:', response);
      setReportData(response);
    } catch (err: any) {
      console.error('Error loading market data:', err);
      setError(err.message || 'Failed to load market data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
      
      {loading ? (
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
                {reportData.company_name}
              </Typography>
              
              {/* Market Selector */}
              {selectedMarkets.length > 1 && (
                <Box sx={{ mt: 2, mb: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    Select Market:
                  </Typography>
                  {selectedMarkets.map((market) => (
                    <Chip
                      key={market}
                      label={market}
                      onClick={() => handleMarketChange(market)}
                      color={market === currentMarket ? "primary" : "default"}
                      variant={market === currentMarket ? "filled" : "outlined"}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>
              )}
              
              <Typography variant="h6" align="center">
                Target Market: {reportData.target_market}
              </Typography>
              <Typography variant="subtitle1" align="center">
                Analysis Date: {reportData.analysis_date}
              </Typography>
            </Grid>
            
            {/* Readiness Scores */}
            <Grid item xs={12} md={6}>
              <ScoreIndicator score={reportData.market_fit_score} label="Market Fit" />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <ScoreIndicator score={reportData.regulatory_readiness} label="Regulatory Readiness" />
            </Grid>
            
            {/* Strengths Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                <CheckCircleOutline sx={{ verticalAlign: 'middle', mr: 1 }} />
                Strengths
              </Typography>
              <List>
                {reportData.strengths.map((strength, index) => (
                  <ListItem key={`strength-${index}`}>
                    <ListItemIcon>
                      <CheckCircleOutline color="success" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            
            {/* Areas for Improvement Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                <WarningAmber sx={{ verticalAlign: 'middle', mr: 1 }} />
                Areas for Improvement
              </Typography>
              <List>
                {reportData.areas_for_improvement.map((area, index) => (
                  <ListItem key={`area-${index}`}>
                    <ListItemIcon>
                      <WarningAmber color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={area} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            
            {/* Market Trends Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                <TrendingUp sx={{ verticalAlign: 'middle', mr: 1 }} />
                Key Market Trends
              </Typography>
              <List>
                {reportData.key_trends.map((trend, index) => (
                  <ListItem key={`trend-${index}`}>
                    <ListItemIcon>
                      <TrendingUp color="info" />
                    </ListItemIcon>
                    <ListItemText primary={trend} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            
            {/* Regulatory Requirements Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                <GavelOutlined sx={{ verticalAlign: 'middle', mr: 1 }} />
                Regulatory Requirements
              </Typography>
              <List>
                {reportData.regulatory_requirements && 
                 !Array.isArray(reportData.regulatory_requirements) && 
                 'markets' in reportData.regulatory_requirements ? (
                  // Handle the case where regulatory_requirements is an object with markets property
                  Object.entries(reportData.regulatory_requirements.markets).map(([market, marketData], marketIndex) => {
                    // Type assertion for marketData
                    const typedMarketData = marketData as { documents: RegDocument[] };
                    return (
                      <React.Fragment key={`market-${marketIndex}`}>
                        <ListItem>
                          <ListItemIcon>
                            <GavelOutlined color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={`${market} Requirements`} 
                            secondary="Regulatory documents needed:" 
                          />
                        </ListItem>
                        {typedMarketData.documents && typedMarketData.documents.map((doc, docIndex) => (
                          <ListItem key={`doc-${docIndex}`} sx={{ pl: 6 }}>
                            <ListItemIcon>
                              <GavelOutlined color="info" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={doc.name} 
                              secondary={doc.description}
                            />
                          </ListItem>
                        ))}
                      </React.Fragment>
                    );
                  })
                ) : reportData.regulatory_requirements && Array.isArray(reportData.regulatory_requirements) ? (
                  // Handle the case where regulatory_requirements is an array (per the interface)
                  reportData.regulatory_requirements.map((req, index) => (
                    <ListItem key={`req-${index}`}>
                      <ListItemIcon>
                        <GavelOutlined color="info" />
                      </ListItemIcon>
                      <ListItemText primary={req} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No regulatory requirements information available" />
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