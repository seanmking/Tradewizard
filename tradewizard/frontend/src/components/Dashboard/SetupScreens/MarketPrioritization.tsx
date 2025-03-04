import React, { useState } from 'react';
import { 
  Box, Typography, Card, CardContent, CardHeader, 
  Chip, Button, Stack, Divider, Grid, LinearProgress 
} from '@mui/material';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { CustomDragDropContext, CustomDroppable, CustomDraggable } from '../../../components/DragDrop/DraggableWrapper';

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
    id: "uk",
    name: "United Kingdom",
    match_score: 85,
    market_size: "$24.5 billion",
    growth_rate: 3.2,
    entry_barriers: 'Low',
    regulatory_complexity: 'Medium',
    strengths: ['Strong consumer demand', 'Favorable trade agreements', 'English language market']
  },
  "Germany": {
    id: "de",
    name: "Germany",
    match_score: 70,
    market_size: "$31.8 billion",
    growth_rate: 2.8,
    entry_barriers: 'Medium',
    regulatory_complexity: 'Medium',
    strengths: ['Large consumer base', 'Strong economy', 'Central European location']
  },
  "France": {
    id: "fr",
    name: "France",
    match_score: 68,
    market_size: "$22.3 billion",
    growth_rate: 2.5,
    entry_barriers: 'Medium',
    regulatory_complexity: 'Medium',
    strengths: ['Growing demand', 'Sophisticated consumer base', 'Strategic location']
  },
  "United Arab Emirates": {
    id: "uae",
    name: "United Arab Emirates",
    match_score: 75,
    market_size: "$9.7 billion",
    growth_rate: 6.8,
    entry_barriers: 'Medium',
    regulatory_complexity: 'Low',
    strengths: ['High disposable income', 'Growing market', 'Gateway to Middle East']
  },
  "United States": {
    id: "us",
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
    if (validMarkets.length === 0) {
      // Fallback to all markets if none of the provided markets are valid
      return Object.values(mockMarketData);
    }
    return validMarkets.map(market => mockMarketData[market]);
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(prioritizedMarkets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setPrioritizedMarkets(items);
  };
  
  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mb: 4, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Market Prioritization
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Drag and drop markets to prioritize them based on your export strategy. Markets at the top will be prioritized in your export planning.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <CustomDragDropContext onDragEnd={handleDragEnd}>
            <CustomDroppable droppableId="markets">
              {(provided: DroppableProvided) => (
                <Box
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ width: '100%' }}
                >
                  {prioritizedMarkets.map((market, index) => (
                    <CustomDraggable 
                      key={market.id} 
                      draggableId={market.id}
                      index={index}
                    >
                      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          sx={{ 
                            mb: 2,
                            width: '100%',
                            opacity: snapshot.isDragging ? 0.8 : 1,
                            transform: snapshot.isDragging ? 'rotate(1deg)' : 'none',
                          }}
                        >
                          <Card 
                            elevation={snapshot.isDragging ? 6 : 1}
                            sx={{ 
                              width: '100%',
                              transition: 'all 0.3s ease-in-out',
                            }}
                          >
                            <CardHeader
                              avatar={
                                <Box {...provided.dragHandleProps}>
                                  <DragIndicatorIcon color="action" />
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
                      )}
                    </CustomDraggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </CustomDroppable>
          </CustomDragDropContext>
        </Grid>
      </Grid>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button 
          variant="contained" 
          color="primary" 
          endIcon={<KeyboardArrowRightIcon />}
          onClick={() => onContinue()}
        >
          Continue to Export Timeline
        </Button>
      </Box>
    </Box>
  );
};

export default MarketPrioritization; 