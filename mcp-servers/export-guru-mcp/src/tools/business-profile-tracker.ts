/**
 * Business Profile Tracker
 * 
 * This module provides functionality for tracking business profiles,
 * detecting changes, and maintaining history.
 */

import { Connectors } from '../connectors';
import { LLM, Tool } from '../types';
import { BusinessAnalysis, ProductInfo } from '../types/business';
import { ApiError } from '../utils/error-handling';

/**
 * Business profile interface
 */
export interface BusinessProfile {
  id: string;
  name: string;
  website?: string;
  description?: string;
  products: ProductInfo[];
  targetMarkets: string[];
  certifications: string[];
  size?: string;
  exportExperience?: string;
  createdAt: string;
  updatedAt: string;
  history: BusinessProfileChange[];
}

/**
 * Business profile change interface
 */
export interface BusinessProfileChange {
  timestamp: string;
  field: string;
  oldValue: any;
  newValue: any;
  source: 'user' | 'webscraper' | 'system';
}

/**
 * Store a business profile
 */
export async function storeBusinessProfile(
  profile: Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt' | 'history'>,
  connectors: Connectors
): Promise<BusinessProfile> {
  try {
    // Check if profile already exists
    const existingProfiles = await connectors.internalDb.query(
      'SELECT * FROM business_profiles WHERE name = ? OR website = ?',
      [profile.name, profile.website || '']
    );
    
    if (existingProfiles.length > 0) {
      // Update existing profile
      const existingProfile = existingProfiles[0];
      const changes = detectChanges(existingProfile, profile);
      
      if (changes.length > 0) {
        // Update profile with changes
        const updatedProfile = {
          ...existingProfile,
          ...profile,
          updatedAt: new Date().toISOString(),
          history: [...existingProfile.history, ...changes]
        };
        
        await connectors.internalDb.query(
          'UPDATE business_profiles SET profile = ? WHERE id = ?',
          [JSON.stringify(updatedProfile), existingProfile.id]
        );
        
        return updatedProfile;
      }
      
      return existingProfile;
    } else {
      // Create new profile
      const newProfile: BusinessProfile = {
        id: `profile-${Math.random().toString(36).substring(2, 10)}`,
        ...profile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: []
      };
      
      await connectors.internalDb.query(
        'INSERT INTO business_profiles (id, name, website, profile) VALUES (?, ?, ?, ?)',
        [newProfile.id, newProfile.name, newProfile.website || '', JSON.stringify(newProfile)]
      );
      
      return newProfile;
    }
  } catch (error: unknown) {
    console.error('Error storing business profile:', error);
    throw new ApiError('Failed to store business profile', 500);
  }
}

/**
 * Get a business profile by ID, name, or website
 */
export async function getBusinessProfile(
  identifier: { id?: string; name?: string; website?: string },
  connectors: Connectors
): Promise<BusinessProfile | null> {
  try {
    let query = 'SELECT * FROM business_profiles WHERE ';
    const params: any[] = [];
    
    if (identifier.id) {
      query += 'id = ?';
      params.push(identifier.id);
    } else if (identifier.name) {
      query += 'name = ?';
      params.push(identifier.name);
    } else if (identifier.website) {
      query += 'website = ?';
      params.push(identifier.website);
    } else {
      throw new ApiError('No identifier provided', 400);
    }
    
    const profiles = await connectors.internalDb.query(query, params);
    
    if (profiles.length === 0) {
      return null;
    }
    
    return profiles[0].profile;
  } catch (error: unknown) {
    console.error('Error getting business profile:', error);
    throw new ApiError('Failed to get business profile', 500);
  }
}

/**
 * Update a business profile
 */
export async function updateBusinessProfile(
  id: string,
  updates: Partial<Omit<BusinessProfile, 'id' | 'createdAt' | 'updatedAt' | 'history'>>,
  source: 'user' | 'webscraper' | 'system',
  connectors: Connectors
): Promise<BusinessProfile> {
  try {
    // Get existing profile
    const existingProfile = await getBusinessProfile({ id }, connectors);
    
    if (!existingProfile) {
      throw new ApiError('Business profile not found', 404);
    }
    
    // Detect changes
    const changes = detectChanges(existingProfile, updates, source);
    
    if (changes.length === 0) {
      return existingProfile;
    }
    
    // Update profile with changes
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
      history: [...existingProfile.history, ...changes]
    };
    
    await connectors.internalDb.query(
      'UPDATE business_profiles SET profile = ? WHERE id = ?',
      [JSON.stringify(updatedProfile), id]
    );
    
    return updatedProfile;
  } catch (error: unknown) {
    console.error('Error updating business profile:', error);
    throw new ApiError('Failed to update business profile', 500);
  }
}

