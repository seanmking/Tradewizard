import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Divider, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  BarChart as ChartIcon, 
  TrendingUp as TrendingUpIcon, 
  Store as StoreIcon, 
  PublicOff as CompetitorIcon, 
  AttachMoney as MoneyIcon, 
  Info as InfoIcon,
  CalendarMonth as CalendarIcon,
  Assignment as TaskIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

interface MarketIntelligencePillarProps {
  markets: string[];
  businessProfile: any;
}

// Mock market intelligence data
const mockMarketData = {
  'United Kingdom': {
    market_size: 'USD 540.6M (2023)',
    growth_rate: '5.78% CAGR (2024-2032)',
    distribution_channels: [
      {
        type: 'Supermarkets',
        examples: ['Tesco', 'Waitrose', 'Sainsbury\'s'],
        market_share: '41%',
        entry_difficulty: 'High',
      },
      {
        type: 'Health stores',
        examples: ['Holland & Barrett', 'Whole Foods'],
        market_share: '18%',
        entry_difficulty: 'Medium',
      },
      {
        type: 'Online',
        examples: ['Ocado', 'Amazon UK'],
        market_share: '19%',
        growth: '19% YOY',
        entry_difficulty: 'Low',
      }
    ],
    price_benchmarks: {
      dried_apricots: {
        price_range: '£8.50-12.75/kg',
        high_end_retail: '£15-18/kg',
        price_sensitivity: 'Medium',
        optimal_price_point: '£10.99/kg'
      },
      premium_nut_mixes: {
        price_range: '£10-15/200g',
        high_end_retail: '£18-25/200g',
        price_sensitivity: 'Low',
        optimal_price_point: '£12.99/200g'
      }
    },
    consumer_trends: [
      {
        trend: 'Plant-based diets',
        percentage: '63% purchase driver',
        growth: '18% YOY',
        opportunity: 'Position dried fruits as natural plant-based snacking options'
      },
      {
        trend: 'Clean labeling',
        percentage: '89% check nutritional info',
        growth: '7% YOY',
        opportunity: 'Emphasize no additives, preservatives, or added sugar'
      },
      {
        trend: 'Ethical sourcing',
        percentage: '72% willing to pay premium',
        growth: '14% YOY',
        opportunity: 'Highlight sustainable farming practices and fair trade principles'
      }
    ],
    key_competitors: [
      {
        name: 'Sunsweet Growers',
        market_share: '28%',
        product_range: 'Premium dried fruits, primarily prunes',
        price_positioning: 'Premium',
        distribution: 'Major retailers, specialty stores',
        strengths: ['Strong brand recognition', 'Wide distribution'],
        weaknesses: ['Limited product range', 'Premium pricing']
      },
      {
        name: 'Angas Park',
        market_share: 'Australian imports dominate 41%',
        product_range: 'Diverse dried fruits',
        price_positioning: 'Mid to premium',
        distribution: 'Major supermarkets',
        strengths: ['Quality perception', 'Product variety'],
        weaknesses: ['Limited marketing support', 'High logistics costs']
      }
    ]
  },
  'European Union': {
    market_size: 'EUR 780M (2023)',
    growth_rate: '4.3% CAGR (2024-2032)',
    distribution_channels: [
      {
        type: 'Hypermarkets',
        examples: ['Carrefour', 'Auchan', 'Kaufland'],
        market_share: '37%',
        entry_difficulty: 'High',
      },
      {
        type: 'Specialty Health Retailers',
        examples: ['Bio c\' Bon', 'Naturalia', 'Alnatura'],
        market_share: '22%',
        entry_difficulty: 'Medium',
      },
      {
        type: 'Online Marketplaces',
        examples: ['Amazon EU', 'Zalando'],
        market_share: '15%',
        growth: '23% YOY',
        entry_difficulty: 'Medium',
      }
    ],
    consumer_trends: [
      {
        trend: 'Organic preference',
        percentage: '68% purchase driver',
        growth: '12% YOY',
        opportunity: 'Obtain EU organic certification for premium positioning'
      },
      {
        trend: 'Sustainable packaging',
        percentage: '74% concerned about packaging waste',
        growth: '16% YOY',
        opportunity: 'Invest in biodegradable or recyclable packaging options'
      },
      {
        trend: 'Healthy snacking',
        percentage: '81% seeking healthier alternatives',
        growth: '9% YOY',
        opportunity: 'Position products as natural energy boosters'
      }
    ]
  },
  'United Arab Emirates': {
    market_size: 'AED 320M (2023)',
    growth_rate: '8.9% CAGR (2024-2032)',
    distribution_channels: [
      {
        type: 'Premium Supermarkets',
        examples: ['Spinneys', 'Waitrose', 'Carrefour Premium'],
        market_share: '46%',
        entry_difficulty: 'Medium',
      },
      {
        type: 'Specialty Gourmet Stores',
        examples: ['Organic Foods & Café', 'Kibsons'],
        market_share: '28%',
        entry_difficulty: 'Low',
      },
      {
        type: 'Hotel Supply',
        examples: ['5-star hotels', 'Resort chains'],
        market_share: '14%',
        growth: '10% YOY',
        entry_difficulty: 'High',
      }
    ],
    consumer_trends: [
      {
        trend: 'Premium gifting',
        percentage: '54% purchase as gifts',
        growth: '15% YOY',
        opportunity: 'Develop premium gift packaging for Ramadan and Eid'
      },
      {
        trend: 'Health consciousness',
        percentage: '67% expatriate health focus',
        growth: '12% YOY',
        opportunity: 'Target health-conscious expatriate communities'
      }
    ]
  }
};

