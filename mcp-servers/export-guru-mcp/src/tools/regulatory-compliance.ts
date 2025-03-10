/**
 * Regulatory Compliance Tools
 * 
 * This module provides tools for assessing regulatory compliance,
 * estimating timelines and costs, and generating compliance checklists.
 */

import { Connectors } from '../connectors';
import { LLM, Tool, RegulatoryRequirement } from '../types';
import { validateRegulatoryRequirement, validateComplianceAssessment } from '../utils/validation';
import { StandardDataStructures } from '../utils/data-standards';
import { ApiError } from '../utils/error-handling';

/**
 * Compliance assessment interface
 */
export interface ComplianceAssessment {
  overallScore: number;
  weightedScore: number;
  satisfiedRequirements: RegulatoryRequirement[];
  missingRequirements: RegulatoryRequirement[];
  partiallyCompliantRequirements: RegulatoryRequirement[];
  timeline: number;
  estimatedCost: string;
  recommendations: string[];
}

/**
 * Assess compliance with regulatory requirements
 */
async function assessCompliance(
  country: string,
  productCategory: string,
  hsCode: string | undefined,
  businessProfile: {
    certifications: string[];
    exportExperience?: string;
    size?: string;
  },
  connectors: Connectors,
  llm: LLM
): Promise<ComplianceAssessment> {
  try {
    // Get regulatory requirements
    const requirements = await connectors.regulatoryDb.getRequirements(
      country,
      productCategory,
      hsCode
    ).catch(error => {
      console.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
      return []; // Return empty array as fallback
    });
    
    if (!requirements || requirements.length === 0) {
      return {
        overallScore: 1.0, // No requirements means full compliance
        weightedScore: 1.0,
        satisfiedRequirements: [],
        missingRequirements: [],
        partiallyCompliantRequirements: [],
        timeline: 0,
        estimatedCost: '$0',
        recommendations: ['No specific regulatory requirements identified.']
      };
    }
    
    // Normalize certifications for comparison
    const normalizedCertifications = (businessProfile.certifications || []).map(cert => 
      cert.toLowerCase().trim()
    );
    
    // Categorize requirements
    const { 
      satisfiedRequirements, 
      missingRequirements, 
      partiallyCompliantRequirements 
    } = categorizeRequirements(requirements, normalizedCertifications);
    
    // Calculate scores
    const { overallScore, weightedScore } = calculateComplianceScores(
      requirements, 
      satisfiedRequirements, 
      partiallyCompliantRequirements
    );
    
    // Estimate timeline and cost
    const timeline = estimateComplianceTimeline(missingRequirements, partiallyCompliantRequirements);
    const estimatedCost = estimateComplianceCost(missingRequirements, partiallyCompliantRequirements);
    
    // Generate recommendations
    const recommendations = await generateComplianceRecommendations(
      country,
      productCategory,
      hsCode,
      businessProfile,
      satisfiedRequirements,
      missingRequirements,
      partiallyCompliantRequirements,
      llm
    );
    
    // Create and validate the compliance assessment
    const assessment: ComplianceAssessment = {
      overallScore,
      weightedScore,
      satisfiedRequirements,
      missingRequirements,
      partiallyCompliantRequirements,
      timeline,
      estimatedCost,
      recommendations
    };
    
    // Validate the assessment
    const validation = validateComplianceAssessment(assessment);
    if (!validation.valid) {
      console.warn(`Invalid compliance assessment: ${validation.errors.map(e => e.message).join(', ')}`);
    }
    
    return assessment;
  } catch (error) {
    console.error('Error assessing compliance:', error instanceof Error ? error.message : String(error));
    
    // Return a fallback assessment
    return {
      overallScore: 0.5,
      weightedScore: 0.5,
      satisfiedRequirements: [],
      missingRequirements: [],
      partiallyCompliantRequirements: [],
      timeline: 30,
      estimatedCost: 'Varies',
      recommendations: [
        'Unable to complete a full compliance assessment.',
        'Consider consulting with a regulatory expert for your specific situation.'
      ]
    };
  }
}

/**
 * Categorize requirements as satisfied, missing, or partially compliant
 */
