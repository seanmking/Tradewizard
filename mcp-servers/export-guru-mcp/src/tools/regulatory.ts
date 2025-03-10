import { Connectors } from '../connectors';
import { LLM, Tool, RegulatoryRequirement } from '../types';
import { validateRegulatoryRequirement } from '../utils/validation';
import { StandardDataStructures } from '../utils/data-standards';
import { ApiError } from '../utils/error-handling';

/**
 * Get regulatory requirements for a country and product category
 */
async function getRegulatoryRequirements(
  country: string,
  productCategory: string,
  hsCode: string | undefined,
  connectors: Connectors,
  llm: LLM
): Promise<RegulatoryRequirement[]> {
  try {
    // Validate inputs
    if (!country || !productCategory) {
      console.warn("Missing required parameters for regulatory requirements");
      return [];
    }
    
    // Convert country name to ISO code if needed
    const countryCode = await getCountryCode(country, llm)
      .catch(error => {
        console.error(`Error getting country code: ${error instanceof Error ? error.message : String(error)}`);
        return country; // Fallback to original country name
      });
    
    // Get regulatory requirements from database
    const requirements = await connectors.regulatoryDb.getRequirements(
      countryCode,
      productCategory,
      hsCode
    ).catch(error => {
      console.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
      return []; // Return empty array as fallback
    });
    
    // If we have requirements, return them
    if (requirements && requirements.length > 0) {
      return requirements;
    }
    
    // If no requirements found, generate them using LLM
    try {
      const generatedRequirements = await generateRegulatoryRequirements(countryCode, productCategory, hsCode, llm);
      
      // Validate generated requirements
      const validRequirements = generatedRequirements.filter(req => {
        const validation = validateRegulatoryRequirement(req);
        if (!validation.valid) {
          console.warn(`Invalid generated requirement: ${validation.errors.map(e => e.message).join(', ')}`);
          return false;
        }
        return true;
      });
      
      // Save valid requirements to database
      for (const req of validRequirements) {
        try {
          await connectors.regulatoryDb.addRequirement(req);
        } catch (error) {
          console.error(`Error saving generated requirement: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      return validRequirements;
    } catch (llmError) {
      console.error(`LLM error: ${llmError instanceof Error ? llmError.message : String(llmError)}`);
      // Return minimal fallback data
      return [{
        country: countryCode,
        productCategory,
        requirementType: "Documentation",
        description: "Basic export documentation required",
        agency: {
          name: "Customs Authority",
          country: countryCode,
          website: "#"
        },
        confidenceLevel: 0.5,
        frequency: "once-off",
        validationStatus: "unverified"
      }];
    }
  } catch (error) {
    console.error('Error fetching regulatory requirements:', error);
    return [{
      country,
      productCategory,
      requirementType: "Documentation",
      description: "Basic export documentation required",
      agency: {
        name: "Customs Authority",
        country,
        website: "#"
      },
      confidenceLevel: 0.5,
      frequency: "once-off",
      validationStatus: "unverified"
    }];
  }
}

/**
 * Generate regulatory requirements using LLM
 */
async function generateRegulatoryRequirements(
  country: string,
  productCategory: string,
  hsCode: string | undefined,
  llm: LLM
): Promise<RegulatoryRequirement[]> {
  // Create a prompt for the LLM
  const prompt = `
    Generate a comprehensive list of regulatory requirements for exporting ${productCategory} from South Africa to ${country}.
    ${hsCode ? `The HS code for this product is ${hsCode}.` : ''}
    
    For each requirement, provide the following information:
    1. Requirement type (e.g., Documentation, Certification, Testing, Labeling, Packaging, Inspection, Registration, Permit, Tariff, Quota, Prohibition, Standard)
    2. Detailed description of the requirement
    3. The government agency or authority responsible for this requirement
    4. Required documentation
    5. Estimated timeline for compliance
    6. Estimated cost for compliance
    7. Frequency (once-off, ongoing, periodic)
    
    Format your response as a JSON array with the following structure:
    [
      {
        "requirementType": "string",
        "description": "string",
        "agency": {
          "name": "string",
          "country": "string",
          "website": "string",
          "contactEmail": "string (optional)",
          "contactPhone": "string (optional)"
        },
        "documentationRequired": ["string"],
        "estimatedTimeline": "string",
        "estimatedCost": "string",
        "frequency": "once-off|ongoing|periodic"
      }
    ]
  `;
  
  try {
    const response = await llm.complete(prompt);
    return parseRequirementsFromLLM(response, country, productCategory, hsCode);
  } catch (error) {
    console.error('Error generating regulatory requirements:', error);
    throw new Error(`Failed to generate regulatory requirements: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse regulatory requirements from LLM response
 */
function parseRequirementsFromLLM(
  llmResponse: string,
  country: string,
  productCategory: string,
  hsCode?: string
): RegulatoryRequirement[] {
  try {
    // Extract JSON array from response
    const jsonMatch = llmResponse.match(/\[\s*\{.*\}\s*\]/s);
    if (!jsonMatch) {
      throw new Error('No JSON array found in LLM response');
    }
    
    const jsonStr = jsonMatch[0];
    const requirements = JSON.parse(jsonStr);
    
    if (!Array.isArray(requirements)) {
      throw new Error('Parsed result is not an array');
    }
    
    // Transform and validate each requirement
    return requirements.map(req => {
      // Ensure agency is properly formatted
      const agency = typeof req.agency === 'string' 
        ? { name: req.agency, country, website: '#' }
        : {
            name: req.agency?.name || 'Unknown',
            country: req.agency?.country || country,
            contactEmail: req.agency?.contactEmail,
            contactPhone: req.agency?.contactPhone,
            website: req.agency?.website || '#'
          };
      
      // Create the requirement object with default values for missing fields
      const requirement: RegulatoryRequirement = {
        country,
        productCategory,
        hsCode,
        requirementType: req.requirementType || 'Documentation',
        description: req.description || 'Regulatory requirement',
        agency,
        documentationRequired: Array.isArray(req.documentationRequired) ? req.documentationRequired : [],
        estimatedTimeline: req.estimatedTimeline || 'Varies',
        estimatedCost: req.estimatedCost || 'Varies',
        confidenceLevel: 0.7, // LLM-generated data has medium confidence
        frequency: (req.frequency as StandardDataStructures.FrequencyType) || 'once-off',
        validationStatus: 'unverified'
      };
      
      return requirement;
    });
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    
    // Return a fallback requirement
    return [{
      country,
      productCategory,
      hsCode,
      requirementType: 'Documentation',
      description: 'Basic export documentation required',
      agency: {
        name: 'Customs Authority',
        country,
        website: '#'
      },
      documentationRequired: ['Commercial Invoice', 'Packing List', 'Bill of Lading'],
      estimatedTimeline: '1-2 weeks',
      estimatedCost: 'Varies',
      confidenceLevel: 0.5,
      frequency: 'once-off',
      validationStatus: 'unverified'
    }];
  }
}

/**
 * Calculate compliance readiness for a business
 */
async function calculateComplianceReadiness(
  country: string,
  productCategory: string,
  userCertifications: string[],
  connectors: Connectors,
  llm: LLM
): Promise<{
  score: number;
  missingRequirements: RegulatoryRequirement[];
  timeline: number;
  estimatedCost: string;
}> {
  try {
    // Get regulatory requirements
    const requirements = await getRegulatoryRequirements(
      country,
      productCategory,
      undefined,
      connectors,
      llm
    );
    
    if (!requirements || requirements.length === 0) {
      return {
        score: 1.0, // No requirements means full compliance
        missingRequirements: [],
        timeline: 0,
        estimatedCost: '$0'
      };
    }
    
    // Calculate compliance score
    const score = calculateComplianceScore(requirements, userCertifications);
    
    // Identify missing requirements
    const missingRequirements = identifyMissingRequirements(requirements, userCertifications);
    
    // Estimate timeline and cost
    const timeline = estimateComplianceTimeline(missingRequirements);
    const estimatedCost = estimateComplianceCost(missingRequirements);
    
    return {
      score,
      missingRequirements,
      timeline,
      estimatedCost
    };
  } catch (error) {
    console.error('Error calculating compliance readiness:', error);
    
    // Return a fallback response
    return {
      score: 0.5,
      missingRequirements: [],
      timeline: 30,
      estimatedCost: 'Unknown'
    };
  }
}

/**
 * Calculate compliance score based on requirements and certifications
 */
function calculateComplianceScore(
  requirements: RegulatoryRequirement[],
  userCertifications: string[]
): number {
  try {
    if (!requirements || requirements.length === 0) {
      return 1.0; // No requirements means full compliance
    }
    
    // Normalize certifications for comparison
    const normalizedCertifications = userCertifications.map(cert => 
      cert.toLowerCase().trim()
    );
    
    // Count requirements that are satisfied by user certifications
    let satisfiedCount = 0;
    
    for (const req of requirements) {
      // Check if this requirement is satisfied by any certification
      const reqDescription = req.description.toLowerCase();
      const reqType = req.requirementType.toLowerCase();
      
      // Check if any certification matches this requirement
      const isSatisfied = normalizedCertifications.some(cert => {
        // Direct match with certification name
        if (reqDescription.includes(cert)) {
          return true;
        }
        
        // Match with requirement type (if certification mentions the type)
        if (cert.includes(reqType)) {
          return true;
        }
        
        // Check documentation required
        if (req.documentationRequired) {
          return req.documentationRequired.some(doc => 
            doc.toLowerCase().includes(cert) || cert.includes(doc.toLowerCase())
          );
        }
        
        return false;
      });
      
      if (isSatisfied) {
        satisfiedCount++;
      }
    }
    
    // Calculate weighted score based on requirement confidence
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (const req of requirements) {
      const weight = req.confidenceLevel || 0.5;
      totalWeight += weight;
      
      // Check if this requirement is satisfied
      const reqDescription = req.description.toLowerCase();
      const reqType = req.requirementType.toLowerCase();
      
      const isSatisfied = normalizedCertifications.some(cert => {
        if (reqDescription.includes(cert) || cert.includes(reqType)) {
          return true;
        }
        
        if (req.documentationRequired) {
          return req.documentationRequired.some(doc => 
            doc.toLowerCase().includes(cert) || cert.includes(doc.toLowerCase())
          );
        }
        
        return false;
      });
      
      if (isSatisfied) {
        weightedScore += weight;
      }
    }
    
    // Calculate final score
    const score = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  } catch (error) {
    console.error('Error calculating compliance score:', error);
    return 0.5; // Return a middle score as fallback
  }
}

/**
 * Identify missing requirements based on user certifications
 */
function identifyMissingRequirements(
  requirements: RegulatoryRequirement[],
  userCertifications: string[]
): RegulatoryRequirement[] {
  try {
    if (!requirements || requirements.length === 0) {
      return [];
    }
    
    // Normalize certifications for comparison
    const normalizedCertifications = userCertifications.map(cert => 
      cert.toLowerCase().trim()
    );
    
    // Filter requirements that are not satisfied by user certifications
    return requirements.filter(req => {
      // Check if this requirement is satisfied by any certification
      const reqDescription = req.description.toLowerCase();
      const reqType = req.requirementType.toLowerCase();
      
      // Check if any certification matches this requirement
      const isSatisfied = normalizedCertifications.some(cert => {
        // Direct match with certification name
        if (reqDescription.includes(cert)) {
          return true;
        }
        
        // Match with requirement type (if certification mentions the type)
        if (cert.includes(reqType)) {
          return true;
        }
        
        // Check documentation required
        if (req.documentationRequired) {
          return req.documentationRequired.some(doc => 
            doc.toLowerCase().includes(cert) || cert.includes(doc.toLowerCase())
          );
        }
        
        return false;
      });
      
      // Return true for requirements that are NOT satisfied
      return !isSatisfied;
    });
  } catch (error) {
    console.error('Error identifying missing requirements:', error);
    return requirements; // Return all requirements as fallback
  }
}

/**
 * Estimate compliance timeline based on missing requirements
 */
function estimateComplianceTimeline(missingRequirements: RegulatoryRequirement[]): number {
  try {
    if (!missingRequirements || missingRequirements.length === 0) {
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
    
    for (const req of missingRequirements) {
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
    console.error('Error estimating compliance timeline:', error);
    return 30; // Return a default timeline as fallback
  }
}

/**
 * Estimate compliance cost based on missing requirements
 */
function estimateComplianceCost(missingRequirements: RegulatoryRequirement[]): string {
  try {
    if (!missingRequirements || missingRequirements.length === 0) {
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
    
    for (const req of missingRequirements) {
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
    console.error('Error estimating compliance cost:', error);
    return 'Varies'; // Return a default cost as fallback
  }
}

/**
 * Get country code from country name
 */
async function getCountryCode(country: string, llm: LLM): Promise<string> {
  // Check if the input is already a country code
  if (/^[A-Z]{2,3}$/.test(country)) {
    return country;
  }
  
  try {
    // Use LLM to convert country name to ISO code
    const prompt = `
      Convert the following country name to its ISO 3166-1 alpha-2 code (2 letters).
      Country: ${country}
      
      Respond with only the 2-letter country code.
    `;
    
    const response = await llm.complete(prompt);
    
    // Extract the country code from the response
    const countryCode = response.trim().match(/^[A-Z]{2}$/)?.[0];
    
    if (countryCode) {
      return countryCode;
    }
    
    // If no valid country code found, return the original country name
    return country;
  } catch (error) {
    console.error('Error getting country code:', error);
    return country; // Return the original country name as fallback
  }
}

/**
 * Register regulatory tools
 */
export function registerRegulatoryTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'get_regulatory_requirements',
      description: 'Get regulatory requirements for exporting a product to a country',
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
        }
      ],
      handler: async (params) => {
        const { country, product_category, hs_code } = params;
        return await getRegulatoryRequirements(
          country,
          product_category,
          hs_code,
          connectors,
          llm
        );
      }
    },
    {
      name: 'calculate_compliance_readiness',
      description: 'Calculate compliance readiness for a business',
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
          name: 'certifications',
          description: 'List of certifications the business has',
          type: 'array',
          required: true
        }
      ],
      handler: async (params) => {
        const { country, product_category, certifications } = params;
        return await calculateComplianceReadiness(
          country,
          product_category,
          certifications,
          connectors,
          llm
        );
      }
    }
  ];
} 