// Next steps for market intelligence
const marketIntelligenceTasks = [
  {
    id: 'mi-1',
    title: 'Complete UK Market Entry Plan',
    description: 'Finalize a detailed go-to-market strategy for the UK based on market analysis',
    status: 'in_progress',
    progress: 65,
    subtasks: [
      { id: 'mi-1-1', title: 'Analyze distribution channels', completed: true },
      { id: 'mi-1-2', title: 'Review price positioning', completed: true },
      { id: 'mi-1-3', title: 'Identify initial retail targets', completed: false },
      { id: 'mi-1-4', title: 'Outline market entry budget', completed: false }
    ]
  },
  {
    id: 'mi-2',
    title: 'Research E-commerce Options',
    description: 'Evaluate direct-to-consumer e-commerce platforms for UK market',
    status: 'not_started',
    progress: 0,
    subtasks: [
      { id: 'mi-2-1', title: 'Evaluate Amazon UK seller options', completed: false },
      { id: 'mi-2-2', title: 'Research independent e-commerce platforms', completed: false },
      { id: 'mi-2-3', title: 'Compare fulfillment options', completed: false }
    ]
  },
  {
    id: 'mi-3',
    title: 'Competitor Product Analysis',
    description: 'Conduct detailed comparison of competitor products in target markets',
    status: 'not_started',
    progress: 0,
    subtasks: [
      { id: 'mi-3-1', title: 'Purchase competitor samples', completed: false },
      { id: 'mi-3-2', title: 'Analyze packaging and presentation', completed: false },
      { id: 'mi-3-3', title: 'Compare pricing and positioning', completed: false },
      { id: 'mi-3-4', title: 'Identify differentiation opportunities', completed: false }
    ]
  }
];

// Now add type definitions for market data
interface PriceBenchmark {
  price_range: string;
  high_end_retail: string;
  price_sensitivity: string;
  optimal_price_point: string;
}

interface ConsumerTrend {
  trend: string;
  percentage: string;
  growth: string;
  opportunity: string;
}

interface DistributionChannel {
  type: string;
  examples: string[];
  market_share: string;
  entry_difficulty: string;
  growth?: string;
}

interface Competitor {
  name: string;
  market_share: string;
  product_range: string;
  price_positioning: string;
  distribution: string;
  strengths: string[];
  weaknesses: string[];
}

