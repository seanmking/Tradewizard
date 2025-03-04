import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid,
  Divider,
  Slider,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton,
  Alert
} from '@mui/material';
import { 
  ArrowForward as ArrowForwardIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface ResourcePlanningProps {
  onContinue: () => void;
}

// Mock data for resource planning
const mockResourceData = {
  totalEstimatedCost: 12500,
  costBreakdown: [
    { category: 'Regulatory Compliance', amount: 5000, percentage: 40 },
    { category: 'Market Research', amount: 2500, percentage: 20 },
    { category: 'Product Adaptation', amount: 3000, percentage: 24 },
    { category: 'Logistics Setup', amount: 2000, percentage: 16 }
  ],
  recommendedMonthlyBudget: 2500,
  estimatedTimelineMonths: {
    minimum: 4,
    recommended: 6,
    comfortable: 9
  },
  milestones: [
    { name: 'Market Research Complete', month: 1 },
    { name: 'Regulatory Compliance', month: 3 },
    { name: 'Product Adaptation', month: 4 },
    { name: 'Logistics Setup', month: 5 },
    { name: 'First Export Shipment', month: 6 }
  ]
};

const ResourcePlanning: React.FC<ResourcePlanningProps> = ({ onContinue }) => {
  const [monthlyBudget, setMonthlyBudget] = useState<number>(mockResourceData.recommendedMonthlyBudget);
  const [inputValue, setInputValue] = useState<string>(mockResourceData.recommendedMonthlyBudget.toString());
  const [estimatedMonths, setEstimatedMonths] = useState<number>(mockResourceData.estimatedTimelineMonths.recommended);
  const [adjustedMilestones, setAdjustedMilestones] = useState(mockResourceData.milestones);
  
  useEffect(() => {
    // Calculate new timeline based on monthly budget
    const totalCost = mockResourceData.totalEstimatedCost;
    const minMonths = mockResourceData.estimatedTimelineMonths.minimum;
    const maxMonths = mockResourceData.estimatedTimelineMonths.comfortable;
    
    if (monthlyBudget <= 0) {
      setEstimatedMonths(maxMonths * 1.5); // Very slow progress if no budget
    } else {
      // Calculate months needed with this budget (with some non-linear scaling)
      const rawMonths = totalCost / monthlyBudget;
      const scaledMonths = Math.max(minMonths, Math.min(maxMonths * 1.5, rawMonths * 1.2));
      setEstimatedMonths(Math.round(scaledMonths));
    }
    
    // Adjust milestone timing based on new timeline
    const recommendedMonths = mockResourceData.estimatedTimelineMonths.recommended;
    const scaleFactor = estimatedMonths / recommendedMonths;
    
    const newMilestones = mockResourceData.milestones.map(milestone => ({
      ...milestone,
      month: Math.round(milestone.month * scaleFactor)
    }));
    
    setAdjustedMilestones(newMilestones);
  }, [monthlyBudget, estimatedMonths]);
  
  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setMonthlyBudget(value);
    setInputValue(value.toString());
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    
    const numValue = Number(value);
    if (!isNaN(numValue)) {
      setMonthlyBudget(numValue);
    }
  };
  
  const handleBlur = () => {
    // Ensure the value is within bounds when user finishes editing
    const numValue = Number(inputValue);
    if (isNaN(numValue)) {
      setMonthlyBudget(mockResourceData.recommendedMonthlyBudget);
      setInputValue(mockResourceData.recommendedMonthlyBudget.toString());
    } else {
      const boundedValue = Math.max(500, Math.min(10000, numValue));
      setMonthlyBudget(boundedValue);
      setInputValue(boundedValue.toString());
    }
  };
  
  const getBudgetRecommendation = () => {
    if (monthlyBudget < mockResourceData.recommendedMonthlyBudget * 0.5) {
      return "Your current budget may significantly extend your timeline. Consider increasing it if faster market entry is a priority.";
    } else if (monthlyBudget < mockResourceData.recommendedMonthlyBudget) {
      return "This budget will work but may extend your timeline somewhat. It's a balanced approach if you have time flexibility.";
    } else if (monthlyBudget <= mockResourceData.recommendedMonthlyBudget * 1.5) {
      return "This is an optimal budget that balances cost and timeline considerations.";
    } else {
      return "Your budget is higher than typically needed. While this may accelerate some processes, not all regulatory timelines can be shortened.";
    }
  };
  
  const getTimelineClass = () => {
    if (estimatedMonths <= mockResourceData.estimatedTimelineMonths.minimum + 1) {
      return "timeline-fast";
    } else if (estimatedMonths <= mockResourceData.estimatedTimelineMonths.recommended + 1) {
      return "timeline-balanced";
    } else {
      return "timeline-slow";
    }
  };
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom align="center">
          Resource Planning
        </Typography>
        
        <Typography variant="body1" paragraph align="center" sx={{ mb: 4 }}>
          Plan your export budget and timeline to ensure a successful market entry.
          Adjust your monthly budget to see how it affects your export timeline.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MoneyIcon sx={{ mr: 1, color: '#1a73e8' }} />
                  <Typography variant="h6">
                    Cost Breakdown
                  </Typography>
                </Box>
                
                <Typography variant="h4" color="primary" gutterBottom>
                  ${mockResourceData.totalEstimatedCost.toLocaleString()}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  Estimated total cost for your export journey
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                {mockResourceData.costBreakdown.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.category}</Typography>
                      <Typography variant="body2">${item.amount.toLocaleString()}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={item.percentage} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        bgcolor: '#f1f3f4',
                        '& .MuiLinearProgress-bar': { 
                          bgcolor: index === 0 ? '#0d652d' : 
                                  index === 1 ? '#1a73e8' : 
                                  index === 2 ? '#f29900' : '#5f6368' 
                        }
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarIcon sx={{ mr: 1, color: '#0d652d' }} />
                  <Typography variant="h6">
                    Timeline Projection
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Typography variant="h4" color="success.main">
                    {estimatedMonths}
                  </Typography>
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    months
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  Estimated timeline to your first export shipment
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ position: 'relative', mt: 4, mb: 4, height: 80 }}>
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 30, 
                    left: 0, 
                    right: 0, 
                    height: 4, 
                    bgcolor: '#e8eaed' 
                  }} />
                  
                  {adjustedMilestones.map((milestone, index) => {
                    const position = (milestone.month / estimatedMonths) * 100;
                    return (
                      <Tooltip 
                        key={index} 
                        title={`${milestone.name}: Month ${milestone.month}`}
                        arrow
                      >
                        <Box 
                          sx={{
                            position: 'absolute',
                            left: `${position}%`,
                            top: 0,
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <Box 
                            sx={{ 
                              width: 16, 
                              height: 16, 
                              borderRadius: '50%', 
                              bgcolor: index === adjustedMilestones.length - 1 ? '#0d652d' : '#1a73e8',
                              zIndex: 1,
                            }} 
                          />
                          <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', maxWidth: 80 }}>
                            {index === 0 || index === adjustedMilestones.length - 1 ? milestone.name : ''}
                          </Typography>
                        </Box>
                      </Tooltip>
                    );
                  })}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Faster</Typography>
                  <Typography variant="caption" color="text.secondary">Slower</Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 2, minWidth: 120 }}>
                    Monthly Budget:
                  </Typography>
                  <TextField
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    variant="outlined"
                    size="small"
                    sx={{ width: 120 }}
                  />
                </Box>
                
                <Slider
                  value={monthlyBudget}
                  onChange={handleSliderChange}
                  min={500}
                  max={10000}
                  step={100}
                  marks={[
                    { value: 500, label: '$500' },
                    { value: mockResourceData.recommendedMonthlyBudget, label: `$${mockResourceData.recommendedMonthlyBudget}` },
                    { value: 10000, label: '$10,000' }
                  ]}
                  sx={{ mt: 3 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Alert 
          severity={
            monthlyBudget < mockResourceData.recommendedMonthlyBudget * 0.7 ? "warning" : 
            monthlyBudget > mockResourceData.recommendedMonthlyBudget * 1.5 ? "info" : "success"
          }
          icon={
            monthlyBudget < mockResourceData.recommendedMonthlyBudget * 0.7 ? <InfoIcon /> : 
            monthlyBudget > mockResourceData.recommendedMonthlyBudget * 1.5 ? <InfoIcon /> : <CheckCircleIcon />
          }
          sx={{ mt: 4 }}
        >
          {getBudgetRecommendation()}
        </Alert>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
          <Button 
            variant="contained" 
            endIcon={<ArrowForwardIcon />}
            onClick={onContinue}
          >
            Finalize Plan
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResourcePlanning; 