/**
 * Detect changes between two business profiles
 */
function detectChanges(
  oldProfile: BusinessProfile | Partial<BusinessProfile>,
  newProfile: Partial<BusinessProfile>,
  source: 'user' | 'webscraper' | 'system' = 'system'
): BusinessProfileChange[] {
  const changes: BusinessProfileChange[] = [];
  const timestamp = new Date().toISOString();
  
  // Check simple fields
  const simpleFields: Array<keyof BusinessProfile> = ['name', 'website', 'description', 'size', 'exportExperience'];
  
  for (const field of simpleFields) {
    if (field in newProfile && newProfile[field] !== oldProfile[field]) {
      changes.push({
        timestamp,
        field,
        oldValue: oldProfile[field],
        newValue: newProfile[field],
        source
      });
    }
  }
  
  // Check products
  if (newProfile.products && oldProfile.products) {
    const oldProductMap = new Map(oldProfile.products.map(p => [p.name, p]));
    const newProductMap = new Map(newProfile.products.map(p => [p.name, p]));
    
    // Added products
    for (const [name, product] of newProductMap.entries()) {
      if (!oldProductMap.has(name)) {
        changes.push({
          timestamp,
          field: 'products',
          oldValue: null,
          newValue: product,
          source
        });
      }
    }
    
    // Removed products
    for (const [name, product] of oldProductMap.entries()) {
      if (!newProductMap.has(name)) {
        changes.push({
          timestamp,
          field: 'products',
          oldValue: product,
          newValue: null,
          source
        });
      }
    }
    
    // Changed products
    for (const [name, newProduct] of newProductMap.entries()) {
      const oldProduct = oldProductMap.get(name);
      if (oldProduct && JSON.stringify(oldProduct) !== JSON.stringify(newProduct)) {
        changes.push({
          timestamp,
          field: `products.${name}`,
          oldValue: oldProduct,
          newValue: newProduct,
          source
        });
      }
    }
  }
  
  // Check target markets
  if (newProfile.targetMarkets && oldProfile.targetMarkets) {
    const oldMarkets = new Set(oldProfile.targetMarkets);
    const newMarkets = new Set(newProfile.targetMarkets);
    
    // Added markets
    const addedMarkets = newProfile.targetMarkets.filter(m => !oldMarkets.has(m));
    if (addedMarkets.length > 0) {
      changes.push({
        timestamp,
        field: 'targetMarkets',
        oldValue: oldProfile.targetMarkets,
        newValue: newProfile.targetMarkets,
        source
      });
    }
    
    // Removed markets
    const removedMarkets = oldProfile.targetMarkets.filter(m => !newMarkets.has(m));
    if (removedMarkets.length > 0 && addedMarkets.length === 0) {
      changes.push({
        timestamp,
        field: 'targetMarkets',
        oldValue: oldProfile.targetMarkets,
        newValue: newProfile.targetMarkets,
        source
      });
    }
  }
  
  // Check certifications
  if (newProfile.certifications && oldProfile.certifications) {
    const oldCerts = new Set(oldProfile.certifications);
    const newCerts = new Set(newProfile.certifications);
    
    // Added certifications
    const addedCerts = newProfile.certifications.filter(c => !oldCerts.has(c));
    if (addedCerts.length > 0) {
      changes.push({
        timestamp,
        field: 'certifications',
        oldValue: oldProfile.certifications,
        newValue: newProfile.certifications,
        source
      });
    }
    
    // Removed certifications
    const removedCerts = oldProfile.certifications.filter(c => !newCerts.has(c));
    if (removedCerts.length > 0 && addedCerts.length === 0) {
      changes.push({
        timestamp,
        field: 'certifications',
        oldValue: oldProfile.certifications,
        newValue: newProfile.certifications,
        source
      });
    }
  }
  
  return changes;
}

/**
 * Get business profile history
 */
