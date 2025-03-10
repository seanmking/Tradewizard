import { EnhancedRegulatoryRequirement } from '../types/regulatory';
import { Connectors } from '../connectors';
import { LLM, Tool } from '../types';

/**
 * Timeline and cost estimation for regulatory compliance
 * This module provides functions to estimate the timeline and costs associated with
 * meeting regulatory requirements for export markets
 */

// Extend the EnhancedRegulatoryRequirement for our needs
interface ExtendedRegulatoryRequirement extends EnhancedRegulatoryRequirement {
  id: string;
  name?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  dependencies?: string[];
  lastVerifiedDate?: string;
  costLastUpdated?: string;
}

// Define the types we need for this module
interface BusinessProfile {
  id: string;
  name: string;
  industry: string;
  products?: { name: string; category: string }[];
  certifications?: { name: string; issuer: string }[];
  exportExperience?: boolean;
  yearsInOperation?: number;
  employees?: number;
  preferredCurrency?: string;
}

interface CountryData {
  id: string;
  name: string;
  processingEfficiency?: number;
  costFactor?: number;
  regulatoryStability?: number;
  priceStability?: number;
}

interface TimelineEstimate {
  totalDays: number;
  criticalPath: {
    requirement: ExtendedRegulatoryRequirement;
    estimatedDays: number;
  }[];
  parallelPaths: {
    requirement: ExtendedRegulatoryRequirement;
    estimatedDays: number;
  }[][];
  earliestCompletionDate: Date;
  latestCompletionDate: Date;
  confidenceLevel: number;
}

interface CostEstimate {
  totalCost: {
    amount: number;
    currency: string;
  };
  breakdown: {
    requirement: ExtendedRegulatoryRequirement;
    estimatedCost: {
      amount: number;
      currency: string;
    };
    notes: string;
  }[];
  oneTimeCosts: {
    amount: number;
    currency: string;
  };
  recurringCosts: {
    amount: number;
    currency: string;
    frequency: 'monthly' | 'quarterly' | 'annually';
  }[];
  confidenceLevel: number;
}

interface ComplianceCostEstimate {
  timeline: TimelineEstimate;
  costs: CostEstimate;
  assumptions: string[];
  recommendations: string[];
}

/**
 * Estimate timeline for meeting regulatory requirements
 * @param requirements List of regulatory requirements
 * @param businessProfile Business profile information
 * @param countryData Country-specific data
 * @returns Timeline estimation
 */
export async function estimateComplianceTimeline(
  requirements: ExtendedRegulatoryRequirement[],
  businessProfile: BusinessProfile,
  countryData: CountryData
): Promise<TimelineEstimate> {
  try {
    // Validate inputs
    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
      throw new Error('Invalid or empty requirements list');
    }

    if (!businessProfile || typeof businessProfile !== 'object') {
      throw new Error('Invalid business profile');
    }

    if (!countryData || typeof countryData !== 'object') {
      throw new Error('Invalid country data');
    }

    // Calculate dependency graph for requirements
    const dependencyGraph = buildDependencyGraph(requirements);
    
    // Identify critical path requirements (those with dependencies)
    const criticalPathReqs = identifyCriticalPath(dependencyGraph);
    
    // Estimate days for each requirement based on complexity, business readiness, and country factors
    const estimatedDays = requirements.map(req => ({
      requirement: req,
      estimatedDays: calculateEstimatedDays(req, businessProfile, countryData)
    }));
    
    // Sort critical path by dependencies
    const criticalPath = criticalPathReqs
      .map(reqId => estimatedDays.find(item => item.requirement.id === reqId))
      .filter((item): item is { requirement: ExtendedRegulatoryRequirement; estimatedDays: number } => 
        item !== undefined
      );
    
    // Identify requirements that can be done in parallel
    const parallelPaths = identifyParallelPaths(dependencyGraph, estimatedDays);
    
    // Calculate total days based on critical path
    const totalDays = criticalPath.reduce((sum, item) => sum + item.estimatedDays, 0);
    
    // Calculate earliest completion date
    const earliestCompletionDate = new Date();
    earliestCompletionDate.setDate(earliestCompletionDate.getDate() + totalDays);
    
    // Calculate latest completion date with buffer for unexpected delays
    const latestCompletionDate = new Date();
    latestCompletionDate.setDate(latestCompletionDate.getDate() + totalDays * 1.2);
    
    // Calculate confidence level based on data quality and business readiness
    const confidenceLevel = calculateTimelineConfidence(requirements, businessProfile, countryData);

    return {
      totalDays,
      criticalPath,
      parallelPaths,
      earliestCompletionDate,
      latestCompletionDate,
      confidenceLevel
    };
  } catch (error) {
    console.error(`Error in estimateComplianceTimeline: ${error instanceof Error ? error.message : String(error)}`);
    // Return fallback estimate with low confidence
    return createFallbackTimelineEstimate(requirements);
  }
}

