import { Connectors } from '../connectors';
import { LLM, Tool, RegulatoryRequirement } from '../types';

/**
 * Get regulatory requirements for a specific market and product category
 * @param country Target country
 * @param productCategory Product category
 * @param hsCode Optional HS code for more specific requirements
 * @param connectors Data connectors
 * @param llm LLM for enhanced analysis
 * @returns List of regulatory requirements
 */
async function getRegulatoryRequirements(
  country: string,
  productCategory: string,
  hsCode: string | undefined,
  connectors: Connectors,
  llm: LLM
): Promise<RegulatoryRequirement[]> {
  try {
    // Normalize country code
    const countryCode = country.toUpperCase();
    
    // Get regulatory requirements from database
    const requirements = await connectors.regulatoryDb.getRegulatoryRequirements(
      countryCode,
      productCategory,
      hsCode
    );
    
    // If we have requirements from the database, return them
    if (requirements && requirements.length > 0) {
      return requirements;
    }
    
    // If no requirements found, use LLM to generate them
    return generateRegulatoryRequirements(country, productCategory, hsCode, llm);
  } catch (error) {
    console.error('Error getting regulatory requirements:', error);
    
    // Fallback to LLM-generated requirements
    return generateRegulatoryRequirements(country, productCategory, hsCode, llm);
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
    
    Please include detailed information on:
    1. Product certification requirements (e.g., HACCP, ISO 22000, Halal/Kosher if applicable)
    2. Labeling requirements (language, nutrition facts, allergens, country of origin, etc.)
    3. Safety standards and compliance (food safety regulations, additives restrictions)
    4. Import permits or licenses required in the destination country
    5. Customs documentation (certificates of origin, health certificates, etc.)
    6. Packaging requirements and restrictions
    7. Tariffs, duties, and taxes applicable
    8. Special requirements for food and beverage products (shelf-life, storage conditions, etc.)
    
    For each requirement, include:
    - The specific requirement type
    - A detailed description of what compliance entails
    - The responsible regulatory agency or authority
    - A URL to the official source if available
    
    Format as JSON with the following structure:
    [
      {
        "country": "${country}",
        "productCategory": "${productCategory}",
        ${hsCode ? `"hsCode": "${hsCode}",` : ''}
        "requirementType": "...",
        "description": "...",
        "agency": "...",
        "url": "...",
        "confidence": 0.9
      },
      ...
    ]
    
    Focus on accuracy and completeness. Include both general requirements for all food/beverage exports and specific requirements for ${productCategory}.
  `;
  
  // Get LLM response
  const response = await llm.complete({
    prompt,
    max_tokens: 1500,
    temperature: 0.3
  });
  
  try {
    // Parse the JSON response
    let requirements: any[] = [];
    
    // Extract JSON from the response (in case the LLM includes explanatory text)
    const jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
    if (jsonMatch) {
      requirements = JSON.parse(jsonMatch[0]);
    } else {
      // Try to parse the entire response as JSON
      requirements = JSON.parse(response);
    }
    
    // Validate and clean up each requirement
    return requirements.map((req: any) => ({
      country: country,
      productCategory: productCategory,
      hsCode: hsCode,
      requirementType: req.requirementType || 'General',
      description: req.description || `Requirement for exporting ${productCategory} to ${country}`,
      agency: req.agency || 'Regulatory Authority',
      url: req.url || '',
      lastUpdated: new Date().toISOString().split('T')[0],
      confidence: req.confidence || 0.8
    }));
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    
    // Return minimal requirements with more detailed fallback
    return [
      {
        country,
        productCategory,
        hsCode,
        requirementType: 'General Compliance',
        description: `Exporting ${productCategory} from South Africa to ${country} requires compliance with both South African export regulations and ${country}'s import regulations. This typically includes business registration, product certification, labeling requirements, and customs documentation.`,
        agency: 'Multiple Regulatory Authorities',
        lastUpdated: new Date().toISOString().split('T')[0],
        confidence: 0.7
      },
      {
        country,
        productCategory,
        hsCode,
        requirementType: 'Export Documentation',
        description: 'South African exporters must register with SARS Customs to obtain an exporter code (Customs Client Number, CCN) and prepare appropriate export documentation including commercial invoice, packing list, and certificate of origin.',
        agency: 'South African Revenue Service (SARS)',
        url: 'https://www.sars.gov.za/customs-and-excise/registration-and-licensing/',
        lastUpdated: new Date().toISOString().split('T')[0],
        confidence: 0.8
      }
    ];
  }
}

