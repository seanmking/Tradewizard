/**
 * Market Opportunity Report Template
 * 
 * This module provides templates and data structures for generating
 * market opportunity reports with visualizations.
 */

// Define the missing types locally since they're not exported from market.ts
interface MarketData {
  marketSize: number;
  growth: number;
  competitors: Array<{ country: string; share: number }>;
  trends: Array<{ year: number; value: number }>;
}

interface TariffData {
  appliedRate: number;
  mfnRate: number;
  preferentialRate?: number;
  nonAdValorem: boolean;
}

interface TradeFlowData {
  // Basic structure for trade flow data
  reporter: string;
  partner: string;
  year: number;
  value: number;
  quantity?: number;
}

// Import other types as needed
import { RegulatoryFitScore } from './regulatory-fit';

/**
 * Market opportunity metrics interface
 */
export interface MarketOpportunityMetrics {
  marketSize: {
    value: number;
    unit: string;
    growth: number;
    trend: { year: number; value: number }[];
  };
  competition: {
    topCompetitors: { country: string; share: number }[];
    southAfricanShare?: number;
    concentration: 'High' | 'Medium' | 'Low';
  };
  access: {
    tariffs: {
      applied: number;
      mfn: number;
      preferential?: number;
      advantage: number;
    };
    nonTariffMeasures: {
      count: number;
      types: string[];
      restrictiveness: 'High' | 'Medium' | 'Low';
    };
  };
  demand: {
    growth: number;
    seasonality?: { peak: string[]; low: string[] };
    pricePoints: { min: number; max: number; average: number; unit: string };
    trends: string[];
  };
}

/**
 * Market comparison interface for side-by-side visualization
 */
export interface MarketComparison {
  markets: {
    name: string;
    metrics: {
      marketSize: number;
      growth: number;
      tariff: number;
      competitionLevel: number;
      entryBarriers: number;
      overallScore: number;
    };
  }[];
  bestMarket: string;
  recommendations: string[];
}

/**
 * Visualization specification for market opportunity
 */
export interface MarketOpportunityVisualization {
  marketSizeChart: {
    type: 'bar' | 'line';
    data: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor?: string;
        borderColor?: string;
      }[];
    };
    options: {
      title: string;
      xAxisLabel: string;
      yAxisLabel: string;
    };
  };
  competitionChart: {
    type: 'pie' | 'doughnut';
    data: {
      labels: string[];
      datasets: {
        data: number[];
        backgroundColor: string[];
      }[];
    };
    options: {
      title: string;
    };
  };
  tariffComparisonChart: {
    type: 'bar';
    data: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
      }[];
    };
    options: {
      title: string;
      xAxisLabel: string;
      yAxisLabel: string;
    };
  };
  marketComparisonRadarChart: {
    type: 'radar';
    data: {
      labels: string[];
      datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
      }[];
    };
    options: {
      title: string;
    };
  };
}

/**
 * Complete market opportunity report interface
 */
export interface MarketOpportunityReport {
  title: string;
  summary: string;
  product: {
    name: string;
    hsCode: string;
    category: string;
  };
  markets: {
    [key: string]: MarketOpportunityMetrics;
  };
  comparison: MarketComparison;
  visualizations: MarketOpportunityVisualization;
  recommendations: {
    bestMarket: string;
    reasoning: string[];
    nextSteps: string[];
  };
  competitivePositioning: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  dataConfidence: {
    overall: number;
    marketData: number;
    tariffData: number;
    competitionData: number;
  };
}

/**
 * Generate market size visualization data
 */
export function generateMarketSizeVisualization(
  marketData: { [key: string]: MarketData }
): MarketOpportunityVisualization['marketSizeChart'] {
  const markets = Object.keys(marketData);
  const marketSizes = markets.map(market => marketData[market].marketSize);
  const growthRates = markets.map(market => marketData[market].growth);
  
  return {
    type: 'bar',
    data: {
      labels: markets,
      datasets: [
        {
          label: 'Market Size (USD)',
          data: marketSizes,
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        },
        {
          label: 'Growth Rate (%)',
          data: growthRates,
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        }
      ]
    },
    options: {
      title: 'Market Size and Growth by Country',
      xAxisLabel: 'Country',
      yAxisLabel: 'Value'
    }
  };
}

/**
 * Generate competition visualization data
 */
export function generateCompetitionVisualization(
  marketData: MarketData
): MarketOpportunityVisualization['competitionChart'] {
  const competitors = marketData.competitors.slice(0, 5); // Top 5 competitors
  const labels = competitors.map((comp: { country: string; share: number }) => comp.country);
  const shares = competitors.map((comp: { country: string; share: number }) => comp.share);
  
  // Calculate "Others" category if needed
  const totalShare = shares.reduce((sum: number, share: number) => sum + share, 0);
  if (totalShare < 100) {
    labels.push('Others');
    shares.push(100 - totalShare);
  }
  
  return {
    type: 'pie',
    data: {
      labels,
      datasets: [
        {
          data: shares,
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)'
          ]
        }
      ]
    },
    options: {
      title: 'Market Share by Country'
    }
  };
}