export async function getBusinessProfileHistory(
  id: string,
  connectors: Connectors
): Promise<BusinessProfileChange[]> {
  try {
    const profile = await getBusinessProfile({ id }, connectors);
    
    if (!profile) {
      throw new ApiError('Business profile not found', 404);
    }
    
    return profile.history;
  } catch (error: unknown) {
    console.error('Error getting business profile history:', error);
    throw new ApiError('Failed to get business profile history', 500);
  }
}

/**
 * Create a business profile from website analysis
 */
export async function createProfileFromWebsite(
  websiteUrl: string,
  businessAnalysis: BusinessAnalysis,
  connectors: Connectors,
  llm: LLM
): Promise<BusinessProfile> {
  try {
    // Check if profile already exists
    const existingProfile = await getBusinessProfile({ website: websiteUrl }, connectors);
    
    if (existingProfile) {
      // Update existing profile with new data
      return updateBusinessProfile(
        existingProfile.id,
        {
          name: businessAnalysis.businessName,
          website: businessAnalysis.website,
          products: businessAnalysis.products,
          targetMarkets: businessAnalysis.markets.current,
          certifications: businessAnalysis.certifications.items,
          size: businessAnalysis.businessDetails.estimatedSize,
          exportExperience: businessAnalysis.businessDetails.yearsOperating
        },
        'webscraper',
        connectors
      );
    }
    
    // Create new profile
    return storeBusinessProfile(
      {
        name: businessAnalysis.businessName,
        website: businessAnalysis.website,
        products: businessAnalysis.products,
        targetMarkets: businessAnalysis.markets.current,
        certifications: businessAnalysis.certifications.items,
        size: businessAnalysis.businessDetails.estimatedSize,
        exportExperience: businessAnalysis.businessDetails.yearsOperating,
        history: []
      },
      connectors
    );
  } catch (error: unknown) {
    console.error('Error creating profile from website:', error);
    throw new ApiError('Failed to create profile from website', 500);
  }
}

/**
 * Register business profile tracker tools
 */
export function registerBusinessProfileTrackerTools(connectors: Connectors, llm: LLM): Tool[] {
  return [
    {
      name: 'storeBusinessProfile',
      description: 'Store a business profile',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Business name' },
          website: { type: 'string', description: 'Business website' },
          description: { type: 'string', description: 'Business description' },
          products: { type: 'array', items: { type: 'object' }, description: 'Business products' },
          targetMarkets: { type: 'array', items: { type: 'string' }, description: 'Target markets' },
          certifications: { type: 'array', items: { type: 'string' }, description: 'Business certifications' },
          size: { type: 'string', description: 'Business size' },
          exportExperience: { type: 'string', description: 'Export experience' }
        },
        required: ['name']
      },
      handler: async (params: any) => storeBusinessProfile(params, connectors)
    },
    {
      name: 'getBusinessProfile',
      description: 'Get a business profile by ID, name, or website',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Business profile ID' },
          name: { type: 'string', description: 'Business name' },
          website: { type: 'string', description: 'Business website' }
        }
      },
      handler: async (params: any) => getBusinessProfile(params, connectors)
    },
    {
      name: 'updateBusinessProfile',
      description: 'Update a business profile',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Business profile ID' },
          updates: { type: 'object', description: 'Profile updates' },
          source: { type: 'string', enum: ['user', 'webscraper', 'system'], description: 'Source of the update' }
        },
        required: ['id', 'updates', 'source']
      },
      handler: async (params: any) => updateBusinessProfile(params.id, params.updates, params.source, connectors)
    },
    {
      name: 'getBusinessProfileHistory',
      description: 'Get business profile history',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Business profile ID' }
        },
        required: ['id']
      },
      handler: async (params: any) => getBusinessProfileHistory(params.id, connectors)
    },
    {
      name: 'createProfileFromWebsite',
      description: 'Create a business profile from website analysis',
      parameters: {
        type: 'object',
        properties: {
          websiteUrl: { type: 'string', description: 'Website URL' },
          businessAnalysis: { type: 'object', description: 'Business analysis' }
        },
        required: ['websiteUrl', 'businessAnalysis']
      },
      handler: async (params: any) => createProfileFromWebsite(
        params.websiteUrl,
        params.businessAnalysis,
        connectors,
        llm
      )
    }
  ];
} 