/**
 * Calculate compliance readiness based on user data and requirements
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
    
    // Return default values
    return {
      score: 0.5,
      missingRequirements: [],
      timeline: 90, // 3 months
      estimatedCost: '$5,000 - $10,000'
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
  if (requirements.length === 0) {
    return 1.0; // No requirements means full compliance
  }
  
  // Count how many requirements are likely covered by user certifications
  let coveredRequirements = 0;
  const totalRequirements = requirements.length;
  
  // Create a mapping of certification keywords to their full names
  const certificationKeywords: Record<string, string[]> = {
    'haccp': ['haccp', 'hazard analysis', 'food safety system'],
    'iso': ['iso 22000', 'fssc 22000', 'iso 9001', 'quality management'],
    'halal': ['halal', 'islamic', 'muslim'],
    'kosher': ['kosher', 'jewish dietary'],
    'organic': ['organic', 'natural', 'pesticide-free'],
    'export': ['exporter code', 'customs client number', 'ccn', 'export registration'],
    'gmp': ['good manufacturing practice', 'gmp'],
    'brc': ['brc', 'british retail consortium', 'global standard for food safety'],
    'fssc': ['fssc', 'food safety system certification'],
    'globalg.a.p': ['globalg.a.p', 'good agricultural practice'],
    'sabs': ['sabs', 'south african bureau of standards'],
    'nrcs': ['nrcs', 'national regulator for compulsory specifications'],
    'fda': ['fda registration', 'food facility registration'],
    'business': ['cipc', 'company registration', 'business license'],
    'tax': ['sars', 'tax clearance', 'vat registration']
  };
  
  // Process each requirement
  for (const req of requirements) {
    // Check if any certification directly covers this requirement
    let isCovered = userCertifications.some(cert => {
      const certLower = cert.toLowerCase();
      
      // Direct match in requirement type or description
      if (req.description.toLowerCase().includes(certLower) || 
          (req.requirementType && req.requirementType.toLowerCase().includes(certLower))) {
        return true;
      }
      
      // Check for keyword matches
      for (const [keyword, phrases] of Object.entries(certificationKeywords)) {
        if (certLower.includes(keyword) || phrases.some(phrase => certLower.includes(phrase))) {
          // This certification matches a keyword, now check if the requirement relates to this keyword
          return phrases.some(phrase => 
            req.description.toLowerCase().includes(phrase) || 
            (req.requirementType && req.requirementType.toLowerCase().includes(phrase))
          );
        }
      }
      
      return false;
    });
    
    // Special case handling for common certifications
    if (!isCovered) {
      // If user has FSSC 22000, they likely comply with HACCP requirements
      if (userCertifications.some(cert => cert.toLowerCase().includes('fssc 22000') || cert.toLowerCase().includes('iso 22000')) &&
          (req.description.toLowerCase().includes('haccp') || 
           (req.requirementType && req.requirementType.toLowerCase().includes('haccp')))) {
        isCovered = true;
      }
      
      // If user has export registration, they likely comply with basic export documentation
      if (userCertifications.some(cert => cert.toLowerCase().includes('export registration') || cert.toLowerCase().includes('exporter code')) &&
          (req.description.toLowerCase().includes('export documentation') || 
           (req.requirementType && req.requirementType.toLowerCase().includes('export documentation')))) {
        isCovered = true;
      }
    }
    
    if (isCovered) {
      coveredRequirements++;
    }
  }
  
  // Calculate weighted score
  // Give more weight to high-confidence requirements
  let weightedScore = 0;
  let totalWeight = 0;
  
  for (const req of requirements) {
    const weight = req.confidence || 0.5;
    totalWeight += weight;
    
    const isCovered = userCertifications.some(cert => {
      const certLower = cert.toLowerCase();
      return req.description.toLowerCase().includes(certLower) || 
             (req.requirementType && req.requirementType.toLowerCase().includes(certLower));
    });
    
    if (isCovered) {
      weightedScore += weight;
    }
  }
  
  // Return the simple ratio if there are no weights
  if (totalWeight === 0) {
    return coveredRequirements / totalRequirements;
  }
  
  // Return weighted score
  return weightedScore / totalWeight;
}

/**
 * Identify missing requirements
 */