function categorizeRequirements(
  requirements: RegulatoryRequirement[],
  normalizedCertifications: string[]
): {
  satisfiedRequirements: RegulatoryRequirement[];
  missingRequirements: RegulatoryRequirement[];
  partiallyCompliantRequirements: RegulatoryRequirement[];
} {
  const satisfiedRequirements: RegulatoryRequirement[] = [];
  const missingRequirements: RegulatoryRequirement[] = [];
  const partiallyCompliantRequirements: RegulatoryRequirement[] = [];
  
  for (const req of requirements) {
    // Check if this requirement is satisfied by any certification
    const reqDescription = req.description.toLowerCase();
    const reqType = req.requirementType.toLowerCase();
    
    // Check for direct matches
    const directMatch = normalizedCertifications.some(cert => 
      reqDescription.includes(cert) || cert.includes(reqType)
    );
    
    // Check for documentation matches
    const docMatch = normalizedCertifications.some(cert => {
      if (req.documentationRequired && Array.isArray(req.documentationRequired)) {
        return req.documentationRequired.some(doc => 
          doc.toLowerCase().includes(cert) || cert.includes(doc.toLowerCase())
        );
      }
      return false;
    });
    
    // Check for partial matches
    const partialMatch = normalizedCertifications.some(cert => {
      // Check for keyword matches
      const keywords = reqDescription.split(/\s+/).filter(word => word.length > 4);
      return keywords.some(keyword => cert.includes(keyword));
    });
    
    if (directMatch || docMatch) {
      satisfiedRequirements.push(req);
    } else if (partialMatch) {
      partiallyCompliantRequirements.push(req);
    } else {
      missingRequirements.push(req);
    }
  }
  
  return {
    satisfiedRequirements,
    missingRequirements,
    partiallyCompliantRequirements
  };
}

/**
 * Calculate compliance scores
 */
function calculateComplianceScores(
  allRequirements: RegulatoryRequirement[],
  satisfiedRequirements: RegulatoryRequirement[],
  partiallyCompliantRequirements: RegulatoryRequirement[]
): {
  overallScore: number;
  weightedScore: number;
} {
  // Simple overall score based on count
  const totalCount = allRequirements.length;
  const satisfiedCount = satisfiedRequirements.length;
  const partialCount = partiallyCompliantRequirements.length;
  
  // Count partial compliance as 0.5
  const overallScore = totalCount > 0 
    ? (satisfiedCount + (partialCount * 0.5)) / totalCount
    : 1.0;
  
  // Weighted score based on requirement confidence and importance
  let weightedTotal = 0;
  let weightedSatisfied = 0;
  
  for (const req of allRequirements) {
    const confidence = req.confidenceLevel || 0.5;
    // Assign importance based on requirement type
    let importance = 1.0;
    
    // Critical requirements have higher importance
    if (['Certification', 'Registration', 'Permit', 'Prohibition'].includes(req.requirementType)) {
      importance = 2.0;
    }
    // Nice-to-have requirements have lower importance
    else if (['Labeling', 'Packaging'].includes(req.requirementType)) {
      importance = 0.8;
    }
    
    const weight = confidence * importance;
    weightedTotal += weight;
    
    // Check if this requirement is satisfied
    if (satisfiedRequirements.includes(req)) {
      weightedSatisfied += weight;
    }
    // Check if this requirement is partially satisfied
    else if (partiallyCompliantRequirements.includes(req)) {
      weightedSatisfied += (weight * 0.5);
    }
  }
  
  const weightedScore = weightedTotal > 0 
    ? weightedSatisfied / weightedTotal
    : 1.0;
  
  // Ensure scores are between 0 and 1
  return {
    overallScore: Math.max(0, Math.min(1, overallScore)),
    weightedScore: Math.max(0, Math.min(1, weightedScore))
  };
}

/**
 * Estimate compliance timeline based on missing and partially compliant requirements
 */
