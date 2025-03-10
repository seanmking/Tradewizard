const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// Mock data for different industries
const marketIntelligenceData = {
  'Food & Beverage': {
    id: 'USA',
    name: 'United States',
    description: 'The United States market for food products is large and diverse, with strong demand for organic and specialty foods. The market size is estimated at $1.5 trillion with a steady growth rate of 3.8% annually. Entry barriers include FDA regulations and strong domestic competition.',
    confidence: 0.85,
    marketSize: '$1.5 trillion',
    growthRate: '3.8%',
    entryBarriers: 'Medium',
    regulatoryComplexity: 'Medium',
    strengths: [
      'Growing demand for organic products',
      'Strong specialty food market',
      'High consumer purchasing power',
      'Advanced distribution networks'
    ],
    regulatoryRequirements: [
      {
        country: 'USA',
        productCategory: 'Food & Beverage',
        requirementType: 'Certification',
        description: 'FDA Food Facility Registration',
        agency: 'Food and Drug Administration',
        confidence: 0.9
      },
      {
        country: 'USA',
        productCategory: 'Food & Beverage',
        requirementType: 'Labeling',
        description: 'Nutrition Facts Label requirements',
        agency: 'Food and Drug Administration',
        confidence: 0.9
      }
    ],
    opportunityTimeline: {
      months: 6,
      milestones: {
        'Month 1-2': 'Market research and preparation',
        'Month 3-4': 'Regulatory compliance',
        'Month 5-6': 'Market entry'
      }
    }
  },
  'Electronics': {
    id: 'USA',
    name: 'United States',
    description: 'The United States market for electronics is large and competitive, with strong demand for innovative products. The market size is estimated at $400 billion with a steady growth rate of 5.2% annually. Entry barriers include strong domestic competition and regulatory requirements for electronic devices.',
    confidence: 0.85,
    marketSize: '$400 billion',
    growthRate: '5.2%',
    entryBarriers: 'Medium',
    regulatoryComplexity: 'Medium',
    strengths: [
      'Growing market demand',
      'Significant market size',
      'Strong consumer purchasing power',
      'Advanced digital infrastructure'
    ],
    regulatoryRequirements: [
      {
        country: 'USA',
        productCategory: 'Electronics',
        requirementType: 'Certification',
        description: 'FCC certification for electronic devices',
        agency: 'Federal Communications Commission',
        confidence: 0.9
      },
      {
        country: 'USA',
        productCategory: 'Electronics',
        requirementType: 'Labeling',
        description: 'Energy Star labeling for energy-efficient devices',
        agency: 'Environmental Protection Agency',
        confidence: 0.9
      }
    ],
    opportunityTimeline: {
      months: 6,
      milestones: {
        'Month 1-2': 'Market research and preparation',
        'Month 3-4': 'Regulatory compliance',
        'Month 5-6': 'Market entry'
      }
    }
  },
  'default': {
    id: 'USA',
    name: 'United States',
    description: 'The United States offers a large and diverse market with strong consumer purchasing power. Entry barriers vary by industry but generally include regulatory compliance and strong domestic competition.',
    confidence: 0.8,
    marketSize: 'Varies by industry',
    growthRate: '3-5%',
    entryBarriers: 'Medium',
    regulatoryComplexity: 'Medium',
    strengths: [
      'Large consumer market',
      'Strong purchasing power',
      'Advanced infrastructure',
      'Stable business environment'
    ],
    regulatoryRequirements: [
      {
        country: 'USA',
        productCategory: 'General',
        requirementType: 'Business',
        description: 'Business registration requirements',
        agency: 'State authorities',
        confidence: 0.9
      }
    ],
    opportunityTimeline: {
      months: 6,
      milestones: {
        'Month 1-2': 'Market research and preparation',
        'Month 3-4': 'Regulatory compliance',
        'Month 5-6': 'Market entry'
      }
    }
  }
};