function identifyMissingRequirements(
  requirements: RegulatoryRequirement[],
  userCertifications: string[]
): RegulatoryRequirement[] {
  // Create a mapping of certification keywords to their full names
  const certificationKeywords: Record<string, string[]> = {
    'haccp': ['haccp', 'hazard analysis', 'food safety system'],
    'iso': ['iso 22000', 'fssc 22000', 'iso 9001', 'quality management'],
    'halal': ['halal', 'islamic', 'muslim'],
    'kosher': ['kosher', 'jewish dietary'],
    'organic': ['organic', 'natural', 'pesticide-free'],
    'export': ['exporter code', 'customs client number', 'ccn', 'export registration'],
    'gmp': ['good manufacturing practice', 'gmp'],
    'brc': ['brc', 'british retail consortium', 'global standard for food safety'],
    'fssc': ['fssc', 'food safety system certification'],
    'globalg.a.p': ['globalg.a.p', 'good agricultural practice'],
    'sabs': ['sabs', 'south african bureau of standards'],
    'nrcs': ['nrcs', 'national regulator for compulsory specifications'],
    'fda': ['fda registration', 'food facility registration'],
    'business': ['cipc', 'company registration', 'business license'],
    'tax': ['sars', 'tax clearance', 'vat registration']
  };
  
  return requirements.filter(req => {
    // Check if any certification covers this requirement
    const isCovered = userCertifications.some(cert => {
      const certLower = cert.toLowerCase();
      
      // Direct match in requirement type or description
      if (req.description.toLowerCase().includes(certLower) || 
          (req.requirementType && req.requirementType.toLowerCase().includes(certLower))) {
        return true;
      }
      
      // Check for keyword matches
      for (const [keyword, phrases] of Object.entries(certificationKeywords)) {
        if (certLower.includes(keyword) || phrases.some(phrase => certLower.includes(phrase))) {
          // This certification matches a keyword, now check if the requirement relates to this keyword
          return phrases.some(phrase => 
            req.description.toLowerCase().includes(phrase) || 
            (req.requirementType && req.requirementType.toLowerCase().includes(phrase))
          );
        }
      }
      
      // Special case handling for common certifications
      // If user has FSSC 22000, they likely comply with HACCP requirements
      if ((certLower.includes('fssc 22000') || certLower.includes('iso 22000')) &&
          (req.description.toLowerCase().includes('haccp') || 
           (req.requirementType && req.requirementType.toLowerCase().includes('haccp')))) {
        return true;
      }
      
      // If user has export registration, they likely comply with basic export documentation
      if ((certLower.includes('export registration') || certLower.includes('exporter code')) &&
          (req.description.toLowerCase().includes('export documentation') || 
           (req.requirementType && req.requirementType.toLowerCase().includes('export documentation')))) {
        return true;
      }
      
      return false;
    });
    
    return !isCovered;
  });
}

/**
 * Estimate compliance timeline in days
 */