interface MarketData {
  market_size: string;
  growth_rate: string;
  distribution_channels: DistributionChannel[];
  consumer_trends: ConsumerTrend[];
  price_benchmarks?: {[key: string]: PriceBenchmark};
  key_competitors?: Competitor[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
}

const MarketIntelligencePillar: React.FC<MarketIntelligencePillarProps> = ({ markets, businessProfile }) => {
  const [activeMarket, setActiveMarket] = useState<string>(markets[0] || 'United Kingdom');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleMarketChange = (_event: React.SyntheticEvent, newValue: string) => {
    setIsLoading(true);
    setActiveMarket(newValue);
    
    // Simulate loading delay
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  };
  
  // Get market data for the selected market
  const marketData = mockMarketData[activeMarket as keyof typeof mockMarketData] as MarketData | null;
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Market Intelligence
        </Typography>
        
        <Typography variant="body1" paragraph>
          Explore market insights for your target export markets. Understand market size, growth trends, 
          distribution channels, and competitive landscape to refine your export strategy.
        </Typography>
        
        <Tabs
          value={activeMarket}
          onChange={handleMarketChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          {markets.map(market => (
            <Tab key={market} label={market} value={market} />
          ))}
        </Tabs>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : marketData ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <ChartIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Market Size
                        </Typography>
                        <Typography variant="h6">
                          {marketData.market_size}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Growth Rate
                        </Typography>
                        <Typography variant="h6">
                          {marketData.growth_rate}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
            
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{ mb: 3 }}
            >
              <Tab label="Overview" value="overview" />
              <Tab label="Distribution Channels" value="distribution" />
              <Tab label="Consumer Trends" value="trends" />
              <Tab label="Competitors" value="competitors" />
              <Tab label="Next Steps" value="tasks" />
            </Tabs>
            
            {activeTab === 'overview' && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Market Snapshot
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Key Opportunity Areas
                        </Typography>
                        
                        <List dense>
                          {marketData.consumer_trends && marketData.consumer_trends.map((trend, index) => (
                            <ListItem key={index}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <TrendingUpIcon color="primary" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={trend.trend} 
                                secondary={`${trend.percentage} | ${trend.growth} growth`} 
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Top Distribution Channels
                        </Typography>
                        
                        <List dense>
                          {marketData.distribution_channels && marketData.distribution_channels.map((channel, index) => (
                            <ListItem key={index}>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                <StoreIcon color={channel.entry_difficulty === 'Low' ? 'success' : 
                                                 channel.entry_difficulty === 'Medium' ? 'primary' : 'error'} 
                                        fontSize="small" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={channel.type} 
                                secondary={`${channel.market_share} market share | Entry: ${channel.entry_difficulty}`} 
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={5}>
                  <Card variant="outlined" sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recommended Actions
                      </Typography>
                      
                      <Alert severity="info" sx={{ mb: 2 }}>
                        These actions are tailored to the {activeMarket} market based on our analysis.
                      </Alert>
                      
                      <List>
                        <ListItem sx={{ pl: 0 }}>
                          <ListItemIcon>
                            <Chip
                              icon={<StoreIcon />}
                              label="Distribution"
                              size="small"
                              sx={{ backgroundColor: '#e8f0fe', color: '#1a73e8' }}
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Focus on online retail channels" 
                            secondary={`Online channels are growing at ${marketData.distribution_channels && 
                              marketData.distribution_channels.find(c => c.type === 'Online')?.growth || 'a fast rate'} with lower barriers to entry.`} 
                          />
                        </ListItem>
                        
                        <ListItem sx={{ pl: 0 }}>
                          <ListItemIcon>
                            <Chip
                              icon={<MoneyIcon />}
                              label="Pricing"
                              size="small"
                              sx={{ backgroundColor: '#e6f4ea', color: '#0d652d' }}
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Position as premium product" 
                            secondary={marketData.price_benchmarks ? 
                              `Target the optimal price point of ${marketData.price_benchmarks.premium_nut_mixes.optimal_price_point}` : 
                              'Position at the upper-mid price range for best margin and volume balance.'}  
                          />
                        </ListItem>
                        
                        <ListItem sx={{ pl: 0 }}>
                          <ListItemIcon>
                            <Chip
                              icon={<TrendingUpIcon />}
                              label="Trends"
                              size="small"
                              sx={{ backgroundColor: '#fef7e0', color: '#f29900' }}
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={
                              marketData.consumer_trends ? 
                              `Leverage "${marketData.consumer_trends[0].trend}" trend` : 
                              'Leverage emerging consumer trends'
                            } 
                            secondary={
                              marketData.consumer_trends ? 
                              marketData.consumer_trends[0].opportunity : 
                              'Focus on health benefits and natural ingredients in marketing.'
                            }  
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        variant="contained" 
                        size="small"
                        sx={{ ml: 'auto' }}
                        endIcon={<ArrowForwardIcon />}
                      >
                        Generate Detailed Strategy
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            )}
            
            {activeTab === 'distribution' && (
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Distribution Channels
                    </Typography>
                    
                    <Tooltip title="Distribution channels represent different routes to market, each with their own requirements, costs, and market reach.">
                      <IconButton size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Channel Type</TableCell>
                          <TableCell>Examples</TableCell>
                          <TableCell>Market Share</TableCell>
                          <TableCell>Entry Difficulty</TableCell>
                          <TableCell>Notes</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {marketData.distribution_channels && marketData.distribution_channels.map((channel, index) => (
                          <TableRow key={index}>
                            <TableCell>{channel.type}</TableCell>
                            <TableCell>{channel.examples?.join(', ')}</TableCell>
                            <TableCell>{channel.market_share}</TableCell>
                            <TableCell>
                              <Chip 
                                label={channel.entry_difficulty} 
                                size="small"
                                sx={{
                                  bgcolor: channel.entry_difficulty === 'Low' ? '#e6f4ea' : 
                                          channel.entry_difficulty === 'Medium' ? '#e8f0fe' : '#fce8e6',
                                  color: channel.entry_difficulty === 'Low' ? '#0d652d' : 
                                         channel.entry_difficulty === 'Medium' ? '#1a73e8' : '#d93025',
                                }}
                              />
                            </TableCell>
                            <TableCell>{channel.growth ? `Growing at ${channel.growth}` : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {marketData.price_benchmarks && (
                    <>
                      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                        Price Benchmarks
                      </Typography>
                      
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Product Type</TableCell>
                              <TableCell>Standard Price Range</TableCell>
                              <TableCell>Premium Price Range</TableCell>
                              <TableCell>Price Sensitivity</TableCell>
                              <TableCell>Optimal Price Point</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(marketData.price_benchmarks).map(([product, data], index) => (
                              <TableRow key={index}>
                                <TableCell>{product.replace('_', ' ')}</TableCell>
                                <TableCell>{data.price_range}</TableCell>
                                <TableCell>{data.high_end_retail}</TableCell>
                                <TableCell>{data.price_sensitivity}</TableCell>
                                <TableCell>{data.optimal_price_point}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'trends' && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Consumer Trends
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Consumer trends can significantly impact product success. Align your marketing and 
                    product strategy with these trends for maximum market acceptance.
                  </Alert>
                  
                  <Grid container spacing={3}>
                    {marketData.consumer_trends && marketData.consumer_trends.map((trend, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {trend.trend}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>Market penetration:</Typography>
                            <Chip label={trend.percentage} size="small" color="primary" />
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>Growth rate:</Typography>
                            <Chip label={trend.growth} size="small" color="success" />
                          </Box>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Opportunity:</strong> {trend.opportunity}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'competitors' && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Competitor Analysis
                  </Typography>
                  
                  {marketData.key_competitors ? (
                    <>
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Understanding your competitors helps identify market gaps and differentiation opportunities.
                      </Alert>
                      
                      {marketData.key_competitors.map((competitor, index) => (
                        <Card key={index} variant="outlined" sx={{ mb: 3 }}>
                          <CardContent>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle1" gutterBottom>
                                  {competitor.name}
                                </Typography>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="body2" sx={{ mr: 1 }}>Market share:</Typography>
                                  <Typography variant="body2" fontWeight="medium">
                                    {competitor.market_share}
                                  </Typography>
                                </Box>
                                
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  <strong>Product range:</strong> {competitor.product_range}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  <strong>Pricing:</strong> {competitor.price_positioning}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Distribution:</strong> {competitor.distribution}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Strengths
                                </Typography>
                                
                                <List dense disablePadding>
                                  {competitor.strengths.map((strength, i) => (
                                    <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                                      <ListItemText primary={strength} />
                                    </ListItem>
                                  ))}
                                </List>
                              </Grid>
                              
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Weaknesses
                                </Typography>
                                
                                <List dense disablePadding>
                                  {competitor.weaknesses.map((weakness, i) => (
                                    <ListItem key={i} disablePadding sx={{ py: 0.5 }}>
                                      <ListItemText primary={weakness} />
                                    </ListItem>
                                  ))}
                                </List>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Competitor analysis data is being compiled for this market.
                      </Typography>
                      
                      <Button 
                        variant="outlined" 
                        sx={{ mt: 2 }}
                        startIcon={<CompetitorIcon />}
                      >
                        Request Competitor Analysis
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
            
            {activeTab === 'tasks' && (
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Next Steps
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Complete these tasks to improve your market readiness and refine your export strategy.
                  </Typography>
                  
                  {marketIntelligenceTasks.map((task, index) => (
                    <Card key={task.id} variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle1">{task.title}</Typography>
                          <Chip 
                            label={task.status === 'in_progress' ? 'In Progress' : 
                                  task.status === 'completed' ? 'Completed' : 'Not Started'} 
                            size="small"
                            color={task.status === 'in_progress' ? 'primary' : 
                                  task.status === 'completed' ? 'success' : 'default'}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {task.description}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="body2">Progress</Typography>
                            <Typography variant="body2">{task.progress}%</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={task.progress} 
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Subtasks
                        </Typography>
                        
                        <List dense>
                          {task.subtasks.map(subtask => (
                            <ListItem key={subtask.id} disablePadding>
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {subtask.completed ? (
                                  <CheckCircleIcon color="success" fontSize="small" />
                                ) : (
                                  <TaskIcon color="action" fontSize="small" />
                                )}
                              </ListItemIcon>
                              <ListItemText 
                                primary={subtask.title}
                                primaryTypographyProps={{
                                  style: subtask.completed ? { textDecoration: 'line-through' } : undefined
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                      
                      <CardActions>
                        <Button 
                          variant={task.status === 'not_started' ? 'contained' : 'outlined'} 
                          size="small"
                          sx={{ ml: 'auto' }}
                          endIcon={<ArrowForwardIcon />}
                        >
                          {task.status === 'not_started' ? 'Start Task' : 'Continue Task'}
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No market data available for {activeMarket}. Please select another market.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default MarketIntelligencePillar; 