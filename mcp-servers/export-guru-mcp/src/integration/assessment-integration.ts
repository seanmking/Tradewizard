/**
 * Assessment Integration
 * 
 * This module provides integration between the export readiness assessment,
 * market intelligence, and regulatory compliance components.
 */

import { LLM } from '../types/common';
import { AssessmentIntegration } from '../types/common';
import { BusinessAnalysis } from '../types/business';
import { MarketInfo } from '../types/market';
import { RegulatoryRequirement, ComplianceAssessment } from '../types/regulatory';
import { trackResponseTime } from '../utils/monitoring';

/**
 * Options for integrated assessment
 */
export interface IntegratedAssessmentOptions {
  includeRegulatoryCompliance?: boolean;
  includeMarketIntelligence?: boolean;
  includeExportReadiness?: boolean;
  targetMarkets?: string[];
}

/**
 * Creates an integrated assessment for a business
 */
export async function createIntegratedAssessment(
  businessAnalysis: BusinessAnalysis,
  options: IntegratedAssessmentOptions,
  llm: LLM,
  getExportReadiness: (business: BusinessAnalysis) => Promise<{
    overallScore: number;
    dimensionScores: Record<string, number>;
    regulatoryCompliance: number;
  }>,
  getMarketIntelligence: (business: BusinessAnalysis, market: string) => Promise<{
    marketAccessScore: number;
    regulatoryBarriers: number;
    competitivePosition: string;
  }>,
  getRegulatoryCompliance: (business: BusinessAnalysis, market: string) => Promise<{
    complianceScore: number;
    missingRequirements: number;
    timeline: number;
    estimatedCost: string;
  }>
): Promise<Record<string, AssessmentIntegration>> {
  return trackResponseTime('createIntegratedAssessment', async () => {
    const results: Record<string, AssessmentIntegration> = {};
    
    // Get target markets
    const targetMarkets = options.targetMarkets || 
                         (businessAnalysis.markets?.current || []).length > 0 ? 
                         businessAnalysis.markets.current : 
                         ['Global'];
    
    // Process each target market
    for (const market of targetMarkets) {
      try {
        const assessment: AssessmentIntegration = {
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
        };
        
        // Get export readiness if requested
        if (options.includeExportReadiness) {
          assessment.exportReadiness = await getExportReadiness(businessAnalysis);
        }
        
        // Get market intelligence if requested
        if (options.includeMarketIntelligence) {
          assessment.marketIntelligence = await getMarketIntelligence(businessAnalysis, market);
        }
        
        // Get regulatory compliance if requested
        if (options.includeRegulatoryCompliance) {
          assessment.regulatoryCompliance = await getRegulatoryCompliance(businessAnalysis, market);
        }
        
        results[market] = assessment;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to create integrated assessment for market ${market}: ${errorMessage}`);
        
        // Add a default assessment
        results[market] = {
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
        };
      }
    }
    
    return results;
  }, { businessName: businessAnalysis.businessName });
}

/**
 * Combines assessment results with market information
 */
export function combineAssessmentWithMarketInfo(
  assessment: AssessmentIntegration,
  marketInfo: MarketInfo
): {
  assessment: AssessmentIntegration;
  marketInfo: MarketInfo;
  combinedScore: number;
  recommendation: string;
} {
  // Calculate a combined score
  const combinedScore = (
    assessment.exportReadiness.overallScore * 0.3 +
    assessment.marketIntelligence.marketAccessScore * 0.4 +
    assessment.regulatoryCompliance.complianceScore * 0.3
  );
  
  // Generate a recommendation
  let recommendation = '';
  
  if (combinedScore > 0.7) {
    recommendation = `${marketInfo.name} is a highly suitable market for your business. Your export readiness is strong, market access is favorable, and regulatory compliance is manageable.`;
  } else if (combinedScore > 0.5) {
    recommendation = `${marketInfo.name} is a moderately suitable market for your business. Some preparation is needed, particularly in ${getWeakestArea(assessment)}.`;
  } else {
    recommendation = `${marketInfo.name} presents significant challenges for your business at this time. Focus on improving ${getWeakestArea(assessment)} before pursuing this market.`;
  }
  
  return {
    assessment,
    marketInfo,
    combinedScore,
    recommendation
  };
}

/**
 * Gets the weakest area from an assessment
 */
function getWeakestArea(assessment: AssessmentIntegration): string {
  const scores = {
    'export readiness': assessment.exportReadiness.overallScore,
    'market access': assessment.marketIntelligence.marketAccessScore,
    'regulatory compliance': assessment.regulatoryCompliance.complianceScore
  };
  
  let weakestArea = '';
  let lowestScore = 1;
  
  for (const [area, score] of Object.entries(scores)) {
    if (score < lowestScore) {
      weakestArea = area;
      lowestScore = score;
    }
  }
  
  return weakestArea || 'overall preparation';
}

/**
 * Creates a prioritized list of markets based on assessment results
 */
export function prioritizeMarkets(
  assessments: Record<string, AssessmentIntegration>,
  marketInfo: Record<string, MarketInfo>
): {
  marketName: string;
  combinedScore: number;
  recommendation: string;
  assessmentSummary: {
    exportReadiness: number;
    marketAccess: number;
    regulatoryCompliance: number;
  };
}[] {
  const prioritizedMarkets = [];
  
  for (const [marketName, assessment] of Object.entries(assessments)) {
    if (!marketInfo[marketName]) continue;
    
    const combined = combineAssessmentWithMarketInfo(assessment, marketInfo[marketName]);
    
    prioritizedMarkets.push({
      marketName,
      combinedScore: combined.combinedScore,
      recommendation: combined.recommendation,
      assessmentSummary: {
        exportReadiness: assessment.exportReadiness.overallScore,
        marketAccess: assessment.marketIntelligence.marketAccessScore,
        regulatoryCompliance: assessment.regulatoryCompliance.complianceScore
      }
    });
  }
  
  // Sort by combined score (descending)
  return prioritizedMarkets.sort((a, b) => b.combinedScore - a.combinedScore);
} 