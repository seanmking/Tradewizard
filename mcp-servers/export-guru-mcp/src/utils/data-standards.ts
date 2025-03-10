/**
 * Data Standards
 * 
 * This module defines standard data structures and transformation utilities
 * to ensure consistency across the system.
 */

import { safeTransform } from './validation';

/**
 * Standard data structures namespace
 */
export namespace StandardDataStructures {
  /**
   * Standard certification structure
   */
  export interface Certification {
    name: string;
    issuer: string;
    validUntil?: string;
    verificationUrl?: string;
  }
  
  export type CertificationList = Certification[];
  
  /**
   * Standard agency structure
   */
  export interface Agency {
    name: string;
    country: string;
    contactEmail?: string;
    contactPhone?: string;
    website: string;
  }
  
  /**
   * Standard requirement type
   */
  export type RequirementType = 
    | 'Documentation'
    | 'Certification'
    | 'Testing'
    | 'Labeling'
    | 'Packaging'
    | 'Inspection'
    | 'Registration'
    | 'Permit'
    | 'Tariff'
    | 'Quota'
    | 'Prohibition'
    | 'Standard'
    | 'Other';
  
  /**
   * Standard frequency type
   */
  export type FrequencyType = 'once-off' | 'ongoing' | 'periodic';
  
  /**
   * Standard validation status
   */
  export type ValidationStatus = 'verified' | 'unverified' | 'outdated';
  
  /**
   * Standard update frequency structure
   */
  export interface UpdateFrequency {
    recommendedSchedule: string;
    sourcesToMonitor: string[];
    countrySpecificNotes?: string;
  }
  
  /**
   * Standard regulatory requirement structure
   */
  export interface RegulatoryRequirement {
    id?: string;
    country: string;
    productCategory: string;
    hsCode?: string;
    requirementType: RequirementType;
    description: string;
    agency: Agency | string;
    documentationRequired?: string[];
    estimatedTimeline?: string;
    estimatedCost?: string;
    confidenceLevel?: number;
    frequency?: FrequencyType;
    updateFrequency?: UpdateFrequency;
    validationStatus?: ValidationStatus;
    lastVerifiedDate?: string;
    verificationSource?: string;
  }
  
  /**
   * Standard compliance assessment structure
   */
  export interface ComplianceAssessment {
    overallScore: number;
    weightedScore: number;
    satisfiedRequirements: RegulatoryRequirement[];
    missingRequirements: RegulatoryRequirement[];
    partiallyCompliantRequirements?: RegulatoryRequirement[];
    timeline?: number;
    estimatedCost?: string;
  }
  
  /**
   * Standard market data structure
   */
  export interface MarketData {
    id: string;
    name: string;
    description: string;
    marketSize: number;
    growthRate: number;
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
    regulatoryComplexity?: number;
    tariffRate?: number;
    competitivePosition?: string;
  }
  
  /**
   * Standard business profile structure
   */
  export interface BusinessProfile {
    id?: string;
    name: string;
    description?: string;
    products: {
      name: string;
      description?: string;
      category: string;
      estimatedHsCode?: string;
    }[];
    certifications?: CertificationList;
    marketFocus?: string[];
    exportExperience?: string;
    size?: string;
    website?: string;
  }
  
  /**
   * Standard export readiness assessment structure
   */
  export interface ExportReadinessAssessment {
    overallScore: number;
    dimensionScores: Record<string, number>;
    regulatoryCompliance?: number;
    recommendations?: string[];
  }
  
  /**
   * Standard assessment integration structure
   */
  export interface AssessmentIntegration {
    exportReadiness: ExportReadinessAssessment;
    marketIntelligence: {
      marketAccessScore: number;
      regulatoryBarriers: number;
      competitivePosition: string;
    };
    regulatoryCompliance: {
      complianceScore: number;
      missingRequirements: number;
      timeline: number;
      estimatedCost: string;
    };
  }
  
  // Transformation utilities
  
