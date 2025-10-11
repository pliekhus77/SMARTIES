/**
 * ScanResult model interface and validation for SMARTIES application
 * Implements Requirements 1.3 and 1.5 from core architecture specification
 */

/**
 * Compliance status types for dietary analysis results
 */
export type ComplianceStatus = 'safe' | 'caution' | 'violation';

/**
 * AI analysis results for dietary compliance checking
 */
export interface AIAnalysis {
  recommendation: string;        // AI-generated recommendation text
  alternatives: string[];        // Suggested alternative products
  confidence: number;            // AI confidence score (0-1)
}

/**
 * Location data for scan tracking
 */
export interface LocationData {
  latitude: number;              // GPS latitude coordinate
  longitude: number;             // GPS longitude coordinate
}

/**
 * Core ScanResult interface for SMARTIES application
 * Links users to products with timestamp, compliance status, and violation tracking
 * Supports efficient queries for user scan history and analytics
 */
export interface ScanResult {
  _id?: string;                     // MongoDB ObjectId as string
  userId: string;                   // Reference to User._id (required)
  productId: string;                // Reference to Product._id (required)
  upc: string;                      // Scanned barcode for direct lookup (required)
  scanTimestamp: Date;              // When the scan occurred (required)
  complianceStatus: ComplianceStatus; // Dietary compliance result (required)
  violations: string[];             // List of detected violations (required)
  aiAnalysis?: AIAnalysis;          // Optional AI analysis and recommendations
  location?: LocationData;          // Optional GPS location data
}

/**
 * ScanResult creation input (excludes auto-generated fields)
 */
export interface CreateScanResultInput {
  userId: string;
  productId: string;
  upc: string;
  complianceStatus: ComplianceStatus;
  violations: string[];
  aiAnalysis?: AIAnalysis;
  location?: LocationData;
}

/**
 * ScanResult update input (limited fields that can be updated)
 */
export interface UpdateScanResultInput {
  complianceStatus?: ComplianceStatus;
  violations?: string[];
  aiAnalysis?: AIAnalysis;
  location?: LocationData;
}

/**
 * Validation result interface
 */
export interface ScanResultValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valid compliance status values
 */
export const COMPLIANCE_STATUSES: ComplianceStatus[] = ['safe', 'caution', 'violation'];

/**
 * Validates MongoDB ObjectId format (24 character hex string)
 * @param id - ID to validate
 * @param fieldName - Field name for error messages
 * @returns ValidationResult with validation status and errors
 */