/**
 * Estimate costs for meeting regulatory requirements
 * @param requirements List of regulatory requirements
 * @param businessProfile Business profile information
 * @param countryData Country-specific data
 * @returns Cost estimation
 */
export async function estimateComplianceCosts(
  requirements: ExtendedRegulatoryRequirement[],
  businessProfile: BusinessProfile,
  countryData: CountryData
): Promise<CostEstimate> {
  try {
    // Validate inputs
    if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
      throw new Error('Invalid or empty requirements list');
    }

    if (!businessProfile || typeof businessProfile !== 'object') {
      throw new Error('Invalid business profile');
    }

    if (!countryData || typeof countryData !== 'object') {
      throw new Error('Invalid country data');
    }

    // Currency to use for estimates
    const currency = businessProfile.preferredCurrency || 'USD';
    
    // Calculate cost breakdown for each requirement
    const breakdown = requirements.map(req => ({
      requirement: req,
      estimatedCost: calculateRequirementCost(req, businessProfile, countryData, currency),
      notes: generateCostNotes(req, businessProfile, countryData)
    }));
    
    // Calculate total one-time costs
    const oneTimeCosts = {
      amount: breakdown
        .filter(item => !isRecurringRequirement(item.requirement))
        .reduce((sum, item) => sum + item.estimatedCost.amount, 0),
      currency
    };
    
    // Identify and calculate recurring costs
    const recurringCosts = calculateRecurringCosts(breakdown, currency);
    
    // Calculate total cost (one-time + first year of recurring)
    const totalCost = {
      amount: oneTimeCosts.amount + recurringCosts.reduce((sum, item) => {
        const annualAmount = item.frequency === 'monthly' 
          ? item.amount * 12 
          : item.frequency === 'quarterly' 
            ? item.amount * 4 
            : item.amount;
        return sum + annualAmount;
      }, 0),
      currency
    };
    
    // Calculate confidence level based on data quality and market factors
    const confidenceLevel = calculateCostConfidence(requirements, businessProfile, countryData);

    return {
      totalCost,
      breakdown,
      oneTimeCosts,
      recurringCosts,
      confidenceLevel
    };
  } catch (error) {
    console.error(`Error in estimateComplianceCosts: ${error instanceof Error ? error.message : String(error)}`);
    // Return fallback estimate with low confidence
    return createFallbackCostEstimate(requirements);
  }
}

function calculateRequirementCost(
  requirement: ExtendedRegulatoryRequirement,
  businessProfile: BusinessProfile,
  countryData: CountryData,
  currency: string
): { amount: number; currency: string } {
  // Base cost estimation based on requirement type
  let baseCost = 0;
  
  switch (requirement.requirementType) {
    case 'certification':
      baseCost = 5000;
      break;
    case 'documentation':
      baseCost = 1000;
      break;
    case 'registration':
      baseCost = 2500;
      break;
    case 'licensing':
      baseCost = 3500;
      break;
    default:
      baseCost = 1500; // Default fallback
  }
  
  // Adjust based on complexity
  switch (requirement.complexity) {
    case 'simple':
      baseCost *= 0.7;
      break;
    case 'moderate':
      baseCost *= 1.0;
      break;
    case 'complex':
      baseCost *= 1.5;
      break;
  }
  
  // Adjust based on business size
  const businessSizeMultiplier = calculateBusinessSizeMultiplier(businessProfile);
  
  // Adjust based on country cost factors
  const countryCostMultiplier = countryData.costFactor || 1.0;
  
  // Calculate final cost
  const finalAmount = Math.round(baseCost * businessSizeMultiplier * countryCostMultiplier);
  
  return {
    amount: finalAmount,
    currency
  };
}

