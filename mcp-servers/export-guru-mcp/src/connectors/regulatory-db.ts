import { Pool } from 'pg';
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
  // Create a connection pool
  const pool = new Pool({
    connectionString: config.connectionString,
  });
  
  // Test the connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Error connecting to regulatory database:', err);
    } else {
      console.log('Connected to regulatory database at:', res.rows[0].now);
    }
  });
  
  // Initialize the database schema if it doesn't exist
  const initializeDatabase = async () => {
    try {
      // Create the regulatory_requirements table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS regulatory_requirements (
          id SERIAL PRIMARY KEY,
          country VARCHAR(100) NOT NULL,
          product_category VARCHAR(100) NOT NULL,
          hs_code VARCHAR(20),
          requirement_type VARCHAR(100) NOT NULL,
          description TEXT NOT NULL,
          agency VARCHAR(200),
          url TEXT,
          last_updated TIMESTAMP,
          confidence FLOAT NOT NULL
        )
      `);
      
      console.log('Regulatory database schema initialized');
    } catch (error) {
      console.error('Error initializing regulatory database schema:', error);
    }
  };
  
  // Initialize the database
  initializeDatabase();
  
  return {
    /**
     * Get regulatory requirements for a country and product category
     * @param country Country code
     * @param productCategory Product category
     * @param hsCode Optional HS code
     * @returns Array of regulatory requirements
     */
    getRequirements: async function(
      country: string,
      productCategory: string,
      hsCode?: string
    ): Promise<RegulatoryRequirement[]> {
      try {
        let query = `
          SELECT * FROM regulatory_requirements 
          WHERE country = $1 AND product_category = $2
        `;
        
        const params = [country, productCategory];
        
        if (hsCode) {
          query += ` AND (hs_code = $3 OR hs_code IS NULL)`;
          params.push(hsCode);
        }
        
        const result = await pool.query(query, params);
        
        // Map the database results to the RegulatoryRequirement interface
        return result.rows.map(row => ({
          country: row.country,
          productCategory: row.product_category,
          hsCode: row.hs_code,
          requirementType: row.requirement_type,
          description: row.description,
          agency: row.agency,
          url: row.url,
          lastUpdated: row.last_updated ? new Date(row.last_updated).toISOString() : undefined,
          confidence: row.confidence
        }));
      } catch (error) {
        console.error('Error fetching regulatory requirements:', error);
        throw new ApiError('Failed to fetch regulatory requirements', 500);
      }
    },
    
    /**
     * Add a regulatory requirement
     * @param requirement Regulatory requirement to add
     * @returns Success status
     */
    addRequirement: async function(
      requirement: RegulatoryRequirement
    ): Promise<boolean> {
      try {
        const query = `
          INSERT INTO regulatory_requirements (
            country, product_category, hs_code, requirement_type, 
            description, agency, url, last_updated, confidence
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        const params = [
          requirement.country,
          requirement.productCategory,
          requirement.hsCode || null,
          requirement.requirementType,
          requirement.description,
          requirement.agency || null,
          requirement.url || null,
          requirement.lastUpdated ? new Date(requirement.lastUpdated) : null,
          requirement.confidence
        ];
        
        await pool.query(query, params);
        
        return true;
      } catch (error) {
        console.error('Error adding regulatory requirement:', error);
        throw new ApiError('Failed to add regulatory requirement', 500);
      }
    },
    
    /**
     * Update a regulatory requirement
     * @param id Requirement ID
     * @param requirement Updated requirement data
     * @returns Success status
     */
    updateRequirement: async function(
      id: number,
      requirement: Partial<RegulatoryRequirement>
    ): Promise<boolean> {
      try {
        // Build the SET clause dynamically based on the provided fields
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;
        
        if (requirement.country !== undefined) {
          updates.push(`country = $${paramIndex++}`);
          params.push(requirement.country);
        }
        
        if (requirement.productCategory !== undefined) {
          updates.push(`product_category = $${paramIndex++}`);
          params.push(requirement.productCategory);
        }
        
        if (requirement.hsCode !== undefined) {
          updates.push(`hs_code = $${paramIndex++}`);
          params.push(requirement.hsCode);
        }
        
        if (requirement.requirementType !== undefined) {
          updates.push(`requirement_type = $${paramIndex++}`);
          params.push(requirement.requirementType);
        }
        
        if (requirement.description !== undefined) {
          updates.push(`description = $${paramIndex++}`);
          params.push(requirement.description);
        }
        
        if (requirement.agency !== undefined) {
          updates.push(`agency = $${paramIndex++}`);
          params.push(requirement.agency);
        }
        
        if (requirement.url !== undefined) {
          updates.push(`url = $${paramIndex++}`);
          params.push(requirement.url);
        }
        
        if (requirement.lastUpdated !== undefined) {
          updates.push(`last_updated = $${paramIndex++}`);
          params.push(requirement.lastUpdated ? new Date(requirement.lastUpdated) : null);
        }
        
        if (requirement.confidence !== undefined) {
          updates.push(`confidence = $${paramIndex++}`);
          params.push(requirement.confidence);
        }
        
        if (updates.length === 0) {
          return true; // Nothing to update
        }
        
        // Add the ID as the last parameter
        params.push(id);
        
        const query = `
          UPDATE regulatory_requirements 
          SET ${updates.join(', ')} 
          WHERE id = $${paramIndex}
        `;
        
        await pool.query(query, params);
        
        return true;
      } catch (error) {
        console.error('Error updating regulatory requirement:', error);
        throw new ApiError('Failed to update regulatory requirement', 500);
      }
    },
    
    /**
     * Delete a regulatory requirement
     * @param id Requirement ID
     * @returns Success status
     */
    deleteRequirement: async function(id: number): Promise<boolean> {
      try {
        await pool.query('DELETE FROM regulatory_requirements WHERE id = $1', [id]);
        return true;
      } catch (error) {
        console.error('Error deleting regulatory requirement:', error);
        throw new ApiError('Failed to delete regulatory requirement', 500);
      }
    },
    
    /**
     * Search for regulatory requirements
     * @param searchTerm Search term
     * @returns Array of matching regulatory requirements
     */
    searchRequirements: async function(searchTerm: string): Promise<RegulatoryRequirement[]> {
      try {
        const query = `
          SELECT * FROM regulatory_requirements 
          WHERE 
            country ILIKE $1 OR 
            product_category ILIKE $1 OR 
            requirement_type ILIKE $1 OR 
            description ILIKE $1 OR 
            agency ILIKE $1
        `;
        
        const result = await pool.query(query, [`%${searchTerm}%`]);
        
        return result.rows.map(row => ({
          country: row.country,
          productCategory: row.product_category,
          hsCode: row.hs_code,
          requirementType: row.requirement_type,
          description: row.description,
          agency: row.agency,
          url: row.url,
          lastUpdated: row.last_updated ? new Date(row.last_updated).toISOString() : undefined,
          confidence: row.confidence
        }));
      } catch (error) {
        console.error('Error searching regulatory requirements:', error);
        throw new ApiError('Failed to search regulatory requirements', 500);
      }
    },
    
    /**
     * Close the database connection pool
     */
    close: async function(): Promise<void> {
      await pool.end();
    }
  };
} 