// Mock data for export readiness
const exportReadinessData = {
  exportReadiness: {
    overallScore: 0.75,
    marketIntelligence: 0.8,
    regulatoryCompliance: 0.7,
    exportOperations: 0.75
  },
  nextSteps: [
    {
      id: 1,
      title: 'Conduct market research',
      description: 'Research target markets to understand demand and competition',
      pillar: 'market_intelligence',
      estimatedTime: '2-4 weeks'
    },
    {
      id: 2,
      title: 'Identify regulatory requirements',
      description: 'Determine necessary certifications and documentation',
      pillar: 'regulatory_compliance',
      estimatedTime: '3-6 weeks'
    },
    {
      id: 3,
      title: 'Develop export plan',
      description: 'Create a comprehensive export strategy',
      pillar: 'export_operations',
      estimatedTime: '4-8 weeks'
    }
  ],
  strengths: [
    'Strong product quality',
    'Competitive pricing',
    'Established domestic presence'
  ],
  areas_for_improvement: [
    'Limited international experience',
    'Regulatory compliance knowledge',
    'International marketing strategy'
  ],
  key_trends: [
    'Growing demand for sustainable products',
    'Increasing e-commerce adoption',
    'Rising middle class in emerging markets'
  ]
};

// Market data for different countries
const marketData = {
  'USA': {
    name: 'United States',
    match: 95,
    description: 'The United States offers a large consumer market with high purchasing power and demand for quality products.',
    marketSize: 1500, // in billions USD for Food & Beverage
    growthRate: 3.8,
    industry: 'Food & Beverage'
  },
  'UK': {
    name: 'United Kingdom',
    match: 78,
    description: 'The UK offers a large consumer market with high purchasing power and demand for quality products.',
    marketSize: 80, // in billions USD for Food & Beverage
    growthRate: 4.1,
    industry: 'Food & Beverage'
  },
  'UAE': {
    name: 'United Arab Emirates',
    match: 85,
    description: 'The UAE is a growing market with high demand for premium food products and a strong expatriate community.',
    marketSize: 25, // in billions USD for Food & Beverage
    growthRate: 5.2,
    industry: 'Food & Beverage'
  },
  'Canada': {
    name: 'Canada',
    match: 82,
    description: 'Canada has a stable economy and strong trade relations with many countries, making it an attractive export market.',
    marketSize: 50, // in billions USD for Food & Beverage
    growthRate: 3.8,
    industry: 'Food & Beverage'
  }
};

// API endpoints
app.post('/api/mcp/tools', (req, res) => {
  const { tool, params } = req.body;
  
  console.log(`Received request for tool: ${tool}`, params);
  
  try {
    switch (tool) {
      case 'getMarketIntelligence':
        // Get the industry from params or default to 'default'
        const industry = params?.industry || 'default';
        const country = params?.country || 'USA';
        
        // Get the market intelligence data for the industry
        const marketIntelligence = marketIntelligenceData[industry] || marketIntelligenceData['default'];
        
        // Customize the data for the country if needed
        if (country && country !== 'USA') {
          marketIntelligence.id = country;
          marketIntelligence.name = marketData[country]?.name || country;
          // Update other country-specific data as needed
        }
        
        // Simulate a delay to test loading states
        setTimeout(() => {
          res.json(marketIntelligence);
        }, 1000);
        break;
        
      case 'generateExportReadinessReport':
        // Customize the export readiness data based on params if needed
        const customizedReadinessData = { ...exportReadinessData };
        
        // Simulate a delay to test loading states
        setTimeout(() => {
          res.json(customizedReadinessData);
        }, 1500);
        break;
        
      case 'getMarketOptions':
        // Filter markets based on selected markets if provided
        const selectedMarkets = params?.selectedMarkets || [];
        let availableMarkets = Object.keys(marketData).map(key => ({
          id: key,
          name: marketData[key].name,
          match: marketData[key].match,
          description: marketData[key].description,
          marketSize: `$${marketData[key].marketSize} billion`,
          growthRate: `${marketData[key].growthRate}%`,
          industry: marketData[key].industry
        }));
        
        // Filter by selected markets if provided
        if (selectedMarkets.length > 0) {
          availableMarkets = availableMarkets.filter(market => 
            selectedMarkets.includes(market.id)
          );
        }
        
        // Sort by match score
        availableMarkets.sort((a, b) => b.match - a.match);
        
        // Simulate a delay
        setTimeout(() => {
          res.json({ markets: availableMarkets });
        }, 1000);
        break;
        
      default:
        res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
  } catch (error) {
    console.error(`Error processing request for tool ${tool}:`, error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
  console.log(`Mock server listening at http://localhost:${port}`);
}); 