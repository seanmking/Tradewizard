/**
 * Validation Utilities
 * 
 * This module provides utilities for validating data structures
 * to ensure they conform to expected schemas.
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  path: string;
  message: string;
  value?: any;
}

/**
 * Validator interface
 */
export interface Validator<T> {
  validate: (data: any) => ValidationResult;
  isValid: (data: any) => boolean;
}

/**
 * Field validator type
 */
type FieldValidator = (value: any, path: string) => ValidationError | null;

/**
 * Creates a validator for a specific type
 */
export function createValidator<T>(
  schema: Record<string, FieldValidator>,
  options: {
    name: string;
    allowExtraFields?: boolean;
    requiredFields?: string[];
  }
): Validator<T> {
  return {
    validate: (data: any): ValidationResult => {
      return validate(data, schema, options);
    },
    isValid: (data: any): boolean => {
      return validate(data, schema, options).valid;
    }
  };
}

/**
 * Validates data against a schema
 */
export function validate(
  data: any,
  schema: Record<string, FieldValidator>,
  options: {
    name: string;
    allowExtraFields?: boolean;
    requiredFields?: string[];
  }
): ValidationResult {
  // Check if data is an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      errors: [
        {
          path: '',
          message: `Expected ${options.name} to be an object, got ${data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data}`,
          value: data
        }
      ]
    };
  }

  const errors: ValidationError[] = [];

  // Check required fields
  if (options.requiredFields) {
    for (const field of options.requiredFields) {
      if (!(field in data)) {
        errors.push({
          path: field,
          message: `Required field '${field}' is missing`
        });
      }
    }
  }

  // Validate fields
  for (const [field, validator] of Object.entries(schema)) {
    if (field in data) {
      const error = validator(data[field], field);
      if (error) {
        errors.push(error);
      }
    }
  }

  // Check for extra fields
  if (options.allowExtraFields === false) {
    const schemaFields = Object.keys(schema);
    const dataFields = Object.keys(data);
    
    for (const field of dataFields) {
      if (!schemaFields.includes(field)) {
        errors.push({
          path: field,
          message: `Unexpected field '${field}'`,
          value: data[field]
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Common field validators
 */

/**
 * Validates that a value is a string
 */
export function isString(options: {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  allowEmpty?: boolean;
} = {}): FieldValidator {
  return (value, path) => {
    if (typeof value !== 'string') {
      return {
        path,
        message: `Expected '${path}' to be a string`,
        value
      };
    }
    
    if (!options.allowEmpty && value === '') {
      return {
        path,
        message: `'${path}' cannot be empty`,
        value
      };
    }
    
    if (options.minLength !== undefined && value.length < options.minLength) {
      return {
        path,
        message: `'${path}' must be at least ${options.minLength} characters`,
        value
      };
    }
    
    if (options.maxLength !== undefined && value.length > options.maxLength) {
      return {
        path,
        message: `'${path}' must be at most ${options.maxLength} characters`,
        value
      };
    }
    
    if (options.pattern && !options.pattern.test(value)) {
      return {
        path,
        message: `'${path}' must match pattern ${options.pattern}`,
        value
      };
    }
    
    return null;
  };
}

/**
 * Validates that a value is a number
 */
export function isNumber(options: {
  min?: number;
  max?: number;
  integer?: boolean;
} = {}): FieldValidator {
  return (value, path) => {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        path,
        message: `Expected '${path}' to be a number`,
        value
      };
    }
    
    if (options.integer && !Number.isInteger(value)) {
      return {
        path,
        message: `'${path}' must be an integer`,
        value
      };
    }
    
    if (options.min !== undefined && value < options.min) {
      return {
        path,
        message: `'${path}' must be at least ${options.min}`,
        value
      };
    }
    
    if (options.max !== undefined && value > options.max) {
      return {
        path,
        message: `'${path}' must be at most ${options.max}`,
        value
      };
    }
    
    return null;
  };
}

/**
 * Validates that a value is a boolean
 */
export function isBoolean(): FieldValidator {
  return (value, path) => {
    if (typeof value !== 'boolean') {
      return {
        path,
        message: `Expected '${path}' to be a boolean`,
        value
      };
    }
    
    return null;
  };
}

/**
 * Validates that a value is an array
 */
export function isArray(options: {
  minLength?: number;
  maxLength?: number;
  itemValidator?: FieldValidator;
} = {}): FieldValidator {
  return (value, path) => {
    if (!Array.isArray(value)) {
      return {
        path,
        message: `Expected '${path}' to be an array`,
        value
      };
    }
    
    if (options.minLength !== undefined && value.length < options.minLength) {
      return {
        path,
        message: `'${path}' must have at least ${options.minLength} items`,
        value
      };
    }
    
    if (options.maxLength !== undefined && value.length > options.maxLength) {
      return {
        path,
        message: `'${path}' must have at most ${options.maxLength} items`,
        value
      };
    }
    
    if (options.itemValidator) {
      for (let i = 0; i < value.length; i++) {
        const error = options.itemValidator(value[i], `${path}[${i}]`);
        if (error) {
          return error;
        }
      }
    }
    
    return null;
  };
}

/**
 * Validates that a value is an object
 */
export function isObject(options: {
  schema?: Record<string, FieldValidator>;
  allowExtraFields?: boolean;
  requiredFields?: string[];
} = {}): FieldValidator {
  return (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {
        path,
        message: `Expected '${path}' to be an object`,
        value
      };
    }
    
    if (options.schema) {
      // Check required fields
      if (options.requiredFields) {
        for (const field of options.requiredFields) {
          if (value[field] === undefined) {
            return {
              path: `${path}.${field}`,
              message: `Required field '${field}' is missing`,
              value
            };
          }
        }
      }
      
      // Check extra fields
      if (!options.allowExtraFields) {
        for (const field in value) {
          if (!options.schema[field]) {
            return {
              path: `${path}.${field}`,
              message: `Unexpected field '${field}'`,
              value: value[field]
            };
          }
        }
      }
      
      // Validate each field
      for (const field in options.schema) {
        if (value[field] !== undefined) {
          const error = options.schema[field](value[field], `${path}.${field}`);
          if (error) {
            return error;
          }
        }
      }
    }
    
    return null;
  };
}

/**
 * Validates that a value is one of a set of values
 */
export function isOneOf(values: any[]): FieldValidator {
  return (value, path) => {
    if (!values.includes(value)) {
      return {
        path,
        message: `'${path}' must be one of: ${values.join(', ')}`,
        value
      };
    }
    
    return null;
  };
}

/**
 * Validates that a value matches a regular expression
 */
export function matchesPattern(pattern: RegExp): FieldValidator {
  return (value, path) => {
    if (typeof value !== 'string' || !pattern.test(value)) {
      return {
        path,
        message: `'${path}' must match pattern ${pattern}`,
        value
      };
    }
    
    return null;
  };
}

/**
 * Type-specific validation functions
 */

/**
 * Validates market data
 */
export function validateMarketData(data: unknown): ValidationResult {
  const schema = {
    id: isString(),
    name: isString({ minLength: 1 }),
    description: isString(),
    marketSize: isNumber({ min: 0 }),
    growthRate: isNumber(),
    strengths: isArray({ itemValidator: isString() }),
    weaknesses: isArray({ itemValidator: isString() }),
    opportunities: isArray({ itemValidator: isString() }),
    threats: isArray({ itemValidator: isString() })
  };

  return validate(data, schema, {
    name: 'MarketData',
    requiredFields: ['id', 'name', 'description', 'marketSize', 'growthRate'],
    allowExtraFields: true
  });
}

/**
 * Validates regulatory requirement data
 */
export function validateRegulatoryRequirement(data: unknown): ValidationResult {
  const schema = {
    id: isString(),
    country: isString({ minLength: 1 }),
    productCategory: isString({ minLength: 1 }),
    hsCode: isString(),
    requirementType: isString(),
    description: isString({ minLength: 1 }),
    agency: isString(),
    documentationRequired: isArray({ itemValidator: isString() }),
    estimatedTimeline: isString(),
    estimatedCost: isString(),
    confidenceLevel: isNumber({ min: 0, max: 1 }),
    frequency: isOneOf(['once-off', 'ongoing', 'periodic']),
    validationStatus: isOneOf(['verified', 'unverified', 'outdated']),
    lastVerifiedDate: isString(),
    verificationSource: isString()
  };

  return validate(data, schema, {
    name: 'RegulatoryRequirement',
    requiredFields: ['country', 'productCategory', 'requirementType', 'description', 'agency'],
    allowExtraFields: true
  });
}

/**
 * Validates enhanced regulatory requirement data
 */
export function validateEnhancedRegulatoryRequirement(data: unknown): ValidationResult {
  const basicValidation = validateRegulatoryRequirement(data);
  
  if (!basicValidation.valid) {
    return basicValidation;
  }
  
  const schema = {
    updateFrequency: isObject({
      schema: {
        recommendedSchedule: isString(),
        sourcesToMonitor: isArray({ itemValidator: isString() }),
        countrySpecificNotes: isString()
      },
      requiredFields: ['recommendedSchedule']
    }),
    agency: isObject({
      schema: {
        name: isString({ minLength: 1 }),
        country: isString({ minLength: 1 }),
        contactEmail: isString(),
        contactPhone: isString(),
        website: isString()
      },
      requiredFields: ['name', 'country', 'website']
    })
  };

  const enhancedValidation = validate(data, schema, {
    name: 'EnhancedRegulatoryRequirement',
    allowExtraFields: true
  });

  if (!enhancedValidation.valid) {
    return enhancedValidation;
  }

  return {
    valid: true,
    errors: []
  };
}

/**
 * Validates compliance assessment data
 */
export function validateComplianceAssessment(data: unknown): ValidationResult {
  const schema = {
    overallScore: isNumber({ min: 0, max: 1 }),
    weightedScore: isNumber({ min: 0, max: 1 }),
    satisfiedRequirements: isArray({
      itemValidator: (value, path) => {
        const result = validateRegulatoryRequirement(value);
        if (!result.valid) {
          return {
            path,
            message: `Invalid regulatory requirement: ${result.errors.map(e => e.message).join(', ')}`,
            value
          };
        }
        return null;
      }
    }),
    missingRequirements: isArray({
      itemValidator: (value, path) => {
        const result = validateRegulatoryRequirement(value);
        if (!result.valid) {
          return {
            path,
            message: `Invalid regulatory requirement: ${result.errors.map(e => e.message).join(', ')}`,
            value
          };
        }
        return null;
      }
    }),
    partiallyCompliantRequirements: isArray({
      itemValidator: (value, path) => {
        const result = validateRegulatoryRequirement(value);
        if (!result.valid) {
          return {
            path,
            message: `Invalid regulatory requirement: ${result.errors.map(e => e.message).join(', ')}`,
            value
          };
        }
        return null;
      }
    })
  };

  return validate(data, schema, {
    name: 'ComplianceAssessment',
    requiredFields: ['overallScore', 'weightedScore', 'satisfiedRequirements', 'missingRequirements'],
    allowExtraFields: true
  });
}

/**
 * Safe data transformation utilities
 */

/**
 * Safely transforms data to the expected format with fallbacks for missing or malformed data
 */
export function safeTransform<T>(
  data: unknown, 
  transformer: (data: any) => T, 
  fallback: T
): T {
  if (!data) {
    return fallback;
  }
  
  try {
    return transformer(data);
  } catch (error) {
    console.error('Error transforming data:', error);
    return fallback;
  }
}

/**
 * Safely parses a string to JSON with fallback
 */
export function safeParseJson<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

/**
 * Safely accesses a nested property with fallback
 */
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  try {
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return fallback;
      }
      current = current[part];
    }
    
    return current === undefined ? fallback : current;
  } catch (error) {
    console.error('Error accessing property:', error);
    return fallback;
  }
} 