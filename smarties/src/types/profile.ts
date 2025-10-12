/**
 * Enhanced profile type definitions for SMARTIES app
 * 
 * This file defines the enhanced types for the profile screen
 * including dietary restrictions with severity levels.
 */

import { NavigationProp, RouteProp } from '@react-navigation/native';

// Enhanced severity levels for dietary restrictions
export enum SeverityLevel {
  IRRITATION = 'irritation',
  SEVERE = 'severe',
  ANAPHYLACTIC = 'anaphylactic'
}

// Enhanced dietary restriction with severity
export interface DietaryRestriction {
  id: string;
  name: string;
  type: RestrictionType;
  category: RestrictionCategory;
  severity: SeverityLevel;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Dietary restriction categories
export enum RestrictionCategory {
  ALLERGEN = 'allergen',
  RELIGIOUS = 'religious',
  LIFESTYLE = 'lifestyle'
}

// Allergen types based on FDA Top 9 + additional
export enum AllergenType {
  PEANUTS = 'peanuts',
  TREE_NUTS = 'tree_nuts',
  MILK = 'milk',
  EGGS = 'eggs',
  FISH = 'fish',
  SHELLFISH = 'shellfish',
  SOY = 'soy',
  WHEAT = 'wheat',
  SESAME = 'sesame',
  GLUTEN = 'gluten'
}

// Religious dietary restrictions
export enum ReligiousType {
  HALAL = 'halal',
  KOSHER = 'kosher',
  HINDU_VEGETARIAN = 'hindu_vegetarian',
  JAIN = 'jain',
  BUDDHIST = 'buddhist'
}

// Lifestyle dietary choices
export enum LifestyleType {
  VEGAN = 'vegan',
  VEGETARIAN = 'vegetarian',
  KETO = 'keto',
  PALEO = 'paleo',
  ORGANIC_ONLY = 'organic_only',
  NON_GMO = 'non_gmo',
  LOW_SODIUM = 'low_sodium',
  SUGAR_FREE = 'sugar_free'
}

// Union type for all restriction types
export type RestrictionType = AllergenType | ReligiousType | LifestyleType;

// Profile screen state management
export interface ProfileScreenState {
  restrictions: DietaryRestriction[];
  isLoading: boolean;
  isEditing: boolean;
  selectedRestriction: string | null;
}

// Component prop interfaces
export interface ProfileScreenProps {
  navigation: NavigationProp<any>;
  route: RouteProp<any>;
}

export interface RestrictionCardProps {
  restriction: DietaryRestriction;
  onSeverityChange: (id: string, severity: SeverityLevel) => void;
  onDelete: (id: string) => void;
}

export interface SeveritySliderProps {
  value: SeverityLevel;
  onChange: (severity: SeverityLevel) => void;
  disabled?: boolean;
}

export interface AllergenIconProps {
  allergenType: string;
  size?: number;
  color?: string;
}

export interface AddRestrictionButtonProps {
  onPress: () => void;
  disabled?: boolean;
}

// Profile service interface
export interface IProfileService {
  getUserRestrictions(): Promise<DietaryRestriction[]>;
  updateRestriction(restriction: DietaryRestriction): Promise<void>;
  addRestriction(restriction: Omit<DietaryRestriction, 'id' | 'createdAt' | 'updatedAt'>): Promise<DietaryRestriction>;
  deleteRestriction(id: string): Promise<void>;
  syncProfile(): Promise<void>;
}

// Error handling types
export enum ProfileErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  STORAGE_ERROR = 'storage_error',
  SYNC_ERROR = 'sync_error'
}

export interface ProfileError {
  type: ProfileErrorType;
  message: string;
  details?: any;
}

// Validation functions for dietary restriction data
export const validateDietaryRestriction = (restriction: Partial<DietaryRestriction>): ProfileError[] => {
  const errors: ProfileError[] = [];

  // Validate name
  if (!restriction.name || restriction.name.trim().length === 0) {
    errors.push({
      type: ProfileErrorType.VALIDATION_ERROR,
      message: 'Dietary restriction name is required'
    });
  } else if (restriction.name.trim().length > 100) {
    errors.push({
      type: ProfileErrorType.VALIDATION_ERROR,
      message: 'Dietary restriction name must be 100 characters or less'
    });
  }

  // Validate type
  if (!restriction.type || !validateRestrictionType(restriction.type)) {
    errors.push({
      type: ProfileErrorType.VALIDATION_ERROR,
      message: 'Valid restriction type is required'
    });
  }

  // Validate severity
  if (!restriction.severity || !Object.values(SeverityLevel).includes(restriction.severity)) {
    errors.push({
      type: ProfileErrorType.VALIDATION_ERROR,
      message: 'Valid severity level is required'
    });
  }



  // Validate isActive
  if (restriction.isActive !== undefined && typeof restriction.isActive !== 'boolean') {
    errors.push({
      type: ProfileErrorType.VALIDATION_ERROR,
      message: 'isActive must be a boolean value'
    });
  }

  return errors;
};