  /**
   * Standardizes certification data
   */
  export function standardizeCertifications(input: unknown): CertificationList {
    return safeTransform(
      input,
      (data) => {
        // Handle string input (comma-separated)
        if (typeof data === 'string') {
          return data.split(',').map(name => ({ 
            name: name.trim(), 
            issuer: 'Unknown' 
          }));
        }
        
        // Handle array of strings
        if (Array.isArray(data) && data.every(item => typeof item === 'string')) {
          return data.map(name => ({ 
            name, 
            issuer: 'Unknown' 
          }));
        }
        
        // Handle object with items array
        if (typeof data === 'object' && data !== null && 'items' in data && Array.isArray((data as { items: unknown[] }).items)) {
          return (data as { items: unknown[] }).items.map(item => {
            if (typeof item === 'string') {
              return { name: item, issuer: 'Unknown' };
            }
            if (typeof item === 'object' && item !== null) {
              const certItem = item as Record<string, unknown>;
              return {
                name: (certItem.name as string) || 'Unknown',
                issuer: (certItem.issuer as string) || 'Unknown',
                validUntil: certItem.validUntil as string | undefined,
                verificationUrl: certItem.verificationUrl as string | undefined
              };
            }
            return { name: 'Unknown', issuer: 'Unknown' };
          });
        }
        
        // Handle array of objects
        if (Array.isArray(data)) {
          return data.map(item => {
            if (typeof item === 'string') {
              return { name: item, issuer: 'Unknown' };
            }
            if (typeof item === 'object' && item !== null) {
              const certItem = item as Record<string, unknown>;
              return {
                name: (certItem.name as string) || 'Unknown',
                issuer: (certItem.issuer as string) || 'Unknown',
                validUntil: certItem.validUntil as string | undefined,
                verificationUrl: certItem.verificationUrl as string | undefined
              };
            }
            return { name: 'Unknown', issuer: 'Unknown' };
          });
        }
        
        // Default fallback
        return [];
      },
      [] // Default fallback
    );
  }
  
  /**
   * Standardizes agency data
   */
  export function standardizeAgency(input: unknown): Agency {
    return safeTransform(
      input,
      (data) => {
        // Handle string input
        if (typeof data === 'string') {
          return { 
            name: data, 
            country: 'Unknown',
            website: '#'
          };
        }
        
        // Handle object
        if (typeof data === 'object' && data !== null) {
          const agencyData = data as Record<string, unknown>;
          return {
            name: (agencyData.name as string) || 'Unknown',
            country: (agencyData.country as string) || 'Unknown',
            contactEmail: agencyData.contactEmail as string | undefined,
            contactPhone: agencyData.contactPhone as string | undefined,
            website: (agencyData.website as string) || '#'
          };
        }
        
        // Default fallback
        return { 
          name: 'Unknown', 
          country: 'Unknown',
          website: '#'
        };
      },
      { name: 'Unknown', country: 'Unknown', website: '#' } // Default fallback
    );
  }
  
  /**
   * Standardizes regulatory requirement data
   */
  export function standardizeRegulatoryRequirement(input: unknown): RegulatoryRequirement {
    return safeTransform(
      input,
      (data) => {
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid regulatory requirement data');
        }
        
        const reqData = data as Record<string, unknown>;
        
        // Standardize agency
        const agency = typeof reqData.agency === 'string' 
          ? reqData.agency 
          : standardizeAgency(reqData.agency);
        
        // Standardize documentation required
        const documentationRequired = Array.isArray(reqData.documentationRequired)
          ? reqData.documentationRequired
          : typeof reqData.documentationRequired === 'string'
            ? (reqData.documentationRequired as string).split(',').map((doc: string) => doc.trim())
            : [];
        
        // Standardize requirement type
        const requirementType = typeof reqData.requirementType === 'string'
          ? reqData.requirementType as RequirementType
          : 'Other';
        
        // Standardize frequency
        const frequency = typeof reqData.frequency === 'string'
          ? reqData.frequency as FrequencyType
          : 'once-off';
        
        // Standardize validation status
        const validationStatus = typeof reqData.validationStatus === 'string'
          ? reqData.validationStatus as ValidationStatus
          : 'unverified';
        
        return {
          id: reqData.id as string | undefined,
          country: (reqData.country as string) || 'Unknown',
          productCategory: (reqData.productCategory as string) || 'Unknown',
          hsCode: reqData.hsCode as string | undefined,
          requirementType,
          description: (reqData.description as string) || 'Unknown',
          agency,
          documentationRequired,
          estimatedTimeline: reqData.estimatedTimeline as string | undefined,
          estimatedCost: reqData.estimatedCost as string | undefined,
          confidenceLevel: typeof reqData.confidenceLevel === 'number' ? reqData.confidenceLevel : 0.5,
          frequency,
          updateFrequency: reqData.updateFrequency as UpdateFrequency | undefined,
          validationStatus,
          lastVerifiedDate: reqData.lastVerifiedDate as string | undefined,
          verificationSource: reqData.verificationSource as string | undefined
        };
      },
      {
        id: undefined,
        country: 'Unknown',
        productCategory: 'Unknown',
        hsCode: undefined,
        requirementType: 'Other' as RequirementType,
        description: 'Unknown',
        agency: { name: 'Unknown', country: 'Unknown', website: '#' },
        documentationRequired: [],
        estimatedTimeline: undefined,
        estimatedCost: undefined,
        confidenceLevel: 0.5,
        frequency: 'once-off' as FrequencyType,
        updateFrequency: undefined,
        validationStatus: 'unverified' as ValidationStatus,
        lastVerifiedDate: undefined,
        verificationSource: undefined
      } // Default fallback
    );
  }
} 