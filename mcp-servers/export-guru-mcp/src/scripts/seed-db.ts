import dotenv from 'dotenv';
import { setupRegulatoryDbConnector } from '../connectors/regulatory-db';
import { setupTradeDbConnector } from '../connectors/trade-db';
import { RegulatoryRequirement, TradeData } from '../types';

// Load environment variables
dotenv.config();

// Initialize database connectors
const regulatoryDb = setupRegulatoryDbConnector({
  connectionString: process.env.REGULATORY_DB_URL || 'postgresql://postgres:postgres@localhost:5432/regulatory_db'
});

const tradeDb = setupTradeDbConnector({
  connectionString: process.env.TRADE_DB_URL || 'postgresql://postgres:postgres@localhost:5432/trade_db'
});

// Sample regulatory requirements data
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
  }
];

// Sample trade data
const tradeData: TradeData[] = [
  {
    reporterCountry: 'ZAF',
    partnerCountry: 'GBR',
    year: 2023,
    month: 1,
    hsCode: '2204',
    productDescription: 'Wine of fresh grapes',
    tradeFlow: 'export',
    valueUsd: 5000000,
    quantity: 1000000,
    quantityUnit: 'Liters',
    source: 'South African Revenue Service'
  },
  {
    reporterCountry: 'ZAF',
    partnerCountry: 'GBR',
    year: 2023,
    month: 2,
    hsCode: '2204',
    productDescription: 'Wine of fresh grapes',
    tradeFlow: 'export',
    valueUsd: 5200000,
    quantity: 1050000,
    quantityUnit: 'Liters',
    source: 'South African Revenue Service'
  },
  {
    reporterCountry: 'ZAF',
    partnerCountry: 'USA',
    year: 2023,
    month: 1,
    hsCode: '2204',
    productDescription: 'Wine of fresh grapes',
    tradeFlow: 'export',
    valueUsd: 3000000,
    quantity: 600000,
    quantityUnit: 'Liters',
    source: 'South African Revenue Service'
  },
  {
    reporterCountry: 'ZAF',
    partnerCountry: 'USA',
    year: 2023,
    month: 2,
    hsCode: '2204',
    productDescription: 'Wine of fresh grapes',
    tradeFlow: 'export',
    valueUsd: 3100000,
    quantity: 620000,
    quantityUnit: 'Liters',
    source: 'South African Revenue Service'
  },
  {
    reporterCountry: 'ZAF',
    partnerCountry: 'CHN',
    year: 2023,
    month: 1,
    hsCode: '0805',
    productDescription: 'Citrus fruit, fresh or dried',
    tradeFlow: 'export',
    valueUsd: 8000000,
    quantity: 4000000,
    quantityUnit: 'Kilograms',
    source: 'South African Revenue Service'
  },
  {
    reporterCountry: 'ZAF',
    partnerCountry: 'CHN',
    year: 2023,
    month: 2,
    hsCode: '0805',
    productDescription: 'Citrus fruit, fresh or dried',
    tradeFlow: 'export',
    valueUsd: 8200000,
    quantity: 4100000,
    quantityUnit: 'Kilograms',
    source: 'South African Revenue Service'
  },
  {
    reporterCountry: 'ZAF',
    partnerCountry: 'GBR',
    year: 2023,
    month: 1,
    hsCode: '0805',
    productDescription: 'Citrus fruit, fresh or dried',
    tradeFlow: 'export',
    valueUsd: 6000000,
    quantity: 3000000,
    quantityUnit: 'Kilograms',
    source: 'South African Revenue Service'
  },
  {
    reporterCountry: 'ZAF',
    partnerCountry: 'GBR',
    year: 2023,
    month: 2,
    hsCode: '0805',
    productDescription: 'Citrus fruit, fresh or dried',
    tradeFlow: 'export',
    valueUsd: 6200000,
    quantity: 3100000,
    quantityUnit: 'Kilograms',
    source: 'South African Revenue Service'
  }
];

// Seed the databases
async function seedDatabases() {
  try {
    console.log('Initializing database schemas...');
    
    // Wait for database initialization to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Seeding regulatory database...');
    
    // Add regulatory requirements
    for (const requirement of regulatoryRequirements) {
      await regulatoryDb.addRequirement(requirement);
      console.log(`Added requirement: ${requirement.country} - ${requirement.requirementType}`);
    }
    
    console.log('Seeding trade database...');
    
    // Add trade data
    for (const data of tradeData) {
      await tradeDb.addTradeData(data);
      console.log(`Added trade data: ${data.reporterCountry} - ${data.partnerCountry} - ${data.hsCode}`);
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding databases:', error);
  } finally {
    // Close database connections
    await regulatoryDb.close();
    await tradeDb.close();
  }
}

// Run the seed function
seedDatabases(); 