/**
 * Compliance Checklist Tools
 * 
 * This module provides tools for generating compliance checklists
 * and action plans for regulatory compliance.
 */

import { Connectors } from '../connectors';
import { LLM, Tool, RegulatoryRequirement } from '../types';
import { ApiError } from '../utils/error-handling';

// Market-specific constants for UAE, UK, and USA
const TARGET_MARKETS = {
  UAE: {
    name: 'United Arab Emirates',
    code: 'UAE',
    regulatoryBodies: [
      'Emirates Authority for Standardization and Metrology (ESMA)',
      'Dubai Municipality',
      'Abu Dhabi Quality and Conformity Council'
    ],
    estimatedBaseDays: 90, // Base days for compliance
    complexityFactors: {
      food: 1.5,
      medical: 2.0,
      electronics: 1.3,
      textiles: 1.0,
      chemicals: 1.8,
      default: 1.2
    }
  },
  UK: {
    name: 'United Kingdom',
    code: 'UK',
    regulatoryBodies: [
      'Office for Product Safety and Standards',
      'Food Standards Agency',
      'Medicines and Healthcare products Regulatory Agency'
    ],
    estimatedBaseDays: 60,
    complexityFactors: {
      food: 1.3,
      medical: 1.8,
      electronics: 1.2,
      textiles: 0.9,
      chemicals: 1.6,
      default: 1.1
    }
  },
  USA: {
    name: 'United States of America',
    code: 'USA',
    regulatoryBodies: [
      'Food and Drug Administration (FDA)',
      'Consumer Product Safety Commission (CPSC)',
      'Federal Communications Commission (FCC)',
      'Environmental Protection Agency (EPA)'
    ],
    estimatedBaseDays: 75,
    complexityFactors: {
      food: 1.4,
      medical: 2.2,
      electronics: 1.3,
      textiles: 1.0,
      chemicals: 1.7,
      default: 1.2
    }
  }
};

// Product category mapping to standardize categories
const PRODUCT_CATEGORY_MAPPING: Record<string, string> = {
  // Food and beverages
  'food': 'food',
  'beverage': 'food',
  'agricultural': 'food',
  'produce': 'food',
  'fruit': 'food',
  'vegetable': 'food',
  'meat': 'food',
  'dairy': 'food',
  'processed food': 'food',
  
  // Medical and healthcare
  'medical': 'medical',
  'healthcare': 'medical',
  'pharmaceutical': 'medical',
  'medicine': 'medical',
  'medical device': 'medical',
  'medical equipment': 'medical',
  
  // Electronics
  'electronic': 'electronics',
  'electrical': 'electronics',
  'computer': 'electronics',
  'electronic device': 'electronics',
  'appliance': 'electronics',
  
  // Textiles
  'textile': 'textiles',
  'clothing': 'textiles',
  'apparel': 'textiles',
  'fabric': 'textiles',
  'garment': 'textiles',
  
  // Chemicals
  'chemical': 'chemicals',
  'cosmetic': 'chemicals',
  'cleaning': 'chemicals',
  'paint': 'chemicals',
  'solvent': 'chemicals'
};

/**
 * Checklist item interface
 */
export interface ChecklistItem {
  id: string;
  requirement: string;
  description: string;
  status: 'completed' | 'in-progress' | 'not-started';
  priority: 'high' | 'medium' | 'low';
  timeline: string;
  estimatedCost: string;
  resources: string[];
  actions: string[];
  marketSpecific: boolean; // Indicates if this is a market-specific requirement
}

/**
 * Compliance checklist interface
 */
export interface ComplianceChecklist {
  id: string;
  country: string;
  productCategory: string;
  hsCode?: string;
  businessName: string;
  createdAt: string;
  updatedAt: string;
  items: ChecklistItem[];
  overallProgress: number;
  estimatedCompletionTime: string;
  totalEstimatedCost: string;
  milestones: ComplianceMilestone[]; // Added milestones for timeline tracking
}

/**
 * Compliance milestone interface for tracking timeline
 */
export interface ComplianceMilestone {
  id: string;
  name: string;
  description: string;
  estimatedCompletionDate: string;
  dependsOn: string[]; // IDs of checklist items that must be completed before this milestone
  status: 'not-started' | 'in-progress' | 'completed';
}

/**
 * Action plan interface
 */
