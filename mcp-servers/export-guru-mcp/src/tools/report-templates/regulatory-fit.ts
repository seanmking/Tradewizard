/**
 * Regulatory Fit Report Template
 * 
 * This module provides templates and data structures for generating
 * regulatory fit reports with progressive disclosure and visual timelines.
 */

import { ComplianceChecklist, ChecklistItem, ComplianceMilestone } from '../compliance-checklist';

/**
 * Regulatory requirement with confidence indicator
 */
export interface RegulatoryRequirementWithConfidence {
  id: string;
  requirement: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  estimatedCost: string;
  agency: string;
  url?: string;
  confidence: number;
  detectionMethod: 'automatic' | 'manual' | 'inferred';
  lastVerified?: string;
}

/**
 * Timeline visualization for regulatory compliance
 */
export interface RegulatoryTimelineVisualization {
  type: 'gantt';
  milestones: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    dependencies: string[];
    progress: number;
    category: 'documentation' | 'testing' | 'certification' | 'approval';
  }[];
  criticalPath: string[];
  totalDuration: string;
}

/**
 * Cost breakdown for regulatory compliance
 */
export interface RegulatoryCostBreakdown {
  categories: {
    name: string;
    amount: number;
    percentage: number;
    items: {
      name: string;
      amount: number;
      description: string;
    }[];
  }[];
  totalCost: number;
  currency: string;
  notes: string[];
}

/**
 * Regulatory fit score components
 */
export interface RegulatoryFitScore {
  overall: number;
  components: {
    complexity: number;
    cost: number;
    timeline: number;
    certainty: number;
  };
  interpretation: string;
}

/**
 * Complete regulatory fit report
 */
export interface RegulatoryFitReport {
  title: string;
  summary: string;
  product: {
    name: string;
    hsCode: string;
    category: string;
  };
  market: {
    name: string;
    regulatoryBodies: string[];
    regulatoryApproach: string;
  };
  criticalRequirements: RegulatoryRequirementWithConfidence[];
  standardRequirements: RegulatoryRequirementWithConfidence[];
  optionalRequirements: RegulatoryRequirementWithConfidence[];
  timeline: {
    visualization: RegulatoryTimelineVisualization;
    criticalMilestones: ComplianceMilestone[];
    estimatedCompletionTime: string;
  };
  costs: {
    breakdown: RegulatoryCostBreakdown;
    estimatedTotalCost: string;
    rangeMin: string;
    rangeMax: string;
  };
  fitScore: RegulatoryFitScore;
  dataConfidence: {
    overall: number;
    requirements: number;
    timeline: number;
    costs: number;
  };
  nextSteps: string[];
}

/**
 * Generate a regulatory fit report from a compliance checklist
 */
export function generateRegulatoryFitReport(
  checklist: ComplianceChecklist,
  product: { name: string; hsCode: string; category: string }
): RegulatoryFitReport {
  // Extract requirements by priority
  const criticalRequirements = checklist.items
    .filter(item => item.priority === 'high')
    .map(item => convertToRequirementWithConfidence(item));
  
  const standardRequirements = checklist.items
    .filter(item => item.priority === 'medium')
    .map(item => convertToRequirementWithConfidence(item));
  
  const optionalRequirements = checklist.items
    .filter(item => item.priority === 'low')
    .map(item => convertToRequirementWithConfidence(item));
  
  // Generate timeline visualization
  const timeline = generateTimelineVisualization(checklist);
  
  // Generate cost breakdown
  const costs = generateCostBreakdown(checklist);
  
  // Calculate fit score
  const fitScore = calculateFitScore(checklist, criticalRequirements);
  
  // Calculate data confidence
  const dataConfidence = calculateDataConfidence(checklist);
  
  // Generate next steps
  const nextSteps = generateNextSteps(checklist);
  
  // Generate market info
  const market = {
    name: checklist.country,
    regulatoryBodies: getMarketRegulatoryBodies(checklist.country),
    regulatoryApproach: getMarketRegulatoryApproach(checklist.country)
  };
  
  // Generate summary
  const summary = `Regulatory fit analysis for ${product.name} (HS Code: ${product.hsCode}) in ${checklist.country}. The product has ${criticalRequirements.length} critical requirements, with an estimated compliance timeline of ${checklist.estimatedCompletionTime} and total cost of ${checklist.totalEstimatedCost}.`;
  
  return {
    title: `Regulatory Fit Report: ${product.name} in ${checklist.country}`,
    summary,
    product,
    market,
    criticalRequirements,
    standardRequirements,
    optionalRequirements,
    timeline: {
      visualization: timeline,
      criticalMilestones: checklist.milestones,
      estimatedCompletionTime: checklist.estimatedCompletionTime
    },
    costs: {
      breakdown: costs,
      estimatedTotalCost: checklist.totalEstimatedCost,
      rangeMin: calculateCostRangeMin(checklist.totalEstimatedCost),
      rangeMax: calculateCostRangeMax(checklist.totalEstimatedCost)
    },
    fitScore,
    dataConfidence,
    nextSteps
  };
}

