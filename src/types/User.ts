/**
 * User model interface and validation for SMARTIES application
 * Implements Requirements 1.2 and 1.5 from core architecture specification
 */

/**
 * Alert level types for dietary compliance checking
 */
export type AlertLevel = 'strict' | 'moderate' | 'flexible';

/**
 * Dietary restrictions organized by category
 * Based on SMARTIES product guide dietary restrictions specification
 */
export interface DietaryRestrictions {
  allergies: string[];         // FDA Top 9 + additional allergens
  religious: string[];         // Religious dietary requirements
  medical: string[];           // Medical dietary needs
  lifestyle: string[];         // Lifestyle choices and preferences
}

/**
 * User preferences for app behavior and notifications
 */
export interface UserPreferences {
  alertLevel: AlertLevel;      // Compliance checking strictness
  notifications: boolean;      // Push notification preferences
  offlineMode: boolean;        // Offline functionality preference
}

/**
 * Core User interface for SMARTIES application
 * Supports dietary restrictions, preferences, and profile metadata
 * with proper relationships and indexing for sub-100ms query performance
 */
export interface User {
  _id?: string;                     // MongoDB ObjectId as string
  profileId: string;                // Unique profile identifier (required)
  name: string;                     // Display name (required)
  dietaryRestrictions: DietaryRestrictions; // User's dietary restrictions (required)
  preferences: UserPreferences;     // App preferences (required)
  createdAt: Date;                  // Profile creation timestamp (required)
  lastActive: Date;                 // Last activity timestamp (required)
}

/**
 * User creation input (excludes auto-generated fields)
 */
export interface CreateUserInput {
  profileId: string;
  name: string;
  dietaryRestrictions: DietaryRestrictions;
  preferences: UserPreferences;
}

/**
 * User update input (all fields optional except profileId which shouldn't change)
 */
export interface UpdateUserInput {
  name?: string;
  dietaryRestrictions?: Partial<DietaryRestrictions>;
  preferences?: Partial<UserPreferences>;
}

/**
 * Validation result interface
 */
export interface UserValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Common allergens for user dietary restrictions based on FDA Top 9 + additional
 * From SMARTIES product guide specification
 */
export const USER_ALLERGENS = [
  'milk',
  'eggs',
  'fish',
  'shellfish',
  'tree nuts',
  'peanuts',
  'wheat',
  'soybeans',
  'sesame',
  'dairy'
] as const;

/**
 * Religious dietary restrictions
 * From SMARTIES product guide specification
 */
export const RELIGIOUS_RESTRICTIONS = [
  'halal',
  'kosher',
  'hindu vegetarian',
  'jain',
  'buddhist'
] as const;

/**
 * Medical dietary restrictions
 * From SMARTIES product guide specification
 */
export const MEDICAL_RESTRICTIONS = [
  'diabetes',
  'hypertension',
  'celiac',
  'kidney disease'
] as const;

/**
 * Lifestyle dietary preferences
 * From SMARTIES product guide specification
 */
export const LIFESTYLE_PREFERENCES = [
  'vegan',
  'vegetarian',
  'keto',
  'paleo',
  'organic-only',
  'non-gmo'
] as const;

/**
 * Valid alert levels
 */
export const ALERT_LEVELS: AlertLevel[] = ['strict', 'moderate', 'flexible'];

/**
 * Validates profile ID format and requirements
 * @param profileId - Profile ID to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateProfileId(profileId: string): UserValidationResult {
  const errors: string[] = [];

  if (!profileId || typeof profileId !== 'string') {
    errors.push('Profile ID is required and must be a string');
  } else {
    const trimmedId = profileId.trim();
    if (trimmedId.length === 0) {
      errors.push('Profile ID cannot be empty');
    } else if (trimmedId.length < 3) {
      errors.push('Profile ID must be at least 3 characters long');
    } else if (trimmedId.length > 50) {
      errors.push('Profile ID cannot exceed 50 characters');
    } else if (!/^[a-zA-Z0-9_-]+$/.test(trimmedId)) {
      errors.push('Profile ID can only contain letters, numbers, underscores, and hyphens');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user name requirements
 * @param name - User name to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateUserName(name: string): UserValidationResult {
  const errors: string[] = [];

  if (name === null || name === undefined || typeof name !== 'string') {
    errors.push('User name is required and must be a string');
  } else {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      errors.push('User name cannot be empty');
    } else if (trimmedName.length > 100) {
      errors.push('User name cannot exceed 100 characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates dietary restrictions array for a specific category
 * @param restrictions - Array of restrictions to validate
 * @param category - Category name for error messages
 * @param validOptions - Array of valid options for this category
 * @returns ValidationResult with validation status and errors
 */