export interface ActionPlan {
  id: string;
  country: string;
  productCategory: string;
  hsCode?: string;
  businessName: string;
  createdAt: string;
  updatedAt: string;
  phases: {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'not-started' | 'in-progress' | 'completed';
    tasks: {
      id: string;
      name: string;
      description: string;
      assignedTo?: string;
      dueDate: string;
      status: 'not-started' | 'in-progress' | 'completed';
      priority: 'high' | 'medium' | 'low';
      dependencies?: string[];
    }[];
  }[];
  overallProgress: number;
}

/**
 * Maps a product category to a standardized category for complexity calculation
 */
function mapToStandardCategory(productCategory: string): string {
  const lowerCategory = productCategory.toLowerCase();
  
  for (const [key, value] of Object.entries(PRODUCT_CATEGORY_MAPPING)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }
  
  return 'default';
}

/**
 * Gets market-specific complexity factor for timeline estimation
 */
function getComplexityFactor(country: string, productCategory: string): number {
  const standardCategory = mapToStandardCategory(productCategory);
  
  if (country === 'UAE' || country === 'United Arab Emirates') {
    return TARGET_MARKETS.UAE.complexityFactors[standardCategory as keyof typeof TARGET_MARKETS.UAE.complexityFactors] || 
           TARGET_MARKETS.UAE.complexityFactors.default;
  } else if (country === 'UK' || country === 'United Kingdom') {
    return TARGET_MARKETS.UK.complexityFactors[standardCategory as keyof typeof TARGET_MARKETS.UK.complexityFactors] || 
           TARGET_MARKETS.UK.complexityFactors.default;
  } else if (country === 'USA' || country === 'United States' || country === 'United States of America') {
    return TARGET_MARKETS.USA.complexityFactors[standardCategory as keyof typeof TARGET_MARKETS.USA.complexityFactors] || 
           TARGET_MARKETS.USA.complexityFactors.default;
  }
  
  return 1.2; // Default complexity factor
}

/**
 * Gets base timeline estimation for a country
 */
function getBaseTimelineEstimation(country: string): number {
  if (country === 'UAE' || country === 'United Arab Emirates') {
    return TARGET_MARKETS.UAE.estimatedBaseDays;
  } else if (country === 'UK' || country === 'United Kingdom') {
    return TARGET_MARKETS.UK.estimatedBaseDays;
  } else if (country === 'USA' || country === 'United States' || country === 'United States of America') {
    return TARGET_MARKETS.USA.estimatedBaseDays;
  }
  
  return 75; // Default base days
}

/**
 * Generate a compliance checklist
 */
async function generateComplianceChecklist(
  country: string,
  productCategory: string,
  hsCode: string | undefined,
  businessProfile: {
    name: string;
    certifications?: string[];
    exportExperience?: string;
    size?: string;
  },
  connectors: Connectors,
  llm: LLM
): Promise<ComplianceChecklist> {
  try {
    // Create an empty checklist
    const checklist = createEmptyChecklist(country, productCategory, hsCode, businessProfile.name);
    
    // Get regulatory requirements
    const requirements = await connectors.regulatoryDb.getRequirements(country, productCategory, hsCode);
    
    if (!requirements || requirements.length === 0) {
      throw new ApiError('No regulatory requirements found', 404);
    }
    
    // Categorize requirements by type
    const categorizedRequirements = categorizeRequirementsByType(requirements);
    
    // Process each category of requirements
    for (const [category, reqs] of Object.entries(categorizedRequirements)) {
      for (const req of reqs) {
        // Generate actions for the requirement
        const actions = await generateActionsForRequirement(req, country, llm);
        
        // Get priority for the requirement
        const priority = getPriorityForRequirement(req);
        
        // Get resources for the requirement
        const resources = getResourcesForRequirement(req);
        
        // Parse timeline and cost
        const timeline = parseTimeline(req.estimatedTimeline);
        const cost = parseCost(req.estimatedCost);
        
        // Apply complexity factor based on product category and country
        const complexityFactor = getComplexityFactor(country, productCategory);
        const adjustedDays = Math.round(timeline.days * complexityFactor);
        const adjustedTimeline = formatTimelineEstimate(adjustedDays);
        
        // Create checklist item
        const item: ChecklistItem = {
          id: `req-${checklist.items.length + 1}`,
          requirement: req.requirementType,
          description: req.description,
          status: 'not-started',
          priority,
          timeline: adjustedTimeline,
          estimatedCost: cost.display,
          resources,
          actions,
          marketSpecific: false // Default to false since it's not in the RegulatoryRequirement interface
        };
        
        checklist.items.push(item);
      }
    }
    
    // Calculate overall progress
    checklist.overallProgress = 0; // All items start as not-started
    
    // Calculate total estimated cost
    const totalCost = checklist.items.reduce((sum, item) => {
      const cost = parseCost(item.estimatedCost);
      return sum + cost.value;
    }, 0);
    checklist.totalEstimatedCost = formatCostEstimate(totalCost);
    
    // Calculate estimated completion time
    const complexityFactor = getComplexityFactor(country, productCategory);
    const baseTimeline = getBaseTimelineEstimation(country);
    const estimatedDays = Math.round(baseTimeline * complexityFactor);
    checklist.estimatedCompletionTime = formatTimelineEstimate(estimatedDays);
    
    // Generate milestones
    checklist.milestones = generateComplianceMilestones(checklist, country, productCategory);
    
    return checklist;
  } catch (error) {
    console.error('Error generating compliance checklist:', error);
    throw error;
  }
}