export const validateSeverityLevel = (severity: string): boolean => {
  return Object.values(SeverityLevel).includes(severity as SeverityLevel);
};

export const validateAllergenType = (type: string): boolean => {
  return Object.values(AllergenType).includes(type as AllergenType);
};

export const validateRestrictionType = (type: string): boolean => {
  return Object.values(AllergenType).includes(type as AllergenType) ||
         Object.values(ReligiousType).includes(type as ReligiousType) ||
         Object.values(LifestyleType).includes(type as LifestyleType);
};

// Helper function to create a new dietary restriction with defaults
export const createDietaryRestriction = (
  name: string,
  type: RestrictionType,
  category: RestrictionCategory,
  severity: SeverityLevel = SeverityLevel.SEVERE
): Omit<DietaryRestriction, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    name: name.trim(),
    type,
    category,
    severity,
    isActive: true
  };
};

// Helper function to get severity level display name
export const getSeverityDisplayName = (severity: SeverityLevel): string => {
  switch (severity) {
    case SeverityLevel.IRRITATION:
      return 'Irritation';
    case SeverityLevel.SEVERE:
      return 'Severe';
    case SeverityLevel.ANAPHYLACTIC:
      return 'Anaphylactic';
    default:
      return 'Unknown';
  }
};

// Helper function to get restriction type display name
export const getRestrictionDisplayName = (type: RestrictionType): string => {
  // Allergen types
  if (Object.values(AllergenType).includes(type as AllergenType)) {
    switch (type as AllergenType) {
      case AllergenType.PEANUTS:
        return 'Peanuts';
      case AllergenType.TREE_NUTS:
        return 'Tree Nuts';
      case AllergenType.MILK:
        return 'Milk';
      case AllergenType.EGGS:
        return 'Eggs';
      case AllergenType.FISH:
        return 'Fish';
      case AllergenType.SHELLFISH:
        return 'Shellfish';
      case AllergenType.SOY:
        return 'Soy';
      case AllergenType.WHEAT:
        return 'Wheat';
      case AllergenType.SESAME:
        return 'Sesame';
      case AllergenType.GLUTEN:
        return 'Gluten';
    }
  }
  
  // Religious types
  if (Object.values(ReligiousType).includes(type as ReligiousType)) {
    switch (type as ReligiousType) {
      case ReligiousType.HALAL:
        return 'Halal';
      case ReligiousType.KOSHER:
        return 'Kosher';
      case ReligiousType.HINDU_VEGETARIAN:
        return 'Hindu Vegetarian';
      case ReligiousType.JAIN:
        return 'Jain';
      case ReligiousType.BUDDHIST:
        return 'Buddhist';
    }
  }
  
  // Lifestyle types
  if (Object.values(LifestyleType).includes(type as LifestyleType)) {
    switch (type as LifestyleType) {
      case LifestyleType.VEGAN:
        return 'Vegan';
      case LifestyleType.VEGETARIAN:
        return 'Vegetarian';
      case LifestyleType.KETO:
        return 'Keto';
      case LifestyleType.PALEO:
        return 'Paleo';
      case LifestyleType.ORGANIC_ONLY:
        return 'Organic Only';
      case LifestyleType.NON_GMO:
        return 'Non-GMO';
      case LifestyleType.LOW_SODIUM:
        return 'Low Sodium';
      case LifestyleType.SUGAR_FREE:
        return 'Sugar Free';
    }
  }
  
  return 'Unknown';
};

// Helper function to get allergen type display name (for backward compatibility)
export const getAllergenDisplayName = (type: AllergenType): string => {
  return getRestrictionDisplayName(type);
};

// Helper function to get restriction category
export const getRestrictionCategory = (type: RestrictionType): RestrictionCategory => {
  if (Object.values(AllergenType).includes(type as AllergenType)) {
    return RestrictionCategory.ALLERGEN;
  }
  if (Object.values(ReligiousType).includes(type as ReligiousType)) {
    return RestrictionCategory.RELIGIOUS;
  }
  if (Object.values(LifestyleType).includes(type as LifestyleType)) {
    return RestrictionCategory.LIFESTYLE;
  }
  return RestrictionCategory.ALLERGEN; // Default fallback
};

// Helper function to get severity color for UI
export const getSeverityColor = (severity: SeverityLevel): string => {
  switch (severity) {
    case SeverityLevel.IRRITATION:
      return '#4CAF50'; // Green
    case SeverityLevel.SEVERE:
      return '#FF9800'; // Orange
    case SeverityLevel.ANAPHYLACTIC:
      return '#F44336'; // Red
    default:
      return '#999999'; // Gray
  }
};