import React, { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, CardHeader, 
  Chip, Button, Stack, Divider, Grid, LinearProgress 
} from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

interface MarketData {
  id: string;
  name: string;
  match_score: number;
  market_size: string;
  growth_rate: number;
  entry_barriers: 'Low' | 'Medium' | 'High';
  regulatory_complexity: 'Low' | 'Medium' | 'High';
  strengths: string[];
}

interface MarketPrioritizationProps {
  markets: string[];
  onContinue: () => void;
  useMockData?: boolean;
}

// Mock market data
const mockMarketData: Record<string, MarketData> = {
  "United Kingdom": {
    id: "united-kingdom",
    name: "United Kingdom",
    match_score: 85,
    market_size: "$24.5 billion",
    growth_rate: 3.2,
    entry_barriers: 'Low',
    regulatory_complexity: 'Medium',
    strengths: ['Strong consumer demand', 'Favorable trade agreements', 'English language market']
  },
  "United Arab Emirates": {
    id: "united-arab-emirates",
    name: "United Arab Emirates",
    match_score: 65,
    market_size: "$12.3 billion",
    growth_rate: 4.5,
    entry_barriers: 'Medium',
    regulatory_complexity: 'High',
    strengths: ['Growing market', 'High purchasing power', 'Gateway to Middle East']
  },
  "United States": {
    id: "united-states",
    name: "United States",
    match_score: 82,
    market_size: "$156.2 billion",
    growth_rate: 3.9,
    entry_barriers: 'High',
    regulatory_complexity: 'High',
    strengths: ['Massive market size', 'Innovation-friendly', 'Strong purchasing power']
  }
};

