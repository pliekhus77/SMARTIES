import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: string[];
  custom?: (value: any) => boolean | string;
}

export class RequestValidator {
  static validate(rules: ValidationRule[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const errors: string[] = [];
      const data = { ...req.body, ...req.params, ...req.query };

      for (const rule of rules) {
        const value = data[rule.field];
        const fieldErrors = this.validateField(rule, value);
        errors.push(...fieldErrors);
      }

      if (errors.length > 0) {
        throw new ValidationError(errors);
      }

      next();
    };
  }

  private static validateField(rule: ValidationRule, value: any): string[] {
    const errors: string[] = [];
    const { field, required, type, minLength, maxLength, min, max, pattern, enum: enumValues, custom } = rule;

    // Required validation
    if (required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      return errors;
    }

    // Skip further validation if field is not provided and not required
    if (value === undefined || value === null) {
      return errors;
    }

    // Type validation
    if (type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== type) {
        errors.push(`${field} must be of type ${type}`);
        return errors;
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (minLength !== undefined && value.length < minLength) {
        errors.push(`${field} must be at least ${minLength} characters long`);
      }
      if (maxLength !== undefined && value.length > maxLength) {
        errors.push(`${field} must be at most ${maxLength} characters long`);
      }
      if (pattern && !pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (min !== undefined && value < min) {
        errors.push(`${field} must be at least ${min}`);
      }
      if (max !== undefined && value > max) {
        errors.push(`${field} must be at most ${max}`);
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (minLength !== undefined && value.length < minLength) {
        errors.push(`${field} must have at least ${minLength} items`);
      }
      if (maxLength !== undefined && value.length > maxLength) {
        errors.push(`${field} must have at most ${maxLength} items`);
      }
    }

    // Enum validation
    if (enumValues && !enumValues.includes(value)) {
      errors.push(`${field} must be one of: ${enumValues.join(', ')}`);
    }

    // Custom validation
    if (custom) {
      const result = custom(value);
      if (typeof result === 'string') {
        errors.push(result);
      } else if (result === false) {
        errors.push(`${field} is invalid`);
      }
    }

    return errors;
  }

  // Common validation rules
  static upcValidation(): ValidationRule {
    return {
      field: 'upc',
      required: true,
      type: 'string',
      pattern: /^\d{11,14}$/,
      custom: (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        return cleaned.length >= 11 && cleaned.length <= 14 || 'UPC must be 11-14 digits';
      }
    };
  }

  static searchQueryValidation(): ValidationRule[] {
    return [
      {
        field: 'query',
        type: 'string',
        minLength: 1,
        maxLength: 200
      },
      {
        field: 'maxResults',
        type: 'number',
        min: 1,
        max: 100
      },
      {
        field: 'similarityThreshold',
        type: 'number',
        min: 0,
        max: 1
      }
    ];
  }

  static allergenListValidation(): ValidationRule {
    return {
      field: 'userAllergens',
      type: 'array',
      maxLength: 20,
      custom: (value: string[]) => {
        const validAllergens = [
          'milk', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 'wheat', 'soy',
          'sesame', 'mustard', 'celery', 'lupin', 'molluscs', 'sulphites'
        ];
        const invalid = value.filter(allergen => !validAllergens.includes(allergen.toLowerCase()));
        return invalid.length === 0 || `Invalid allergens: ${invalid.join(', ')}`;
      }
    };
  }

  static dietaryRestrictionsValidation(): ValidationRule {
    return {
      field: 'dietaryRestrictions',
      type: 'array',
      maxLength: 10,
      custom: (value: Array<{ type: string; required: boolean }>) => {
        const validTypes = ['vegan', 'vegetarian', 'kosher', 'halal', 'gluten_free', 'organic'];
        for (const restriction of value) {
          if (!restriction.type || !validTypes.includes(restriction.type)) {
            return `Invalid dietary restriction type: ${restriction.type}`;
          }
          if (typeof restriction.required !== 'boolean') {
            return 'Dietary restriction "required" field must be boolean';
          }
        }
        return true;
      }
    };
  }
}

// Sanitization functions
export class RequestSanitizer {
  static sanitizeString(value: string): string {
    return value.trim().replace(/[<>]/g, '');
  }

  static sanitizeArray(value: string[]): string[] {
    return value.map(item => this.sanitizeString(item)).filter(item => item.length > 0);
  }

  static sanitizeUPC(value: string): string {
    return value.replace(/\D/g, '');
  }

  static sanitizeNumber(value: any, defaultValue: number = 0): number {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }
}
