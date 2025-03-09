import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Button,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { DescriptionOutlined, NavigateNext, NavigateBefore } from '@mui/icons-material';
import analysisService from '../../../services/analysis-service';

// Types
interface Document {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  estimatedCost: number;
  estimatedTimeInWeeks: number;
  details: string;
}

interface MarketDocuments {
  [key: string]: Document[];
}

interface RegulatoryAssessmentProps {
  markets: string[];
  onContinue: () => void;
  onBack?: () => void;
}

const RegulatoryAssessment: React.FC<RegulatoryAssessmentProps> = ({ markets, onContinue, onBack }) => {
  const [currentMarket, setCurrentMarket] = useState<string>(markets[0] || '');
  const [documentsData, setDocumentsData] = useState<{ [key: string]: { documents: Document[] } }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State to track which documents the user already owns
  const [ownedDocuments, setOwnedDocuments] = useState<Record<string, boolean>>({});
  
  // Total estimates for selected documents
  const [totalEstimates, setTotalEstimates] = useState<{
    cost: number;
    timeInWeeks: number;
  }>({
    cost: 0,
    timeInWeeks: 0
  });

  // Load the regulatory requirements from the API
  useEffect(() => {
    const fetchRequirements = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user's industry or default to Food Products
        const industry = 'Food Products';
        
        // Fetch the regulatory requirements from the API
        const requirementsData = await analysisService.getRegulatoryRequirements(industry, markets);
        
        setDocumentsData(requirementsData.markets);
        
        // Initialize owned documents state from defaults
        const initialOwnedState: Record<string, boolean> = {};
        
        // Initialize all documents as not owned
        Object.values(requirementsData.markets).forEach(marketDocs => {
          marketDocs.documents.forEach(doc => {
            initialOwnedState[doc.id] = false;
          });
        });
        
        setOwnedDocuments(initialOwnedState);
        
        // Calculate initial totals
        updateTotals(initialOwnedState);
        
      } catch (err) {
        console.error('Error fetching regulatory requirements:', err);
        setError('Failed to load regulatory requirements. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequirements();
  }, [markets]);
  
  // Update totals whenever owned documents change
  const updateTotals = (owned: Record<string, boolean>) => {
    let totalCost = 0;
    let totalTime = 0;
    
    // Calculate totals for all markets
    Object.values(documentsData).forEach(marketData => {
      const result = calculateTotals(owned, marketData.documents);
      totalCost += result.cost;
      totalTime = Math.max(totalTime, result.timeInWeeks); // Use the longest timeline
    });
    
    setTotalEstimates({
      cost: totalCost,
      timeInWeeks: totalTime
    });
  };

  const handleMarketChange = (_event: React.SyntheticEvent, newValue: string) => {
    setCurrentMarket(newValue);
  };

  const handleDocumentToggle = (docId: string) => {
    const newOwnedDocuments = {
      ...ownedDocuments,
      [docId]: !ownedDocuments[docId]
    };
    
    setOwnedDocuments(newOwnedDocuments);
    updateTotals(newOwnedDocuments);
    
    // If we had user context, we would store it there
    // For now, just update the local state
  };

  const calculateTotals = (owned: Record<string, boolean>, docs: Document[]) => {
    let cost = 0;
    let timeInWeeks = 0;

    // Filter to only consider documents that are not already owned
    const neededDocs = docs.filter(doc => !owned[doc.id]);
    
    // Sum up costs and find max time (assuming parallel processing)
    neededDocs.forEach(doc => {
      cost += doc.estimatedCost;
      timeInWeeks = Math.max(timeInWeeks, doc.estimatedTimeInWeeks);
    });

    return { cost, timeInWeeks };
  };

  const getCompletionPercentage = (): number => {
    if (!documentsData[currentMarket]) return 0;
    
    const marketDocs = documentsData[currentMarket]?.documents || [];
    const totalDocs = marketDocs.length;
    if (totalDocs === 0) return 100;
    
    const ownedDocs = marketDocs
      .filter(doc => ownedDocuments[doc.id])
      .length;
      
    return Math.round((ownedDocs / totalDocs) * 100);
  };

  const getImportanceColor = (importance: string): string => {
    switch (importance) {
      case 'critical': return '#f44336'; // red
      case 'high': return '#ff9800'; // orange
      case 'medium': return '#2196f3'; // blue
      case 'low': return '#4caf50'; // green
      default: return '#9e9e9e'; // grey
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading regulatory requirements...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={onContinue}>
          Continue Anyway
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Regulatory Requirements Assessment
      </Typography>
      
      <Typography variant="body1" paragraph>
        Review the documentation requirements for each of your target markets. Check off any documents you already have.
      </Typography>
      
      {/* Market selector tabs */}
      <Tabs
        value={currentMarket}
        onChange={handleMarketChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        {markets.map((market) => (
          <Tab
            key={market}
            label={market}
            value={market}
            sx={{
              minWidth: '120px',
              '&.Mui-selected': {
                fontWeight: 'bold',
              }
            }}
          />
        ))}
      </Tabs>
      
      {/* Completion progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Completion</Typography>
          <Typography variant="body2">{getCompletionPercentage()}%</Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={getCompletionPercentage()} 
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>
      
      {/* Document list */}
      {documentsData[currentMarket] && documentsData[currentMarket].documents && documentsData[currentMarket].documents.length > 0 ? (
        <List>
          {documentsData[currentMarket].documents.map((doc) => (
            <Paper 
              key={doc.id}
              elevation={1} 
              sx={{ 
                mb: 2,
                border: ownedDocuments[doc.id] ? '1px solid #4caf50' : 'none',
                backgroundColor: ownedDocuments[doc.id] ? 'rgba(76, 175, 80, 0.05)' : 'white'
              }}
            >
              <ListItem>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={ownedDocuments[doc.id] || false}
                    onChange={() => handleDocumentToggle(doc.id)}
                    color="primary"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DescriptionOutlined sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle1">{doc.name}</Typography>
                      <Chip 
                        label={doc.importance}
                        size="small"
                        sx={{ 
                          ml: 1, 
                          backgroundColor: getImportanceColor(doc.importance),
                          color: 'white',
                          fontWeight: 'bold'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" paragraph>{doc.description}</Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip 
                          label={`Est. Cost: $${doc.estimatedCost}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip 
                          label={`Est. Time: ${doc.estimatedTimeInWeeks} weeks`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {doc.details}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          No regulatory requirements found for {currentMarket}.
        </Typography>
      )}
      
      {/* Summary Card */}
      <Paper elevation={3} sx={{ p: 3, mb: 3, mt: 4, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Estimated total cost for required documents:
            </Typography>
            <Typography variant="h6" color="primary">
              ${totalEstimates.cost.toLocaleString()}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Estimated timeline for completion:
            </Typography>
            <Typography variant="h6" color="primary">
              {totalEstimates.timeInWeeks} weeks
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
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

export default RegulatoryAssessment; 