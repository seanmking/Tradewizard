import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

// Initialize database connection
const memoryDb = new Pool({
  connectionString: process.env.MEMORY_DB_URL || 'postgresql://seanking@localhost:5432/memory_db'
});

// Create memory subsystem tables
async function initializeMemoryDb() {
  try {
    console.log('Initializing memory subsystem database...');
    
    // Create export strategy patterns table
    await memoryDb.query(`
      CREATE TABLE IF NOT EXISTS export_strategy_patterns (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        confidence FLOAT NOT NULL,
        business_size_min INTEGER,
        business_size_max INTEGER,
        product_categories TEXT[] NOT NULL,
        applicable_markets TEXT[] NOT NULL,
        entry_strategy VARCHAR(100) NOT NULL,
        compliance_approach VARCHAR(100),
        logistics_model VARCHAR(100),
        timeline_min INTEGER,
        timeline_max INTEGER,
        timeline_average INTEGER,
        success_rate FLOAT NOT NULL,
        common_challenges TEXT[],
        critical_success_factors TEXT[],
        relevant_certifications TEXT[],
        application_count INTEGER NOT NULL,
        discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
        metadata JSONB,
        archived BOOLEAN DEFAULT FALSE,
        merged_into VARCHAR(50),
        archived_date TIMESTAMP
      )
    `);
    console.log('Created export_strategy_patterns table');
    
    // Create regulatory patterns table
    await memoryDb.query(`
      CREATE TABLE IF NOT EXISTS regulatory_patterns (
        id VARCHAR(50) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        confidence FLOAT NOT NULL,
        applicable_markets TEXT[] NOT NULL,
        product_categories TEXT[] NOT NULL,
        hs_code_patterns TEXT[],
        regulatory_domain VARCHAR(100) NOT NULL,
        pattern_criteria JSONB NOT NULL,
        discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
        application_count INTEGER NOT NULL,
        success_rate FLOAT NOT NULL,
        metadata JSONB,
        archived BOOLEAN DEFAULT FALSE,
        merged_into VARCHAR(50),
        archived_date TIMESTAMP
      )
    `);
    console.log('Created regulatory_patterns table');
    
    // Create business profile history table
    await memoryDb.query(`
      CREATE TABLE IF NOT EXISTS business_profile_history (
        id SERIAL PRIMARY KEY,
        business_id VARCHAR(50) NOT NULL,
        profile_snapshot JSONB NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        change_type VARCHAR(50) NOT NULL,
        changes JSONB
      )
    `);
    console.log('Created business_profile_history table');
    
    // Create pattern applications table
    await memoryDb.query(`
      CREATE TABLE IF NOT EXISTS pattern_applications (
        id VARCHAR(50) PRIMARY KEY,
        pattern_id VARCHAR(50) NOT NULL,
        business_id VARCHAR(50) NOT NULL,
        confidence FLOAT NOT NULL,
        confidence_level VARCHAR(20) NOT NULL,
        source VARCHAR(50) NOT NULL,
        explanation TEXT NOT NULL,
        applied_to VARCHAR(100) NOT NULL,
        before_enhancement JSONB,
        after_enhancement JSONB NOT NULL,
        metadata JSONB,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created pattern_applications table');
    
    // Create feedback table
    await memoryDb.query(`
      CREATE TABLE IF NOT EXISTS pattern_feedback (
        id SERIAL PRIMARY KEY,
        pattern_application_id VARCHAR(50) NOT NULL,
        business_id VARCHAR(50) NOT NULL,
        is_helpful BOOLEAN NOT NULL,
        feedback_details TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created pattern_feedback table');
    
    console.log('Memory subsystem database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing memory database:', error);
  } finally {
    // Close database connection
    await memoryDb.end();
  }
}

// Run the initialization function
initializeMemoryDb(); 