function calculateBusinessSizeMultiplier(businessProfile: BusinessProfile): number {
  const employees = businessProfile.employees || 0;
  
  if (employees < 10) return 0.7; // Small businesses get lower costs
  if (employees < 50) return 0.9; // Medium-small
  if (employees < 250) return 1.0; // Medium
  return 1.2; // Large businesses often have higher costs due to complexity
}

function generateCostNotes(
  requirement: ExtendedRegulatoryRequirement,
  businessProfile: BusinessProfile,
  countryData: CountryData
): string {
  // Generate helpful notes about the cost estimation
  const notes = [];
  
  // Add information about what's included
  notes.push(`Includes application fees, processing, and basic consulting.`);
  
  // Add information about business size adjustment
  const employees = businessProfile.employees || 0;
  if (employees < 10) {
    notes.push(`Estimate adjusted for small business.`);
  } else if (employees > 250) {
    notes.push(`Estimate adjusted for enterprise-scale business.`);
  }
  
  // Add information about country-specific factors
  if (countryData.costFactor && countryData.costFactor > 1.2) {
    notes.push(`${countryData.name} has higher than average processing fees.`);
  } else if (countryData.costFactor && countryData.costFactor < 0.8) {
    notes.push(`${countryData.name} has lower than average processing fees.`);
  }
  
  // Add notes about potential additional costs
  if (requirement.requirementType === 'certification') {
    notes.push(`May require additional testing costs depending on product.`);
  }
  
  // Add information about recurring fees if applicable
  if (isRecurringRequirement(requirement)) {
    notes.push(`Requires recurring maintenance fees.`);
  }
  
  return notes.join(' ');
}

function isRecurringRequirement(requirement: ExtendedRegulatoryRequirement): boolean {
  // Determine if a requirement has recurring costs
  const recurringTypes = ['certification', 'licensing', 'registration'];
  return recurringTypes.includes(requirement.requirementType);
}

function calculateRecurringCosts(
  breakdown: {
    requirement: ExtendedRegulatoryRequirement;
    estimatedCost: { amount: number; currency: string };
    notes: string;
  }[],
  currency: string
): {
  amount: number;
  currency: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
}[] {
  // Group recurring costs by frequency
  const recurringCosts: {
    amount: number;
    currency: string;
    frequency: 'monthly' | 'quarterly' | 'annually';
  }[] = [];
  
  // Annual certifications and licenses
  const annualItems = breakdown.filter(item => 
    (item.requirement.requirementType === 'certification' || 
     item.requirement.requirementType === 'licensing') &&
    isRecurringRequirement(item.requirement)
  );
  
  if (annualItems.length > 0) {
    const annualAmount = annualItems.reduce((sum, item) => 
      sum + item.estimatedCost.amount * 0.2, 0); // Typically 20% of initial cost
    
    recurringCosts.push({
      amount: annualAmount,
      currency,
      frequency: 'annually'
    });
  }
  
  // Quarterly reporting requirements
  const quarterlyItems = breakdown.filter(item => 
    item.requirement.frequency === 'periodic' // Use 'periodic' instead of 'quarterly'
  );
  
  if (quarterlyItems.length > 0) {
    const quarterlyAmount = quarterlyItems.reduce((sum, item) => 
      sum + item.estimatedCost.amount * 0.1, 0); // Typically 10% of initial cost
    
    recurringCosts.push({
      amount: quarterlyAmount,
      currency,
      frequency: 'quarterly'
    });
  }
  
  // Monthly maintenance items
  const monthlyItems = breakdown.filter(item => 
    item.requirement.frequency === 'ongoing' // Use 'ongoing' instead of 'monthly'
  );
  
  if (monthlyItems.length > 0) {
    const monthlyAmount = monthlyItems.reduce((sum, item) => 
      sum + item.estimatedCost.amount * 0.05, 0); // Typically 5% of initial cost
    
    recurringCosts.push({
      amount: monthlyAmount,
      currency,
      frequency: 'monthly'
    });
  }
  
  return recurringCosts;
}