/**
 * Create an empty checklist
 */
function createEmptyChecklist(
  country: string,
  productCategory: string,
  hsCode: string | undefined,
  businessName: string
): ComplianceChecklist {
  return {
    id: `checklist-${Math.random().toString(36).substring(2, 10)}`,
    country,
    productCategory,
    hsCode,
    businessName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: 'empty-1',
        requirement: 'General Export Documentation',
        description: 'Basic export documentation required for all exports',
        status: 'not-started',
        priority: 'medium',
        timeline: '1-2 weeks',
        estimatedCost: '$200-500',
        resources: ['Customs Authority', 'Trade Department'],
        actions: [
          'Prepare commercial invoice',
          'Prepare packing list',
          'Obtain certificate of origin',
          'Prepare bill of lading or airway bill'
        ],
        marketSpecific: false
      }
    ],
    overallProgress: 0,
    estimatedCompletionTime: '2 weeks',
    totalEstimatedCost: '$500',
    milestones: []
  };
}

/**
 * Categorize requirements by type
 */
function categorizeRequirementsByType(
  requirements: RegulatoryRequirement[]
): Record<string, RegulatoryRequirement[]> {
  const categories: Record<string, RegulatoryRequirement[]> = {};
  
  for (const req of requirements) {
    const category = req.requirementType;
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push(req);
  }
  
  return categories;
}

/**
 * Generate actions for a requirement
 */
async function generateActionsForRequirement(
  requirement: RegulatoryRequirement,
  country: string,
  llm: LLM
): Promise<string[]> {
  try {
    // Create a prompt for the LLM
    const prompt = `
      Generate 3-5 specific action steps for complying with the following regulatory requirement for exporting to ${country}:
      
      Requirement Type: ${requirement.requirementType}
      Description: ${requirement.description}
      Agency: ${typeof requirement.agency === 'string' ? requirement.agency : requirement.agency.name}
      
      Each action step should be:
      1. Clear and specific
      2. Actionable by the business
      3. Directly related to achieving compliance with this requirement
      
      Format each action as a bullet point starting with "- ".
    `;
    
    // Get LLM response
    const response = await llm.complete(prompt);
    
    // Parse actions from the response
    const actions = response
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(2).trim())
      .filter(action => action.length > 0);
    
    // Ensure we have at least one action
    if (actions.length === 0) {
      return getDefaultActionsForRequirementType(requirement.requirementType);
    }
    
    return actions;
  } catch (error) {
    console.error('Error generating actions for requirement:', error instanceof Error ? error.message : String(error));
    return getDefaultActionsForRequirementType(requirement.requirementType);
  }
}

/**
 * Get default actions for a requirement type
 */