function estimateComplianceTimeline(
  missingRequirements: RegulatoryRequirement[],
  partiallyCompliantRequirements: RegulatoryRequirement[]
): number {
  try {
    const allRequirements = [...missingRequirements, ...partiallyCompliantRequirements];
    
    if (allRequirements.length === 0) {
      return 0;
    }
    
    // Map of requirement types to estimated days
    const timelineEstimates: Record<string, number> = {
      'Documentation': 7,
      'Certification': 60,
      'Testing': 30,
      'Labeling': 14,
      'Packaging': 14,
      'Inspection': 14,
      'Registration': 45,
      'Permit': 30,
      'Tariff': 1,
      'Quota': 1,
      'Prohibition': 0,
      'Standard': 30,
      'Other': 30
    };
    
    // Calculate timeline based on the longest requirement
    let maxTimeline = 0;
    
    // Also consider parallel processing for similar requirements
    const typeTimelines: Record<string, number> = {};
    
    for (const req of allRequirements) {
      // Partial compliance reduces timeline
      const partialFactor = partiallyCompliantRequirements.includes(req) ? 0.6 : 1.0;
      
      const reqType = req.requirementType;
      const baseTimeline = timelineEstimates[reqType] || 30;
      
      // Parse the estimated timeline if available
      let reqTimeline = baseTimeline;
      if (req.estimatedTimeline) {
        const timeMatch = req.estimatedTimeline.match(/(\d+)(?:\s*-\s*(\d+))?\s*(day|week|month)/i);
        if (timeMatch) {
          const minTime = parseInt(timeMatch[1], 10);
          const maxTime = timeMatch[2] ? parseInt(timeMatch[2], 10) : minTime;
          const unit = timeMatch[3].toLowerCase();
          
          // Convert to days
          const multiplier = unit.startsWith('day') ? 1 : unit.startsWith('week') ? 7 : 30;
          reqTimeline = Math.ceil((minTime + maxTime) / 2) * multiplier;
        }
      }
      
      // Apply partial compliance factor
      reqTimeline = Math.ceil(reqTimeline * partialFactor);
      
      // Update type timeline (for parallel processing)
      typeTimelines[reqType] = Math.max(typeTimelines[reqType] || 0, reqTimeline);
      
      // Update max timeline
      maxTimeline = Math.max(maxTimeline, reqTimeline);
    }
    
    // Calculate total timeline considering parallel processing
    // Use the max of:
    // 1. The longest single requirement
    // 2. Sum of the longest requirement of each type (assuming some parallelization)
    const parallelTimeline = Object.values(typeTimelines).reduce((sum, time) => sum + time, 0);
    const adjustedParallelTimeline = Math.ceil(parallelTimeline * 0.7); // Adjust for some overlap
    
    return Math.max(maxTimeline, adjustedParallelTimeline);
  } catch (error) {
    console.error('Error estimating compliance timeline:', error instanceof Error ? error.message : String(error));
    return 30; // Return a default timeline as fallback
  }
}

/**
 * Estimate compliance cost based on missing and partially compliant requirements
 */