/**
 * Convert a checklist item to a requirement with confidence
 */
function convertToRequirementWithConfidence(
  item: ChecklistItem
): RegulatoryRequirementWithConfidence {
  // Determine detection method based on available data
  const detectionMethod = item.marketSpecific ? 'automatic' : 'inferred';
  
  // Generate confidence score based on detection method and data quality
  const confidence = detectionMethod === 'automatic' ? 0.9 : 0.7;
  
  return {
    id: item.id,
    requirement: item.requirement,
    description: item.description,
    priority: item.priority,
    timeline: item.timeline,
    estimatedCost: item.estimatedCost,
    agency: extractAgencyFromResources(item.resources),
    confidence,
    detectionMethod,
    lastVerified: new Date().toISOString().split('T')[0] // Today's date
  };
}

/**
 * Extract agency from resources
 */
function extractAgencyFromResources(resources: string[]): string {
  // Find the first resource that looks like an agency
  const agencyResource = resources.find(resource => 
    !resource.includes('.') && // Not a URL
    !resource.includes('@') && // Not an email
    !resource.toLowerCase().includes('contact') && // Not a contact instruction
    !resource.toLowerCase().includes('document')   // Not a document
  );
  
  return agencyResource || 'Regulatory Authority';
}

/**
 * Generate timeline visualization
 */
function generateTimelineVisualization(
  checklist: ComplianceChecklist
): RegulatoryTimelineVisualization {
  // Convert milestones to gantt chart format
  const ganttMilestones = checklist.milestones.map(milestone => {
    // Calculate end date (30 days after start date as a placeholder)
    const startDate = new Date(milestone.estimatedCompletionDate);
    startDate.setDate(startDate.getDate() - 30); // Assume 30 days duration
    
    return {
      id: milestone.id,
      name: milestone.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: milestone.estimatedCompletionDate.split('T')[0],
      dependencies: milestone.dependsOn,
      progress: milestone.status === 'completed' ? 100 : 
                milestone.status === 'in-progress' ? 50 : 0,
      category: getCategoryForMilestone(milestone.name)
    };
  });
  
  // Determine critical path (simplified approach)
  const criticalPath = checklist.milestones
    .filter(m => m.name.toLowerCase().includes('critical') || 
                m.dependsOn.length > 2)
    .map(m => m.id);
  
  // Calculate total duration
  const totalDuration = checklist.estimatedCompletionTime;
  
  return {
    type: 'gantt',
    milestones: ganttMilestones,
    criticalPath,
    totalDuration
  };
}

/**
 * Get category for milestone
 */
function getCategoryForMilestone(
  milestoneName: string
): 'documentation' | 'testing' | 'certification' | 'approval' {
  const name = milestoneName.toLowerCase();
  
  if (name.includes('document') || name.includes('preparation')) {
    return 'documentation';
  } else if (name.includes('test')) {
    return 'testing';
  } else if (name.includes('certif')) {
    return 'certification';
  } else {
    return 'approval';
  }
}

/**
 * Generate cost breakdown
 */