function getDefaultActionsForRequirementType(requirementType: string): string[] {
  const defaultActions: Record<string, string[]> = {
    'Documentation': [
      'Identify all required documents',
      'Prepare document templates',
      'Gather necessary information',
      'Submit documents for approval'
    ],
    'Certification': [
      'Research certification requirements',
      'Contact certification body',
      'Schedule certification audit',
      'Implement required processes',
      'Apply for certification'
    ],
    'Testing': [
      'Identify required tests',
      'Select testing laboratory',
      'Submit samples for testing',
      'Review test results',
      'Address any non-compliance issues'
    ],
    'Labeling': [
      'Review labeling requirements',
      'Design compliant labels',
      'Verify label translations',
      'Implement labeling process',
      'Verify label compliance'
    ],
    'Packaging': [
      'Review packaging requirements',
      'Design compliant packaging',
      'Source packaging materials',
      'Implement packaging process',
      'Verify packaging compliance'
    ],
    'Inspection': [
      'Schedule pre-shipment inspection',
      'Prepare for inspection',
      'Address inspection findings',
      'Obtain inspection certificate'
    ],
    'Registration': [
      'Gather required documentation',
      'Complete registration application',
      'Pay registration fees',
      'Submit application',
      'Follow up on registration status'
    ],
    'Permit': [
      'Identify permit requirements',
      'Gather required documentation',
      'Complete permit application',
      'Pay permit fees',
      'Submit application',
      'Follow up on permit status'
    ]
  };
  
  return defaultActions[requirementType] || [
    'Research specific requirements',
    'Contact relevant authority',
    'Prepare necessary documentation',
    'Implement required changes',
    'Verify compliance'
  ];
}

/**
 * Get priority for a requirement
 */
function getPriorityForRequirement(req: RegulatoryRequirement): 'high' | 'medium' | 'low' {
  // Critical requirements have high priority
  if (['Certification', 'Registration', 'Permit', 'Prohibition'].includes(req.requirementType)) {
    return 'high';
  }
  // Documentation requirements have medium priority
  else if (['Documentation', 'Testing', 'Inspection'].includes(req.requirementType)) {
    return 'medium';
  }
  // Other requirements have low priority
  else {
    return 'low';
  }
}

/**
 * Get resources for a requirement
 */
function getResourcesForRequirement(req: RegulatoryRequirement): string[] {
  const resources: string[] = [];
  
  // Add agency information
  if (typeof req.agency === 'string') {
    resources.push(req.agency);
  } else {
    resources.push(req.agency.name);
    if (req.agency.website && req.agency.website !== '#') {
      resources.push(req.agency.website);
    }
  }
  
  // Add documentation required
  if (req.documentationRequired && req.documentationRequired.length > 0) {
    resources.push(...req.documentationRequired);
  }
  
  return resources;
}

/**
 * Parse timeline from string
 */
function parseTimeline(timeline?: string): { days: number; display: string } {
  if (!timeline) {
    return { days: 30, display: '1 month' };
  }
  
  // Try to parse the timeline
  const timeMatch = timeline.match(/(\d+)(?:\s*-\s*(\d+))?\s*(day|week|month|year)/i);
  if (timeMatch) {
    const minTime = parseInt(timeMatch[1], 10);
    const maxTime = timeMatch[2] ? parseInt(timeMatch[2], 10) : minTime;
    const unit = timeMatch[3].toLowerCase();
    
    // Convert to days
    const multiplier = 
      unit.startsWith('day') ? 1 : 
      unit.startsWith('week') ? 7 : 
      unit.startsWith('year') ? 365 : 30;
    
    const days = Math.ceil((minTime + maxTime) / 2) * multiplier;
    
    return { days, display: timeline };
  }
  
  return { days: 30, display: timeline };
}

/**
 * Parse cost from string
 */
function parseCost(cost?: string): { value: number; display: string } {
  if (!cost) {
    return { value: 1000, display: '$1,000' };
  }
  
  // Try to parse the cost
  const costMatch = cost.match(/[\$€£]?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:-\s*[\$€£]?\s*(\d+(?:,\d+)*(?:\.\d+)?))?/);
  if (costMatch) {
    const minCost = parseFloat(costMatch[1].replace(/,/g, ''));
    const maxCost = costMatch[2] ? parseFloat(costMatch[2].replace(/,/g, '')) : minCost;
    const value = Math.ceil((minCost + maxCost) / 2);
    
    return { value, display: cost };
  }
  
  return { value: 1000, display: cost };
}

/**
 * Format timeline estimate
 */
