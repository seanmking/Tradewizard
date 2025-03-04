import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  Grid,
  Divider,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  ArrowForward as ArrowForwardIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';

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

// Mock regulatory document data
const marketDocuments: MarketDocuments = {
  'United Kingdom': [
    {
      id: 'uk-1',
      name: 'Certificate of Origin',
      description: 'Document certifying the country of origin of the goods',
      importance: 'critical',
      estimatedCost: 150,
      estimatedTimeInWeeks: 2,
      details: 'Required for all food products. Must be issued by an authorized chamber of commerce. Needs to be renewed annually.'
    },
    {
      id: 'uk-2',
      name: 'Phytosanitary Certificate',
      description: 'Certificate confirming that products are free from pests and diseases',
      importance: 'critical',
      estimatedCost: 200,
      estimatedTimeInWeeks: 3,
      details: 'Required for all plant-based products. Must be issued by the Department of Agriculture. Valid for one shipment only.'
    },
    {
      id: 'uk-3',
      name: 'Health Certificate',
      description: 'Document certifying that products are fit for human consumption',
      importance: 'high',
      estimatedCost: 250,
      estimatedTimeInWeeks: 2,
      details: 'Required for all food products. Must be issued by the Department of Health. Valid for 6 months.'
    },
    {
      id: 'uk-4',
      name: 'BRC Food Safety Certification',
      description: 'Certification demonstrating compliance with UK food safety standards',
      importance: 'high',
      estimatedCost: 3000,
      estimatedTimeInWeeks: 12,
      details: 'Preferred by major UK retailers. Requires on-site audit by accredited certification body. Valid for 1 year.'
    },
    {
      id: 'uk-5',
      name: 'UK Organic Certification',
      description: 'Certification for organic products',
      importance: 'medium',
      estimatedCost: 1500,
      estimatedTimeInWeeks: 8,
      details: 'Required only for products marketed as organic. Must be issued by an approved certification body. Valid for 1 year.'
    }
  ],
  'European Union': [
    {
      id: 'eu-1',
      name: 'EUR.1 Movement Certificate',
      description: 'Document certifying the preferential origin of goods',
      importance: 'critical',
      estimatedCost: 100,
      estimatedTimeInWeeks: 2,
      details: 'Required for preferential tariff treatment. Must be issued by customs authorities. Valid for one shipment only.'
    },
    {
      id: 'eu-2',
      name: 'EU Import License',
      description: 'License allowing the import of goods into the EU',
      importance: 'critical',
      estimatedCost: 300,
      estimatedTimeInWeeks: 4,
      details: 'Required for all food products. Must be obtained by the EU importer. Valid for 1 year.'
    },
    {
      id: 'eu-3',
      name: 'EU Food Safety Certification',
      description: 'Certification demonstrating compliance with EU food safety standards',
      importance: 'high',
      estimatedCost: 2500,
      estimatedTimeInWeeks: 10,
      details: 'Required for all food products. Requires on-site audit by accredited certification body. Valid for 1 year.'
    },
    {
      id: 'eu-4',
      name: 'EU Organic Certification',
      description: 'Certification for organic products',
      importance: 'medium',
      estimatedCost: 2000,
      estimatedTimeInWeeks: 8,
      details: 'Required only for products marketed as organic. Must be issued by an approved certification body. Valid for 1 year.'
    }
  ],
  'United Arab Emirates': [
    {
      id: 'uae-1',
      name: 'Certificate of Origin',
      description: 'Document certifying the country of origin of the goods',
      importance: 'critical',
      estimatedCost: 150,
      estimatedTimeInWeeks: 2,
      details: 'Required for all products. Must be issued by an authorized chamber of commerce. Needs to be legalized by UAE embassy.'
    },
    {
      id: 'uae-2',
      name: 'Halal Certificate',
      description: 'Certificate confirming that products comply with Islamic law',
      importance: 'high',
      estimatedCost: 500,
      estimatedTimeInWeeks: 4,
      details: 'Required for all food products. Must be issued by an approved Halal certification body. Valid for 1 year.'
    },
    {
      id: 'uae-3',
      name: 'UAE Conformity Certificate',
      description: 'Certificate confirming that products meet UAE standards',
      importance: 'high',
      estimatedCost: 400,
      estimatedTimeInWeeks: 3,
      details: 'Required for all products. Must be issued by an approved certification body. Valid for 1 year.'
    }
  ],
  'United States': [
    {
      id: 'us-1',
      name: 'FDA Registration',
      description: 'Registration with the US Food and Drug Administration',
      importance: 'critical',
      estimatedCost: 200,
      estimatedTimeInWeeks: 4,
      details: 'Required for all food products. Must be renewed every 2 years.'
    },
    {
      id: 'us-2',
      name: 'Prior Notice',
      description: 'Advance notice of food shipments to the FDA',
      importance: 'critical',
      estimatedCost: 50,
      estimatedTimeInWeeks: 1,
      details: 'Required for each food shipment. Must be submitted at least 8 hours before arrival.'
    },
    {
      id: 'us-3',
      name: 'USDA Import Permit',
      description: 'Permit allowing the import of plant products',
      importance: 'high',
      estimatedCost: 300,
      estimatedTimeInWeeks: 6,
      details: 'Required for all plant-based products. Valid for 3 years.'
    },
    {
      id: 'us-4',
      name: 'USDA Organic Certification',
      description: 'Certification for organic products',
      importance: 'medium',
      estimatedCost: 2500,
      estimatedTimeInWeeks: 12,
      details: 'Required only for products marketed as organic. Must be issued by a USDA-accredited certification body. Valid for 1 year.'
    }
  ]
};