function validateObjectId(id: string, fieldName: string): ScanResultValidationResult {
  const errors: string[] = [];

  if (!id || typeof id !== 'string') {
    errors.push(`${fieldName} is required and must be a string`);
  } else {
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
      errors.push(`${fieldName} cannot be empty`);
    } else if (!/^[a-fA-F0-9]{24}$/.test(trimmedId)) {
      errors.push(`${fieldName} must be a valid 24-character hexadecimal ObjectId`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates UPC code format for scan results
 * @param upc - UPC code to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateScanUPC(upc: string): ScanResultValidationResult {
  const errors: string[] = [];

  if (!upc || typeof upc !== 'string') {
    errors.push('UPC is required and must be a string');
  } else {
    // Remove any spaces or dashes
    const cleanUPC = upc.replace(/[\s-]/g, '');
    
    // Check if UPC is numeric and has valid length (UPC-A: 12 digits, UPC-E: 8 digits, EAN: 13 digits)
    if (!/^\d+$/.test(cleanUPC)) {
      errors.push('UPC must contain only numeric characters');
    } else if (![8, 12, 13].includes(cleanUPC.length)) {
      errors.push('UPC must be 8, 12, or 13 digits long');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates compliance status
 * @param status - Compliance status to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateComplianceStatus(status: ComplianceStatus): ScanResultValidationResult {
  const errors: string[] = [];

  if (!status || typeof status !== 'string') {
    errors.push('Compliance status is required and must be a string');
  } else if (!COMPLIANCE_STATUSES.includes(status)) {
    errors.push(`Compliance status must be one of: ${COMPLIANCE_STATUSES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates violations array
 * @param violations - Array of violations to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateViolations(violations: string[]): ScanResultValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(violations)) {
    errors.push('Violations must be an array');
  } else {
    violations.forEach((violation, index) => {
      if (typeof violation !== 'string') {
        errors.push(`Violation at index ${index} must be a non-empty string`);
      } else if (violation.trim().length === 0) {
        errors.push(`Violation at index ${index} cannot be empty`);
      } else if (violation.length > 100) {
        errors.push(`Violation at index ${index} cannot exceed 100 characters`);
      }
    });

    // Check for duplicates
    const uniqueViolations = new Set(violations.map(v => v.trim().toLowerCase()));
    if (uniqueViolations.size !== violations.length) {
      errors.push('Violations array contains duplicate entries');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates AI analysis object
 * @param aiAnalysis - AI analysis to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateAIAnalysis(aiAnalysis?: AIAnalysis): ScanResultValidationResult {
  const errors: string[] = [];

  if (aiAnalysis !== undefined) {
    if (!aiAnalysis || typeof aiAnalysis !== 'object') {
      errors.push('AI analysis must be an object');
    } else {
      // Validate recommendation
      if (typeof aiAnalysis.recommendation !== 'string') {
        errors.push('AI analysis recommendation is required and must be a string');
      } else if (aiAnalysis.recommendation.trim().length === 0) {
        errors.push('AI analysis recommendation cannot be empty');
      } else if (aiAnalysis.recommendation.length > 1000) {
        errors.push('AI analysis recommendation cannot exceed 1000 characters');
      }

      // Validate alternatives
      if (!Array.isArray(aiAnalysis.alternatives)) {
        errors.push('AI analysis alternatives must be an array');
      } else {
        aiAnalysis.alternatives.forEach((alternative, index) => {
          if (typeof alternative !== 'string') {
            errors.push(`AI analysis alternative at index ${index} must be a non-empty string`);
          } else if (alternative.trim().length === 0) {
            errors.push(`AI analysis alternative at index ${index} cannot be empty`);
          } else if (alternative.length > 200) {
            errors.push(`AI analysis alternative at index ${index} cannot exceed 200 characters`);
          }
        });
      }

      // Validate confidence
      if (aiAnalysis.confidence === undefined || aiAnalysis.confidence === null) {
        errors.push('AI analysis confidence is required');
      } else if (typeof aiAnalysis.confidence !== 'number') {
        errors.push('AI analysis confidence must be a number');
      } else if (isNaN(aiAnalysis.confidence)) {
        errors.push('AI analysis confidence cannot be NaN');
      } else if (aiAnalysis.confidence < 0 || aiAnalysis.confidence > 1) {
        errors.push('AI analysis confidence must be between 0 and 1');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates location data object
 * @param location - Location data to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateLocationData(location?: LocationData): ScanResultValidationResult {
  const errors: string[] = [];

  if (location !== undefined) {
    if (!location || typeof location !== 'object') {
      errors.push('Location data must be an object');
    } else {
      // Validate latitude
      if (location.latitude === undefined || location.latitude === null) {
        errors.push('Location latitude is required');
      } else if (typeof location.latitude !== 'number') {
        errors.push('Location latitude must be a number');
      } else if (isNaN(location.latitude)) {
        errors.push('Location latitude cannot be NaN');
      } else if (location.latitude < -90 || location.latitude > 90) {
        errors.push('Location latitude must be between -90 and 90 degrees');
      }

      // Validate longitude
      if (location.longitude === undefined || location.longitude === null) {
        errors.push('Location longitude is required');
      } else if (typeof location.longitude !== 'number') {
        errors.push('Location longitude must be a number');
      } else if (isNaN(location.longitude)) {
        errors.push('Location longitude cannot be NaN');
      } else if (location.longitude < -180 || location.longitude > 180) {
        errors.push('Location longitude must be between -180 and 180 degrees');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a complete ScanResult object
 * @param scanResult - ScanResult to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateScanResult(scanResult: Partial<ScanResult>): ScanResultValidationResult {
  const allErrors: string[] = [];

  // Validate required fields
  if (!scanResult.userId) {
    allErrors.push('User ID is required');
  } else {
    const userIdValidation = validateObjectId(scanResult.userId, 'User ID');
    allErrors.push(...userIdValidation.errors);
  }

  if (!scanResult.productId) {
    allErrors.push('Product ID is required');
  } else {
    const productIdValidation = validateObjectId(scanResult.productId, 'Product ID');
    allErrors.push(...productIdValidation.errors);
  }

  if (!scanResult.upc) {
    allErrors.push('UPC is required');
  } else {
    const upcValidation = validateScanUPC(scanResult.upc);
    allErrors.push(...upcValidation.errors);
  }

  if (!scanResult.scanTimestamp) {
    allErrors.push('Scan timestamp is required');
  } else if (!(scanResult.scanTimestamp instanceof Date)) {
    allErrors.push('Scan timestamp must be a Date object');
  } else if (scanResult.scanTimestamp > new Date()) {
    allErrors.push('Scan timestamp cannot be in the future');
  }

  if (!scanResult.complianceStatus) {
    allErrors.push('Compliance status is required');
  } else {
    const complianceValidation = validateComplianceStatus(scanResult.complianceStatus);
    allErrors.push(...complianceValidation.errors);
  }

  if (!scanResult.violations) {
    allErrors.push('Violations are required (can be empty array)');
  } else {
    const violationsValidation = validateViolations(scanResult.violations);
    allErrors.push(...violationsValidation.errors);
  }

  // Validate optional fields if present
  if (scanResult.aiAnalysis !== undefined) {
    const aiAnalysisValidation = validateAIAnalysis(scanResult.aiAnalysis);
    allErrors.push(...aiAnalysisValidation.errors);
  }

  if (scanResult.location !== undefined) {
    const locationValidation = validateLocationData(scanResult.location);
    allErrors.push(...locationValidation.errors);
  }

  // Business logic validations
  if (scanResult.complianceStatus === 'violation' && scanResult.violations && scanResult.violations.length === 0) {
    allErrors.push('Compliance status "violation" requires at least one violation to be specified');
  }

  if (scanResult.complianceStatus === 'safe' && scanResult.violations && scanResult.violations.length > 0) {
    allErrors.push('Compliance status "safe" should not have any violations');
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Validates CreateScanResultInput object
 * @param input - CreateScanResultInput to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateCreateScanResultInput(input: Partial<CreateScanResultInput>): ScanResultValidationResult {
  // Convert to ScanResult-like object for validation
  const scanResultForValidation: Partial<ScanResult> = {
    ...input,
    scanTimestamp: new Date() // Add required field for validation
  };

  return validateScanResult(scanResultForValidation);
}

/**
 * Validates UpdateScanResultInput object
 * @param input - UpdateScanResultInput to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateUpdateScanResultInput(input: UpdateScanResultInput): ScanResultValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    errors.push('Update input must be an object');
    return { isValid: false, errors };
  }

  // Validate each field if present
  if (input.complianceStatus !== undefined) {
    const complianceValidation = validateComplianceStatus(input.complianceStatus);
    errors.push(...complianceValidation.errors);
  }

  if (input.violations !== undefined) {
    const violationsValidation = validateViolations(input.violations);
    errors.push(...violationsValidation.errors);
  }

  if (input.aiAnalysis !== undefined) {
    const aiAnalysisValidation = validateAIAnalysis(input.aiAnalysis);
    errors.push(...aiAnalysisValidation.errors);
  }

  if (input.location !== undefined) {
    const locationValidation = validateLocationData(input.location);
    errors.push(...locationValidation.errors);
  }

  // Business logic validations for updates
  if (input.complianceStatus === 'violation' && input.violations && input.violations.length === 0) {
    errors.push('Compliance status "violation" requires at least one violation to be specified');
  }

  if (input.complianceStatus === 'safe' && input.violations && input.violations.length > 0) {
    errors.push('Compliance status "safe" should not have any violations');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to create a scan result with current timestamp
 * @param input - CreateScanResultInput data
 * @returns ScanResult with current timestamp
 */
export function createScanResultWithTimestamp(input: CreateScanResultInput): ScanResult {
  return {
    ...input,
    scanTimestamp: new Date()
  };
}

/**
 * Helper function to check if a scan result indicates a dietary violation
 * @param scanResult - ScanResult to check
 * @returns boolean indicating if there are violations
 */
export function hasDietaryViolations(scanResult: ScanResult): boolean {
  return scanResult.complianceStatus === 'violation' && scanResult.violations.length > 0;
}

/**
 * Helper function to check if a scan result has AI analysis
 * @param scanResult - ScanResult to check
 * @returns boolean indicating if AI analysis is present
 */
export function hasAIAnalysis(scanResult: ScanResult): boolean {
  return scanResult.aiAnalysis !== undefined && 
         scanResult.aiAnalysis.recommendation.trim().length > 0;
}

/**
 * Helper function to check if a scan result has location data
 * @param scanResult - ScanResult to check
 * @returns boolean indicating if location data is present
 */
export function hasLocationData(scanResult: ScanResult): boolean {
  return scanResult.location !== undefined &&
         typeof scanResult.location.latitude === 'number' &&
         typeof scanResult.location.longitude === 'number';
}