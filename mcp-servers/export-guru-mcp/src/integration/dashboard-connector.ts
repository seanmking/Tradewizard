/**
 * Dashboard Connector
 * 
 * This module provides integration with dashboards by transforming
 * data into formats suitable for visualization.
 */

import { BusinessAnalysis } from '../types/business';
import { MarketInfo, MarketReport } from '../types/market';
import { RegulatoryRequirement } from '../types/regulatory';
import { AssessmentIntegration } from '../types/common';

/**
 * Dashboard data for market comparison
 */
export interface MarketComparisonData {
  markets: string[];
  metrics: {
    name: string;
    data: number[];
  }[];
  recommendations: Record<string, string>;
}

/**
 * Dashboard data for regulatory requirements
 */
export interface RegulatoryRequirementsData {
  requirements: {
    country: string;
    requirementType: string;
    description: string;
    timeline?: string;
    difficulty?: number;
  }[];
  requirementsByType: Record<string, number>;
  requirementsByCountry: Record<string, number>;
}

/**
 * Dashboard data for export readiness
 */
export interface ExportReadinessData {
  overallScore: number;
  dimensionScores: {
    dimension: string;
    score: number;
  }[];
  recommendations: string[];
  timeline: {
    milestone: string;
    timeframe: string;
  }[];
}

/**
 * Creates dashboard data for market comparison
 */
