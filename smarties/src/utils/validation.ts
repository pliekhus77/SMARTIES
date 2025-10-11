/**
 * Input validation utilities
 * Provides validation functions for user inputs and data
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate UPC barcode format
 */
export function validateUPC(upc: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [] };
  
  if (!upc || typeof upc !== 'string') {
    result.valid = false;
    result.errors.push('UPC must be a non-empty string');
    return result;
  }
  
  // Remove any spaces or dashes
  const cleanUPC = upc.replace(/[\s-]/g, '');
  
  // Check length (UPC-A: 12 digits, UPC-E: 8 digits)
  if (cleanUPC.length !== 12 && cleanUPC.length !== 8) {
    result.valid = false;
    result.errors.push('UPC must be 8 or 12 digits long');
  }
  
  // Check if all characters are digits
  if (!/^\d+$/.test(cleanUPC)) {
    result.valid = false;
    result.errors.push('UPC must contain only digits');
  }
  
  return result;
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [] };
  
  if (!email || typeof email !== 'string') {
    result.valid = false;
    result.errors.push('Email must be a non-empty string');
    return result;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    result.valid = false;
    result.errors.push('Invalid email format');
  }
  
  return result;
}

/**
 * Validate dietary restriction input
 */
export function validateDietaryRestriction(restriction: string): ValidationResult {
  const result: ValidationResult = { valid: true, errors: [] };
  
  if (!restriction || typeof restriction !== 'string') {
    result.valid = false;
    result.errors.push('Dietary restriction must be a non-empty string');
    return result;
  }
  
  if (restriction.trim().length < 2) {
    result.valid = false;
    result.errors.push('Dietary restriction must be at least 2 characters long');
  }
  
  return result;
}