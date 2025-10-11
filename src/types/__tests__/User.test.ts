/**
 * Unit tests for User model interface and validation functions
 * Tests Requirements 1.2 and 1.5 from core architecture specification
 */

import {
  User,
  CreateUserInput,
  UpdateUserInput,
  DietaryRestrictions,
  UserPreferences,
  AlertLevel,
  validateProfileId,
  validateUserName,
  validateDietaryRestrictions,
  validateAlertLevel,
  validateUserPreferences,
  validateUser,
  validateCreateUserInput,
  validateUpdateUserInput,
  USER_ALLERGENS,
  RELIGIOUS_RESTRICTIONS,
  MEDICAL_RESTRICTIONS,
  LIFESTYLE_PREFERENCES,
  ALERT_LEVELS
} from '../User';

describe('User Model Validation', () => {
  // Test data helpers
  const createValidDietaryRestrictions = (): DietaryRestrictions => ({
    allergies: ['milk', 'eggs'],
    religious: ['halal'],
    medical: ['diabetes'],
    lifestyle: ['vegan']
  });

  const createValidUserPreferences = (): UserPreferences => ({
    alertLevel: 'strict',
    notifications: true,
    offlineMode: false
  });

  const createValidUser = (): User => ({
    _id: '507f1f77bcf86cd799439011',
    profileId: 'user123',
    name: 'John Doe',
    dietaryRestrictions: createValidDietaryRestrictions(),
    preferences: createValidUserPreferences(),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastActive: new Date('2024-01-02T00:00:00Z')
  });

  describe('validateProfileId', () => {
    it('should validate correct profile IDs', () => {
      expect(validateProfileId('user123')).toEqual({ isValid: true, errors: [] });
      expect(validateProfileId('test-user_01')).toEqual({ isValid: true, errors: [] });
      expect(validateProfileId('ABC123')).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid profile IDs', () => {
      expect(validateProfileId('')).toEqual({ 
        isValid: false, 
        errors: ['Profile ID is required and must be a string'] 
      });
      expect(validateProfileId('ab')).toEqual({ 
        isValid: false, 
        errors: ['Profile ID must be at least 3 characters long'] 
      });
      expect(validateProfileId('a'.repeat(51))).toEqual({ 
        isValid: false, 
        errors: ['Profile ID cannot exceed 50 characters'] 
      });
      expect(validateProfileId('user@123')).toEqual({ 
        isValid: false, 
        errors: ['Profile ID can only contain letters, numbers, underscores, and hyphens'] 
      });
    });

    it('should handle non-string inputs', () => {
      expect(validateProfileId(null as any)).toEqual({ 
        isValid: false, 
        errors: ['Profile ID is required and must be a string'] 
      });
      expect(validateProfileId(123 as any)).toEqual({ 
        isValid: false, 
        errors: ['Profile ID is required and must be a string'] 
      });
    });
  });

  describe('validateUserName', () => {
    it('should validate correct user names', () => {
      expect(validateUserName('John Doe')).toEqual({ isValid: true, errors: [] });
      expect(validateUserName('Alice')).toEqual({ isValid: true, errors: [] });
      expect(validateUserName('María José')).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid user names', () => {
      expect(validateUserName('')).toEqual({ 
        isValid: false, 
        errors: ['User name cannot be empty'] 
      });
      expect(validateUserName('   ')).toEqual({ 
        isValid: false, 
        errors: ['User name cannot be empty'] 
      });
      expect(validateUserName('a'.repeat(101))).toEqual({ 
        isValid: false, 
        errors: ['User name cannot exceed 100 characters'] 
      });
    });

    it('should handle non-string inputs', () => {
      expect(validateUserName(null as any)).toEqual({ 
        isValid: false, 
        errors: ['User name is required and must be a string'] 
      });
      expect(validateUserName(123 as any)).toEqual({ 
        isValid: false, 
        errors: ['User name is required and must be a string'] 
      });
    });
  });

  describe('validateDietaryRestrictions', () => {
    it('should validate correct dietary restrictions', () => {
      const validRestrictions = createValidDietaryRestrictions();
      expect(validateDietaryRestrictions(validRestrictions)).toEqual({ isValid: true, errors: [] });
    });

    it('should validate empty arrays', () => {
      const emptyRestrictions: DietaryRestrictions = {
        allergies: [],
        religious: [],
        medical: [],
        lifestyle: []
      };
      expect(validateDietaryRestrictions(emptyRestrictions)).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid structure', () => {
      expect(validateDietaryRestrictions(null as any)).toEqual({ 
        isValid: false, 
        errors: ['Dietary restrictions must be an object'] 
      });
      expect(validateDietaryRestrictions('invalid' as any)).toEqual({ 
        isValid: false, 
        errors: ['Dietary restrictions must be an object'] 
      });
    });

    it('should reject non-array categories', () => {
      const invalidRestrictions = {
        allergies: 'milk' as any,
        religious: [],
        medical: [],
        lifestyle: []
      };
      expect(validateDietaryRestrictions(invalidRestrictions)).toEqual({ 
        isValid: false, 
        errors: ['Allergies must be an array'] 
      });
    });

    it('should reject invalid allergens', () => {
      const invalidRestrictions: DietaryRestrictions = {
        allergies: ['milk', 'invalid-allergen'],
        religious: [],
        medical: [],
        lifestyle: []
      };
      const result = validateDietaryRestrictions(invalidRestrictions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Allergies item "invalid-allergen" is not a recognized option');
    });

    it('should reject duplicate entries', () => {
      const invalidRestrictions: DietaryRestrictions = {
        allergies: ['milk', 'milk'],
        religious: [],
        medical: [],
        lifestyle: []
      };
      const result = validateDietaryRestrictions(invalidRestrictions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Allergies contains duplicate entries');
    });

    it('should reject empty strings', () => {
      const invalidRestrictions: DietaryRestrictions = {
        allergies: ['milk', ''],
        religious: [],
        medical: [],
        lifestyle: []
      };
      const result = validateDietaryRestrictions(invalidRestrictions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Allergies item at index 1 cannot be empty');
    });

    it('should reject overly long restriction names', () => {
      const longName = 'a'.repeat(51);
      const invalidRestrictions: DietaryRestrictions = {
        allergies: ['milk', longName],
        religious: [],
        medical: [],
        lifestyle: []
      };
      const result = validateDietaryRestrictions(invalidRestrictions);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Allergies item at index 1 cannot exceed 50 characters');
    });
  });

  describe('validateAlertLevel', () => {
    it('should validate correct alert levels', () => {
      ALERT_LEVELS.forEach(level => {
        expect(validateAlertLevel(level)).toEqual({ isValid: true, errors: [] });
      });
    });

    it('should reject invalid alert levels', () => {
      expect(validateAlertLevel('invalid' as AlertLevel)).toEqual({ 
        isValid: false, 
        errors: ['Alert level must be one of: strict, moderate, flexible'] 
      });
      expect(validateAlertLevel('' as AlertLevel)).toEqual({ 
        isValid: false, 
        errors: ['Alert level is required and must be a string'] 
      });
    });

    it('should handle non-string inputs', () => {
      expect(validateAlertLevel(null as any)).toEqual({ 
        isValid: false, 
        errors: ['Alert level is required and must be a string'] 
      });
      expect(validateAlertLevel(123 as any)).toEqual({ 
        isValid: false, 
        errors: ['Alert level is required and must be a string'] 
      });
    });
  });

  describe('validateUserPreferences', () => {
    it('should validate correct user preferences', () => {
      const validPreferences = createValidUserPreferences();
      expect(validateUserPreferences(validPreferences)).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid structure', () => {
      expect(validateUserPreferences(null as any)).toEqual({ 
        isValid: false, 
        errors: ['User preferences must be an object'] 
      });
      expect(validateUserPreferences('invalid' as any)).toEqual({ 
        isValid: false, 
        errors: ['User preferences must be an object'] 
      });
    });

    it('should reject missing required fields', () => {
      const incompletePreferences = {
        alertLevel: 'strict' as AlertLevel
        // Missing notifications and offlineMode
      } as any;
      const result = validateUserPreferences(incompletePreferences);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Notifications preference is required');
      expect(result.errors).toContain('Offline mode preference is required');
    });

    it('should reject invalid field types', () => {
      const invalidPreferences = {
        alertLevel: 'invalid',
        notifications: 'yes',
        offlineMode: 1
      } as any;
      const result = validateUserPreferences(invalidPreferences);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Alert level must be one of: strict, moderate, flexible');
      expect(result.errors).toContain('Notifications preference must be a boolean');
      expect(result.errors).toContain('Offline mode preference must be a boolean');
    });
  });

  describe('validateUser', () => {
    it('should validate a complete valid user', () => {
      const validUser = createValidUser();
      expect(validateUser(validUser)).toEqual({ isValid: true, errors: [] });
    });

    it('should reject missing required fields', () => {
      const incompleteUser = {
        name: 'John Doe'
        // Missing other required fields
      } as any;
      const result = validateUser(incompleteUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Profile ID is required');
      expect(result.errors).toContain('Dietary restrictions are required');
      expect(result.errors).toContain('User preferences are required');
      expect(result.errors).toContain('Created at timestamp is required');
      expect(result.errors).toContain('Last active timestamp is required');
    });

    it('should reject invalid date fields', () => {
      const invalidUser = {
        ...createValidUser(),
        createdAt: 'invalid-date',
        lastActive: 'invalid-date'
      } as any;
      const result = validateUser(invalidUser);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Created at must be a Date object');
      expect(result.errors).toContain('Last active must be a Date object');
    });

    it('should validate nested objects', () => {
      const userWithInvalidNested = {
        ...createValidUser(),
        dietaryRestrictions: {
          allergies: 'invalid' as any,
          religious: [],
          medical: [],
          lifestyle: []
        }
      };
      const result = validateUser(userWithInvalidNested);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Allergies must be an array');
    });
  });

  describe('validateCreateUserInput', () => {
    it('should validate correct create user input', () => {
      const validInput: CreateUserInput = {
        profileId: 'user123',
        name: 'John Doe',
        dietaryRestrictions: createValidDietaryRestrictions(),
        preferences: createValidUserPreferences()
      };
      expect(validateCreateUserInput(validInput)).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid create user input', () => {
      const invalidInput = {
        profileId: '',
        name: 'John Doe'
        // Missing required fields
      } as any;
      const result = validateCreateUserInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateUpdateUserInput', () => {
    it('should validate correct update user input', () => {
      const validInput: UpdateUserInput = {
        name: 'Jane Doe',
        preferences: {
          alertLevel: 'moderate'
        }
      };
      expect(validateUpdateUserInput(validInput)).toEqual({ isValid: true, errors: [] });
    });

    it('should validate empty update input', () => {
      const emptyInput: UpdateUserInput = {};
      expect(validateUpdateUserInput(emptyInput)).toEqual({ isValid: true, errors: [] });
    });

    it('should reject invalid partial updates', () => {
      const invalidInput: UpdateUserInput = {
        name: '',
        dietaryRestrictions: {
          allergies: 'invalid' as any
        }
      };
      const result = validateUpdateUserInput(invalidInput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('User name cannot be empty');
      expect(result.errors).toContain('Allergies must be an array');
    });

    it('should validate partial dietary restrictions updates', () => {
      const validInput: UpdateUserInput = {
        dietaryRestrictions: {
          allergies: ['milk', 'eggs']
          // Only updating allergies, other categories not included
        }
      };
      expect(validateUpdateUserInput(validInput)).toEqual({ isValid: true, errors: [] });
    });

    it('should validate partial preferences updates', () => {
      const validInput: UpdateUserInput = {
        preferences: {
          notifications: false
          // Only updating notifications, other preferences not included
        }
      };
      expect(validateUpdateUserInput(validInput)).toEqual({ isValid: true, errors: [] });
    });
  });

  describe('Constants', () => {
    it('should have correct allergen constants', () => {
      expect(USER_ALLERGENS).toContain('milk');
      expect(USER_ALLERGENS).toContain('eggs');
      expect(USER_ALLERGENS).toContain('peanuts');
      expect(USER_ALLERGENS).toContain('sesame');
    });

    it('should have correct religious restriction constants', () => {
      expect(RELIGIOUS_RESTRICTIONS).toContain('halal');
      expect(RELIGIOUS_RESTRICTIONS).toContain('kosher');
      expect(RELIGIOUS_RESTRICTIONS).toContain('hindu vegetarian');
    });

    it('should have correct medical restriction constants', () => {
      expect(MEDICAL_RESTRICTIONS).toContain('diabetes');
      expect(MEDICAL_RESTRICTIONS).toContain('hypertension');
      expect(MEDICAL_RESTRICTIONS).toContain('celiac');
    });

    it('should have correct lifestyle preference constants', () => {
      expect(LIFESTYLE_PREFERENCES).toContain('vegan');
      expect(LIFESTYLE_PREFERENCES).toContain('vegetarian');
      expect(LIFESTYLE_PREFERENCES).toContain('keto');
    });

    it('should have correct alert level constants', () => {
      expect(ALERT_LEVELS).toEqual(['strict', 'moderate', 'flexible']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle case-insensitive dietary restrictions', () => {
      const restrictions: DietaryRestrictions = {
        allergies: ['MILK', 'Eggs'],
        religious: ['HALAL'],
        medical: ['Diabetes'],
        lifestyle: ['VEGAN']
      };
      // The validation should normalize to lowercase for comparison
      expect(validateDietaryRestrictions(restrictions)).toEqual({ isValid: true, errors: [] });
    });

    it('should handle whitespace in profile IDs', () => {
      expect(validateProfileId('  user123  ')).toEqual({ isValid: true, errors: [] });
    });

    it('should handle whitespace in user names', () => {
      expect(validateUserName('  John Doe  ')).toEqual({ isValid: true, errors: [] });
    });

    it('should reject null and undefined values appropriately', () => {
      expect(validateUser({} as any).isValid).toBe(false);
      expect(validateCreateUserInput({} as any).isValid).toBe(false);
      const nullResult = validateUpdateUserInput(null as any);
      expect(nullResult.isValid).toBe(false);
      expect(nullResult.errors).toContain('Update input must be an object');
    });
  });
});