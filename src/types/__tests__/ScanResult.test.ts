/**
 * Unit tests for ScanResult model interface and validation
 * Tests Requirements 1.3 and 1.5 from core architecture specification
 */

import {
  ScanResult,
  CreateScanResultInput,
  UpdateScanResultInput,
  AIAnalysis,
  LocationData,
  ComplianceStatus,
  COMPLIANCE_STATUSES,
  validateScanUPC,
  validateComplianceStatus,
  validateViolations,
  validateAIAnalysis,
  validateLocationData,
  validateScanResult,
  validateCreateScanResultInput,
  validateUpdateScanResultInput,
  createScanResultWithTimestamp,
  hasDietaryViolations,
  hasAIAnalysis,
  hasLocationData
} from '../ScanResult';

describe('ScanResult Model', () => {
  // Test data
  const validObjectId = '507f1f77bcf86cd799439011';
  const validUPC = '012345678901';
  const validTimestamp = new Date('2024-01-15T10:30:00Z');

  const validScanResult: ScanResult = {
    _id: validObjectId,
    userId: validObjectId,
    productId: validObjectId,
    upc: validUPC,
    scanTimestamp: validTimestamp,
    complianceStatus: 'safe',
    violations: []
  };

  const validCreateInput: CreateScanResultInput = {
    userId: validObjectId,
    productId: validObjectId,
    upc: validUPC,
    complianceStatus: 'safe',
    violations: []
  };

  const validAIAnalysis: AIAnalysis = {
    recommendation: 'This product is safe for your dietary restrictions.',
    alternatives: ['Alternative Product 1', 'Alternative Product 2'],
    confidence: 0.95
  };

  const validLocationData: LocationData = {
    latitude: 37.7749,
    longitude: -122.4194
  };

  describe('Constants', () => {
    test('COMPLIANCE_STATUSES should contain all valid statuses', () => {
      expect(COMPLIANCE_STATUSES).toEqual(['safe', 'caution', 'violation']);
      expect(COMPLIANCE_STATUSES).toHaveLength(3);
    });
  });

  describe('validateScanUPC', () => {
    test('should validate correct UPC codes', () => {
      const validUPCs = [
        '012345678901',    // UPC-A (12 digits)
        '01234567',        // UPC-E (8 digits)
        '0123456789012'    // EAN (13 digits)
      ];

      validUPCs.forEach(upc => {
        const result = validateScanUPC(upc);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should handle UPC codes with spaces and dashes', () => {
      const result = validateScanUPC('012-345-678-901');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid UPC codes', () => {
      const invalidUPCs = [
        '',                // Empty
        '12345',          // Too short
        '12345678901234', // Too long
        'abcd12345678',   // Contains letters
        '012-345-67a-901' // Contains letters with dashes
      ];

      invalidUPCs.forEach(upc => {
        const result = validateScanUPC(upc);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should reject null/undefined UPC', () => {
      const result = validateScanUPC(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('UPC is required and must be a string');
    });
  });

  describe('validateComplianceStatus', () => {
    test('should validate all valid compliance statuses', () => {
      COMPLIANCE_STATUSES.forEach(status => {
        const result = validateComplianceStatus(status);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    test('should reject invalid compliance statuses', () => {
      const invalidStatuses = ['invalid', 'unknown', '', null, undefined];

      invalidStatuses.forEach(status => {
        const result = validateComplianceStatus(status as any);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('validateViolations', () => {
    test('should validate empty violations array', () => {
      const result = validateViolations([]);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate valid violations array', () => {
      const violations = ['Contains milk', 'Contains nuts', 'Not halal certified'];
      const result = validateViolations(violations);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject non-array violations', () => {
      const result = validateViolations('not an array' as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Violations must be an array');
    });

    test('should reject empty string violations', () => {
      const result = validateViolations(['Valid violation', '', 'Another valid']);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('cannot be empty'))).toBe(true);
    });

    test('should reject violations that are too long', () => {
      const longViolation = 'a'.repeat(101);
      const result = validateViolations([longViolation]);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('cannot exceed 100 characters'))).toBe(true);
    });

    test('should reject duplicate violations', () => {
      const result = validateViolations(['Contains milk', 'Contains nuts', 'contains milk']);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Violations array contains duplicate entries');
    });
  });

  describe('validateAIAnalysis', () => {
    test('should validate undefined AI analysis', () => {
      const result = validateAIAnalysis(undefined);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate valid AI analysis', () => {
      const result = validateAIAnalysis(validAIAnalysis);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject AI analysis with missing recommendation', () => {
      const invalidAnalysis = {
        ...validAIAnalysis,
        recommendation: ''
      };
      const result = validateAIAnalysis(invalidAnalysis);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('recommendation cannot be empty'))).toBe(true);
    });

    test('should reject AI analysis with invalid confidence', () => {
      const invalidAnalysis = {
        ...validAIAnalysis,
        confidence: 1.5
      };
      const result = validateAIAnalysis(invalidAnalysis);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('confidence must be between 0 and 1'))).toBe(true);
    });

    test('should reject AI analysis with invalid alternatives', () => {
      const invalidAnalysis = {
        ...validAIAnalysis,
        alternatives: ['Valid alternative', '', 'Another valid']
      };
      const result = validateAIAnalysis(invalidAnalysis);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('cannot be empty'))).toBe(true);
    });

    test('should reject AI analysis with too long recommendation', () => {
      const invalidAnalysis = {
        ...validAIAnalysis,
        recommendation: 'a'.repeat(1001)
      };
      const result = validateAIAnalysis(invalidAnalysis);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('cannot exceed 1000 characters'))).toBe(true);
    });
  });

  describe('validateLocationData', () => {
    test('should validate undefined location data', () => {
      const result = validateLocationData(undefined);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate valid location data', () => {
      const result = validateLocationData(validLocationData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid latitude values', () => {
      const invalidLatitudes = [-91, 91, NaN];
      
      invalidLatitudes.forEach(lat => {
        const invalidLocation = { ...validLocationData, latitude: lat };
        const result = validateLocationData(invalidLocation);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should reject invalid longitude values', () => {
      const invalidLongitudes = [-181, 181, NaN];
      
      invalidLongitudes.forEach(lng => {
        const invalidLocation = { ...validLocationData, longitude: lng };
        const result = validateLocationData(invalidLocation);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('should reject location data with missing coordinates', () => {
      const incompleteLocation = { latitude: 37.7749 } as LocationData;
      const result = validateLocationData(incompleteLocation);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('longitude is required'))).toBe(true);
    });
  });

  describe('validateScanResult', () => {
    test('should validate complete valid scan result', () => {
      const result = validateScanResult(validScanResult);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate scan result with optional fields', () => {
      const scanResultWithOptionals: ScanResult = {
        ...validScanResult,
        aiAnalysis: validAIAnalysis,
        location: validLocationData
      };
      
      const result = validateScanResult(scanResultWithOptionals);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject scan result with missing required fields', () => {
      const requiredFieldTests = [
        { field: 'userId', expectedError: 'User ID is required' },
        { field: 'productId', expectedError: 'Product ID is required' },
        { field: 'upc', expectedError: 'UPC is required' },
        { field: 'scanTimestamp', expectedError: 'Scan timestamp is required' },
        { field: 'complianceStatus', expectedError: 'Compliance status is required' },
        { field: 'violations', expectedError: 'Violations are required' }
      ];
      
      requiredFieldTests.forEach(({ field, expectedError }) => {
        const incompleteResult = { ...validScanResult };
        delete (incompleteResult as any)[field];
        
        const result = validateScanResult(incompleteResult);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes(expectedError))).toBe(true);
      });
    });

    test('should reject scan result with invalid ObjectIds', () => {
      const invalidId = 'invalid-id';
      const scanResultWithInvalidId = {
        ...validScanResult,
        userId: invalidId
      };
      
      const result = validateScanResult(scanResultWithInvalidId);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('valid 24-character hexadecimal ObjectId'))).toBe(true);
    });

    test('should reject scan result with future timestamp', () => {
      const futureTimestamp = new Date(Date.now() + 86400000); // Tomorrow
      const scanResultWithFutureTime = {
        ...validScanResult,
        scanTimestamp: futureTimestamp
      };
      
      const result = validateScanResult(scanResultWithFutureTime);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Scan timestamp cannot be in the future');
    });

    test('should enforce business logic: violation status requires violations', () => {
      const violationWithoutViolations = {
        ...validScanResult,
        complianceStatus: 'violation' as ComplianceStatus,
        violations: []
      };
      
      const result = validateScanResult(violationWithoutViolations);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('requires at least one violation'))).toBe(true);
    });

    test('should enforce business logic: safe status should not have violations', () => {
      const safeWithViolations = {
        ...validScanResult,
        complianceStatus: 'safe' as ComplianceStatus,
        violations: ['Contains milk']
      };
      
      const result = validateScanResult(safeWithViolations);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('should not have any violations'))).toBe(true);
    });
  });

  describe('validateCreateScanResultInput', () => {
    test('should validate valid create input', () => {
      const result = validateCreateScanResultInput(validCreateInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate create input with optional fields', () => {
      const inputWithOptionals: CreateScanResultInput = {
        ...validCreateInput,
        aiAnalysis: validAIAnalysis,
        location: validLocationData
      };
      
      const result = validateCreateScanResultInput(inputWithOptionals);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject create input with missing required fields', () => {
      const incompleteInput = { ...validCreateInput };
      delete (incompleteInput as any).userId;
      
      const result = validateCreateScanResultInput(incompleteInput);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('User ID is required'))).toBe(true);
    });
  });

  describe('validateUpdateScanResultInput', () => {
    test('should validate empty update input', () => {
      const result = validateUpdateScanResultInput({});
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate partial update input', () => {
      const updateInput: UpdateScanResultInput = {
        complianceStatus: 'caution',
        violations: ['May contain traces of nuts']
      };
      
      const result = validateUpdateScanResultInput(updateInput);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid update input', () => {
      const invalidUpdate: UpdateScanResultInput = {
        complianceStatus: 'invalid' as ComplianceStatus
      };
      
      const result = validateUpdateScanResultInput(invalidUpdate);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should enforce business logic in updates', () => {
      const invalidUpdate: UpdateScanResultInput = {
        complianceStatus: 'violation',
        violations: []
      };
      
      const result = validateUpdateScanResultInput(invalidUpdate);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('requires at least one violation'))).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    describe('createScanResultWithTimestamp', () => {
      test('should create scan result with current timestamp', () => {
        const beforeTime = Date.now();
        const result = createScanResultWithTimestamp(validCreateInput);
        const afterTime = Date.now();
        
        expect(result).toMatchObject(validCreateInput);
        expect(result.scanTimestamp).toBeInstanceOf(Date);
        expect(result.scanTimestamp.getTime()).toBeGreaterThanOrEqual(beforeTime);
        expect(result.scanTimestamp.getTime()).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('hasDietaryViolations', () => {
      test('should return true for violation status with violations', () => {
        const scanWithViolations: ScanResult = {
          ...validScanResult,
          complianceStatus: 'violation',
          violations: ['Contains milk']
        };
        
        expect(hasDietaryViolations(scanWithViolations)).toBe(true);
      });

      test('should return false for safe status', () => {
        expect(hasDietaryViolations(validScanResult)).toBe(false);
      });

      test('should return false for caution status', () => {
        const cautionResult: ScanResult = {
          ...validScanResult,
          complianceStatus: 'caution',
          violations: ['May contain traces']
        };
        
        expect(hasDietaryViolations(cautionResult)).toBe(false);
      });
    });

    describe('hasAIAnalysis', () => {
      test('should return true when AI analysis is present', () => {
        const scanWithAI: ScanResult = {
          ...validScanResult,
          aiAnalysis: validAIAnalysis
        };
        
        expect(hasAIAnalysis(scanWithAI)).toBe(true);
      });

      test('should return false when AI analysis is undefined', () => {
        expect(hasAIAnalysis(validScanResult)).toBe(false);
      });

      test('should return false when AI analysis has empty recommendation', () => {
        const scanWithEmptyAI: ScanResult = {
          ...validScanResult,
          aiAnalysis: {
            ...validAIAnalysis,
            recommendation: '   '
          }
        };
        
        expect(hasAIAnalysis(scanWithEmptyAI)).toBe(false);
      });
    });

    describe('hasLocationData', () => {
      test('should return true when location data is present', () => {
        const scanWithLocation: ScanResult = {
          ...validScanResult,
          location: validLocationData
        };
        
        expect(hasLocationData(scanWithLocation)).toBe(true);
      });

      test('should return false when location data is undefined', () => {
        expect(hasLocationData(validScanResult)).toBe(false);
      });

      test('should return false when location data is incomplete', () => {
        const scanWithIncompleteLocation: ScanResult = {
          ...validScanResult,
          location: { latitude: 37.7749 } as LocationData
        };
        
        expect(hasLocationData(scanWithIncompleteLocation)).toBe(false);
      });
    });
  });

  describe('Type Safety', () => {
    test('should enforce ComplianceStatus type', () => {
      const validStatuses: ComplianceStatus[] = ['safe', 'caution', 'violation'];
      validStatuses.forEach(status => {
        expect(COMPLIANCE_STATUSES).toContain(status);
      });
    });

    test('should have proper interface structure', () => {
      const scanResult: ScanResult = {
        _id: validObjectId,
        userId: validObjectId,
        productId: validObjectId,
        upc: validUPC,
        scanTimestamp: validTimestamp,
        complianceStatus: 'safe',
        violations: [],
        aiAnalysis: validAIAnalysis,
        location: validLocationData
      };

      // TypeScript compilation ensures type safety
      expect(scanResult).toBeDefined();
      expect(typeof scanResult.userId).toBe('string');
      expect(typeof scanResult.productId).toBe('string');
      expect(typeof scanResult.upc).toBe('string');
      expect(scanResult.scanTimestamp).toBeInstanceOf(Date);
      expect(Array.isArray(scanResult.violations)).toBe(true);
    });
  });
});