function estimateComplianceCost(
  missingRequirements: RegulatoryRequirement[],
  partiallyCompliantRequirements: RegulatoryRequirement[]
): string {
  try {
    const allRequirements = [...missingRequirements, ...partiallyCompliantRequirements];
    
    if (allRequirements.length === 0) {
      return '$0';
    }
    
    // Map of requirement types to estimated costs (in USD)
    const costEstimates: Record<string, number> = {
      'Documentation': 200,
      'Certification': 5000,
      'Testing': 2000,
      'Labeling': 1000,
      'Packaging': 1000,
      'Inspection': 1500,
      'Registration': 3000,
      'Permit': 1000,
      'Tariff': 0, // Tariffs are calculated separately
      'Quota': 0,
      'Prohibition': 0,
      'Standard': 2000,
      'Other': 1000
    };
    
    // Calculate total cost
    let totalCost = 0;
    
    for (const req of allRequirements) {
      // Partial compliance reduces cost
      const partialFactor = partiallyCompliantRequirements.includes(req) ? 0.5 : 1.0;
      
      const reqType = req.requirementType;
      const baseCost = costEstimates[reqType] || 1000;
      
      // Parse the estimated cost if available
      let reqCost = baseCost;
      if (req.estimatedCost) {
        const costMatch = req.estimatedCost.match(/[\$€£]?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:-\s*[\$€£]?\s*(\d+(?:,\d+)*(?:\.\d+)?))?/);
        if (costMatch) {
          const minCost = parseFloat(costMatch[1].replace(/,/g, ''));
          const maxCost = costMatch[2] ? parseFloat(costMatch[2].replace(/,/g, '')) : minCost;
          reqCost = Math.ceil((minCost + maxCost) / 2);
        }
      }
      
      // Apply partial compliance factor
      reqCost = Math.ceil(reqCost * partialFactor);
      
      totalCost += reqCost;
    }
    
    // Format the cost
    if (totalCost === 0) {
      return '$0';
    } else if (totalCost < 1000) {
      return `$${totalCost}`;
    } else if (totalCost < 10000) {
      return `$${Math.round(totalCost / 100) * 100}`;
    } else {
      return `$${Math.round(totalCost / 1000)}k`;
    }
  } catch (error) {
    console.error('Error estimating compliance cost:', error instanceof Error ? error.message : String(error));
    return 'Varies'; // Return a default cost as fallback
  }
}

/**
 * Generate compliance recommendations
 */
async function generateComplianceRecommendations(
  country: string,
  productCategory: string,
  hsCode: string | undefined,
  businessProfile: {
    certifications: string[];
    exportExperience?: string;
    size?: string;
  },
  satisfiedRequirements: RegulatoryRequirement[],
  missingRequirements: RegulatoryRequirement[],
  partiallyCompliantRequirements: RegulatoryRequirement[],
  llm: LLM
): Promise<string[]> {
  try {
    // If no missing or partially compliant requirements, return simple recommendation
    if (missingRequirements.length === 0 && partiallyCompliantRequirements.length === 0) {
      return [
        'All regulatory requirements appear to be satisfied.',
        'Continue to monitor for regulatory changes that may affect your compliance status.'
      ];
    }
    
    // Create a prompt for the LLM
    const prompt = `
      Generate 3-5 specific recommendations for a business exporting ${productCategory} from South Africa to ${country}.
      ${hsCode ? `The HS code for this product is ${hsCode}.` : ''}
      
      Business profile:
      - Export experience: ${businessProfile.exportExperience || 'Unknown'}
      - Business size: ${businessProfile.size || 'Unknown'}
      - Current certifications: ${businessProfile.certifications.join(', ') || 'None'}
      
      Compliance status:
      - Satisfied requirements: ${satisfiedRequirements.length}
      - Partially compliant requirements: ${partiallyCompliantRequirements.length}
      - Missing requirements: ${missingRequirements.length}
      
      Missing requirements:
      ${missingRequirements.map(req => `- ${req.requirementType}: ${req.description}`).join('\n')}
      
      Partially compliant requirements:
      ${partiallyCompliantRequirements.map(req => `- ${req.requirementType}: ${req.description}`).join('\n')}
      
      Provide actionable recommendations that will help the business achieve compliance.
      Format each recommendation as a bullet point starting with "- ".
    `;
    
    // Get LLM response
    const response = await llm.complete(prompt);
    
    // Parse recommendations from the response
    const recommendations = response
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.trim().substring(2).trim())
      .filter(rec => rec.length > 0);
    
    // Ensure we have at least one recommendation
    if (recommendations.length === 0) {
      return [
        'Focus on addressing the missing regulatory requirements, starting with the most critical ones.',
        'Consider consulting with a regulatory expert for detailed guidance on compliance.'
      ];
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating compliance recommendations:', error instanceof Error ? error.message : String(error));
    
    // Return fallback recommendations
    return [
      'Focus on addressing the missing regulatory requirements, starting with the most critical ones.',
      'Consider consulting with a regulatory expert for detailed guidance on compliance.',
      'Ensure all required documentation is prepared and up-to-date.',
      'Monitor for regulatory changes that may affect your compliance status.'
    ];
  }
}

/**
 * Generate a compliance checklist
 */