function estimateComplianceTimeline(missingRequirements: RegulatoryRequirement[]): number {
  if (missingRequirements.length === 0) {
    return 0; // No missing requirements means no time needed
  }
  
  // Define timeline estimates for different requirement types (in days)
  const timelineEstimates: Record<string, number> = {
    // Business registration and licensing
    'Business Registration': 30,
    'Tax Registration': 21,
    'Liquor License': 90,
    'Food Safety Certification': 45,
    
    // Certifications
    'Food Safety System': 120, // HACCP implementation
    'Quality Certification': 180, // ISO 22000
    'Halal Certification': 60,
    'Kosher Certification': 60,
    'Organic Certification': 180,
    
    // Export prerequisites
    'Export Registration': 14,
    'Export Permit': 21,
    'Phytosanitary Certificate': 14,
    'Veterinary Health Certificate': 14,
    
    // UK specific
    'UK Importer Registration': 30,
    'UK Responsible Address': 14,
    'Shelf-life Marking': 30,
    'Food Information Regulations': 45,
    'Alcohol Labeling': 30,
    'Sugar Tax Compliance': 14,
    'Tariff Preference': 21,
    'IPAFFS Pre-notification': 7,
    'Packaging EPR': 30,
    
    // USA specific
    'FDA Facility Registration': 30,
    'TTB Label Approval': 60,
    'Low-Acid Canned Food Registration': 45,
    'Nutrition Facts Panel': 30,
    'Allergen Labeling': 21,
    'Juice HACCP': 90,
    'AGOA Tariff Preference': 21,
    'USDA Organic Certification': 180,
    'FDA Prior Notice': 7,
    'Foreign Supplier Verification': 45,
    
    // UAE specific
    'Product Registration': 60,
    'Arabic Labeling': 30,
    'Shelf-life Standards': 21,
    'Emirates Quality Mark': 90,
    'Excise Tax': 14,
    'Import Duty': 7,
    'Health Certificate': 14,
    'Certificate of Origin': 7,
    'Local Distribution': 60
  };
  
  // Default timeline for unknown requirement types
  const defaultTimeline = 30;
  
  // Calculate total timeline
  let totalTimeline = 0;
  
  // Track requirement types to avoid double-counting similar requirements
  const processedTypes = new Set<string>();
  
  for (const req of missingRequirements) {
    // Skip if we've already processed this type of requirement
    if (processedTypes.has(req.requirementType)) {
      continue;
    }
    
    // Add to processed types
    processedTypes.add(req.requirementType);
    
    // Get timeline estimate for this requirement type
    const estimate = timelineEstimates[req.requirementType] || defaultTimeline;
    
    // Add to total timeline
    totalTimeline += estimate;
  }
  
  // Apply parallel processing factor - many requirements can be pursued simultaneously
  // The more requirements, the more parallel processing can happen
  const parallelFactor = Math.min(0.7, 0.3 + (processedTypes.size * 0.05));
  
  // Apply the parallel processing factor
  const adjustedTimeline = Math.round(totalTimeline * (1 - parallelFactor));
  
  // Ensure minimum timeline
  return Math.max(30, adjustedTimeline);
}

/**
 * Estimate compliance cost
 */
