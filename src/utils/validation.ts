import { z } from 'zod';

// Input sanitization utilities
export class InputSanitizer {
  // Remove potentially dangerous characters
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/[<>'"&]/g, (match) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[match] || match;
      })
      .trim();
  }

  // Sanitize email input
  static sanitizeEmail(email: string): string {
    return this.sanitizeString(email).toLowerCase();
  }

  // Sanitize barcode input (UPC codes)
  static sanitizeBarcode(barcode: string): string {
    return this.sanitizeString(barcode).replace(/[^0-9]/g, '');
  }

  // Sanitize product name
  static sanitizeProductName(name: string): string {
    return this.sanitizeString(name).substring(0, 200); // Limit length
  }
}

// Validation schemas
export const ValidationSchemas = {
  email: z.string().email('Invalid email format').max(255),
  
  barcode: z.string()
    .transform((val) => InputSanitizer.sanitizeBarcode(val))
    .refine(val => /^\d{8,14}$/.test(val), 'Barcode must be 8-14 digits'),
  
  productName: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name too long')
    .transform(InputSanitizer.sanitizeProductName),
  
  userId: z.string()
    .uuid('Invalid user ID format'),
  
  allergenList: z.array(z.string().max(50)).max(20, 'Too many allergens'),
  
  searchQuery: z.string()
    .min(1, 'Search query is required')
    .max(100, 'Search query too long')
    .transform(InputSanitizer.sanitizeString)
};

// Validation helper functions
export class Validator {
  static validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors.map(err => err.message).join(', ');
        throw new Error(`Validation failed: ${messages}`);
      }
      throw error;
    }
  }

  static isValidEmail(email: string): boolean {
    try {
      ValidationSchemas.email.parse(email);
      return true;
    } catch {
      return false;
    }
  }

  static isValidBarcode(barcode: string): boolean {
    try {
      ValidationSchemas.barcode.parse(barcode);
      return true;
    } catch {
      return false;
    }
  }
}