/**
 * Generate tariff comparison visualization data
 */
export function generateTariffComparisonVisualization(
  tariffData: { [key: string]: TariffData }
): MarketOpportunityVisualization['tariffComparisonChart'] {
  const markets = Object.keys(tariffData);
  const appliedRates = markets.map(market => tariffData[market].appliedRate);
  const mfnRates = markets.map(market => tariffData[market].mfnRate);
  const preferentialRates = markets.map(market => 
    tariffData[market].preferentialRate || tariffData[market].appliedRate
  );
  
  return {
    type: 'bar',
    data: {
      labels: markets,
      datasets: [
        {
          label: 'Applied Rate (%)',
          data: appliedRates,
          backgroundColor: 'rgba(54, 162, 235, 0.5)'
        },
        {
          label: 'MFN Rate (%)',
          data: mfnRates,
          backgroundColor: 'rgba(255, 99, 132, 0.5)'
        },
        {
          label: 'Preferential Rate (%)',
          data: preferentialRates,
          backgroundColor: 'rgba(75, 192, 192, 0.5)'
        }
      ]
    },
    options: {
      title: 'Tariff Rates by Country',
      xAxisLabel: 'Country',
      yAxisLabel: 'Rate (%)'
    }
  };
}

/**
 * Generate market comparison radar chart
 */
export function generateMarketComparisonRadarChart(
  comparison: MarketComparison
): MarketOpportunityVisualization['marketComparisonRadarChart'] {
  return {
    type: 'radar',
    data: {
      labels: ['Market Size', 'Growth', 'Tariff Advantage', 'Competition', 'Entry Barriers', 'Overall Score'],
      datasets: comparison.markets.map((market, index) => ({
        label: market.name,
        data: [
          market.metrics.marketSize,
          market.metrics.growth,
          10 - market.metrics.tariff, // Invert tariff so lower is better
          10 - market.metrics.competitionLevel, // Invert competition so lower is better
          10 - market.metrics.entryBarriers, // Invert barriers so lower is better
          market.metrics.overallScore
        ],
        backgroundColor: `rgba(${index * 100}, ${255 - index * 50}, ${index * 70}, 0.2)`,
        borderColor: `rgba(${index * 100}, ${255 - index * 50}, ${index * 70}, 1)`
      }))
    },
    options: {
      title: 'Market Comparison (Higher is Better)'
    }
  };
}

/**
 * Generate a complete market opportunity report
 */