function formatTimelineEstimate(days: number): string {
  if (days <= 0) {
    return 'Immediate';
  } else if (days <= 7) {
    return `${days} days`;
  } else if (days <= 30) {
    const weeks = Math.ceil(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''}`;
  } else if (days <= 365) {
    const months = Math.ceil(days / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.round(days / 365 * 10) / 10;
    return `${years} year${years > 1 ? 's' : ''}`;
  }
}

/**
 * Format cost estimate
 */
function formatCostEstimate(cost: number): string {
  if (cost <= 0) {
    return '$0';
  } else if (cost < 1000) {
    return `$${cost}`;
  } else if (cost < 10000) {
    return `$${Math.round(cost / 100) * 100}`;
  } else if (cost < 1000000) {
    return `$${Math.round(cost / 1000)}k`;
  } else {
    return `$${Math.round(cost / 100000) / 10}M`;
  }
}

/**
 * Generate an action plan
 */
async function generateActionPlan(
  country: string,
  productCategory: string,
  hsCode: string | undefined,
  businessProfile: {
    name: string;
    certifications?: string[];
    exportExperience?: string;
    size?: string;
  },
  connectors: Connectors,
  llm: LLM
): Promise<ActionPlan> {
  try {
    // First, generate a compliance checklist
    const checklist = await generateComplianceChecklist(
      country,
      productCategory,
      hsCode,
      businessProfile,
      connectors,
      llm
    );
    
    // Group checklist items by priority
    const itemsByPriority: Record<string, ChecklistItem[]> = {
      high: [],
      medium: [],
      low: []
    };
    
    for (const item of checklist.items) {
      itemsByPriority[item.priority].push(item);
    }
    
    // Create phases based on priority
    const phases: ActionPlan['phases'] = [];
    let startDate = new Date();
    let phaseId = 1;
    
    // Phase 1: High priority items
    if (itemsByPriority.high.length > 0) {
      const phaseDuration = Math.max(...itemsByPriority.high.map(item => parseTimeline(item.timeline).days));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + phaseDuration);
      
      phases.push({
        id: `phase-${phaseId++}`,
        name: 'Critical Requirements',
        description: 'Address high-priority regulatory requirements',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'not-started',
        tasks: itemsByPriority.high.map((item, index) => ({
          id: `task-${phaseId}-${index + 1}`,
          name: item.requirement,
          description: item.description,
          dueDate: endDate.toISOString().split('T')[0],
          status: 'not-started',
          priority: 'high'
        }))
      });
      
      startDate = new Date(endDate);
    }
    
    // Phase 2: Medium priority items
    if (itemsByPriority.medium.length > 0) {
      const phaseDuration = Math.max(...itemsByPriority.medium.map(item => parseTimeline(item.timeline).days));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + phaseDuration);
      
      phases.push({
        id: `phase-${phaseId++}`,
        name: 'Standard Requirements',
        description: 'Address medium-priority regulatory requirements',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'not-started',
        tasks: itemsByPriority.medium.map((item, index) => ({
          id: `task-${phaseId}-${index + 1}`,
          name: item.requirement,
          description: item.description,
          dueDate: endDate.toISOString().split('T')[0],
          status: 'not-started',
          priority: 'medium'
        }))
      });
      
      startDate = new Date(endDate);
    }
    
    // Phase 3: Low priority items
    if (itemsByPriority.low.length > 0) {
      const phaseDuration = Math.max(...itemsByPriority.low.map(item => parseTimeline(item.timeline).days));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + phaseDuration);
      
      phases.push({
        id: `phase-${phaseId++}`,
        name: 'Additional Requirements',
        description: 'Address low-priority regulatory requirements',
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        status: 'not-started',
        tasks: itemsByPriority.low.map((item, index) => ({
          id: `task-${phaseId}-${index + 1}`,
          name: item.requirement,
          description: item.description,
          dueDate: endDate.toISOString().split('T')[0],
          status: 'not-started',
          priority: 'low'
        }))
      });
    }
    
    // Create the action plan
    return {
      id: `plan-${Math.random().toString(36).substring(2, 10)}`,
      country,
      productCategory,
      hsCode,
      businessName: businessProfile.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phases,
      overallProgress: 0
    };
  } catch (error) {
    console.error('Error generating action plan:', error instanceof Error ? error.message : String(error));
    
    // Return a minimal action plan with error information
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);
    
    return {
      id: `plan-${Math.random().toString(36).substring(2, 10)}`,
      country,
      productCategory,
      hsCode,
      businessName: businessProfile.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phases: [
        {
          id: 'phase-error',
          name: 'Error Recovery',
          description: 'An error occurred while generating the action plan',
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          status: 'not-started',
          tasks: [
            {
              id: 'task-error-1',
              name: 'Contact Support',
              description: 'Contact support for assistance with generating your action plan',
              dueDate: endDate.toISOString().split('T')[0],
              status: 'not-started',
              priority: 'high'
            }
          ]
        }
      ],
      overallProgress: 0
    };
  }
}

/**
 * Register compliance checklist tools
 */
export function registerComplianceChecklistTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'generate_compliance_checklist',
      description: 'Generate a compliance checklist for regulatory requirements',
      parameters: [
        {
          name: 'country',
          description: 'The destination country',
          type: 'string',
          required: true
        },
        {
          name: 'product_category',
          description: 'The product category',
          type: 'string',
          required: true
        },
        {
          name: 'hs_code',
          description: 'The HS code for the product (optional)',
          type: 'string',
          required: false
        },
        {
          name: 'business_profile',
          description: 'Business profile information',
          type: 'object',
          required: true
        }
      ],
      handler: async (params) => {
        const { country, product_category, hs_code, business_profile } = params;
        return await generateComplianceChecklist(
          country,
          product_category,
          hs_code,
          business_profile,
          connectors,
          llm
        );
      }
    },
    {
      name: 'generate_action_plan',
      description: 'Generate an action plan for achieving regulatory compliance',
      parameters: [
        {
          name: 'country',
          description: 'The destination country',
          type: 'string',
          required: true
        },
        {
          name: 'product_category',
          description: 'The product category',
          type: 'string',
          required: true
        },
        {
          name: 'hs_code',
          description: 'The HS code for the product (optional)',
          type: 'string',
          required: false
        },
        {
          name: 'business_profile',
          description: 'Business profile information',
          type: 'object',
          required: true
        }
      ],
      handler: async (params) => {
        const { country, product_category, hs_code, business_profile } = params;
        return await generateActionPlan(
          country,
          product_category,
          hs_code,
          business_profile,
          connectors,
          llm
        );
      }
    }
  ];
}

/**
 * Generate compliance milestones based on checklist items
 */
function generateComplianceMilestones(
  checklist: ComplianceChecklist,
  country: string,
  productCategory: string
): ComplianceMilestone[] {
  const highPriorityItems = checklist.items.filter(item => item.priority === 'high');
  const mediumPriorityItems = checklist.items.filter(item => item.priority === 'medium');
  const lowPriorityItems = checklist.items.filter(item => item.priority === 'low');
  
  const milestones: ComplianceMilestone[] = [];
  const now = new Date();
  let currentDate = new Date(now);
  
  // Initial documentation milestone
  milestones.push({
    id: `milestone-1`,
    name: 'Initial Documentation Preparation',
    description: 'Prepare all necessary documentation for export compliance',
    estimatedCompletionDate: new Date(currentDate.setDate(currentDate.getDate() + 14)).toISOString(),
    dependsOn: [],
    status: 'not-started'
  });
  
  // Product testing and certification milestone
  currentDate = new Date(now);
  const testingDays = Math.round(30 * getComplexityFactor(country, productCategory));
  milestones.push({
    id: `milestone-2`,
    name: 'Product Testing and Certification',
    description: 'Complete required product testing and obtain necessary certifications',
    estimatedCompletionDate: new Date(currentDate.setDate(currentDate.getDate() + testingDays)).toISOString(),
    dependsOn: highPriorityItems.map(item => item.id),
    status: 'not-started'
  });
  
  // Regulatory approval milestone
  currentDate = new Date(now);
  const approvalDays = Math.round(45 * getComplexityFactor(country, productCategory));
  milestones.push({
    id: `milestone-3`,
    name: 'Regulatory Approval',
    description: 'Obtain regulatory approval from relevant authorities',
    estimatedCompletionDate: new Date(currentDate.setDate(currentDate.getDate() + approvalDays)).toISOString(),
    dependsOn: [...highPriorityItems.map(item => item.id), ...mediumPriorityItems.map(item => item.id).slice(0, 3)],
    status: 'not-started'
  });
  
  // Market entry readiness milestone
  currentDate = new Date(now);
  const readinessDays = Math.round(getBaseTimelineEstimation(country) * getComplexityFactor(country, productCategory));
  milestones.push({
    id: `milestone-4`,
    name: 'Market Entry Readiness',
    description: 'Complete all compliance requirements for market entry',
    estimatedCompletionDate: new Date(currentDate.setDate(currentDate.getDate() + readinessDays)).toISOString(),
    dependsOn: checklist.items.map(item => item.id),
    status: 'not-started'
  });
  
  return milestones;
} 