function generateCostBreakdown(
  checklist: ComplianceChecklist
): RegulatoryCostBreakdown {
  // Group items by type of cost
  const documentationItems = checklist.items.filter(item => 
    item.requirement.toLowerCase().includes('document') ||
    item.requirement.toLowerCase().includes('application') ||
    item.requirement.toLowerCase().includes('registration')
  );
  
  const testingItems = checklist.items.filter(item => 
    item.requirement.toLowerCase().includes('test') ||
    item.requirement.toLowerCase().includes('analysis') ||
    item.requirement.toLowerCase().includes('inspection')
  );
  
  const certificationItems = checklist.items.filter(item => 
    item.requirement.toLowerCase().includes('certif') ||
    item.requirement.toLowerCase().includes('approval') ||
    item.requirement.toLowerCase().includes('license')
  );
  
  const otherItems = checklist.items.filter(item => 
    !documentationItems.includes(item) &&
    !testingItems.includes(item) &&
    !certificationItems.includes(item)
  );
  
  // Calculate costs for each category
  const documentationCost = calculateCategoryTotal(documentationItems);
  const testingCost = calculateCategoryTotal(testingItems);
  const certificationCost = calculateCategoryTotal(certificationItems);
  const otherCost = calculateCategoryTotal(otherItems);
  
  // Calculate total cost
  const totalCost = documentationCost + testingCost + certificationCost + otherCost;
  
  // Create cost breakdown
  return {
    categories: [
      {
        name: 'Documentation',
        amount: documentationCost,
        percentage: Math.round((documentationCost / totalCost) * 100),
        items: documentationItems.map(item => ({
          name: item.requirement,
          amount: parseCostValue(item.estimatedCost),
          description: item.description
        }))
      },
      {
        name: 'Testing',
        amount: testingCost,
        percentage: Math.round((testingCost / totalCost) * 100),
        items: testingItems.map(item => ({
          name: item.requirement,
          amount: parseCostValue(item.estimatedCost),
          description: item.description
        }))
      },
      {
        name: 'Certification',
        amount: certificationCost,
        percentage: Math.round((certificationCost / totalCost) * 100),
        items: certificationItems.map(item => ({
          name: item.requirement,
          amount: parseCostValue(item.estimatedCost),
          description: item.description
        }))
      },
      {
        name: 'Other',
        amount: otherCost,
        percentage: Math.round((otherCost / totalCost) * 100),
        items: otherItems.map(item => ({
          name: item.requirement,
          amount: parseCostValue(item.estimatedCost),
          description: item.description
        }))
      }
    ],
    totalCost,
    currency: 'USD',
    notes: [
      'Costs are estimates and may vary based on specific product details.',
      'Additional costs may apply for expedited processing.',
      'Costs do not include shipping, travel, or translation services.'
    ]
  };
}

/**
 * Calculate category total cost
 */
function calculateCategoryTotal(items: ChecklistItem[]): number {
  return items.reduce((total, item) => total + parseCostValue(item.estimatedCost), 0);
}

/**
 * Parse cost value from string
 */