function validateRestrictionCategory(
  restrictions: string[], 
  category: string, 
  validOptions?: readonly string[]
): UserValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(restrictions)) {
    errors.push(`${category} must be an array`);
  } else {
    restrictions.forEach((restriction, index) => {
      if (typeof restriction !== 'string') {
        errors.push(`${category} item at index ${index} must be a non-empty string`);
      } else {
        const trimmedRestriction = restriction.trim();
        if (trimmedRestriction.length === 0) {
          errors.push(`${category} item at index ${index} cannot be empty`);
        } else if (restriction.length > 50) {
          errors.push(`${category} item at index ${index} cannot exceed 50 characters`);
        } else if (validOptions && !validOptions.includes(trimmedRestriction.toLowerCase() as any)) {
          errors.push(`${category} item "${restriction}" is not a recognized option`);
        }
      }
    });

    // Check for duplicates
    const uniqueRestrictions = new Set(restrictions.map(r => r.trim().toLowerCase()));
    if (uniqueRestrictions.size !== restrictions.length) {
      errors.push(`${category} contains duplicate entries`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates dietary restrictions object
 * @param dietaryRestrictions - Dietary restrictions to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateDietaryRestrictions(dietaryRestrictions: DietaryRestrictions): UserValidationResult {
  const allErrors: string[] = [];

  if (!dietaryRestrictions || typeof dietaryRestrictions !== 'object') {
    allErrors.push('Dietary restrictions must be an object');
    return { isValid: false, errors: allErrors };
  }

  // Validate each category
  const allergiesValidation = validateRestrictionCategory(
    dietaryRestrictions.allergies, 
    'Allergies', 
    USER_ALLERGENS
  );
  allErrors.push(...allergiesValidation.errors);

  const religiousValidation = validateRestrictionCategory(
    dietaryRestrictions.religious, 
    'Religious restrictions', 
    RELIGIOUS_RESTRICTIONS
  );
  allErrors.push(...religiousValidation.errors);

  const medicalValidation = validateRestrictionCategory(
    dietaryRestrictions.medical, 
    'Medical restrictions', 
    MEDICAL_RESTRICTIONS
  );
  allErrors.push(...medicalValidation.errors);

  const lifestyleValidation = validateRestrictionCategory(
    dietaryRestrictions.lifestyle, 
    'Lifestyle preferences', 
    LIFESTYLE_PREFERENCES
  );
  allErrors.push(...lifestyleValidation.errors);

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Validates alert level
 * @param alertLevel - Alert level to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateAlertLevel(alertLevel: AlertLevel): UserValidationResult {
  const errors: string[] = [];

  if (!alertLevel || typeof alertLevel !== 'string') {
    errors.push('Alert level is required and must be a string');
  } else if (!ALERT_LEVELS.includes(alertLevel)) {
    errors.push(`Alert level must be one of: ${ALERT_LEVELS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user preferences object
 * @param preferences - User preferences to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateUserPreferences(preferences: UserPreferences): UserValidationResult {
  const errors: string[] = [];

  if (!preferences || typeof preferences !== 'object') {
    errors.push('User preferences must be an object');
    return { isValid: false, errors };
  }

  // Validate alert level
  if (preferences.alertLevel === undefined || preferences.alertLevel === null) {
    errors.push('Alert level is required');
  } else {
    const alertLevelValidation = validateAlertLevel(preferences.alertLevel);
    errors.push(...alertLevelValidation.errors);
  }

  // Validate notifications
  if (preferences.notifications === undefined || preferences.notifications === null) {
    errors.push('Notifications preference is required');
  } else if (typeof preferences.notifications !== 'boolean') {
    errors.push('Notifications preference must be a boolean');
  }

  // Validate offline mode
  if (preferences.offlineMode === undefined || preferences.offlineMode === null) {
    errors.push('Offline mode preference is required');
  } else if (typeof preferences.offlineMode !== 'boolean') {
    errors.push('Offline mode preference must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a complete User object
 * @param user - User to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateUser(user: Partial<User>): UserValidationResult {
  const allErrors: string[] = [];

  // Validate required fields
  if (!user.profileId) {
    allErrors.push('Profile ID is required');
  } else {
    const profileIdValidation = validateProfileId(user.profileId);
    allErrors.push(...profileIdValidation.errors);
  }

  if (!user.name) {
    allErrors.push('User name is required');
  } else {
    const nameValidation = validateUserName(user.name);
    allErrors.push(...nameValidation.errors);
  }

  if (!user.dietaryRestrictions) {
    allErrors.push('Dietary restrictions are required');
  } else {
    const dietaryRestrictionsValidation = validateDietaryRestrictions(user.dietaryRestrictions);
    allErrors.push(...dietaryRestrictionsValidation.errors);
  }

  if (!user.preferences) {
    allErrors.push('User preferences are required');
  } else {
    const preferencesValidation = validateUserPreferences(user.preferences);
    allErrors.push(...preferencesValidation.errors);
  }

  if (!user.createdAt) {
    allErrors.push('Created at timestamp is required');
  } else if (!(user.createdAt instanceof Date)) {
    allErrors.push('Created at must be a Date object');
  }

  if (!user.lastActive) {
    allErrors.push('Last active timestamp is required');
  } else if (!(user.lastActive instanceof Date)) {
    allErrors.push('Last active must be a Date object');
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Validates CreateUserInput object
 * @param input - CreateUserInput to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateCreateUserInput(input: Partial<CreateUserInput>): UserValidationResult {
  // Convert to User-like object for validation
  const userForValidation: Partial<User> = {
    ...input,
    createdAt: new Date(),
    lastActive: new Date()
  };

  return validateUser(userForValidation);
}

/**
 * Validates UpdateUserInput object
 * @param input - UpdateUserInput to validate
 * @returns ValidationResult with validation status and errors
 */
export function validateUpdateUserInput(input: UpdateUserInput): UserValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    errors.push('Update input must be an object');
    return { isValid: false, errors };
  }

  // Validate each field if present
  if (input.name !== undefined) {
    const nameValidation = validateUserName(input.name);
    errors.push(...nameValidation.errors);
  }

  if (input.dietaryRestrictions !== undefined) {
    // For partial updates, we need to validate the structure but allow partial data
    if (typeof input.dietaryRestrictions !== 'object' || input.dietaryRestrictions === null) {
      errors.push('Dietary restrictions must be an object');
    } else {
      // Validate each category if present
      if (input.dietaryRestrictions.allergies !== undefined) {
        const allergiesValidation = validateRestrictionCategory(
          input.dietaryRestrictions.allergies, 
          'Allergies', 
          USER_ALLERGENS
        );
        errors.push(...allergiesValidation.errors);
      }

      if (input.dietaryRestrictions.religious !== undefined) {
        const religiousValidation = validateRestrictionCategory(
          input.dietaryRestrictions.religious, 
          'Religious restrictions', 
          RELIGIOUS_RESTRICTIONS
        );
        errors.push(...religiousValidation.errors);
      }

      if (input.dietaryRestrictions.medical !== undefined) {
        const medicalValidation = validateRestrictionCategory(
          input.dietaryRestrictions.medical, 
          'Medical restrictions', 
          MEDICAL_RESTRICTIONS
        );
        errors.push(...medicalValidation.errors);
      }

      if (input.dietaryRestrictions.lifestyle !== undefined) {
        const lifestyleValidation = validateRestrictionCategory(
          input.dietaryRestrictions.lifestyle, 
          'Lifestyle preferences', 
          LIFESTYLE_PREFERENCES
        );
        errors.push(...lifestyleValidation.errors);
      }
    }
  }

  if (input.preferences !== undefined) {
    // For partial updates, validate the structure but allow partial data
    if (typeof input.preferences !== 'object' || input.preferences === null) {
      errors.push('User preferences must be an object');
    } else {
      if (input.preferences.alertLevel !== undefined) {
        const alertLevelValidation = validateAlertLevel(input.preferences.alertLevel);
        errors.push(...alertLevelValidation.errors);
      }

      if (input.preferences.notifications !== undefined) {
        if (typeof input.preferences.notifications !== 'boolean') {
          errors.push('Notifications preference must be a boolean');
        }
      }

      if (input.preferences.offlineMode !== undefined) {
        if (typeof input.preferences.offlineMode !== 'boolean') {
          errors.push('Offline mode preference must be a boolean');
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}