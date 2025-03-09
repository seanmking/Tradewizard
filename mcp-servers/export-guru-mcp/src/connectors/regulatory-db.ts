import { RegulatoryRequirement } from '../types';
import { ApiError } from '../utils/error-handling';

interface RegulatoryDbConfig {
  connectionString: string;
}

/**
 * Update frequency information for regulatory requirements
 * This helps maintain the database by indicating how often different requirements should be checked for updates
 */
const updateFrequencyInfo = {
  // South Africa: Domestic food regulations are updated via Government Gazette notices
  // Major labeling regulations were last updated in 2010 (R146) with draft amendments in 2014
  southAfrica: {
    frequency: 'biannual', // Every 6 months
    sources: [
      {
        name: 'Department of Health (Food Control)',
        url: 'https://www.health.gov.za/food-control/'
      },
      {
        name: 'Department of Agriculture, Land Reform and Rural Development (DALRRD)',
        url: 'https://www.dalrrd.gov.za/'
      },
      {
        name: 'National Regulator for Compulsory Specifications (NRCS)',
        url: 'https://www.nrcs.org.za/business-units/food-and-associated-industries'
      },
      {
        name: 'South African Bureau of Standards (SABS)',
        url: 'https://www.sabs.co.za'
      },
      {
        name: 'International Trade Administration Commission (ITAC)',
        url: 'http://www.itac.org.za'
      }
    ],
    notes: 'Monitor Government Gazette notices continuously. SABS and NRCS host annual stakeholder forums which can hint at upcoming changes.'
  },
  
  // UK: Actively reviewing inherited EU food laws post-Brexit
  // FSA and DEFRA may issue updates multiple times a year
  unitedKingdom: {
    frequency: 'quarterly', // Every 3 months
    sources: [
      {
        name: 'UK Food Standards Agency - Importing Food',
        url: 'https://www.food.gov.uk/business-guidance/imports-exports'
      },
      {
        name: 'UK Food Standards Agency - Food Labelling',
        url: 'https://www.gov.uk/food-labelling-and-packaging'
      },
      {
        name: 'UK Government Import Guidance',
        url: 'https://www.gov.uk/import-goods-into-uk'
      },
      {
        name: 'UK HMRC - Tariff Updates',
        url: 'https://www.gov.uk/guidance/check-tariffs-when-importing-goods-into-the-uk'
      }
    ],
    notes: 'The UK is in a dynamic post-Brexit environment with frequent regulatory changes. New import regimes (Border Target Operating Model) were announced in 2023, and labeling rules like the importer address requirement were deferred to 2024.'
  },
  
  // USA: Food regulations change at a moderate pace with long lead times
  // FDA updates are published in the Federal Register
  unitedStates: {
    frequency: 'semiannual', // Every 6 months
    sources: [
      {
        name: 'FDA Food Facility Registration',
        url: 'https://www.fda.gov/food/online-registration-food-facilities'
      },
      {
        name: 'FDA Importing Food Guidance',
        url: 'https://www.fda.gov/food/importing-food-products-united-states'
      },
      {
        name: 'FDA Food Labeling & Nutrition',
        url: 'https://www.fda.gov/food/food-labeling-nutrition'
      },
      {
        name: 'TTB Alcohol Import Requirements',
        url: 'https://www.ttb.gov/importers'
      },
      {
        name: 'FDA Import Alerts Database',
        url: 'https://www.accessdata.fda.gov/cms_ia/ialist.html'
      }
    ],
    notes: 'Monitor FDA\'s Import Alerts database, Federal Register notices on food imports, and USTR/Customs tariff announcements. AGOA is set to expire in 2025 unless renewed, which is a critical update point.'
  },
  
  // UAE: Standards are updated in line with GSO
  // GSO standards meetings can result in updates each year or two for key standards
  unitedArabEmirates: {
    frequency: 'annual', // Every 12 months
    sources: [
      {
        name: 'UAE Ministry of Climate Change & Environment',
        url: 'https://www.moccae.gov.ae/en/knowledge-and-statistics/policies-and-law.aspx'
      },
      {
        name: 'Emirates Authority for Standardization & Metrology (MOIAT)',
        url: 'https://www.moiat.gov.ae/'
      },
      {
        name: 'Dubai Municipality Food Safety Department',
        url: 'https://www.dm.gov.ae/business/food-safety/'
      },
      {
        name: 'GCC Standardization Organization (GSO)',
        url: 'https://www.gso.org.sa/en/'
      }
    ],
    notes: 'The UAE\'s digital system (ZAD) may push notices to registered importers when rules change. Monitor UAE Ministry of Climate Change and Environment announcements for any new import bans or lifting of bans.'
  },
  
  // General recommendation for update schedule
  recommendedSchedule: {
    quarterly: 'Run an update script to scrape key pages and flag changes in content. This captures frequent changes in major import regimes or tariffs.',
    annually: 'Conduct a comprehensive review of all entries. Update any that have stale dates or references.',
    realTimeMonitoring: 'Set up alerts for critical keywords to catch unforeseen immediate changes.'
  }
};

