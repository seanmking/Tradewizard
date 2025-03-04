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
  "Germany": {
    id: "germany",
    name: "Germany",
    match_score: 70,
    market_size: "$31.8 billion",
    growth_rate: 2.8,
    entry_barriers: 'Medium',
    regulatory_complexity: 'Medium',
    strengths: ['Large consumer base', 'Strong economy', 'Central European location']
  },
  "France": {
    id: "france",
    name: "France",
    match_score: 68,
    market_size: "$22.3 billion",
    growth_rate: 2.5,
    entry_barriers: 'Medium',
    regulatory_complexity: 'Medium',
    strengths: ['Growing demand', 'Sophisticated consumer base', 'Strategic location']
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

const MarketPrioritization: React.FC<MarketPrioritizationProps> = ({ markets, onContinue }) => {
  // Initialize with defaults if markets aren't in our mock data
  const [prioritizedMarkets, setPrioritizedMarkets] = useState<MarketData[]>(() => {
    const validMarkets = markets.filter(market => mockMarketData[market] !== undefined);
    console.log("Valid markets:", validMarkets);
    
    if (validMarkets.length === 0) {
      // Fallback to all markets if none of the provided markets are valid
      console.log("Using all markets as fallback");
      return Object.values(mockMarketData);
    }
    
    const marketData = validMarkets.map(market => mockMarketData[market]);
    console.log("Initial market data:", marketData);
    return marketData;
  });

  // Track the currently dragged market
  const [draggedMarket, setDraggedMarket] = useState<MarketData | null>(null);
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
    const sourceIndex = prioritizedMarkets.findIndex(m => m.id === draggedMarket.id);
    const destinationIndex = prioritizedMarkets.findIndex(m => m.id === targetMarketId);
    
    if (sourceIndex === -1 || destinationIndex === -1 || sourceIndex === destinationIndex) {
      return;
    }
    
    // Create a new array and reorder
    const newMarkets = [...prioritizedMarkets];
    const [removedMarket] = newMarkets.splice(sourceIndex, 1);
    newMarkets.splice(destinationIndex, 0, removedMarket);
    
    console.log(`Moved market from position ${sourceIndex} to ${destinationIndex}`);
    console.log("New market order:", newMarkets.map(m => m.name));
    
    setPrioritizedMarkets(newMarkets);
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
          {prioritizedMarkets.map((market) => (
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
            Market Order: {prioritizedMarkets.map(m => m.name).join(', ')}
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