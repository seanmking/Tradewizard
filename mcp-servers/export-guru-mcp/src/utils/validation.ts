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
      const errors: ValidationError[] = [];
      
      // Check if data is an object
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return {
          valid: false,
          errors: [{
            path: '',
            message: `Expected ${options.name} to be an object`
          }]
        };
      }
      
      // Check required fields
      if (options.requiredFields) {
        for (const field of options.requiredFields) {
          if (data[field] === undefined) {
            errors.push({
              path: field,
              message: `Required field '${field}' is missing`
            });
          }
        }
      }
      
      // Check extra fields
      if (!options.allowExtraFields) {
        for (const field in data) {
          if (!schema[field]) {
            errors.push({
              path: field,
              message: `Unexpected field '${field}'`,
              value: data[field]
            });
          }
        }
      }
      
      // Validate each field
      for (const field in schema) {
        if (data[field] !== undefined) {
          const error = schema[field](data[field], field);
          if (error) {
            errors.push(error);
          }
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
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
  return createValidator(schema, options).validate(data);
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