export function createMarketComparisonData(
  assessments: Record<string, AssessmentIntegration>,
  marketInfo: Record<string, MarketInfo>
): MarketComparisonData {
  const markets = Object.keys(assessments);
  
  // Create metrics
  const metrics = [
    {
      name: 'Export Readiness',
      data: markets.map(market => assessments[market].exportReadiness.overallScore * 100)
    },
    {
      name: 'Market Access',
      data: markets.map(market => assessments[market].marketIntelligence.marketAccessScore * 100)
    },
    {
      name: 'Regulatory Compliance',
      data: markets.map(market => assessments[market].regulatoryCompliance.complianceScore * 100)
    },
    {
      name: 'Market Size',
      data: markets.map(market => {
        const info = marketInfo[market];
        if (!info || !info.marketSize) return 0;
        
        // Try to extract a number from the market size
        const match = info.marketSize.match(/\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
      })
    },
    {
      name: 'Growth Rate',
      data: markets.map(market => {
        const info = marketInfo[market];
        if (!info || !info.growthRate) return 0;
        
        // If it's already a number, use it
        if (typeof info.growthRate === 'number') return info.growthRate * 100;
        
        // Try to extract a percentage
        const match = info.growthRate.match(/\d+(\.\d+)?/);
        return match ? parseFloat(match[0]) : 0;
      })
    }
  ];
  
  // Create recommendations
  const recommendations: Record<string, string> = {};
  
  for (const market of markets) {
    const assessment = assessments[market];
    const info = marketInfo[market];
    
    if (!info) continue;
    
    const combinedScore = (
      assessment.exportReadiness.overallScore * 0.3 +
      assessment.marketIntelligence.marketAccessScore * 0.4 +
      assessment.regulatoryCompliance.complianceScore * 0.3
    );
    
    if (combinedScore > 0.7) {
      recommendations[market] = `High potential market with good fit`;
    } else if (combinedScore > 0.5) {
      recommendations[market] = `Moderate potential with some challenges`;
    } else {
      recommendations[market] = `Significant challenges, consider other markets first`;
    }
  }
  
  return {
    markets,
    metrics,
    recommendations
  };
}

/**
 * Creates dashboard data for regulatory requirements
 */
export function createRegulatoryRequirementsData(
  requirements: RegulatoryRequirement[]
): RegulatoryRequirementsData {
  // Transform requirements for visualization
  const transformedRequirements = requirements.map(req => ({
    country: req.country,
    requirementType: req.requirementType,
    description: req.description,
    timeline: req.lastUpdated,
    difficulty: 1 - req.confidence // Invert confidence to get difficulty
  }));
  
  // Count requirements by type
  const requirementsByType: Record<string, number> = {};
  
  for (const req of requirements) {
    if (!requirementsByType[req.requirementType]) {
      requirementsByType[req.requirementType] = 0;
    }
    requirementsByType[req.requirementType]++;
  }
  
  // Count requirements by country
  const requirementsByCountry: Record<string, number> = {};
  
  for (const req of requirements) {
    if (!requirementsByCountry[req.country]) {
      requirementsByCountry[req.country] = 0;
    }
    requirementsByCountry[req.country]++;
  }
  
  return {
    requirements: transformedRequirements,
    requirementsByType,
    requirementsByCountry
  };
}

/**
 * Creates dashboard data for export readiness
 */
export function createExportReadinessData(
  assessment: AssessmentIntegration,
  businessAnalysis: BusinessAnalysis
): ExportReadinessData {
  // Transform dimension scores
  const dimensionScores = Object.entries(assessment.exportReadiness.dimensionScores).map(
    ([dimension, score]) => ({
      dimension,
      score: score * 100
    })
  );
  
  // Create dummy recommendations and timeline
  // In a real implementation, these would come from the assessment
  const recommendations = [
    'Improve product documentation for target markets',
    'Obtain necessary certifications for regulatory compliance',
    'Develop market entry strategy with local partners',
    'Establish logistics and distribution channels'
  ];
  
  const timeline = [
    {
      milestone: 'Market research and selection',
      timeframe: '1-2 months'
    },
    {
      milestone: 'Product adaptation and certification',
      timeframe: '3-6 months'
    },
    {
      milestone: 'Partner identification and negotiation',
      timeframe: '2-4 months'
    },
    {
      milestone: 'First export shipment',
      timeframe: '6-9 months'
    }
  ];
  
  return {
    overallScore: assessment.exportReadiness.overallScore * 100,
    dimensionScores,
    recommendations,
    timeline
  };
}

/**
 * Creates a complete dashboard data package
 */
export function createDashboardData(
  businessAnalysis: BusinessAnalysis,
  assessments: Record<string, AssessmentIntegration>,
  marketInfo: Record<string, MarketInfo>,
  requirements: Record<string, RegulatoryRequirement[]>
): {
  businessProfile: {
    name: string;
    sectors: string[];
    products: string[];
    currentMarkets: string[];
  };
  marketComparison: MarketComparisonData;
  regulatoryRequirements: Record<string, RegulatoryRequirementsData>;
  exportReadiness: ExportReadinessData;
} {
  // Create business profile
  const businessProfile = {
    name: businessAnalysis.businessName,
    sectors: businessAnalysis.categories.map(c => `${c.mainSector} - ${c.subSector}`),
    products: businessAnalysis.products.map(p => p.name),
    currentMarkets: businessAnalysis.markets?.current || []
  };
  
  // Create market comparison
  const marketComparison = createMarketComparisonData(assessments, marketInfo);
  
  // Create regulatory requirements for each market
  const regulatoryRequirements: Record<string, RegulatoryRequirementsData> = {};
  
  for (const market in requirements) {
    regulatoryRequirements[market] = createRegulatoryRequirementsData(requirements[market]);
  }
  
  // Create export readiness
  const exportReadiness = createExportReadinessData(
    // Use the first assessment if available, otherwise create a dummy
    Object.values(assessments)[0] || {
      exportReadiness: {
        overallScore: 0,
        dimensionScores: {},
        regulatoryCompliance: 0
      },
      marketIntelligence: {
        marketAccessScore: 0,
        regulatoryBarriers: 0,
        competitivePosition: ''
      },
      regulatoryCompliance: {
        complianceScore: 0,
        missingRequirements: 0,
        timeline: 0,
        estimatedCost: ''
      }
    },
    businessAnalysis
  );
  
  return {
    businessProfile,
    marketComparison,
    regulatoryRequirements,
    exportReadiness
  };
} 