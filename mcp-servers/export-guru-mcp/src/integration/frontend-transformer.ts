/**
 * Frontend Transformer
 * 
 * This module provides utilities for transforming data into formats
 * suitable for frontend components.
 */

import { BusinessAnalysis } from '../types/business';
import { MarketInfo, MarketReport } from '../types/market';
import { RegulatoryRequirement } from '../types/regulatory';
import { AssessmentIntegration } from '../types/common';

/**
 * Transforms business analysis for frontend display
 */
export function transformBusinessAnalysis(
  businessAnalysis: BusinessAnalysis
): Record<string, any> {
  return {
    businessName: businessAnalysis.businessName,
    website: businessAnalysis.website,
    sectors: businessAnalysis.categories.map(category => ({
      mainSector: category.mainSector,
      subSector: category.subSector,
      attributes: category.attributes,
      confidence: Math.round(category.confidence * 100)
    })),
    products: businessAnalysis.products.map(product => ({
      name: product.name,
      description: product.description || '',
      hsCode: product.hsCode || 'Not available',
      price: product.price || 'Not available'
    })),
    markets: {
      current: businessAnalysis.markets?.current || [],
      confidence: Math.round((businessAnalysis.markets?.confidence || 0) * 100)
    },
    certifications: {
      items: businessAnalysis.certifications?.items || [],
      confidence: Math.round((businessAnalysis.certifications?.confidence || 0) * 100)
    },
    businessDetails: {
      estimatedSize: businessAnalysis.businessDetails?.estimatedSize || 'Unknown',
      yearsOperating: businessAnalysis.businessDetails?.yearsOperating || 'Unknown',
      confidence: Math.round((businessAnalysis.businessDetails?.confidence || 0) * 100)
    }
  };
}

/**
 * Transforms market information for frontend display
 */
export function transformMarketInfo(
  marketInfo: MarketInfo
): Record<string, any> {
  return {
    id: marketInfo.id,
    name: marketInfo.name,
    description: marketInfo.description,
    confidence: Math.round(marketInfo.confidence * 100),
    marketSize: marketInfo.marketSize || 'Not available',
    growthRate: typeof marketInfo.growthRate === 'number' 
      ? `${marketInfo.growthRate * 100}%` 
      : marketInfo.growthRate || 'Not available',
    entryBarriers: marketInfo.entryBarriers || 'Not available',
    regulatoryComplexity: marketInfo.regulatoryComplexity || 'Not available',
    strengths: marketInfo.strengths || []
  };
}

/**
 * Transforms regulatory requirements for frontend display
 */
export function transformRegulatoryRequirements(
  requirements: RegulatoryRequirement[]
): Record<string, any>[] {
  return requirements.map(req => ({
    country: req.country,
    productCategory: req.productCategory,
    hsCode: req.hsCode || 'Not specified',
    requirementType: req.requirementType,
    description: req.description,
    agency: req.agency || 'Not specified',
    url: req.url || '',
    lastUpdated: req.lastUpdated || 'Unknown',
    confidence: Math.round(req.confidence * 100)
  }));
}

/**
 * Transforms assessment integration for frontend display
 */
export function transformAssessmentIntegration(
  assessment: AssessmentIntegration
): Record<string, any> {
  return {
    exportReadiness: {
      overallScore: Math.round(assessment.exportReadiness.overallScore * 100),
      dimensionScores: Object.entries(assessment.exportReadiness.dimensionScores).map(
        ([dimension, score]) => ({
          dimension,
          score: Math.round(score * 100)
        })
      ),
      regulatoryCompliance: Math.round(assessment.exportReadiness.regulatoryCompliance * 100)
    },
    marketIntelligence: {
      marketAccessScore: Math.round(assessment.marketIntelligence.marketAccessScore * 100),
      regulatoryBarriers: Math.round(assessment.marketIntelligence.regulatoryBarriers * 100),
      competitivePosition: assessment.marketIntelligence.competitivePosition
    },
    regulatoryCompliance: {
      complianceScore: Math.round(assessment.regulatoryCompliance.complianceScore * 100),
      missingRequirements: assessment.regulatoryCompliance.missingRequirements,
      timeline: assessment.regulatoryCompliance.timeline,
      estimatedCost: assessment.regulatoryCompliance.estimatedCost
    }
  };
}

/**
 * Transforms market report for frontend display
 */
export function transformMarketReport(
  report: MarketReport
): Record<string, any> {
  return {
    businessName: report.businessName,
    productCategories: report.productCategories,
    targetMarket: report.targetMarket,
    marketSize: report.marketSize,
    growthRate: report.growthRate,
    entryBarriers: report.entryBarriers,
    regulatoryRequirements: transformRegulatoryRequirements(report.regulatoryRequirements),
    competitorAnalysis: {
      topCompetitors: report.competitorAnalysis.topCompetitors,
      marketShare: Object.entries(report.competitorAnalysis.marketShare).map(
        ([competitor, share]) => ({
          competitor,
          share: Math.round(share * 100)
        })
      ),
      strengthsWeaknesses: Object.entries(report.competitorAnalysis.strengthsWeaknesses).map(
        ([competitor, points]) => ({
          competitor,
          points
        })
      )
    },
    opportunityTimeline: {
      months: report.opportunityTimeline.months,
      milestones: Object.entries(report.opportunityTimeline.milestones).map(
        ([milestone, timeframe]) => ({
          milestone,
          timeframe
        })
      )
    },
    recommendations: report.recommendations,
    generatedDate: report.generatedDate
  };
}

/**
 * Creates a complete data package for the frontend
 */
export function createFrontendDataPackage(
  businessAnalysis: BusinessAnalysis,
  marketInfo: Record<string, MarketInfo>,
  requirements: Record<string, RegulatoryRequirement[]>,
  assessments: Record<string, AssessmentIntegration>,
  reports: Record<string, MarketReport>
): Record<string, any> {
  return {
    business: transformBusinessAnalysis(businessAnalysis),
    markets: Object.entries(marketInfo).reduce(
      (acc, [market, info]) => {
        acc[market] = transformMarketInfo(info);
        return acc;
      },
      {} as Record<string, any>
    ),
    requirements: Object.entries(requirements).reduce(
      (acc, [market, reqs]) => {
        acc[market] = transformRegulatoryRequirements(reqs);
        return acc;
      },
      {} as Record<string, any>
    ),
    assessments: Object.entries(assessments).reduce(
      (acc, [market, assessment]) => {
        acc[market] = transformAssessmentIntegration(assessment);
        return acc;
      },
      {} as Record<string, any>
    ),
    reports: Object.entries(reports).reduce(
      (acc, [market, report]) => {
        acc[market] = transformMarketReport(report);
        return acc;
      },
      {} as Record<string, any>
    ),
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    }
  };
} 