/**
 * Sets up the Regulatory Database connector
 * @param config Configuration for the Regulatory DB connector
 * @returns Object with methods to interact with the Regulatory DB
 */
export function setupRegulatoryDbConnector(config: RegulatoryDbConfig) {
  // This implementation uses in-memory data for regulatory requirements
  // In a production environment, this would connect to a database
  
  // Comprehensive regulatory requirements database
  const regulatoryRequirements: RegulatoryRequirement[] = [
    // South African Domestic Requirements
    {
      country: 'ZAF',
      productCategory: 'Food and Beverage',
      requirementType: 'Business Registration',
      description: 'Register as a business with the Companies and Intellectual Property Commission (CIPC) to obtain a company registration number.',
      agency: 'Companies and Intellectual Property Commission (CIPC)',
      url: 'https://www.cipc.co.za/',
      lastUpdated: '2023-12-01',
      confidence: 1.0
    },
    {
      country: 'ZAF',
      productCategory: 'Food and Beverage',
      requirementType: 'Tax Registration',
      description: 'Register for taxes with the South African Revenue Service (SARS).',
      agency: 'South African Revenue Service (SARS)',
      url: 'https://www.sars.gov.za/',
      confidence: 1.0
    },
    {
      country: 'ZAF',
      productCategory: 'Food and Beverage',
      requirementType: 'Food Safety Certification',
      description: 'Obtain a Certificate of Acceptability (COA) from the local municipal health authority, as required by Regulation R638 under the Foodstuffs, Cosmetics and Disinfectants Act.',
      agency: 'Local Municipal Health Department',
      url: 'https://www.gov.za/',
      confidence: 1.0
    },
    {
      country: 'ZAF',
      productCategory: 'Alcoholic Beverages',
      requirementType: 'Liquor License',
      description: 'Obtain a provincial liquor manufacturing license from the relevant Liquor Board and register for excise duty with SARS.',
      agency: 'Provincial Liquor Board & SARS',
      url: 'https://www.sars.gov.za/customs-and-excise/registration-and-licensing/',
      confidence: 1.0
    },
    {
      country: 'ZAF',
      productCategory: 'Food and Beverage',
      requirementType: 'Food Safety System',
      description: 'Implement HACCP (Hazard Analysis and Critical Control Points) food safety management system, especially for products under NRCS compulsory specifications.',
      agency: 'National Regulator for Compulsory Specifications (NRCS)',
      url: 'https://www.nrcs.org.za/business-units/food-and-associated-industries',
      confidence: 1.0
    },
    {
      country: 'ZAF',
      productCategory: 'Food and Beverage',
      requirementType: 'Quality Certification',
      description: 'Consider ISO 22000 / FSSC 22000 certification for comprehensive food safety controls, often required to supply major overseas retailers.',
      agency: 'South African National Accreditation System (SANAS)',
      url: 'https://www.sanas.co.za/',
      confidence: 0.9
    },
    {
      country: 'ZAF',
      productCategory: 'Food and Beverage',
      requirementType: 'Halal Certification',
      description: 'Obtain Halal certification if products contain animal derivatives and are intended for Muslim consumers or export to Muslim-majority markets.',
      agency: 'South African National Halaal Authority (SANHA)',
      url: 'http://www.sanha.org.za',
      confidence: 0.9
    },
    {
      country: 'ZAF',
      productCategory: 'Food and Beverage',
      requirementType: 'Export Registration',
      description: 'Register as an exporter with SARS Customs to obtain an exporter code (Customs Client Number, CCN).',
      agency: 'South African Revenue Service (SARS)',
      url: 'https://www.sars.gov.za/customs-and-excise/registration-and-licensing/',
      confidence: 1.0
    },
    {
      country: 'ZAF',
      productCategory: 'Food and Beverage',
      requirementType: 'Export Permit',
      description: 'Check if your product requires an export permit from ITAC (International Trade Administration Commission).',
      agency: 'International Trade Administration Commission (ITAC)',
      url: 'http://www.itac.org.za',
      confidence: 0.9
    },
    {
      country: 'ZAF',
      productCategory: 'Plant Products',
      requirementType: 'Phytosanitary Certificate',
      description: 'Obtain a phytosanitary certificate from DALRRD for plant products, certifying the goods are free from pests.',
      agency: 'Department of Agriculture, Land Reform and Rural Development (DALRRD)',
      url: 'https://www.dalrrd.gov.za/',
      confidence: 1.0
    },
    {
      country: 'ZAF',
      productCategory: 'Animal Products',
      requirementType: 'Veterinary Health Certificate',
      description: 'Obtain a veterinary health certificate issued by state vets for animal products (meat, dairy, eggs).',
      agency: 'Department of Agriculture, Land Reform and Rural Development (DALRRD)',
      url: 'https://www.dalrrd.gov.za/',
      confidence: 1.0
    },
    
    // UK Market Requirements
    {
      country: 'GBR',
      productCategory: 'Food and Beverage',
      requirementType: 'UK Importer Registration',
      description: 'Ensure your UK importer is registered with the local Environmental Health Authority as a food business operator (FBO).',
      agency: 'UK Local Authority Environmental Health',
      url: 'https://www.food.gov.uk/business-guidance/imports-exports',
      confidence: 1.0
    },
    {
      country: 'GBR',
      productCategory: 'Food and Beverage',
      requirementType: 'UK Responsible Address',
      description: 'Include a UK Responsible Address on the label by 2024 (either the UK importer\'s name and address or the manufacturer\'s UK office).',
      agency: 'Food Standards Agency (FSA)',
      url: 'https://www.food.gov.uk/business-guidance/packaging-and-labelling',
      confidence: 1.0
    },
    {
      country: 'GBR',
      productCategory: 'Frozen/Canned Goods',
      requirementType: 'Shelf-life Marking',
      description: 'Include appropriate "best before" or "use by" date on packaged foods. For products with <3 months shelf-life, use day/month/year format, and for >3 months, at least month/year.',
      agency: 'Food Standards Agency (FSA)',
      url: 'https://www.food.gov.uk/business-guidance/packaging-and-labelling',
      confidence: 1.0
    },
    {
      country: 'GBR',
      productCategory: 'Processed Foods',
      requirementType: 'Food Information Regulations',
      description: 'Adhere to Food Information Regulations (FIR 2014) on labeling – including English-language labels with product name, ingredient list, allergens (emphasized in bold), nutrition information, and net quantity.',
      agency: 'Food Standards Agency (FSA)',
      url: 'https://www.food.gov.uk/business-guidance/packaging-and-labelling',
      confidence: 1.0
    },
    {
      country: 'GBR',
      productCategory: 'Alcoholic Beverages',
      requirementType: 'Alcohol Labeling',
      description: 'Include alcohol by volume (ABV%), allergens (e.g. "contains sulfites" on wine), and UK pregnancy warning or responsibility statements are recommended.',
      agency: 'Food Standards Agency (FSA)',
      url: 'https://www.food.gov.uk/business-guidance/packaging-and-labelling',
      confidence: 1.0
    },
    {
      country: 'GBR',
      productCategory: 'Non-Alcoholic Beverages',
      requirementType: 'Sugar Tax Compliance',
      description: 'Be aware that the UK Soft Drinks Industry Levy (SDIL) imposes a tax on sweetened drinks with >5g sugar/100ml.',
      agency: 'HM Revenue & Customs (HMRC)',
      url: 'https://www.gov.uk/guidance/soft-drinks-industry-levy',
      confidence: 1.0
    },
    {
      country: 'GBR',
      productCategory: 'Food and Beverage',
      requirementType: 'Tariff Preference',
      description: 'Under the UK-SACUM Economic Partnership Agreement, most South African food and drink exports enter duty-free or at reduced tariffs, subject to rules of origin.',
      agency: 'HM Revenue & Customs (HMRC)',
      url: 'https://www.gov.uk/guidance/check-tariffs-when-importing-goods-into-the-uk',
      confidence: 0.9
    },
    {
      country: 'GBR',
      productCategory: 'Food and Beverage',
      requirementType: 'Organic Certification',
      description: 'To label as "Organic" in the UK, products must be certified to organic standards equivalent to UK/EU by a control body recognized by the UK.',
      agency: 'Department for Environment, Food & Rural Affairs (DEFRA)',
      url: 'https://www.gov.uk/guidance/importing-organic-food-to-the-uk',
      confidence: 0.9
    },
    {
      country: 'GBR',
      productCategory: 'Animal Products',
      requirementType: 'IPAFFS Pre-notification',
      description: 'Products of animal origin (meat, dairy, fish, egg) require pre-notification via the IPAFFS system and health certificates.',
      agency: 'Animal and Plant Health Agency (APHA)',
      url: 'https://www.gov.uk/guidance/import-of-products-animal-origin-and-high-risk-food-not-of-animal-origin',
      confidence: 1.0
    },
    {
      country: 'GBR',
      productCategory: 'Food and Beverage',
      requirementType: 'Packaging EPR',
      description: 'UK Importers who place products on UK market must register for Packaging Extended Producer Responsibility and report packaging materials for recycling obligations.',
      agency: 'UK Environment Agency',
      url: 'https://www.gov.uk/guidance/packaging-producer-responsibilities',
      confidence: 0.9
    },
    
    // USA Market Requirements
    {
      country: 'USA',
      productCategory: 'Food and Beverage',
      requirementType: 'FDA Facility Registration',
      description: 'Register your food facility with the U.S. FDA before exporting to the US. This is a requirement under the Bioterrorism Act and Food Safety Modernization Act (FSMA).',
      agency: 'U.S. Food and Drug Administration (FDA)',
      url: 'https://www.fda.gov/food/online-registration-food-facilities',
      confidence: 1.0
    },
    {
      country: 'USA',
      productCategory: 'Alcoholic Beverages',
      requirementType: 'TTB Label Approval',
      description: 'Ensure your US importer obtains a TTB Certificate of Label Approval (COLA) for wine, distilled spirits, and malt beverages prior to import and sale in the US.',
      agency: 'Alcohol and Tobacco Tax and Trade Bureau (TTB)',
      url: 'https://www.ttb.gov/importers',
      confidence: 1.0
    },
    {
      country: 'USA',
      productCategory: 'Canned Foods',
      requirementType: 'Low-Acid Canned Food Registration',
      description: 'Register your scheduled process with FDA (filing form FDA 2541 and process details) for acidified or low-acid canned products.',
      agency: 'U.S. Food and Drug Administration (FDA)',
      url: 'https://www.fda.gov/food/guidance-regulation-food-and-dietary-supplements/acidified-low-acid-canned-foods',
      confidence: 1.0
    },
    {
      country: 'USA',
      productCategory: 'Food and Beverage',
      requirementType: 'Nutrition Facts Panel',
      description: 'Include Nutrition Facts Panel on most processed foods, formatted according to FDA\'s latest requirements (which were updated in 2016, e.g. requiring an "Added Sugars" line).',
      agency: 'U.S. Food and Drug Administration (FDA)',
      url: 'https://www.fda.gov/food/food-labeling-nutrition',
      confidence: 1.0
    },
    {
      country: 'USA',
      productCategory: 'Food and Beverage',
      requirementType: 'Allergen Labeling',
      description: 'List "Contains: [allergen names]" for any of the major allergens (milk, eggs, fish, crustacean shellfish, tree nuts, peanuts, wheat, soy, and sesame).',
      agency: 'U.S. Food and Drug Administration (FDA)',
      url: 'https://www.fda.gov/food/food-labeling-nutrition/food-allergies',
      confidence: 1.0
    },
    {
      country: 'USA',
      productCategory: 'Juices',
      requirementType: 'Juice HACCP',
      description: 'Implement a HACCP system for juice processors under 21 CFR Part 120.',
      agency: 'U.S. Food and Drug Administration (FDA)',
      url: 'https://www.fda.gov/food/hazard-analysis-critical-control-point-haccp/juice-haccp',
      confidence: 1.0
    },
    {
      country: 'USA',
      productCategory: 'Food and Beverage',
      requirementType: 'AGOA Tariff Preference',
      description: 'Under the African Growth and Opportunity Act (AGOA), many South African food exports can enter duty-free (currently effective through 2025).',
      agency: 'U.S. Customs and Border Protection (CBP)',
      url: 'https://www.trade.gov/agoa-eligibility',
      confidence: 0.9
    },
    {
      country: 'USA',
      productCategory: 'Food and Beverage',
      requirementType: 'USDA Organic Certification',
      description: 'To market a product as "Organic" in the US, it must comply with the USDA National Organic Program (NOP) standards and be certified by a USDA-accredited organic certifier.',
      agency: 'USDA Agricultural Marketing Service',
      url: 'https://www.ams.usda.gov/organic',
      confidence: 0.9
    },
    {
      country: 'USA',
      productCategory: 'Food and Beverage',
      requirementType: 'FDA Prior Notice',
      description: 'Submit electronic notice of each food shipment before it arrives in the U.S. via FDA\'s Prior Notice system.',
      agency: 'U.S. Food and Drug Administration (FDA)',
      url: 'https://www.fda.gov/food/importing-food-products-united-states',
      confidence: 1.0
    },
    {
      country: 'USA',
      productCategory: 'Food and Beverage',
      requirementType: 'Foreign Supplier Verification',
      description: 'Ensure your U.S. importer has a Foreign Supplier Verification Program (FSVP) to verify that you produce food meeting U.S. safety standards.',
      agency: 'U.S. Food and Drug Administration (FDA)',
      url: 'https://www.fda.gov/food/food-safety-modernization-act-fsma/fsma-final-rule-foreign-supplier-verification-programs-fsvp-importers-food-humans-and-animals',
      confidence: 1.0
    },
    
    // UAE Market Requirements
    {
      country: 'ARE',
      productCategory: 'Food and Beverage',
      requirementType: 'Product Registration',
      description: 'Register all food items in the UAE\'s food registration system (e.g. Dubai Municipality\'s "FIRS" or the unified federal system called ZAD) before import.',
      agency: 'UAE Ministry of Climate Change & Environment / Dubai Municipality',
      url: 'https://www.dm.gov.ae/business/food-safety/',
      confidence: 1.0
    },
    {
      country: 'ARE',
      productCategory: 'Food and Beverage',
      requirementType: 'Arabic Labeling',
      description: 'Every product label must be in Arabic (at least sticker translation) and include the product name, ingredients, country of origin, production/expiry dates, manufacturer details, etc.',
      agency: 'Emirates Authority for Standardization & Metrology (ESMA)',
      url: 'https://www.moiat.gov.ae/',
      confidence: 1.0
    },
    {
      country: 'ARE',
      productCategory: 'Food and Beverage',
      requirementType: 'Shelf-life Standards',
      description: 'Ensure products have at least half of their shelf life remaining upon arrival. Production and expiry dates must be printed by the manufacturer on the original label or container in DD/MM/YYYY format.',
      agency: 'Dubai Municipality Food Safety Department',
      url: 'https://www.dm.gov.ae/business/food-safety/',
      confidence: 1.0
    },
    {
      country: 'ARE',
      productCategory: 'Meat Products',
      requirementType: 'Halal Certification',
      description: 'For any meat or gelatin-containing product, obtain a Halal Certificate from a UAE-approved Islamic authority in South Africa, attesting animals were slaughtered according to Islamic law.',
      agency: 'Emirates Authority for Standardization & Metrology (ESMA)',
      url: 'https://www.moiat.gov.ae/',
      confidence: 1.0
    },
    {
      country: 'ARE',
      productCategory: 'Bottled Water/Juices/Dairy',
      requirementType: 'Emirates Quality Mark',
      description: 'Obtain the Emirates Quality Mark (EQM) certification for bottled drinking water, juices, and dairy products, which is mandatory for sale in UAE.',
      agency: 'Emirates Authority for Standardization & Metrology (ESMA)',
      url: 'https://www.moiat.gov.ae/',
      confidence: 1.0
    },
    {
      country: 'ARE',
      productCategory: 'Sweetened Beverages',
      requirementType: 'Excise Tax',
      description: 'Be aware that the UAE imposes 50% excise tax on sweetened beverages (with added sugar or sweetener) and 100% on energy drinks.',
      agency: 'Federal Tax Authority (UAE)',
      url: 'https://tax.gov.ae/en/taxes/excise-tax',
      confidence: 1.0
    },
    {
      country: 'ARE',
      productCategory: 'Food and Beverage',
      requirementType: 'Import Duty',
      description: 'Most food and beverage imports incur a 5% import duty ad valorem as part of the GCC Common External Tariff.',
      agency: 'UAE Customs',
      url: 'https://www.moiat.gov.ae/',
      confidence: 0.9
    },
    {
      country: 'ARE',
      productCategory: 'Food and Beverage',
      requirementType: 'Health Certificate',
      description: 'Provide a general export certificate stating the product is fit for human consumption and freely sold in South Africa.',
      agency: 'Department of Agriculture, Land Reform and Rural Development (DALRRD)',
      url: 'https://www.dalrrd.gov.za/',
      confidence: 0.9
    },
    {
      country: 'ARE',
      productCategory: 'Food and Beverage',
      requirementType: 'Certificate of Origin',
      description: 'Provide a Certificate of Origin for customs documentation to verify origin and for statistics.',
      agency: 'South African Chamber of Commerce and Industry',
      url: 'https://sacci.org.za/',
      confidence: 0.9
    },
    {
      country: 'ARE',
      productCategory: 'Food and Beverage',
      requirementType: 'Local Distribution',
      description: 'Work with a UAE-registered importer or distributor, as foreign companies cannot directly import without a local entity.',
      agency: 'UAE Ministry of Economy',
      url: 'https://www.moec.gov.ae/en/home',
      confidence: 0.9
    }
  ];
  
  return {
    /**
     * Get regulatory requirements for a specific country and product category
     * @param country Country code
     * @param productCategory Product category
     * @param hsCode Optional HS code for more specific requirements
     * @returns List of regulatory requirements
     */
    getRegulatoryRequirements: async function(
      country: string,
      productCategory: string,
      hsCode?: string
    ): Promise<RegulatoryRequirement[]> {
      try {
        // Filter requirements by country and product category
        let filteredRequirements = regulatoryRequirements.filter(req => 
          req.country.toUpperCase() === country.toUpperCase() &&
          (req.productCategory.toLowerCase() === productCategory.toLowerCase() ||
           req.productCategory.toLowerCase() === 'food and beverage')
        );
        
        // Further filter by HS code if provided
        if (hsCode && hsCode.trim() !== '') {
          const hsCodeSpecificRequirements = filteredRequirements.filter(req => 
            req.hsCode === hsCode
          );
          
          // If we have HS code specific requirements, return those
          // Otherwise, fall back to the general requirements
          if (hsCodeSpecificRequirements.length > 0) {
            filteredRequirements = hsCodeSpecificRequirements;
          }
        }
        
        return filteredRequirements;
      } catch (error) {
        console.error('Error fetching regulatory requirements', error);
        throw new ApiError('Failed to fetch regulatory requirements', 500);
      }
    },
    
    /**
     * Get update frequency information for regulatory requirements
     * @returns Update frequency information
     */
    getUpdateFrequencyInfo: async function() {
      return updateFrequencyInfo;
    },
    
    /**
     * Check if regulatory requirements need to be updated
     * @param country Country code
     * @returns Object indicating if update is needed and when last updated
     */
    checkUpdateStatus: async function(country?: string) {
      // Get all requirements or filter by country
      const requirements = country 
        ? regulatoryRequirements.filter(req => req.country.toUpperCase() === country.toUpperCase())
        : regulatoryRequirements;
      
      // Find the oldest lastUpdated date
      const oldestUpdate = requirements.reduce((oldest, req) => {
        if (!req.lastUpdated) return oldest;
        return !oldest || new Date(req.lastUpdated) < new Date(oldest) ? req.lastUpdated : oldest;
      }, '');
      
      // Calculate days since last update
      const daysSinceUpdate = oldestUpdate 
        ? Math.floor((Date.now() - new Date(oldestUpdate).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Determine if update is needed based on country's recommended frequency
      let updateNeeded = false;
      let recommendedFrequency = '';
      
      if (country) {
        const countryCode = country.toUpperCase();
        if (countryCode === 'ZAF') {
          updateNeeded = daysSinceUpdate !== null && daysSinceUpdate > 180; // 6 months
          recommendedFrequency = updateFrequencyInfo.southAfrica.frequency;
        } else if (countryCode === 'GBR') {
          updateNeeded = daysSinceUpdate !== null && daysSinceUpdate > 90; // 3 months
          recommendedFrequency = updateFrequencyInfo.unitedKingdom.frequency;
        } else if (countryCode === 'USA') {
          updateNeeded = daysSinceUpdate !== null && daysSinceUpdate > 180; // 6 months
          recommendedFrequency = updateFrequencyInfo.unitedStates.frequency;
        } else if (countryCode === 'ARE') {
          updateNeeded = daysSinceUpdate !== null && daysSinceUpdate > 365; // 12 months
          recommendedFrequency = updateFrequencyInfo.unitedArabEmirates.frequency;
        } else {
          updateNeeded = daysSinceUpdate !== null && daysSinceUpdate > 180; // Default to 6 months
          recommendedFrequency = 'semiannual';
        }
      } else {
        // If no country specified, recommend update if any country is due
        updateNeeded = daysSinceUpdate !== null && daysSinceUpdate > 90; // Default to quarterly
        recommendedFrequency = 'quarterly';
      }
      
      return {
        updateNeeded,
        lastUpdated: oldestUpdate || 'Never',
        daysSinceUpdate: daysSinceUpdate || 'Unknown',
        recommendedFrequency
      };
    }
  };
} 