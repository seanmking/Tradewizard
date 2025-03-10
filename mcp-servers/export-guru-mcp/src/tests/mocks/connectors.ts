/**
 * Mock Connectors for Testing
 */

import { Connectors } from '../../connectors';

export const mockConnectors: Connectors = {
  tradeMap: {
    getMarketData: async (country, product) => ({
      marketSize: 1000000,
      growth: 5.2,
      competitors: [
        { country: 'China', share: 25 },
        { country: 'Germany', share: 15 },
        { country: 'USA', share: 10 }
      ],
      trends: [
        { year: 2018, value: 800000 },
        { year: 2019, value: 850000 },
        { year: 2020, value: 900000 },
        { year: 2021, value: 950000 },
        { year: 2022, value: 1000000 }
      ]
    }),
    getExportOpportunities: async (sourceCountry, product) => ([
      { country: 'UAE', score: 85, potential: 'High' },
      { country: 'UK', score: 75, potential: 'Medium' },
      { country: 'USA', score: 65, potential: 'Medium' }
    ])
  },
  comtrade: {
    getTradeData: async (reporter, partner, product, year) => ({
      imports: 500000,
      exports: 300000,
      balance: -200000,
      yearOnYearGrowth: 7.5
    })
  },
  regulatoryDb: {
    getRequirements: async (country, productCategory, hsCode) => ([
      {
        country,
        productCategory,
        hsCode,
        requirementType: 'Certification',
        description: 'Product certification required for market entry',
        agency: 'Standards Authority',
        confidence: 0.9,
        estimatedTimeline: '30 days',
        estimatedCost: '$500'
      },
      {
        country,
        productCategory,
        hsCode,
        requirementType: 'Labeling',
        description: 'Specific labeling requirements for consumer products',
        agency: 'Consumer Protection Agency',
        confidence: 0.85,
        estimatedTimeline: '15 days',
        estimatedCost: '$200'
      },
      {
        country,
        productCategory,
        hsCode,
        requirementType: 'Import License',
        description: 'Import license required for this product category',
        agency: 'Trade Ministry',
        confidence: 0.95,
        estimatedTimeline: '45 days',
        estimatedCost: '$300'
      }
    ])
  },
  internalDb: {
    getUserById: async (userId) => ({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
      company: 'Test Company'
    }),
    saveAnalysisResults: async (userId, analysisType, data) => true,
    query: async (sql, params) => {
      // Mock implementation for business profile queries
      if (sql.includes('business_profiles')) {
        if (sql.includes('SELECT')) {
          return [];
        }
        return { affectedRows: 1, insertId: 1 };
      }
      return [];
    }
  },
  wits: {
    getTariffData: async (reporter, partner, product) => ({
      appliedRate: 5.0,
      mfnRate: 7.5,
      preferentialRate: 2.5,
      nonAdValorem: false
    }),
    getNTMData: async (reporter, product) => ([
      { type: 'SPS', count: 3, coverage: 0.8 },
      { type: 'TBT', count: 2, coverage: 0.6 }
    ])
  }
}; 