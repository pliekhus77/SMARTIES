/**
 * Type definitions index
 * Consolidated exports for all SMARTIES types
 */

// Product and API types
export * from './product';

// Profile and dietary restriction types  
export * from './profile';

// Navigation types
export * from './navigation';

// Scan and barcode types
export * from './scan';

// Re-export commonly used types for convenience
export type {
  Product,
  APIProductResponse,
  UserProfile,
  DietaryRestriction,
  UserPreferences
} from './product';

export type {
  SeverityLevel,
  RestrictionCategory,
  AllergenType,
  ReligiousType,
  LifestyleType
} from './profile';

export type {
  RootTabParamList,
  ScanStackParamList,
  ScanScreenProps,
  ResultScreenProps
} from './navigation';

export type {
  ScanResult,
  ScanHistory,
  CompleteScanResult,
  ScanSession
} from './scan';