async function generateComplianceChecklist(
  country: string,
  productCategory: string,
  hsCode: string | undefined,
  businessProfile: {
    certifications: string[];
    exportExperience?: string;
    size?: string;
  },
  connectors: Connectors,
  llm: LLM
): Promise<{
  checklist: Array<{
    id: string;
    requirement: string;
    status: 'completed' | 'in-progress' | 'not-started';
    priority: 'high' | 'medium' | 'low';
    timeline: string;
    resources: string[];
  }>;
  overallProgress: number;
}> {
  try {
    // Get compliance assessment
    const assessment = await assessCompliance(
      country,
      productCategory,
      hsCode,
      businessProfile,
      connectors,
      llm
    );
    
    // Create checklist items from missing and partially compliant requirements
    const checklist = [
      ...assessment.missingRequirements.map((req, index) => ({
        id: `missing-${index}`,
        requirement: `${req.requirementType}: ${req.description}`,
        status: 'not-started' as const,
        priority: getPriorityForRequirement(req),
        timeline: req.estimatedTimeline || 'Varies',
        resources: [
          ...(req.documentationRequired || []),
          ...(typeof req.agency === 'string' 
            ? [req.agency] 
            : [req.agency.name, req.agency.website].filter(Boolean))
        ]
      })),
      ...assessment.partiallyCompliantRequirements.map((req, index) => ({
        id: `partial-${index}`,
        requirement: `${req.requirementType}: ${req.description}`,
        status: 'in-progress' as const,
        priority: getPriorityForRequirement(req),
        timeline: req.estimatedTimeline || 'Varies',
        resources: [
          ...(req.documentationRequired || []),
          ...(typeof req.agency === 'string' 
            ? [req.agency] 
            : [req.agency.name, req.agency.website].filter(Boolean))
        ]
      }))
    ];
    
    // Add completed items for satisfied requirements
    const completedItems = assessment.satisfiedRequirements.map((req, index) => ({
      id: `satisfied-${index}`,
      requirement: `${req.requirementType}: ${req.description}`,
      status: 'completed' as const,
      priority: getPriorityForRequirement(req),
      timeline: 'Completed',
      resources: [
        ...(req.documentationRequired || []),
        ...(typeof req.agency === 'string' 
          ? [req.agency] 
          : [req.agency.name, req.agency.website].filter(Boolean))
      ]
    }));
    
    // Calculate overall progress
    const totalItems = assessment.satisfiedRequirements.length + 
      assessment.missingRequirements.length + 
      assessment.partiallyCompliantRequirements.length;
    
    const completedCount = assessment.satisfiedRequirements.length + 
      (assessment.partiallyCompliantRequirements.length * 0.5);
    
    const overallProgress = totalItems > 0 
      ? completedCount / totalItems
      : 1.0;
    
    return {
      checklist: [...completedItems, ...checklist],
      overallProgress
    };
  } catch (error) {
    console.error('Error generating compliance checklist:', error instanceof Error ? error.message : String(error));
    
    // Return a fallback checklist
    return {
      checklist: [
        {
          id: 'fallback-1',
          requirement: 'Verify export documentation requirements',
          status: 'not-started',
          priority: 'high',
          timeline: '1-2 weeks',
          resources: ['Customs Authority', 'Trade Department']
        },
        {
          id: 'fallback-2',
          requirement: 'Check product certification requirements',
          status: 'not-started',
          priority: 'high',
          timeline: '4-8 weeks',
          resources: ['Standards Bureau', 'Certification Bodies']
        },
        {
          id: 'fallback-3',
          requirement: 'Review labeling and packaging requirements',
          status: 'not-started',
          priority: 'medium',
          timeline: '2-4 weeks',
          resources: ['Food Safety Authority', 'Import Regulations']
        }
      ],
      overallProgress: 0
    };
  }
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
 * Register regulatory compliance tools
 */
export function registerRegulatoryComplianceTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'assess_compliance',
      description: 'Assess compliance with regulatory requirements',
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
        return await assessCompliance(
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
      name: 'generate_compliance_checklist',
      description: 'Generate a compliance checklist',
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
    }
  ];
} 