function estimateComplianceCost(missingRequirements: RegulatoryRequirement[]): string {
  if (missingRequirements.length === 0) {
    return '$0'; // No missing requirements means no cost
  }
  
  // Define cost estimates for different requirement types (in USD)
  const costEstimates: Record<string, number> = {
    // Business registration and licensing
    'Business Registration': 500,
    'Tax Registration': 300,
    'Liquor License': 5000,
    'Food Safety Certification': 1500,
    
    // Certifications
    'Food Safety System': 15000, // HACCP implementation
    'Quality Certification': 25000, // ISO 22000
    'Halal Certification': 3000,
    'Kosher Certification': 3000,
    'Organic Certification': 10000,
    
    // Export prerequisites
    'Export Registration': 500,
    'Export Permit': 300,
    'Phytosanitary Certificate': 200,
    'Veterinary Health Certificate': 200,
    
    // UK specific
    'UK Importer Registration': 1000,
    'UK Responsible Address': 500,
    'Shelf-life Marking': 2000,
    'Food Information Regulations': 3000,
    'Alcohol Labeling': 2000,
    'Sugar Tax Compliance': 1000,
    'Tariff Preference': 500,
    'IPAFFS Pre-notification': 200,
    'Packaging EPR': 2000,
    
    // USA specific
    'FDA Facility Registration': 1500,
    'TTB Label Approval': 3000,
    'Low-Acid Canned Food Registration': 2500,
    'Nutrition Facts Panel': 2000,
    'Allergen Labeling': 1500,
    'Juice HACCP': 8000,
    'AGOA Tariff Preference': 500,
    'USDA Organic Certification': 12000,
    'FDA Prior Notice': 200,
    'Foreign Supplier Verification': 3000,
    
    // UAE specific
    'Product Registration': 3000,
    'Arabic Labeling': 2000,
    'Shelf-life Standards': 1500,
    'Emirates Quality Mark': 5000,
    'Excise Tax': 1000,
    'Import Duty': 500,
    'Health Certificate': 300,
    'Certificate of Origin': 200,
    'Local Distribution': 5000
  };
  
  // Default cost for unknown requirement types
  const defaultCost = 2000;
  
  // Calculate total cost
  let totalCost = 0;
  
  // Track requirement types to avoid double-counting similar requirements
  const processedTypes = new Set<string>();
  
  for (const req of missingRequirements) {
    // Skip if we've already processed this type of requirement
    if (processedTypes.has(req.requirementType)) {
      continue;
    }
    
    // Add to processed types
    processedTypes.add(req.requirementType);
    
    // Get cost estimate for this requirement type
    const estimate = costEstimates[req.requirementType] || defaultCost;
    
    // Add to total cost
    totalCost += estimate;
  }
  
  // Apply economies of scale - the more requirements, the more efficient the process
  // This reflects that some costs can be shared across multiple requirements
  const scaleFactor = Math.max(0.7, 1 - (processedTypes.size * 0.03));
  
  // Apply the scale factor
  const adjustedCost = Math.round(totalCost * scaleFactor);
  
  // Add base cost for consulting and administrative overhead
  const baseCost = 3000;
  const finalCost = baseCost + adjustedCost;
  
  // Format as a range with 20% variance
  const lowerBound = Math.round(finalCost * 0.9);
  const upperBound = Math.round(finalCost * 1.3);
  
  // Format the cost range
  if (finalCost >= 1000000) {
    return `$${(lowerBound / 1000000).toFixed(1)} - $${(upperBound / 1000000).toFixed(1)} million`;
  } else if (finalCost >= 1000) {
    return `$${(lowerBound / 1000).toFixed(1)} - $${(upperBound / 1000).toFixed(1)} thousand`;
  } else {
    return `$${lowerBound.toFixed(0)} - $${upperBound.toFixed(0)}`;
  }
}

export function registerRegulatoryTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'getRegulatoryRequirements',
      description: 'Get regulatory requirements for a specific country and product category',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Target country (name or code)' },
          productCategory: { type: 'string', description: 'Product category' },
          hsCode: { type: 'string', description: 'Optional HS code for more specific requirements' }
        },
        required: ['country', 'productCategory']
      },
      handler: async (params) => getRegulatoryRequirements(
        params.country,
        params.productCategory,
        params.hsCode,
        connectors,
        llm
      )
    },
    {
      name: 'calculateComplianceReadiness',
      description: 'Calculate compliance readiness based on user data and requirements',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Target country (name or code)' },
          productCategory: { type: 'string', description: 'Product category' },
          userCertifications: { 
            type: 'array', 
            items: { type: 'string' }, 
            description: 'List of user certifications' 
          }
        },
        required: ['country', 'productCategory', 'userCertifications']
      },
      handler: async (params) => calculateComplianceReadiness(
        params.country,
        params.productCategory,
        params.userCertifications,
        connectors,
        llm
      )
    },
    {
      name: 'getUpdateFrequencyInfo',
      description: 'Get information about how often regulatory requirements should be updated',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      handler: async () => connectors.regulatoryDb.getUpdateFrequencyInfo()
    },
    {
      name: 'checkRegulatoryUpdateStatus',
      description: 'Check if regulatory requirements need to be updated',
      parameters: {
        type: 'object',
        properties: {
          country: { type: 'string', description: 'Optional country code to check update status for specific country' }
        },
        required: []
      },
      handler: async (params) => connectors.regulatoryDb.checkUpdateStatus(params.country)
    }
  ];
} 