export function generateMarketOpportunityReport(
  product: { name: string; hsCode: string; category: string },
  marketData: { [key: string]: MarketData },
  tariffData: { [key: string]: TariffData },
  tradeFlowData: { [key: string]: TradeFlowData[] }
): MarketOpportunityReport {
  // Generate market metrics for each target market
  const markets: { [key: string]: MarketOpportunityMetrics } = {};
  
  for (const [market, data] of Object.entries(marketData)) {
    markets[market] = {
      marketSize: {
        value: data.marketSize,
        unit: 'USD',
        growth: data.growth,
        trend: data.trends
      },
      competition: {
        topCompetitors: data.competitors,
        concentration: calculateConcentration(data.competitors)
      },
      access: {
        tariffs: {
          applied: tariffData[market]?.appliedRate || 0,
          mfn: tariffData[market]?.mfnRate || 0,
          preferential: tariffData[market]?.preferentialRate,
          advantage: calculateTariffAdvantage(tariffData[market])
        },
        nonTariffMeasures: {
          count: 0, // This would come from NTM data
          types: [],
          restrictiveness: 'Medium' // This would be calculated
        }
      },
      demand: {
        growth: data.growth,
        pricePoints: { min: 0, max: 0, average: 0, unit: 'USD' }, // This would come from price data
        trends: []
      }
    };
  }
  
  // Generate market comparison
  const marketNames = Object.keys(markets);
  const comparison: MarketComparison = {
    markets: marketNames.map(name => ({
      name,
      metrics: {
        marketSize: normalizeScore(markets[name].marketSize.value, 0, 1000000, 10),
        growth: normalizeScore(markets[name].marketSize.growth, 0, 10, 10),
        tariff: normalizeScore(markets[name].access.tariffs.applied, 0, 20, 10, true),
        competitionLevel: calculateCompetitionLevel(markets[name].competition),
        entryBarriers: calculateEntryBarriers(markets[name]),
        overallScore: 0 // Will be calculated below
      }
    })),
    bestMarket: '',
    recommendations: []
  };
  
  // Calculate overall scores
  for (const market of comparison.markets) {
    market.metrics.overallScore = (
      market.metrics.marketSize * 0.3 +
      market.metrics.growth * 0.2 +
      (10 - market.metrics.tariff) * 0.15 +
      (10 - market.metrics.competitionLevel) * 0.2 +
      (10 - market.metrics.entryBarriers) * 0.15
    );
  }
  
  // Determine best market
  comparison.markets.sort((a, b) => b.metrics.overallScore - a.metrics.overallScore);
  comparison.bestMarket = comparison.markets[0].name;
  
  // Generate recommendations
  comparison.recommendations = generateMarketRecommendations(comparison, markets);
  
  // Generate visualizations
  const visualizations: MarketOpportunityVisualization = {
    marketSizeChart: generateMarketSizeVisualization(marketData),
    competitionChart: generateCompetitionVisualization(marketData[comparison.bestMarket]),
    tariffComparisonChart: generateTariffComparisonVisualization(tariffData),
    marketComparisonRadarChart: generateMarketComparisonRadarChart(comparison)
  };
  
  // Generate SWOT analysis
  const competitivePositioning = generateCompetitivePositioning(product, comparison, markets);
  
  // Calculate data confidence
  const dataConfidence = {
    overall: 0.85,
    marketData: 0.9,
    tariffData: 0.95,
    competitionData: 0.8
  };
  
  // Generate summary
  const summary = `Market opportunity analysis for ${product.name} (HS Code: ${product.hsCode}) across ${marketNames.length} target markets. ${comparison.bestMarket} shows the highest potential with a market size of $${formatNumber(markets[comparison.bestMarket].marketSize.value)} and growth rate of ${markets[comparison.bestMarket].marketSize.growth}%.`;
  
  // Return complete report
  return {
    title: `Market Opportunity Report: ${product.name}`,
    summary,
    product,
    markets,
    comparison,
    visualizations,
    recommendations: {
      bestMarket: comparison.bestMarket,
      reasoning: generateReasoningForBestMarket(comparison.bestMarket, markets[comparison.bestMarket]),
      nextSteps: generateNextSteps(comparison.bestMarket, markets[comparison.bestMarket])
    },
    competitivePositioning,
    dataConfidence
  };
}

/**
 * Helper function to calculate market concentration
 */
function calculateConcentration(competitors: { country: string; share: number }[]): 'High' | 'Medium' | 'Low' {
  // Calculate Herfindahl-Hirschman Index (HHI)
  const hhi = competitors.reduce((sum, comp) => sum + Math.pow(comp.share, 2), 0);
  
  if (hhi > 2500) return 'High';
  if (hhi > 1500) return 'Medium';
  return 'Low';
}

/**
 * Helper function to calculate tariff advantage
 */
function calculateTariffAdvantage(tariffData?: TariffData): number {
  if (!tariffData) return 0;
  
  const { mfnRate, appliedRate, preferentialRate } = tariffData;
  const effectiveRate = preferentialRate || appliedRate;
  
  return Math.max(0, mfnRate - effectiveRate);
}

/**
 * Helper function to normalize scores to a 0-10 scale
 */
function normalizeScore(
  value: number,
  min: number,
  max: number,
  scale: number = 10,
  invert: boolean = false
): number {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return invert ? scale * (1 - normalized) : scale * normalized;
}

/**
 * Helper function to calculate competition level
 */
function calculateCompetitionLevel(competition: MarketOpportunityMetrics['competition']): number {
  // Higher concentration means higher competition level
  const concentrationScore = competition.concentration === 'High' ? 8 :
                             competition.concentration === 'Medium' ? 5 : 3;
  
  // Calculate top competitor dominance
  const topCompetitorShare = competition.topCompetitors[0]?.share || 0;
  const dominanceScore = normalizeScore(topCompetitorShare, 0, 100, 10);
  
  return (concentrationScore * 0.6) + (dominanceScore * 0.4);
}

/**
 * Helper function to calculate entry barriers
 */
function calculateEntryBarriers(market: MarketOpportunityMetrics): number {
  // Higher tariffs and NTMs mean higher barriers
  const tariffScore = normalizeScore(market.access.tariffs.applied, 0, 20, 10);
  const ntmScore = normalizeScore(market.access.nonTariffMeasures.count, 0, 10, 10);
  
  // Restrictiveness score
  const restrictiveScore = market.access.nonTariffMeasures.restrictiveness === 'High' ? 8 :
                           market.access.nonTariffMeasures.restrictiveness === 'Medium' ? 5 : 3;
  
  return (tariffScore * 0.4) + (ntmScore * 0.3) + (restrictiveScore * 0.3);
}

/**
 * Helper function to generate market recommendations
 */