function parseCostValue(costString: string): number {
  // Extract numeric value from cost string (e.g., "$500" -> 500)
  const match = costString.match(/[\d,]+/);
  if (match) {
    return parseInt(match[0].replace(/,/g, ''), 10);
  }
  
  // Handle ranges (e.g., "$500-1000" -> 750)
  const rangeMatch = costString.match(/(\d+)[^\d]+(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    return Math.round((min + max) / 2);
  }
  
  return 0;
}

/**
 * Calculate fit score
 */
function calculateFitScore(
  checklist: ComplianceChecklist,
  criticalRequirements: RegulatoryRequirementWithConfidence[]
): RegulatoryFitScore {
  // Calculate complexity score (0-10, lower is better)
  const complexityScore = Math.min(10, criticalRequirements.length * 2);
  
  // Calculate cost score (0-10, lower is better)
  const totalCost = parseCostValue(checklist.totalEstimatedCost);
  const costScore = Math.min(10, totalCost / 1000);
  
  // Calculate timeline score (0-10, lower is better)
  const timelineMatch = checklist.estimatedCompletionTime.match(/(\d+)/);
  const timelineValue = timelineMatch ? parseInt(timelineMatch[1], 10) : 0;
  const timelineScore = Math.min(10, timelineValue / 30); // 30 days = 1 point
  
  // Calculate certainty score (0-10, higher is better)
  const certaintyScore = Math.min(10, criticalRequirements.reduce((sum, req) => sum + req.confidence, 0) / criticalRequirements.length * 10);
  
  // Calculate overall score (0-100, higher is better)
  const overall = Math.round(
    (10 - complexityScore) * 2.5 +
    (10 - costScore) * 2.5 +
    (10 - timelineScore) * 2.5 +
    certaintyScore * 2.5
  );
  
  // Generate interpretation
  let interpretation = '';
  if (overall >= 80) {
    interpretation = 'Excellent regulatory fit. The product meets most requirements with minimal adaptation needed.';
  } else if (overall >= 60) {
    interpretation = 'Good regulatory fit. Some adaptations required but generally feasible.';
  } else if (overall >= 40) {
    interpretation = 'Moderate regulatory fit. Significant adaptations required but still viable.';
  } else {
    interpretation = 'Challenging regulatory fit. Consider product modifications or alternative markets.';
  }
  
  return {
    overall,
    components: {
      complexity: 10 - complexityScore,
      cost: 10 - costScore,
      timeline: 10 - timelineScore,
      certainty: certaintyScore
    },
    interpretation
  };
}

/**
 * Calculate data confidence
 */
function calculateDataConfidence(checklist: ComplianceChecklist): {
  overall: number;
  requirements: number;
  timeline: number;
  costs: number;
} {
  // Calculate requirements confidence
  const requirementsConfidence = 0.85; // Placeholder
  
  // Calculate timeline confidence
  const timelineConfidence = 0.75; // Placeholder
  
  // Calculate costs confidence
  const costsConfidence = 0.8; // Placeholder
  
  // Calculate overall confidence
  const overall = (requirementsConfidence + timelineConfidence + costsConfidence) / 3;
  
  return {
    overall,
    requirements: requirementsConfidence,
    timeline: timelineConfidence,
    costs: costsConfidence
  };
}

/**
 * Generate next steps
 */
function generateNextSteps(checklist: ComplianceChecklist): string[] {
  const criticalItems = checklist.items.filter(item => item.priority === 'high');
  
  const nextSteps = [
    `Address ${criticalItems.length} critical requirements first, starting with ${criticalItems[0]?.requirement || 'documentation'}.`,
    `Allocate a budget of approximately ${checklist.totalEstimatedCost} for compliance activities.`,
    `Establish a timeline of ${checklist.estimatedCompletionTime} for achieving full compliance.`,
    `Contact ${getMarketRegulatoryBodies(checklist.country)[0]} to confirm specific requirements for your product.`,
    `Consider engaging a local regulatory consultant in ${checklist.country} to facilitate the process.`
  ];
  
  return nextSteps;
}

/**
 * Get regulatory bodies for a market
 */
function getMarketRegulatoryBodies(country: string): string[] {
  // This would ideally come from a database
  if (country === 'United Arab Emirates' || country === 'UAE') {
    return [
      'Emirates Authority for Standardization and Metrology (ESMA)',
      'Dubai Municipality',
      'Abu Dhabi Quality and Conformity Council'
    ];
  } else if (country === 'United Kingdom' || country === 'UK') {
    return [
      'Office for Product Safety and Standards',
      'Food Standards Agency',
      'Medicines and Healthcare products Regulatory Agency'
    ];
  } else if (country === 'United States' || country === 'USA') {
    return [
      'Food and Drug Administration (FDA)',
      'Consumer Product Safety Commission (CPSC)',
      'Federal Communications Commission (FCC)',
      'Environmental Protection Agency (EPA)'
    ];
  }
  
  return ['National Regulatory Authority'];
}

/**
 * Get regulatory approach for a market
 */
function getMarketRegulatoryApproach(country: string): string {
  // This would ideally come from a database
  if (country === 'United Arab Emirates' || country === 'UAE') {
    return 'Centralized regulatory system with strong emphasis on conformity with Gulf standards (GSO).';
  } else if (country === 'United Kingdom' || country === 'UK') {
    return 'Post-Brexit regulatory framework based on UK Conformity Assessment (UKCA) marking, replacing CE marking.';
  } else if (country === 'United States' || country === 'USA') {
    return 'Decentralized regulatory system with multiple federal agencies having jurisdiction based on product type.';
  }
  
  return 'Standard regulatory approach with focus on product safety and compliance.';
}

/**
 * Calculate minimum cost range
 */
function calculateCostRangeMin(costString: string): string {
  const cost = parseCostValue(costString);
  return `$${formatNumber(Math.round(cost * 0.8))}`;
}

/**
 * Calculate maximum cost range
 */
function calculateCostRangeMax(costString: string): string {
  const cost = parseCostValue(costString);
  return `$${formatNumber(Math.round(cost * 1.2))}`;
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
} 