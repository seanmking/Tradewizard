import { Pool } from 'pg';
import { RegulatoryRequirement } from '../types';
import { ApiError } from '../utils/error-handling';
import { StandardDataStructures } from '../utils/data-standards';
import { validateRegulatoryRequirement } from '../utils/validation';

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
 * Enhanced regulatory requirement interface with additional metadata
 */
export interface EnhancedRegulatoryRequirement extends RegulatoryRequirement {
  confidenceLevel: number;  // 0-1 scale indicating confidence in the data
  frequency: StandardDataStructures.FrequencyType;  // How often requirement needs attention
  updateFrequency: {
    recommendedSchedule: string;  // e.g., "Quarterly", "Biannually"
    sourcesToMonitor: string[];   // URLs to monitor for changes
    countrySpecificNotes: string; // Country-specific update considerations
  };
  requirementType: StandardDataStructures.RequirementType;  // Categorized requirement type
  agency: {
    name: string;
    country: string;
    contactEmail?: string;
    contactPhone?: string;
    website: string;
  };
  // Added validation metadata
  validationStatus: StandardDataStructures.ValidationStatus;
  lastVerifiedDate?: string;
  verificationSource?: string;
}

/**
 * Sets up the regulatory database connector
 */
export function setupRegulatoryDbConnector(config: RegulatoryDbConfig) {
  const pool = new Pool({
    connectionString: config.connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  /**
   * Initialize the database with tables and initial data
   */
  const initializeDatabase = async () => {
    const client = await pool.connect();
    try {
      // Create tables if they don't exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS regulatory_requirements (
          id SERIAL PRIMARY KEY,
          country VARCHAR(100) NOT NULL,
          product_category VARCHAR(255) NOT NULL,
          hs_code VARCHAR(20),
          requirement_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          agency_name VARCHAR(255) NOT NULL,
          agency_country VARCHAR(100) NOT NULL,
          agency_contact_email VARCHAR(255),
          agency_contact_phone VARCHAR(100),
          agency_website VARCHAR(255),
          documentation_required TEXT[],
          estimated_timeline VARCHAR(100),
          estimated_cost VARCHAR(100),
          confidence_level FLOAT DEFAULT 0.5,
          frequency VARCHAR(20) DEFAULT 'once-off',
          update_schedule VARCHAR(100),
          update_sources TEXT[],
          update_notes TEXT,
          validation_status VARCHAR(20) DEFAULT 'unverified',
          last_verified_date DATE,
          verification_source VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_regulatory_country_product ON regulatory_requirements(country, product_category);
        CREATE INDEX IF NOT EXISTS idx_regulatory_hs_code ON regulatory_requirements(hs_code);
      `);
      
      // Add any missing columns to support the enhanced schema
      await client.query(`
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN confidence_level FLOAT DEFAULT 0.5;
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN frequency VARCHAR(20) DEFAULT 'once-off';
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN update_schedule VARCHAR(100);
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN update_sources TEXT[];
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN update_notes TEXT;
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN validation_status VARCHAR(20) DEFAULT 'unverified';
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN last_verified_date DATE;
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN verification_source VARCHAR(255);
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN agency_country VARCHAR(100) DEFAULT 'Unknown';
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN agency_contact_email VARCHAR(255);
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN agency_contact_phone VARCHAR(100);
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE regulatory_requirements ADD COLUMN agency_website VARCHAR(255) DEFAULT '#';
          EXCEPTION
            WHEN duplicate_column THEN NULL;
          END;
        END $$;
      `);
      
      console.log('Regulatory database initialized successfully');
    } catch (error) {
      console.error('Error initializing regulatory database:', error);
      throw new ApiError('Database initialization failed', 500);
    } finally {
      client.release();
    }
  };

  /**
   * Get regulatory requirements from the database
   */
  const getRequirements = async (
    country: string,
    productCategory: string,
    hsCode?: string
  ): Promise<RegulatoryRequirement[]> => {
    try {
      let query = `
        SELECT 
          id, 
          country, 
          product_category as "productCategory", 
          hs_code as "hsCode", 
          requirement_type as "requirementType", 
          description, 
          agency_name as "agencyName",
          agency_country as "agencyCountry",
          agency_contact_email as "agencyContactEmail",
          agency_contact_phone as "agencyContactPhone",
          agency_website as "agencyWebsite",
          documentation_required as "documentationRequired", 
          estimated_timeline as "estimatedTimeline", 
          estimated_cost as "estimatedCost",
          confidence_level as "confidenceLevel",
          frequency,
          update_schedule as "updateSchedule",
          update_sources as "updateSources",
          update_notes as "updateNotes",
          validation_status as "validationStatus",
          last_verified_date as "lastVerifiedDate",
          verification_source as "verificationSource"
        FROM regulatory_requirements 
        WHERE country = $1 AND product_category = $2
      `;
      
      const params = [country, productCategory];
      
      if (hsCode) {
        query += ` AND (hs_code = $3 OR hs_code IS NULL)`;
        params.push(hsCode);
      }
      
      const result = await pool.query(query, params);
      
      // Transform the database results into the expected format
      return result.rows.map(row => {
        // Create agency object
        const agency = {
          name: row.agencyName,
          country: row.agencyCountry || 'Unknown',
          contactEmail: row.agencyContactEmail,
          contactPhone: row.agencyContactPhone,
          website: row.agencyWebsite || '#'
        };
        
        // Create update frequency object if data exists
        const updateFrequency = row.updateSchedule ? {
          recommendedSchedule: row.updateSchedule,
          sourcesToMonitor: row.updateSources || [],
          countrySpecificNotes: row.updateNotes || ''
        } : undefined;
        
        // Create and validate the regulatory requirement
        const requirement: RegulatoryRequirement = {
          id: row.id.toString(),
          country: row.country,
          productCategory: row.productCategory,
          hsCode: row.hsCode,
          requirementType: row.requirementType,
          description: row.description,
          agency,
          documentationRequired: row.documentationRequired || [],
          estimatedTimeline: row.estimatedTimeline,
          estimatedCost: row.estimatedCost,
          confidenceLevel: row.confidenceLevel || 0.5,
          frequency: row.frequency || 'once-off',
          updateFrequency,
          validationStatus: row.validationStatus || 'unverified',
          lastVerifiedDate: row.lastVerifiedDate,
          verificationSource: row.verificationSource
        };
        
        // Validate the requirement
        const validation = validateRegulatoryRequirement(requirement);
        if (!validation.valid) {
          console.warn(`Invalid regulatory requirement data from database:`, validation.errors);
        }
        
        return requirement;
      });
    } catch (error) {
      console.error('Error fetching regulatory requirements:', error);
      throw new ApiError('Failed to fetch regulatory requirements', 500);
    }
  };

  /**
   * Add a new regulatory requirement to the database
   */
  const addRequirement = async (requirement: RegulatoryRequirement): Promise<RegulatoryRequirement> => {
    try {
      // Validate the requirement
      const validation = validateRegulatoryRequirement(requirement);
      if (!validation.valid) {
        throw new ApiError(`Invalid regulatory requirement data: ${validation.errors.map(e => e.message).join(', ')}`, 400);
      }
      
      // Extract agency data
      const agency = typeof requirement.agency === 'string' 
        ? { name: requirement.agency, country: 'Unknown', website: '#' } 
        : requirement.agency;
      
      // Extract update frequency data
      const updateFrequency = requirement.updateFrequency || {
        recommendedSchedule: '',
        sourcesToMonitor: [],
        countrySpecificNotes: ''
      };
      
      const query = `
        INSERT INTO regulatory_requirements (
          country, 
          product_category, 
          hs_code, 
          requirement_type, 
          description, 
          agency_name,
          agency_country,
          agency_contact_email,
          agency_contact_phone,
          agency_website,
          documentation_required, 
          estimated_timeline, 
          estimated_cost,
          confidence_level,
          frequency,
          update_schedule,
          update_sources,
          update_notes,
          validation_status,
          last_verified_date,
          verification_source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING id
      `;
      
      const params = [
        requirement.country,
        requirement.productCategory,
        requirement.hsCode || null,
        requirement.requirementType,
        requirement.description,
        agency.name,
        agency.country,
        agency.contactEmail || null,
        agency.contactPhone || null,
        agency.website,
        requirement.documentationRequired || [],
        requirement.estimatedTimeline || null,
        requirement.estimatedCost || null,
        requirement.confidenceLevel || 0.5,
        requirement.frequency || 'once-off',
        updateFrequency.recommendedSchedule || null,
        updateFrequency.sourcesToMonitor || [],
        updateFrequency.countrySpecificNotes || null,
        requirement.validationStatus || 'unverified',
        requirement.lastVerifiedDate || null,
        requirement.verificationSource || null
      ];
      
      const result = await pool.query(query, params);
      
      // Return the requirement with the new ID
      return {
        ...requirement,
        id: result.rows[0].id.toString()
      };
    } catch (error) {
      console.error('Error adding regulatory requirement:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to add regulatory requirement', 500);
    }
  };

  /**
   * Update an existing regulatory requirement
   */
  const updateRequirement = async (id: string, requirement: Partial<RegulatoryRequirement>): Promise<RegulatoryRequirement> => {
    try {
      // Get the existing requirement
      const existingResult = await pool.query(
        `SELECT * FROM regulatory_requirements WHERE id = $1`,
        [id]
      );
      
      if (existingResult.rows.length === 0) {
        throw new ApiError('Regulatory requirement not found', 404);
      }
      
      // Build the update query dynamically based on provided fields
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      // Helper function to add a field to the update query
      const addField = (dbField: string, value: any, transform?: (val: any) => any) => {
        if (value !== undefined) {
          updates.push(`${dbField} = $${paramIndex}`);
          values.push(transform ? transform(value) : value);
          paramIndex++;
        }
      };
      
      // Add fields to update
      addField('country', requirement.country);
      addField('product_category', requirement.productCategory);
      addField('hs_code', requirement.hsCode);
      addField('requirement_type', requirement.requirementType);
      addField('description', requirement.description);
      
      // Handle agency updates
      if (requirement.agency) {
        const agency = typeof requirement.agency === 'string' 
          ? { name: requirement.agency, country: 'Unknown', website: '#' } 
          : requirement.agency;
        
        addField('agency_name', agency.name);
        addField('agency_country', agency.country);
        addField('agency_contact_email', agency.contactEmail);
        addField('agency_contact_phone', agency.contactPhone);
        addField('agency_website', agency.website);
      }
      
      addField('documentation_required', requirement.documentationRequired);
      addField('estimated_timeline', requirement.estimatedTimeline);
      addField('estimated_cost', requirement.estimatedCost);
      addField('confidence_level', requirement.confidenceLevel);
      addField('frequency', requirement.frequency);
      
      // Handle update frequency updates
      if (requirement.updateFrequency) {
        addField('update_schedule', requirement.updateFrequency.recommendedSchedule);
        addField('update_sources', requirement.updateFrequency.sourcesToMonitor);
        addField('update_notes', requirement.updateFrequency.countrySpecificNotes);
      }
      
      addField('validation_status', requirement.validationStatus);
      addField('last_verified_date', requirement.lastVerifiedDate);
      addField('verification_source', requirement.verificationSource);
      
      // Add updated_at timestamp
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // If no fields to update, return the existing requirement
      if (updates.length === 0) {
        return getRequirementById(id);
      }
      
      // Execute the update query
      const query = `
        UPDATE regulatory_requirements
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      values.push(id);
      
      const result = await pool.query(query, values);
      
      // Transform the result to the expected format
      const row = result.rows[0];
      
      // Create agency object
      const agency = {
        name: row.agency_name,
        country: row.agency_country || 'Unknown',
        contactEmail: row.agency_contact_email,
        contactPhone: row.agency_contact_phone,
        website: row.agency_website || '#'
      };
      
      // Create update frequency object if data exists
      const updateFrequency = row.update_schedule ? {
        recommendedSchedule: row.update_schedule,
        sourcesToMonitor: row.update_sources || [],
        countrySpecificNotes: row.update_notes || ''
      } : undefined;
      
      // Return the updated requirement
      return {
        id: row.id.toString(),
        country: row.country,
        productCategory: row.product_category,
        hsCode: row.hs_code,
        requirementType: row.requirement_type,
        description: row.description,
        agency,
        documentationRequired: row.documentation_required || [],
        estimatedTimeline: row.estimated_timeline,
        estimatedCost: row.estimated_cost,
        confidenceLevel: row.confidence_level || 0.5,
        frequency: row.frequency || 'once-off',
        updateFrequency,
        validationStatus: row.validation_status || 'unverified',
        lastVerifiedDate: row.last_verified_date,
        verificationSource: row.verification_source
      };
    } catch (error) {
      console.error('Error updating regulatory requirement:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to update regulatory requirement', 500);
    }
  };

  /**
   * Get a regulatory requirement by ID
   */
  const getRequirementById = async (id: string): Promise<RegulatoryRequirement> => {
    try {
      const query = `
        SELECT 
          id, 
          country, 
          product_category as "productCategory", 
          hs_code as "hsCode", 
          requirement_type as "requirementType", 
          description, 
          agency_name as "agencyName",
          agency_country as "agencyCountry",
          agency_contact_email as "agencyContactEmail",
          agency_contact_phone as "agencyContactPhone",
          agency_website as "agencyWebsite",
          documentation_required as "documentationRequired", 
          estimated_timeline as "estimatedTimeline", 
          estimated_cost as "estimatedCost",
          confidence_level as "confidenceLevel",
          frequency,
          update_schedule as "updateSchedule",
          update_sources as "updateSources",
          update_notes as "updateNotes",
          validation_status as "validationStatus",
          last_verified_date as "lastVerifiedDate",
          verification_source as "verificationSource"
        FROM regulatory_requirements 
        WHERE id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new ApiError('Regulatory requirement not found', 404);
      }
      
      const row = result.rows[0];
      
      // Create agency object
      const agency = {
        name: row.agencyName,
        country: row.agencyCountry || 'Unknown',
        contactEmail: row.agencyContactEmail,
        contactPhone: row.agencyContactPhone,
        website: row.agencyWebsite || '#'
      };
      
      // Create update frequency object if data exists
      const updateFrequency = row.updateSchedule ? {
        recommendedSchedule: row.updateSchedule,
        sourcesToMonitor: row.updateSources || [],
        countrySpecificNotes: row.updateNotes || ''
      } : undefined;
      
      // Create and validate the regulatory requirement
      const requirement: RegulatoryRequirement = {
        id: row.id.toString(),
        country: row.country,
        productCategory: row.productCategory,
        hsCode: row.hsCode,
        requirementType: row.requirementType,
        description: row.description,
        agency,
        documentationRequired: row.documentationRequired || [],
        estimatedTimeline: row.estimatedTimeline,
        estimatedCost: row.estimatedCost,
        confidenceLevel: row.confidenceLevel || 0.5,
        frequency: row.frequency || 'once-off',
        updateFrequency,
        validationStatus: row.validationStatus || 'unverified',
        lastVerifiedDate: row.lastVerifiedDate,
        verificationSource: row.verificationSource
      };
      
      // Validate the requirement
      const validation = validateRegulatoryRequirement(requirement);
      if (!validation.valid) {
        console.warn(`Invalid regulatory requirement data from database:`, validation.errors);
      }
      
      return requirement;
    } catch (error) {
      console.error('Error fetching regulatory requirement by ID:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to fetch regulatory requirement', 500);
    }
  };

  /**
   * Delete a regulatory requirement
   */
  const deleteRequirement = async (id: string): Promise<void> => {
    try {
      const result = await pool.query(
        `DELETE FROM regulatory_requirements WHERE id = $1 RETURNING id`,
        [id]
      );
      
      if (result.rows.length === 0) {
        throw new ApiError('Regulatory requirement not found', 404);
      }
    } catch (error) {
      console.error('Error deleting regulatory requirement:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to delete regulatory requirement', 500);
    }
  };

  // Initialize the database
  initializeDatabase().catch(error => {
    console.error('Failed to initialize regulatory database:', error);
  });

  return {
    getRequirements,
    addRequirement,
    updateRequirement,
    getRequirementById,
    deleteRequirement
  };
} 