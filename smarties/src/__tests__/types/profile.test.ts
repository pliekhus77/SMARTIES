/**
 * Tests for profile type definitions and validation functions
 */

import {
  AllergenType,
  SeverityLevel,
  validateDietaryRestriction,
  validateSeverityLevel,
  validateAllergenType,
  createDietaryRestriction,
  getSeverityDisplayName,
  getAllergenDisplayName,
  getSeverityColor,
  getRestrictionCategory,
  ProfileErrorType
} from '../../types/profile';

describe('Profile Type Validation', () => {
  describe('validateDietaryRestriction', () => {
    it('should return no errors for valid dietary restriction', () => {
      const validRestriction = {
        name: 'Peanut Allergy',
        type: AllergenType.PEANUTS,
        severity: SeverityLevel.SEVERE,
        isActive: true
      };

      const errors = validateDietaryRestriction(validRestriction);
      expect(errors).toHaveLength(0);
    });

    it('should return error for missing name', () => {
      const invalidRestriction = {
        type: AllergenType.PEANUTS,
        severity: SeverityLevel.SEVERE,
        isActive: true
      };

      const errors = validateDietaryRestriction(invalidRestriction);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.type).toBe(ProfileErrorType.VALIDATION_ERROR);
      expect(errors[0]?.message).toBe('Dietary restriction name is required');
    });

    it('should return error for empty name', () => {
      const invalidRestriction = {
        name: '   ',
        type: AllergenType.PEANUTS,
        severity: SeverityLevel.SEVERE,
        isActive: true
      };

      const errors = validateDietaryRestriction(invalidRestriction);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toBe('Dietary restriction name is required');
    });

    it('should return error for name too long', () => {
      const invalidRestriction = {
        name: 'A'.repeat(101),
        type: AllergenType.PEANUTS,
        severity: SeverityLevel.SEVERE,
        isActive: true
      };

      const errors = validateDietaryRestriction(invalidRestriction);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toBe('Dietary restriction name must be 100 characters or less');
    });

    it('should return error for invalid restriction type', () => {
      const invalidRestriction = {
        name: 'Test Allergy',
        type: 'invalid_type' as AllergenType,
        severity: SeverityLevel.SEVERE,
        isActive: true
      };

      const errors = validateDietaryRestriction(invalidRestriction);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toBe('Valid restriction type is required');
    });

    it('should return error for invalid severity level', () => {
      const invalidRestriction = {
        name: 'Test Allergy',
        type: AllergenType.PEANUTS,
        severity: 'invalid_severity' as SeverityLevel,
        isActive: true
      };

      const errors = validateDietaryRestriction(invalidRestriction);
      expect(errors).toHaveLength(1);
      expect(errors[0]?.message).toBe('Valid severity level is required');
    });



    it('should return multiple errors for multiple invalid fields', () => {
      const invalidRestriction = {
        name: '',
        type: 'invalid' as AllergenType,
        severity: 'invalid' as SeverityLevel,
        isActive: true
      };

      const errors = validateDietaryRestriction(invalidRestriction);
      expect(errors).toHaveLength(3); // name, type, and severity are all invalid
    });
  });

  describe('validateSeverityLevel', () => {
    it('should return true for valid severity levels', () => {
      expect(validateSeverityLevel(SeverityLevel.IRRITATION)).toBe(true);
      expect(validateSeverityLevel(SeverityLevel.SEVERE)).toBe(true);
      expect(validateSeverityLevel(SeverityLevel.ANAPHYLACTIC)).toBe(true);
    });

    it('should return false for invalid severity level', () => {
      expect(validateSeverityLevel('invalid')).toBe(false);
      expect(validateSeverityLevel('')).toBe(false);
    });
  });

  describe('validateAllergenType', () => {
    it('should return true for valid allergen types', () => {
      expect(validateAllergenType(AllergenType.PEANUTS)).toBe(true);
      expect(validateAllergenType(AllergenType.MILK)).toBe(true);
      expect(validateAllergenType(AllergenType.GLUTEN)).toBe(true);
    });

    it('should return false for invalid allergen type', () => {
      expect(validateAllergenType('invalid')).toBe(false);
      expect(validateAllergenType('')).toBe(false);
    });
  });

  describe('createDietaryRestriction', () => {
    it('should create dietary restriction with defaults', () => {
      const restriction = createDietaryRestriction('Peanuts', AllergenType.PEANUTS, getRestrictionCategory(AllergenType.PEANUTS));
      
      expect(restriction.name).toBe('Peanuts');
      expect(restriction.type).toBe(AllergenType.PEANUTS);
      expect(restriction.severity).toBe(SeverityLevel.SEVERE);
      expect(restriction.isActive).toBe(true);
    });

    it('should create dietary restriction with custom severity', () => {
      const restriction = createDietaryRestriction(
        'Milk Allergy',
        AllergenType.MILK,
        getRestrictionCategory(AllergenType.MILK),
        SeverityLevel.ANAPHYLACTIC
      );
      
      expect(restriction.name).toBe('Milk Allergy');
      expect(restriction.type).toBe(AllergenType.MILK);
      expect(restriction.severity).toBe(SeverityLevel.ANAPHYLACTIC);
      expect(restriction.isActive).toBe(true);
    });

    it('should trim whitespace from name', () => {
      const restriction = createDietaryRestriction(
        '  Egg Allergy  ',
        AllergenType.EGGS,
        getRestrictionCategory(AllergenType.EGGS),
        SeverityLevel.IRRITATION
      );
      
      expect(restriction.name).toBe('Egg Allergy');
    });
  });

  describe('getSeverityDisplayName', () => {
    it('should return correct display names', () => {
      expect(getSeverityDisplayName(SeverityLevel.IRRITATION)).toBe('Irritation');
      expect(getSeverityDisplayName(SeverityLevel.SEVERE)).toBe('Severe');
      expect(getSeverityDisplayName(SeverityLevel.ANAPHYLACTIC)).toBe('Anaphylactic');
    });

    it('should return Unknown for invalid severity', () => {
      expect(getSeverityDisplayName('invalid' as SeverityLevel)).toBe('Unknown');
    });
  });

  describe('getAllergenDisplayName', () => {
    it('should return correct display names', () => {
      expect(getAllergenDisplayName(AllergenType.PEANUTS)).toBe('Peanuts');
      expect(getAllergenDisplayName(AllergenType.TREE_NUTS)).toBe('Tree Nuts');
      expect(getAllergenDisplayName(AllergenType.MILK)).toBe('Milk');
    });

    it('should return Unknown for invalid allergen type', () => {
      expect(getAllergenDisplayName('invalid' as AllergenType)).toBe('Unknown');
    });
  });

  describe('getSeverityColor', () => {
    it('should return correct colors for severity levels', () => {
      expect(getSeverityColor(SeverityLevel.IRRITATION)).toBe('#4CAF50'); // Green
      expect(getSeverityColor(SeverityLevel.SEVERE)).toBe('#FF9800'); // Orange
      expect(getSeverityColor(SeverityLevel.ANAPHYLACTIC)).toBe('#F44336'); // Red
    });

    it('should return gray for invalid severity', () => {
      expect(getSeverityColor('invalid' as SeverityLevel)).toBe('#999999');
    });
  });
});