const MarketPrioritization: React.FC<MarketPrioritizationProps> = ({ 
  markets, 
  onContinue,
  useMockData = true
}) => {
  const [selectedMarkets, setSelectedMarkets] = useState<MarketData[]>([]);
  const [availableMarkets, setAvailableMarkets] = useState<MarketData[]>([]);
  const [draggedMarket, setDraggedMarket] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch market data from API or use mock data
  React.useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (useMockData) {
          console.log("Using mock market data");
          // Use mock data
          const mockData = markets.map(market => mockMarketData[market] || {
            id: market.toLowerCase().replace(/\s+/g, '-'),
            name: market,
            match_score: Math.floor(Math.random() * 30) + 60, // Random score between 60-90
            market_size: `$${(Math.random() * 20 + 5).toFixed(1)} billion`,
            growth_rate: parseFloat((Math.random() * 5 + 1).toFixed(1)),
            entry_barriers: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High',
            regulatory_complexity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] as 'Low' | 'Medium' | 'High',
            strengths: ['Strong consumer demand', 'Favorable trade agreements', 'Growing market']
          });
          
          // Sort by match score
          mockData.sort((a, b) => b.match_score - a.match_score);
          
          setAvailableMarkets(mockData);
          setSelectedMarkets([]);
          setIsLoading(false);
        } else {
          console.log("Fetching real market data");
          // Import the assessment API service
          const { getMarketOptions } = await import('../../../services/assessment-api');
          
          // Get product categories from localStorage
          const savedData = localStorage.getItem('assessmentUserData');
          const userData = savedData ? JSON.parse(savedData) : {};
          const productCategories = userData.products?.categories || ['Food Products'];
          
          // Fetch market options from API
          const marketOptions = await getMarketOptions(productCategories, userData);
          console.log("Received market options:", marketOptions);
          
          // Transform to expected format
          const transformedData = marketOptions.map((market: any) => ({
            id: market.id || market.name.toLowerCase().replace(/\s+/g, '-'),
            name: market.name,
            match_score: Math.round(market.confidence * 100),
            market_size: market.market_size,
            growth_rate: typeof market.growth_rate === 'number' ? market.growth_rate : 3.0,
            entry_barriers: market.entry_barriers || 'Medium',
            regulatory_complexity: market.regulatory_complexity || 'Medium',
            strengths: market.strengths || ['Strong consumer demand', 'Favorable trade agreements', 'Growing market']
          }));
          
          // Sort by match score
          transformedData.sort((a: MarketData, b: MarketData) => b.match_score - a.match_score);
          
          setAvailableMarkets(transformedData);
          setSelectedMarkets([]);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error fetching market data:", err);
        setError("Failed to load market data. Please try again.");
        setIsLoading(false);
      }
    };
    
    fetchMarketData();
  }, [markets, useMockData]);

  // Track the currently dragged market
  const [dragOverMarket, setDragOverMarket] = useState<string | null>(null);

  // Handle start of drag
  const handleDragStart = (market: MarketData) => {
    console.log(`Started dragging ${market.name}`);
    setDraggedMarket(market);
  };

  // Handle drag over another market
  const handleDragOver = (e: React.DragEvent, marketId: string) => {
    e.preventDefault();
    if (draggedMarket && draggedMarket.id !== marketId) {
      setDragOverMarket(marketId);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetMarketId: string) => {
    e.preventDefault();
    
    if (!draggedMarket) return;
    
    console.log(`Dropping ${draggedMarket.name} onto ${targetMarketId}`);
    
    // Find the indices
    const sourceIndex = availableMarkets.findIndex(m => m.id === draggedMarket.id);
    const destinationIndex = availableMarkets.findIndex(m => m.id === targetMarketId);
    
    if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) {
      return;
    }
    
    // Create a new array and reorder
    const newMarkets = [...availableMarkets];
    const [removedMarket] = newMarkets.splice(sourceIndex, 1);
    newMarkets.splice(destinationIndex, 0, removedMarket);
    
    console.log(`Moved market from position ${sourceIndex} to ${destinationIndex}`);
    console.log("New market order:", newMarkets.map(m => m.name));
    
    setAvailableMarkets(newMarkets);
    setDraggedMarket(null);
    setDragOverMarket(null);
  };

  // Handle end of drag
  const handleDragEnd = () => {
    setDraggedMarket(null);
    setDragOverMarket(null);
  };
  
  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mb: 4, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Market Prioritization
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Prioritize your target markets to focus your export strategy effectively. The order of markets will determine resource allocation and timeline planning.
      </Typography>
      <Typography variant="body1" sx={{ mb: 3, fontWeight: 'bold', color: '#1a73e8' }}>
        INSTRUCTIONS: Use the drag handles (≡) to reorder the markets below. Drag the most important markets to the top of the list. When finished, click the "Continue" button at the bottom.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {availableMarkets.map((market) => (
            <Box 
              key={market.id}
              draggable
              onDragStart={() => handleDragStart(market)}
              onDragOver={(e) => handleDragOver(e, market.id)}
              onDrop={(e) => handleDrop(e, market.id)}
              onDragEnd={handleDragEnd}
              sx={{ 
                mb: 2, 
                width: '100%',
                opacity: draggedMarket?.id === market.id ? 0.5 : 1,
                border: dragOverMarket === market.id ? '2px dashed #1976d2' : 'none',
                borderRadius: 1,
                transition: 'all 0.2s'
              }}
            >
              <Card 
                elevation={1}
                sx={{ 
                  width: '100%',
                  cursor: 'grab',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
              >
                <CardHeader
                  avatar={
                    <Box 
                      sx={{ 
                        bgcolor: '#f0f4ff', 
                        p: 1, 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DragIndicatorIcon color="primary" fontSize="medium" />
                    </Box>
                  }
                  title={
                    <Typography variant="h6">
                      {market.name}
                    </Typography>
                  }
                  action={
                    <Chip 
                      label={`Match Score: ${market.match_score}%`}
                      color={
                        market.match_score >= 80 ? "success" :
                        market.match_score >= 60 ? "primary" : "warning"
                      }
                      sx={{ mr: 1, mt: 1 }}
                    />
                  }
                />
                
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                            Market Size:
                          </Typography>
                          <Typography variant="body1" sx={{ ml: 2 }}>
                            {market.market_size}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                            Growth Rate:
                          </Typography>
                          <Typography variant="body1" sx={{ ml: 2 }}>
                            {market.growth_rate}% per year
                          </Typography>
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                            Entry Barriers:
                          </Typography>
                          <Chip 
                            label={market.entry_barriers}
                            color={
                              market.entry_barriers === 'Low' ? "success" :
                              market.entry_barriers === 'Medium' ? "primary" : "error"
                            }
                            size="small"
                            sx={{ ml: 2 }}
                          />
                        </Box>
                        <Divider />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
                            Regulatory Complexity:
                          </Typography>
                          <Chip 
                            label={market.regulatory_complexity}
                            color={
                              market.regulatory_complexity === 'Low' ? "success" :
                              market.regulatory_complexity === 'Medium' ? "primary" : "error"
                            }
                            size="small"
                            sx={{ ml: 2 }}
                          />
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body2" align="center">
                            Overall Compatibility
                          </Typography>
                          <Typography variant="h4" align="center" color="primary" sx={{ mt: 1 }}>
                            {market.match_score}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={market.match_score} 
                          color={
                            market.match_score >= 80 ? "success" :
                            market.match_score >= 60 ? "primary" : "warning"
                          }
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Grid>
      </Grid>
      
      {/* Debug Section - can be removed in production */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>Debug Information</Typography>
          <Typography variant="body2">
            Market Order: {availableMarkets.map(m => m.name).join(', ')}
          </Typography>
          {draggedMarket && (
            <Typography variant="body2">
              Currently Dragging: {draggedMarket.name}
            </Typography>
          )}
        </Box>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={<KeyboardArrowRightIcon />}
          onClick={onContinue}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default MarketPrioritization; 