interface RegulatoryAssessmentProps {
  markets: string[];
  onContinue: () => void;
}

const RegulatoryAssessment: React.FC<RegulatoryAssessmentProps> = ({ markets, onContinue }) => {
  const [activeMarket, setActiveMarket] = useState<string>(markets[0] || 'United Kingdom');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [ownedDocuments, setOwnedDocuments] = useState<Record<string, boolean>>({});
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalTimeInWeeks, setTotalTimeInWeeks] = useState<number>(0);
  
  useEffect(() => {
    // Load documents for the active market
    const marketDocs = marketDocuments[activeMarket] || [];
    setDocuments(marketDocs);
    
    // Initialize owned documents state
    const initialOwnedState: Record<string, boolean> = {};
    marketDocs.forEach(doc => {
      initialOwnedState[doc.id] = false;
    });
    setOwnedDocuments(initialOwnedState);
    
    // Calculate initial totals
    calculateTotals(initialOwnedState, marketDocs);
  }, [activeMarket]);
  
  const handleMarketChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveMarket(newValue);
  };
  
  const handleDocumentToggle = (docId: string) => {
    const newOwnedDocuments = {
      ...ownedDocuments,
      [docId]: !ownedDocuments[docId]
    };
    setOwnedDocuments(newOwnedDocuments);
    
    // Recalculate totals
    calculateTotals(newOwnedDocuments, documents);
  };
  
  const calculateTotals = (owned: Record<string, boolean>, docs: Document[]) => {
    let cost = 0;
    let time = 0;
    
    docs.forEach(doc => {
      if (!owned[doc.id]) {
        cost += doc.estimatedCost;
        time = Math.max(time, doc.estimatedTimeInWeeks); // Assuming parallel processing
      }
    });
    
    setTotalCost(cost);
    setTotalTimeInWeeks(time);
  };
  
  const getCompletionPercentage = (): number => {
    if (documents.length === 0) return 0;
    
    const ownedCount = Object.values(ownedDocuments).filter(Boolean).length;
    return Math.round((ownedCount / documents.length) * 100);
  };
  
  const getImportanceColor = (importance: string): string => {
    switch (importance) {
      case 'critical':
        return '#d93025';
      case 'high':
        return '#f29900';
      case 'medium':
        return '#1a73e8';
      case 'low':
        return '#0d652d';
      default:
        return '#5f6368';
    }
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Regulatory Assessment
        </Typography>
        
        <Typography variant="body1" paragraph align="center" sx={{ mb: 4 }}>
          Review the required documents and certifications for your target markets. 
          Toggle the ones you already have to help us plan your export journey.
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">
              Completion Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {getCompletionPercentage()}% Complete
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getCompletionPercentage()} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
        
        <Tabs
          value={activeMarket}
          onChange={handleMarketChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3 }}
        >
          {markets.map(market => (
            <Tab key={market} label={market} value={market} />
          ))}
        </Tabs>
        
        <Box sx={{ mb: 4 }}>
          {documents.map(doc => (
            <Accordion key={doc.id} sx={{ mb: 2 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`${doc.id}-content`}
                id={`${doc.id}-header`}
              >
                <Grid container alignItems="center">
                  <Grid item xs={7}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">{doc.name}</Typography>
                      <Chip 
                        label={doc.importance} 
                        size="small" 
                        sx={{ 
                          ml: 1, 
                          bgcolor: getImportanceColor(doc.importance),
                          color: 'white'
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {doc.description}
                    </Typography>
                  </Grid>
                  <Grid item xs={3} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                      <MoneyIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        ${doc.estimatedCost}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <TimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {doc.estimatedTimeInWeeks} weeks
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={2} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={ownedDocuments[doc.id] || false}
                          onChange={() => handleDocumentToggle(doc.id)}
                          color="primary"
                          onClick={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                        />
                      }
                      label="I have this"
                      labelPlacement="start"
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                    />
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" paragraph>
                  {doc.details}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ bgcolor: '#f8f9fa', p: 3, borderRadius: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MoneyIcon sx={{ mr: 1, color: '#1a73e8' }} />
                <Typography variant="subtitle1">
                  Estimated Cost
                </Typography>
                <Tooltip title="Total cost for documents and certifications you don't have yet">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h4" color="primary" gutterBottom>
                ${totalCost.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                For {documents.length - Object.values(ownedDocuments).filter(Boolean).length} documents
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimeIcon sx={{ mr: 1, color: '#0d652d' }} />
                <Typography variant="subtitle1">
                  Estimated Timeline
                </Typography>
                <Tooltip title="Estimated time to obtain all required documents (assuming parallel processing)">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="h4" color="success.main" gutterBottom>
                {totalTimeInWeeks} weeks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approximately {Math.round(totalTimeInWeeks / 4)} months
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button 
            variant="contained" 
            endIcon={<ArrowForwardIcon />}
            onClick={onContinue}
            sx={{ ml: 'auto' }}
          >
            Continue
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegulatoryAssessment; 