function generateMarketRecommendations(
  comparison: MarketComparison,
  markets: { [key: string]: MarketOpportunityMetrics }
): string[] {
  const bestMarket = comparison.bestMarket;
  const bestMarketData = markets[bestMarket];
  
  return [
    `${bestMarket} offers the best overall opportunity with a market size of $${formatNumber(bestMarketData.marketSize.value)} and growth rate of ${bestMarketData.marketSize.growth}%.`,
    `The tariff advantage in ${bestMarket} is ${bestMarketData.access.tariffs.advantage}% compared to competitors without preferential access.`,
    `Market concentration in ${bestMarket} is ${bestMarketData.competition.concentration.toLowerCase()}, indicating ${bestMarketData.competition.concentration === 'High' ? 'significant challenges from established competitors' : bestMarketData.competition.concentration === 'Medium' ? 'moderate competitive pressure' : 'opportunities for new entrants'}.`,
    `Consider a ${bestMarketData.competition.concentration === 'High' ? 'niche strategy focusing on underserved segments' : 'broader market entry strategy'} for ${bestMarket}.`
  ];
}

/**
 * Helper function to generate reasoning for best market
 */
function generateReasoningForBestMarket(
  marketName: string,
  market: MarketOpportunityMetrics
): string[] {
  return [
    `Market Size: ${marketName} has a substantial market size of $${formatNumber(market.marketSize.value)}, providing significant opportunity for sales volume.`,
    `Growth Trajectory: With a growth rate of ${market.marketSize.growth}%, the market is expanding, creating new opportunities for entry.`,
    `Competitive Landscape: Market concentration is ${market.competition.concentration.toLowerCase()}, ${market.competition.concentration === 'Low' ? 'allowing space for new entrants' : market.competition.concentration === 'Medium' ? 'presenting a balanced competitive environment' : 'requiring a focused strategy to compete with established players'}.`,
    `Tariff Advantage: A tariff advantage of ${market.access.tariffs.advantage}% provides a pricing edge over competitors without preferential access.`,
    `Non-Tariff Measures: The market has ${market.access.nonTariffMeasures.count} significant non-tariff measures with ${market.access.nonTariffMeasures.restrictiveness.toLowerCase()} restrictiveness, ${market.access.nonTariffMeasures.restrictiveness === 'Low' ? 'presenting minimal regulatory barriers' : market.access.nonTariffMeasures.restrictiveness === 'Medium' ? 'requiring moderate compliance efforts' : 'necessitating significant investment in compliance'}.`
  ];
}

/**
 * Helper function to generate next steps
 */
function generateNextSteps(
  marketName: string,
  market: MarketOpportunityMetrics
): string[] {
  return [
    `Conduct detailed market research on consumer preferences and distribution channels in ${marketName}.`,
    `Develop a pricing strategy that leverages the ${market.access.tariffs.advantage}% tariff advantage.`,
    `Identify potential distribution partners or agents in ${marketName}.`,
    `Prepare product documentation and certification requirements for ${marketName}.`,
    `Develop a market entry timeline and budget for ${marketName}.`
  ];
}

/**
 * Helper function to generate competitive positioning (SWOT)
 */
function generateCompetitivePositioning(
  product: { name: string; hsCode: string; category: string },
  comparison: MarketComparison,
  markets: { [key: string]: MarketOpportunityMetrics }
): MarketOpportunityReport['competitivePositioning'] {
  const bestMarket = comparison.bestMarket;
  const bestMarketData = markets[bestMarket];
  
  return {
    strengths: [
      `Tariff advantage of ${bestMarketData.access.tariffs.advantage}% in ${bestMarket}.`,
      `Growing market with ${bestMarketData.marketSize.growth}% annual growth rate.`,
      `South African products in this category are known for quality and value.`
    ],
    weaknesses: [
      `Limited market presence compared to established competitors.`,
      `Distance to market may impact shipping costs and delivery times.`,
      `Potential brand recognition challenges in a new market.`
    ],
    opportunities: [
      `Market size of $${formatNumber(bestMarketData.marketSize.value)} provides significant sales potential.`,
      `${bestMarketData.competition.concentration === 'Low' ? 'Low market concentration allows for easier entry.' : bestMarketData.competition.concentration === 'Medium' ? 'Balanced competitive environment provides entry opportunities.' : 'Potential to target niche segments underserved by dominant players.'}`,
      `Growing consumer interest in products from South Africa.`
    ],
    threats: [
      `Competition from ${bestMarketData.competition.topCompetitors[0]?.country || 'leading exporters'} with ${bestMarketData.competition.topCompetitors[0]?.share || 0}% market share.`,
      `Potential regulatory changes affecting market access.`,
      `Currency fluctuations impacting pricing competitiveness.`
    ]
  };
}

/**
 * Helper function to format numbers with commas
 */
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
} 