function calculateCostConfidence(
  requirements: ExtendedRegulatoryRequirement[],
  businessProfile: BusinessProfile,
  countryData: CountryData
): number {
  // Calculate confidence level for cost estimates
  
  // Start with base confidence
  let confidence = 0.65; // Cost estimates are inherently less certain than timeline
  
  // Adjust based on data completeness
  const dataCompleteness = calculateDataCompleteness(requirements, businessProfile, countryData);
  confidence *= dataCompleteness;
  
  // Adjust based on price volatility in target country
  if (countryData.priceStability) {
    confidence *= countryData.priceStability;
  }
  
  // Adjust based on recent data
  const hasRecentPriceData = hasRecentData(requirements, 'cost');
  if (hasRecentPriceData) {
    confidence *= 1.2; // Increase confidence if we have recent pricing data
  } else {
    confidence *= 0.8; // Decrease if pricing data might be outdated
  }
  
  // Ensure confidence is between 0 and 1
  return Math.min(1, Math.max(0, confidence));
}

/**
 * Provide comprehensive cost and timeline estimate for compliance
 * @param requirements List of regulatory requirements
 * @param businessProfile Business profile information
 * @param countryData Country-specific data
 * @returns Combined timeline and cost estimation with recommendations
 */
export async function getComprehensiveComplianceEstimate(
  requirements: ExtendedRegulatoryRequirement[],
  businessProfile: BusinessProfile,
  countryData: CountryData
): Promise<ComplianceCostEstimate> {
  try {
    // Generate timeline estimate
    const timeline = await estimateComplianceTimeline(requirements, businessProfile, countryData);
    
    // Generate cost estimate
    const costs = await estimateComplianceCosts(requirements, businessProfile, countryData);
    
    // Generate assumptions based on available data
    const assumptions = generateAssumptions(requirements, businessProfile, countryData);
    
    // Generate recommendations to optimize timeline and costs
    const recommendations = generateRecommendations(timeline, costs, businessProfile, countryData);
    
    return {
      timeline,
      costs,
      assumptions,
      recommendations
    };
  } catch (error) {
    console.error(`Error in getComprehensiveComplianceEstimate: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return fallback estimates with minimal assumptions and recommendations
    const timeline = createFallbackTimelineEstimate(requirements);
    const costs = createFallbackCostEstimate(requirements);
    
    return {
      timeline,
      costs,
      assumptions: [
        'Estimates are based on limited data and should be considered preliminary.',
        'Actual timelines and costs may vary significantly.'
      ],
      recommendations: [
        'Consult with a regulatory specialist for more accurate estimates.',
        'Contact relevant authorities for official information.'
      ]
    };
  }
}

function generateAssumptions(
  requirements: ExtendedRegulatoryRequirement[],
  businessProfile: BusinessProfile,
  countryData: CountryData
): string[] {
  // Generate list of assumptions used in the estimates
  const assumptions = [
    'All documentation is submitted correctly on first attempt.',
    'No significant changes to regulatory requirements during the application process.',
    'Business is in good standing and meets basic eligibility requirements.',
    `Processing times based on current ${countryData.name} regulatory authority efficiency.`,
    'Cost estimates exclude potential legal consultation fees unless specified.',
    'Timeline assumes business will respond to information requests within 48 hours.'
  ];
  
  // Add business-specific assumptions
  if (businessProfile.exportExperience) {
    assumptions.push('Timeline benefits from previous export experience.');
  } else {
    assumptions.push('Timeline accounts for first-time exporter learning curve.');
  }
  
  // Add product-specific assumptions if available
  if (businessProfile.products && businessProfile.products.length > 0) {
    const productCategories = new Set(businessProfile.products.map(p => p.category));
    
    if (productCategories.has('food')) {
      assumptions.push('Products require standard food safety certifications without special handling requirements.');
    } else if (productCategories.has('electronics')) {
      assumptions.push('Products meet basic electrical safety standards for target market.');
    }
  }
  
  return assumptions;
}

function generateRecommendations(
  timeline: TimelineEstimate,
  costs: CostEstimate,
  businessProfile: BusinessProfile,
  countryData: CountryData
): string[] {
  // Generate recommendations to optimize timeline and costs
  const recommendations = [];
  
  // Recommend critical path optimization if timeline is long
  if (timeline.totalDays > 60) {
    recommendations.push(
      'Focus resources on critical path requirements to reduce overall timeline.'
    );
  }
  
  // Recommend parallelization for efficiency
  if (timeline.parallelPaths && timeline.parallelPaths.length > 0) {
    recommendations.push(
      'Process parallel requirements simultaneously to reduce overall timeline.'
    );
  }
  
  // Recommend cost-saving measures if total cost is high
  if (costs.totalCost.amount > 10000) {
    recommendations.push(
      'Consider bundling applications where possible to reduce administrative fees.'
    );
  }
  
  // Recommend appropriate preparation based on confidence level
  if (timeline.confidenceLevel < 0.7 || costs.confidenceLevel < 0.7) {
    recommendations.push(
      'Build in additional buffer time and budget due to estimation uncertainty.'
    );
  }
  
  // Add country-specific recommendations
  if (countryData.name) {
    recommendations.push(
      `For ${countryData.name}, consider engaging a local agent to expedite government processes.`
    );
  }
  
  // Recommend certification strategy based on business profile
  if (!businessProfile.exportExperience) {
    recommendations.push(
      'Prioritize foundational certifications that are transferable across multiple markets.'
    );
  }
  
  return recommendations;
}

/**
 * Register compliance cost tools
 */
export function registerComplianceCostTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'estimate_compliance_timeline',
      description: 'Estimate timeline for meeting regulatory requirements',
      parameters: [
        {
          name: 'requirements',
          description: 'List of regulatory requirements',
          type: 'array',
          required: true
        },
        {
          name: 'business_profile',
          description: 'Business profile information',
          type: 'object',
          required: true
        },
        {
          name: 'country_data',
          description: 'Country-specific data',
          type: 'object',
          required: true
        }
      ],
      handler: async (params) => estimateComplianceTimeline(
        params.requirements,
        params.business_profile,
        params.country_data
      )
    },
    {
      name: 'estimate_compliance_costs',
      description: 'Estimate costs for meeting regulatory requirements',
      parameters: [
        {
          name: 'requirements',
          description: 'List of regulatory requirements',
          type: 'array',
          required: true
        },
        {
          name: 'business_profile',
          description: 'Business profile information',
          type: 'object',
          required: true
        },
        {
          name: 'country_data',
          description: 'Country-specific data',
          type: 'object',
          required: true
        }
      ],
      handler: async (params) => estimateComplianceCosts(
        params.requirements,
        params.business_profile,
        params.country_data
      )
    },
    {
      name: 'get_comprehensive_compliance_estimate',
      description: 'Get comprehensive cost and timeline estimate for compliance',
      parameters: [
        {
          name: 'requirements',
          description: 'List of regulatory requirements',
          type: 'array',
          required: true
        },
        {
          name: 'business_profile',
          description: 'Business profile information',
          type: 'object',
          required: true
        },
        {
          name: 'country_data',
          description: 'Country-specific data',
          type: 'object',
          required: true
        }
      ],
      handler: async (params) => getComprehensiveComplianceEstimate(
        params.requirements,
        params.business_profile,
        params.country_data
      )
    }
  ];
}

// Placeholder for helper functions
function createFallbackTimelineEstimate(
  requirements: ExtendedRegulatoryRequirement[]
): TimelineEstimate {
  // Simple placeholder implementation
  const totalDays = requirements.length * 15;
  const earliestCompletionDate = new Date();
  earliestCompletionDate.setDate(earliestCompletionDate.getDate() + totalDays);
  const latestCompletionDate = new Date();
  latestCompletionDate.setDate(latestCompletionDate.getDate() + totalDays * 1.5);
  
  return {
    totalDays,
    criticalPath: [],
    parallelPaths: [],
    earliestCompletionDate,
    latestCompletionDate,
    confidenceLevel: 0.4
  };
}

function createFallbackCostEstimate(
  requirements: ExtendedRegulatoryRequirement[]
): CostEstimate {
  // Simple placeholder implementation
  const totalAmount = requirements.length * 2500;
  
  return {
    totalCost: {
      amount: totalAmount,
      currency: 'USD'
    },
    breakdown: [],
    oneTimeCosts: {
      amount: totalAmount * 0.8,
      currency: 'USD'
    },
    recurringCosts: [{
      amount: totalAmount * 0.2,
      currency: 'USD',
      frequency: 'annually'
    }],
    confidenceLevel: 0.4
  };
}

// Helper functions for timeline estimation

function buildDependencyGraph(requirements: ExtendedRegulatoryRequirement[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();
  
  requirements.forEach(req => {
    if (!graph.has(req.id)) {
      graph.set(req.id, []);
    }
    
    // If the requirement has dependencies, add them
    if (req.dependencies && Array.isArray(req.dependencies)) {
      graph.set(req.id, req.dependencies);
    }
  });
  
  return graph;
}

function identifyCriticalPath(dependencyGraph: Map<string, string[]>): string[] {
  // This is a simplified implementation - in a real system, you would use
  // a proper critical path algorithm to find the longest path through the dependency graph
  
  // For this example, we'll take a simplified approach
  const nodesWithDependents = new Set<string>();
  const criticalPath: string[] = [];
  
  // Identify nodes that are dependencies for other nodes
  dependencyGraph.forEach((dependencies, _) => {
    dependencies.forEach(dep => nodesWithDependents.add(dep));
  });
  
  // Identify start nodes (no dependencies)
  const startNodes: string[] = [];
  dependencyGraph.forEach((dependencies, node) => {
    if (dependencies.length === 0) {
      startNodes.push(node);
    }
  });
  
  // Simple approach: include start nodes that have dependents, then all nodes with dependents
  startNodes.forEach(node => {
    if (nodesWithDependents.has(node)) {
      criticalPath.push(node);
    }
  });
  
  dependencyGraph.forEach((dependencies, node) => {
    if (dependencies.length > 0 && !criticalPath.includes(node)) {
      criticalPath.push(node);
    }
  });
  
  return criticalPath;
}

function identifyParallelPaths(
  dependencyGraph: Map<string, string[]>, 
  estimatedDays: { requirement: ExtendedRegulatoryRequirement; estimatedDays: number }[]
): { requirement: ExtendedRegulatoryRequirement; estimatedDays: number }[][] {
  // Group requirements that can be processed in parallel
  const parallelGroups: { requirement: ExtendedRegulatoryRequirement; estimatedDays: number }[][] = [];
  const assignedReqs = new Set<string>();
  
  // Get all nodes with no dependencies that aren't in the critical path
  const independentNodes: string[] = [];
  dependencyGraph.forEach((dependencies, node) => {
    if (dependencies.length === 0) {
      independentNodes.push(node);
    }
  });
  
  // Group independent nodes
  const independentGroup = independentNodes
    .map(nodeId => estimatedDays.find(item => item.requirement.id === nodeId))
    .filter((item): item is { requirement: ExtendedRegulatoryRequirement; estimatedDays: number } => 
      item !== undefined
    );
  
  if (independentGroup.length > 0) {
    parallelGroups.push(independentGroup);
    independentGroup.forEach(item => assignedReqs.add(item.requirement.id));
  }
  
  // Group remaining nodes by common dependencies
  const commonDepGroups = new Map<string, string[]>();
  
  dependencyGraph.forEach((dependencies, node) => {
    if (!assignedReqs.has(node) && dependencies.length > 0) {
      const depKey = dependencies.sort().join(',');
      if (!commonDepGroups.has(depKey)) {
        commonDepGroups.set(depKey, []);
      }
      const group = commonDepGroups.get(depKey);
      if (group) {
        group.push(node);
      }
    }
  });
  
  commonDepGroups.forEach((nodes, _) => {
    const group = nodes
      .map(nodeId => estimatedDays.find(item => item.requirement.id === nodeId))
      .filter((item): item is { requirement: ExtendedRegulatoryRequirement; estimatedDays: number } => 
        item !== undefined
      );
    
    if (group.length > 0) {
      parallelGroups.push(group);
    }
  });
  
  return parallelGroups;
}

function calculateEstimatedDays(
  requirement: ExtendedRegulatoryRequirement,
  businessProfile: BusinessProfile,
  countryData: CountryData
): number {
  // Base estimation based on requirement complexity
  let baseDays = 0;
  
  switch (requirement.complexity) {
    case 'simple':
      baseDays = 7;
      break;
    case 'moderate':
      baseDays = 21;
      break;
    case 'complex':
      baseDays = 45;
      break;
    default:
      // If complexity is not specified, estimate based on requirement type
      switch (requirement.requirementType) {
        case 'certification':
          baseDays = 30;
          break;
        case 'documentation':
          baseDays = 14;
          break;
        case 'registration':
          baseDays = 21;
          break;
        case 'licensing':
          baseDays = 28;
          break;
        default:
          baseDays = 14; // Default fallback
      }
  }
  
  // Adjust based on business readiness
  const readinessMultiplier = calculateReadinessMultiplier(businessProfile, requirement);
  
  // Adjust based on country processing efficiency
  const countryMultiplier = (countryData.processingEfficiency || 1.0);
  
  // Final calculation with minimum of 1 day
  return Math.max(1, Math.round(baseDays * readinessMultiplier * countryMultiplier));
}

function calculateReadinessMultiplier(
  businessProfile: BusinessProfile,
  requirement: ExtendedRegulatoryRequirement
): number {
  // Check if business already has similar certifications
  const hasSimilarCertifications = (businessProfile.certifications || []).some(cert => 
    cert.name.toLowerCase().includes(requirement.name?.toLowerCase() || '')
  );
  
  // Check if business has export experience
  const hasExportExperience = businessProfile.exportExperience || false;
  
  // Check business size/maturity
  const isMatureCompany = (businessProfile.yearsInOperation || 0) > 5;
  
  // Calculate multiplier (lower is better - faster processing)
  let multiplier = 1.0;
  
  if (hasSimilarCertifications) multiplier *= 0.7;
  if (hasExportExperience) multiplier *= 0.8;
  if (isMatureCompany) multiplier *= 0.9;
  
  // If business is completely new to exporting with no experience, things take longer
  if (!hasExportExperience && !hasSimilarCertifications && !isMatureCompany) {
    multiplier = 1.5;
  }
  
  return multiplier;
}

function calculateTimelineConfidence(
  requirements: ExtendedRegulatoryRequirement[],
  businessProfile: BusinessProfile,
  countryData: CountryData
): number {
  // Calculate confidence level based on data quality and factors
  
  // Start with base confidence
  let confidence = 0.7;
  
  // Adjust based on data completeness
  const dataCompleteness = calculateDataCompleteness(requirements, businessProfile, countryData);
  confidence *= dataCompleteness;
  
  // Adjust based on country stability
  if (countryData.regulatoryStability) {
    confidence *= countryData.regulatoryStability;
  }
  
  // Adjust based on experience with similar requirements
  const hasExperience = hasExperienceWithSimilarRequirements(requirements, businessProfile);
  if (hasExperience) {
    confidence *= 1.2; // Increase confidence if business has relevant experience
  } else {
    confidence *= 0.9; // Decrease slightly if no experience
  }
  
  // Ensure confidence is between 0 and 1
  return Math.min(1, Math.max(0, confidence));
}

function calculateDataCompleteness(
  requirements: ExtendedRegulatoryRequirement[],
  businessProfile: BusinessProfile,
  countryData: CountryData
): number {
  // Calculate how complete our data is for accurate estimations
  let completenessScore = 1.0;
  
  // Check if requirements have necessary data
  const hasRequirementData = requirements.every(req => 
    req.id && req.requirementType
  );
  
  if (!hasRequirementData) completenessScore *= 0.8;
  
  // Check if business profile has necessary data
  const hasBusinessData = businessProfile.id && 
    businessProfile.industry &&
    (businessProfile.yearsInOperation !== undefined);
  
  if (!hasBusinessData) completenessScore *= 0.9;
  
  // Check if country data has necessary information
  const hasCountryData = countryData.id && 
    countryData.name &&
    (countryData.processingEfficiency !== undefined);
  
  if (!hasCountryData) completenessScore *= 0.85;
  
  return completenessScore;
}

function hasExperienceWithSimilarRequirements(
  requirements: ExtendedRegulatoryRequirement[],
  businessProfile: BusinessProfile
): boolean {
  // Check if business has experience with similar requirements
  const businessCertifications = businessProfile.certifications || [];
  
  // Look for overlap between current certifications and required ones
  return requirements.some(req => 
    businessCertifications.some(cert => 
      cert.name.toLowerCase().includes(req.name?.toLowerCase() || '') ||
      (req.name && req.name.toLowerCase().includes(cert.name.toLowerCase()))
    )
  );
}

function hasRecentData(
  requirements: ExtendedRegulatoryRequirement[],
  dataType: 'timeline' | 'cost'
): boolean {
  // Check if we have recent data for the requirements
  const currentYear = new Date().getFullYear();
  
  // Different properties to check based on data type
  const propertyToCheck = dataType === 'timeline' 
    ? 'lastVerifiedDate' 
    : 'costLastUpdated';
  
  // Check if at least 70% of requirements have recent data
  const recentDataCount = requirements.filter(req => {
    if (!req[propertyToCheck]) return false;
    
    const dataYear = new Date(req[propertyToCheck] as string).getFullYear();
    return (currentYear - dataYear) <= 2; // Consider data recent if within last 2 years
  }).length;
  
  return (recentDataCount / requirements.length) >= 0.7;
}
