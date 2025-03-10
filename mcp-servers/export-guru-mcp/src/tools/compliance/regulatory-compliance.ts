import { BusinessProfile, RegulatoryRequirement, ComplianceAssessment } from '../../types';
import { LLM } from '../../types';
import { MemorySubsystem } from '../../agent/memory-subsystem';

/**
 * Compliance requirement status
 */
export enum ComplianceStatus {
  SATISFIED = 'SATISFIED',
  PARTIALLY_SATISFIED = 'PARTIALLY_SATISFIED',
  NOT_SATISFIED = 'NOT_SATISFIED',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

/**
 * Compliance requirement with assessment status
 */
export interface AssessedRequirement extends RegulatoryRequirement {
  status: ComplianceStatus;
  complianceScore: number; // 0-1 scale
  notes?: string;
  actionItems?: string[];
  estimatedTimeToComply?: number; // in days
  estimatedCostToComply?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Compliance assessment options
 */
export interface ComplianceAssessmentOptions {
  includePartiallyCompliant?: boolean;
  includeNotApplicable?: boolean;
  weightByImportance?: boolean;
  detailedNotes?: boolean;
  enhanceWithLLM?: boolean;
  enhanceWithMemory?: boolean;
}

/**
 * Assess a business's compliance with regulatory requirements
 */
export async function assessCompliance(
  businessProfile: BusinessProfile,
  requirements: RegulatoryRequirement[],
  certifications: Array<{ name: string; issuer: string; validUntil?: string }> = [],
  options: ComplianceAssessmentOptions = {},
  llm?: LLM,
  memorySubsystem?: MemorySubsystem
): Promise<ComplianceAssessment> {
  try {
    // Default options
    const defaultOptions: ComplianceAssessmentOptions = {
      includePartiallyCompliant: true,
      includeNotApplicable: false,
      weightByImportance: true,
      detailedNotes: true,
      enhanceWithLLM: !!llm,
      enhanceWithMemory: !!memorySubsystem
    };
    
    // Merge options
    const mergedOptions = { ...defaultOptions, ...options };
    
    // Assess each requirement
    const assessedRequirements = await Promise.all(
      requirements.map(req => assessRequirement(
        req, 
        businessProfile, 
        certifications,
        mergedOptions,
        llm
      ))
    );
    
    // Filter requirements by status
    const satisfiedRequirements = assessedRequirements
      .filter(req => req.status === ComplianceStatus.SATISFIED)
      .map(req => stripAssessmentFields(req));
    
    const missingRequirements = assessedRequirements
      .filter(req => req.status === ComplianceStatus.NOT_SATISFIED)
      .map(req => stripAssessmentFields(req));
    
    const partiallyCompliantRequirements = mergedOptions.includePartiallyCompliant
      ? assessedRequirements
          .filter(req => req.status === ComplianceStatus.PARTIALLY_SATISFIED)
          .map(req => stripAssessmentFields(req))
      : [];
    
    // Calculate compliance scores
    const { overallScore, weightedScore } = calculateComplianceScores(
      assessedRequirements,
      mergedOptions.weightByImportance === undefined ? true : mergedOptions.weightByImportance
    );
    
    // Calculate timeline and cost
    const { timeline, estimatedCost } = calculateTimelineAndCost(
      assessedRequirements.filter(req => 
        req.status === ComplianceStatus.NOT_SATISFIED || 
        req.status === ComplianceStatus.PARTIALLY_SATISFIED
      )
    );
    
    // Generate recommendations
    const recommendations = generateRecommendations(
      assessedRequirements,
      businessProfile
    );
    
    // Enhance with memory subsystem if available
    let result: ComplianceAssessment = {
      overallScore,
      weightedScore,
      satisfiedRequirements,
      missingRequirements,
      partiallyCompliantRequirements,
      timeline,
      estimatedCost,
      recommendations
    };
    
    // Enhance with memory subsystem if available and enabled
    if (memorySubsystem && mergedOptions.enhanceWithMemory) {
      result = await enhanceWithMemory(
        result,
        businessProfile,
        memorySubsystem
      );
    }
    
    return result;
  } catch (error) {
    console.error(`Error assessing compliance: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Assess a single requirement
 */
async function assessRequirement(
  requirement: RegulatoryRequirement,
  businessProfile: BusinessProfile,
  certifications: Array<{ name: string; issuer: string; validUntil?: string }>,
  options: ComplianceAssessmentOptions,
  llm?: LLM
): Promise<AssessedRequirement> {
  try {
    // Initialize assessment
    const assessment: AssessedRequirement = {
      ...requirement,
      status: ComplianceStatus.NOT_SATISFIED,
      complianceScore: 0,
      priority: determinePriority(requirement)
    };
    
    // Check if requirement is applicable
    if (!isRequirementApplicable(requirement, businessProfile)) {
      assessment.status = ComplianceStatus.NOT_APPLICABLE;
      assessment.complianceScore = 1;
      assessment.notes = 'Requirement not applicable to this business profile';
      return assessment;
    }
    
    // Check if requirement is satisfied by certifications
    const certificationMatch = checkCertificationMatch(requirement, certifications);
    if (certificationMatch.matches) {
      assessment.status = ComplianceStatus.SATISFIED;
      assessment.complianceScore = 1;
      assessment.notes = `Satisfied by certification: ${certificationMatch.matchingCertification}`;
      return assessment;
    }
    
    // Check for partial compliance
    const partialCompliance = checkPartialCompliance(requirement, businessProfile);
    if (partialCompliance.isPartiallyCompliant) {
      assessment.status = ComplianceStatus.PARTIALLY_SATISFIED;
      assessment.complianceScore = partialCompliance.score;
      assessment.notes = partialCompliance.reason;
      assessment.actionItems = generateActionItems(requirement, businessProfile);
      assessment.estimatedTimeToComply = estimateTimeToComply(requirement, partialCompliance.score);
      assessment.estimatedCostToComply = estimateCostToComply(requirement, partialCompliance.score);
      return assessment;
    }
    
    // Not satisfied
    assessment.actionItems = generateActionItems(requirement, businessProfile);
    assessment.estimatedTimeToComply = estimateTimeToComply(requirement, 0);
    assessment.estimatedCostToComply = estimateCostToComply(requirement, 0);
    
    // Enhance with LLM if available and enabled
    if (llm && options.enhanceWithLLM) {
      return await enhanceAssessmentWithLLM(assessment, businessProfile, llm);
    }
    
    return assessment;
  } catch (error) {
    console.error(`Error assessing requirement: ${error instanceof Error ? error.message : String(error)}`);
    
    // Return a basic assessment on error
    return {
      ...requirement,
      status: ComplianceStatus.NOT_SATISFIED,
      complianceScore: 0,
      priority: 'MEDIUM',
      notes: 'Error occurred during assessment'
    };
  }
}

/**
 * Determine if a requirement is applicable to a business profile
 */
function isRequirementApplicable(
  requirement: RegulatoryRequirement,
  businessProfile: BusinessProfile
): boolean {
  // Check if any product categories match
  const hasMatchingProducts = businessProfile.products.some(product => 
    product.category === requirement.productCategory ||
    (requirement.hsCode && product.estimatedHsCode === requirement.hsCode)
  );
  
  // If no matching products, requirement is not applicable
  if (!hasMatchingProducts) {
    return false;
  }
  
  // Check if requirement is for a target market
  const isTargetMarket = businessProfile.targetMarkets?.includes(requirement.country) ||
                         businessProfile.marketFocus?.includes(requirement.country);
  
  return isTargetMarket !== false;
}

/**
 * Check if a requirement is satisfied by certifications
 */
function checkCertificationMatch(
  requirement: RegulatoryRequirement,
  certifications: Array<{ name: string; issuer: string; validUntil?: string }>
): { matches: boolean; matchingCertification?: string } {
  // No certifications to check
  if (!certifications || certifications.length === 0) {
    return { matches: false };
  }
  
  // Simple keyword matching for now
  // A more sophisticated approach would use a certification-to-requirement mapping database
  const requirementKeywords = extractKeywords(requirement.description.toLowerCase());
  
  for (const cert of certifications) {
    const certName = cert.name.toLowerCase();
    
    // Check if certification is expired
    if (cert.validUntil && new Date(cert.validUntil) < new Date()) {
      continue; // Skip expired certifications
    }
    
    // Check if certification name contains any requirement keywords
    if (requirementKeywords.some(keyword => certName.includes(keyword))) {
      return { matches: true, matchingCertification: cert.name };
    }
    
    // Check if requirement description mentions the certification
    if (requirement.description.toLowerCase().includes(certName)) {
      return { matches: true, matchingCertification: cert.name };
    }
  }
  
  return { matches: false };
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  // Remove common words and punctuation
  const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
                        .replace(/\s{2,}/g, ' ')
                        .toLowerCase();
  
  // Split into words
  const words = cleanText.split(' ');
  
  // Filter out common words
  const commonWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                      'be', 'been', 'being', 'to', 'of', 'for', 'with', 'by', 'about', 
                      'against', 'between', 'into', 'through', 'during', 'before', 'after', 
                      'above', 'below', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 
                      'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 
                      'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 
                      'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 
                      'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 
                      'just', 'don', 'should', 'now', 'requirement', 'requirements', 'required'];
  
  return words.filter(word => word.length > 2 && !commonWords.includes(word));
}

/**
 * Check for partial compliance with a requirement
 */
function checkPartialCompliance(
  requirement: RegulatoryRequirement,
  businessProfile: BusinessProfile
): { isPartiallyCompliant: boolean; score: number; reason: string } {
  // This is a simplified implementation
  // A real implementation would have more sophisticated logic
  
  // Check if business has export experience
  if (businessProfile.exportExperience) {
    return {
      isPartiallyCompliant: true,
      score: 0.3,
      reason: 'Business has export experience which may contribute to compliance'
    };
  }
  
  // Check if business has a website with relevant information
  if (businessProfile.website) {
    return {
      isPartiallyCompliant: true,
      score: 0.2,
      reason: 'Business has a website which may contain some compliance information'
    };
  }
  
  return {
    isPartiallyCompliant: false,
    score: 0,
    reason: ''
  };
}

/**
 * Generate action items for a requirement
 */
function generateActionItems(
  requirement: RegulatoryRequirement,
  businessProfile: BusinessProfile
): string[] {
  const actionItems: string[] = [];
  
  // Add basic action items
  actionItems.push(`Research ${requirement.requirementType} requirements for ${requirement.country}`);
  
  // Add agency-specific action items
  const agency = typeof requirement.agency === 'string' 
    ? requirement.agency 
    : requirement.agency.name;
  
  actionItems.push(`Contact ${agency} for detailed compliance information`);
  
  // Add documentation action items
  if (requirement.documentationRequired && requirement.documentationRequired.length > 0) {
    actionItems.push(`Prepare required documentation: ${requirement.documentationRequired.join(', ')}`);
  }
  
  return actionItems;
}

/**
 * Estimate time to comply with a requirement
 */
function estimateTimeToComply(
  requirement: RegulatoryRequirement,
  currentComplianceScore: number
): number {
  // Base time estimates by requirement type (in days)
  const baseTimeEstimates: Record<string, number> = {
    'Certification': 90,
    'Permit': 60,
    'License': 45,
    'Registration': 30,
    'Documentation': 15,
    'Labeling': 30,
    'Testing': 45,
    'Inspection': 30,
    'Tariff': 7,
    'Standard': 60
  };
  
  // Get base time estimate
  let baseTime = baseTimeEstimates[requirement.requirementType] || 30;
  
  // Adjust for current compliance
  const remainingCompliance = 1 - currentComplianceScore;
  const adjustedTime = Math.ceil(baseTime * remainingCompliance);
  
  // Adjust for frequency
  if (requirement.frequency === 'once-off') {
    return adjustedTime;
  } else if (requirement.frequency === 'periodic') {
    return Math.ceil(adjustedTime * 0.8); // Slightly less time for periodic requirements
  } else {
    return Math.ceil(adjustedTime * 0.6); // Even less time for ongoing requirements
  }
}

/**
 * Estimate cost to comply with a requirement
 */
function estimateCostToComply(
  requirement: RegulatoryRequirement,
  currentComplianceScore: number
): string {
  // Base cost estimates by requirement type (in USD)
  const baseCostEstimates: Record<string, number> = {
    'Certification': 5000,
    'Permit': 2000,
    'License': 3000,
    'Registration': 1000,
    'Documentation': 500,
    'Labeling': 1500,
    'Testing': 3000,
    'Inspection': 2000,
    'Tariff': 0, // Tariffs are calculated differently
    'Standard': 2500
  };
  
  // Get base cost estimate
  let baseCost = baseCostEstimates[requirement.requirementType] || 1500;
  
  // Adjust for current compliance
  const remainingCompliance = 1 - currentComplianceScore;
  const adjustedCost = Math.ceil(baseCost * remainingCompliance);
  
  // Format cost as range
  const lowerBound = Math.max(100, adjustedCost - (adjustedCost * 0.3));
  const upperBound = adjustedCost + (adjustedCost * 0.3);
  
  return `$${Math.round(lowerBound)} - $${Math.round(upperBound)}`;
}

/**
 * Determine priority of a requirement
 */
function determinePriority(requirement: RegulatoryRequirement): 'HIGH' | 'MEDIUM' | 'LOW' {
  // High priority requirement types
  const highPriorityTypes = ['Certification', 'Permit', 'License', 'Registration'];
  
  // Medium priority requirement types
  const mediumPriorityTypes = ['Testing', 'Inspection', 'Standard'];
  
  if (highPriorityTypes.includes(requirement.requirementType)) {
    return 'HIGH';
  } else if (mediumPriorityTypes.includes(requirement.requirementType)) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

/**
 * Calculate compliance scores
 */
function calculateComplianceScores(
  assessedRequirements: AssessedRequirement[],
  weightByImportance: boolean
): { overallScore: number; weightedScore: number } {
  // Filter out not applicable requirements
  const applicableRequirements = assessedRequirements.filter(
    req => req.status !== ComplianceStatus.NOT_APPLICABLE
  );
  
  if (applicableRequirements.length === 0) {
    return { overallScore: 1, weightedScore: 1 }; // No applicable requirements
  }
  
  // Calculate overall score (simple average)
  const overallScore = applicableRequirements.reduce(
    (sum, req) => sum + req.complianceScore, 
    0
  ) / applicableRequirements.length;
  
  // Calculate weighted score if requested
  if (weightByImportance) {
    // Define weights by priority
    const weights = {
      'HIGH': 3,
      'MEDIUM': 2,
      'LOW': 1
    };
    
    // Calculate weighted sum
    const weightedSum = applicableRequirements.reduce(
      (sum, req) => sum + (req.complianceScore * weights[req.priority]), 
      0
    );
    
    // Calculate total weight
    const totalWeight = applicableRequirements.reduce(
      (sum, req) => sum + weights[req.priority], 
      0
    );
    
    // Calculate weighted score
    const weightedScore = weightedSum / totalWeight;
    
    return { overallScore, weightedScore };
  }
  
  // If not weighting by importance, weighted score equals overall score
  return { overallScore, weightedScore: overallScore };
}

/**
 * Calculate timeline and cost
 */
function calculateTimelineAndCost(
  incompleteRequirements: AssessedRequirement[]
): { timeline: number; estimatedCost: string } {
  if (incompleteRequirements.length === 0) {
    return { timeline: 0, estimatedCost: '$0' };
  }
  
  // Calculate timeline (maximum time to comply)
  const timeline = Math.max(
    ...incompleteRequirements.map(req => req.estimatedTimeToComply || 0)
  );
  
  // Calculate total cost range
  let minCost = 0;
  let maxCost = 0;
  
  incompleteRequirements.forEach(req => {
    if (req.estimatedCostToComply) {
      // Parse cost range
      const costMatch = req.estimatedCostToComply.match(/\$(\d+) - \$(\d+)/);
      if (costMatch) {
        minCost += parseInt(costMatch[1]);
        maxCost += parseInt(costMatch[2]);
      }
    }
  });
  
  // Format cost range
  const estimatedCost = `$${minCost} - $${maxCost}`;
  
  return { timeline, estimatedCost };
}

/**
 * Generate recommendations based on assessment
 */
function generateRecommendations(
  assessedRequirements: AssessedRequirement[],
  businessProfile: BusinessProfile
): string[] {
  const recommendations: string[] = [];
  
  // Get high priority missing requirements
  const highPriorityMissing = assessedRequirements.filter(
    req => req.status === ComplianceStatus.NOT_SATISFIED && req.priority === 'HIGH'
  );
  
  // Get partially compliant requirements
  const partiallyCompliant = assessedRequirements.filter(
    req => req.status === ComplianceStatus.PARTIALLY_SATISFIED
  );
  
  // Add recommendations for high priority missing requirements
  if (highPriorityMissing.length > 0) {
    recommendations.push(
      `Prioritize compliance with ${highPriorityMissing.length} critical requirements for ${highPriorityMissing[0].country}`
    );
    
    // Add specific recommendations for the first few high priority requirements
    highPriorityMissing.slice(0, 3).forEach(req => {
      recommendations.push(
        `Initiate ${req.requirementType} process with ${typeof req.agency === 'string' ? req.agency : req.agency.name}`
      );
    });
  }
  
  // Add recommendations for partially compliant requirements
  if (partiallyCompliant.length > 0) {
    recommendations.push(
      `Complete partial compliance for ${partiallyCompliant.length} requirements`
    );
  }
  
  // Add general recommendations
  recommendations.push(
    'Develop a compliance tracking system to monitor progress'
  );
  
  recommendations.push(
    'Consider engaging with a trade consultant for complex requirements'
  );
  
  return recommendations;
}

/**
 * Enhance assessment with LLM
 */
async function enhanceAssessmentWithLLM(
  assessment: AssessedRequirement,
  businessProfile: BusinessProfile,
  llm: LLM
): Promise<AssessedRequirement> {
  try {
    // Create prompt for LLM
    const prompt = `
      I need to enhance a regulatory compliance assessment for a business.
      
      Business Profile:
      - Name: ${businessProfile.name}
      - Products: ${businessProfile.products.map(p => p.name).join(', ')}
      - Target Markets: ${businessProfile.targetMarkets?.join(', ') || businessProfile.marketFocus?.join(', ') || 'Unknown'}
      
      Regulatory Requirement:
      - Country: ${assessment.country}
      - Type: ${assessment.requirementType}
      - Description: ${assessment.description}
      - Agency: ${typeof assessment.agency === 'string' ? assessment.agency : assessment.agency.name}
      
      Current Assessment:
      - Status: ${assessment.status}
      - Compliance Score: ${assessment.complianceScore}
      - Priority: ${assessment.priority}
      
      Please provide:
      1. A more detailed assessment note
      2. Specific action items (as a JSON array)
      3. A more accurate estimate of time to comply (in days)
      4. A more accurate cost estimate (as a range like "$X - $Y")
      
      Format your response as JSON:
      {
        "notes": "detailed assessment",
        "actionItems": ["action 1", "action 2"],
        "estimatedTimeToComply": number,
        "estimatedCostToComply": "cost range"
      }
    `;
    
    // Get LLM response
    const response = await llm.complete(prompt);
    
    // Parse response
    try {
      const parsedResponse = JSON.parse(response);
      
      // Update assessment with LLM-enhanced information
      if (parsedResponse.notes) {
        assessment.notes = parsedResponse.notes;
      }
      
      if (parsedResponse.actionItems && Array.isArray(parsedResponse.actionItems)) {
        assessment.actionItems = parsedResponse.actionItems;
      }
      
      if (parsedResponse.estimatedTimeToComply && typeof parsedResponse.estimatedTimeToComply === 'number') {
        assessment.estimatedTimeToComply = parsedResponse.estimatedTimeToComply;
      }
      
      if (parsedResponse.estimatedCostToComply && typeof parsedResponse.estimatedCostToComply === 'string') {
        assessment.estimatedCostToComply = parsedResponse.estimatedCostToComply;
      }
    } catch (error) {
      console.error(`Error parsing LLM response: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with original assessment if parsing fails
    }
    
    return assessment;
  } catch (error) {
    console.error(`Error enhancing assessment with LLM: ${error instanceof Error ? error.message : String(error)}`);
    return assessment; // Return original assessment on error
  }
}

/**
 * Enhance compliance assessment with memory subsystem
 */
async function enhanceWithMemory(
  assessment: ComplianceAssessment,
  businessProfile: BusinessProfile,
  memorySubsystem: MemorySubsystem
): Promise<ComplianceAssessment> {
  try {
    // Use memory subsystem to enhance compliance recommendations
    const enhancedRecommendations = await memorySubsystem.enhanceComplianceRecommendations(
      businessProfile.id || 'unknown',
      businessProfile,
      assessment.recommendations || []
    );
    
    // Update assessment with enhanced recommendations
    return {
      ...assessment,
      recommendations: enhancedRecommendations
    };
  } catch (error) {
    console.error(`Error enhancing assessment with memory: ${error instanceof Error ? error.message : String(error)}`);
    return assessment; // Return original assessment on error
  }
}

/**
 * Strip assessment-specific fields from a requirement
 */
function stripAssessmentFields(requirement: AssessedRequirement): RegulatoryRequirement {
  // Create a copy of the requirement
  const { 
    status, 
    complianceScore, 
    notes, 
    actionItems, 
    estimatedTimeToComply, 
    estimatedCostToComply, 
    priority, 
    ...regulatoryRequirement 
  } = requirement;
  
  return regulatoryRequirement;
} 