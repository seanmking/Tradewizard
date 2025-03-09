const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock data
const marketIntelligenceData = {
  id: 'USA',
  name: 'United States',
  description: 'The United States market for electronics is large and competitive, with strong demand for innovative products. The market size is estimated at $400 billion with a steady growth rate of 5.2% annually. Entry barriers include strong domestic competition and regulatory requirements for electronic devices. Consumer trends show increasing demand for smart home devices and sustainable electronics.',
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
};

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

// API endpoints
app.post('/api/mcp/tools', (req, res) => {
  const { tool, params } = req.body;
  
  console.log(`Received request for tool: ${tool}`, params);
  
  switch (tool) {
    case 'getMarketIntelligence':
      // Simulate a delay to test loading states
      setTimeout(() => {
        res.json(marketIntelligenceData);
      }, 1000);
      break;
      
    case 'generateExportReadinessReport':
      // Simulate a delay to test loading states
      setTimeout(() => {
        res.json(exportReadinessData);
      }, 1500);
      break;
      
    default:
      res.status(400).json({ error: `Unknown tool: ${tool}` });
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