/**
 * Application-wide constants
 * Centralized configuration values and constants
 */

// App metadata
export const APP_CONFIG = {
  name: 'SMARTIES',
  version: '1.0.0',
  description: 'Scan-based Mobile Allergen Risk Tracking & Intelligence Suite',
  author: 'SMARTIES Team',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  openFoodFacts: 'https://world.openfoodfacts.org/api/v0/product',
  usda: 'https://api.nal.usda.gov/fdc/v1',
  barcodeLookup: 'https://api.barcodelookup.com/v3/products',
} as const;

// Dietary restriction categories
export const DIETARY_CATEGORIES = {
  allergies: [
    'milk', 'eggs', 'fish', 'shellfish', 'tree_nuts', 
    'peanuts', 'wheat', 'soy', 'sesame'
  ],
  medical: [
    'diabetes', 'hypertension', 'celiac', 'kidney_disease', 
    'heart_disease', 'lactose_intolerance'
  ],
  religious: [
    'halal', 'kosher', 'hindu_vegetarian', 'jain', 'buddhist'
  ],
  lifestyle: [
    'vegan', 'vegetarian', 'keto', 'paleo', 'organic_only', 
    'non_gmo', 'gluten_free', 'low_sodium', 'low_sugar'
  ],
} as const;

// Alert levels and colors
export const ALERT_LEVELS = {
  safe: {
    level: 'safe',
    color: '#4CAF50', // Green
    icon: 'check-circle',
    priority: 0,
  },
  warning: {
    level: 'warning',
    color: '#FF9800', // Orange
    icon: 'warning',
    priority: 1,
  },
  danger: {
    level: 'danger',
    color: '#F44336', // Red
    icon: 'error',
    priority: 2,
  },
} as const;

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  scanTimeout: 10000, // 10 seconds
  apiTimeout: 5000, // 5 seconds
  databaseTimeout: 3000, // 3 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second
} as const;

// Cache settings
export const CACHE_SETTINGS = {
  productCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  userProfileCacheDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
  scanHistoryCacheDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  maxCacheSize: 100, // Maximum number of cached items
} as const;

// Validation rules
export const VALIDATION_RULES = {
  upc: {
    minLength: 8,
    maxLength: 13,
    pattern: /^(\d{8}|\d{12}|\d{13})$/,
  },
  userId: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
  },
  productName: {
    minLength: 1,
    maxLength: 200,
  },
  ingredients: {
    maxItems: 100,
    maxItemLength: 100,
  },
} as const;

// Feature flags
export const FEATURE_FLAGS = {
  offlineMode: true,
  locationTracking: false, // Disabled for privacy by default
  analytics: true,
  crashReporting: true,
  betaFeatures: false,
  aiAnalysis: true,
  voiceAssistant: false, // Future feature
  imageRecognition: false, // Future feature
} as const;

// Notification settings
export const NOTIFICATION_SETTINGS = {
  types: {
    allergen_warning: {
      title: 'Allergen Warning',
      priority: 'high',
      sound: true,
      vibration: true,
    },
    product_recall: {
      title: 'Product Recall',
      priority: 'high',
      sound: true,
      vibration: true,
    },
    dietary_violation: {
      title: 'Dietary Restriction Violation',
      priority: 'medium',
      sound: true,
      vibration: false,
    },
    scan_complete: {
      title: 'Scan Complete',
      priority: 'low',
      sound: false,
      vibration: true,
    },
  },
} as const;

// Language support
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
} as const;

// Default user preferences
export const DEFAULT_USER_PREFERENCES = {
  strict_mode: true,
  notification_level: 'medium' as const,
  language: 'en',
  theme: 'auto' as const,
  sound_enabled: true,
  vibration_enabled: true,
} as const;

// Database collection names
export const COLLECTIONS = {
  products: 'products',
  users: 'users',
  scanHistory: 'scan_history',
  productCache: 'product_cache',
  userSessions: 'user_sessions',
} as const;

// Error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  API_ERROR: 'API_ERROR',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  QUERY_ERROR: 'QUERY_ERROR',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_UPC: 'INVALID_UPC',
  INVALID_USER_ID: 'INVALID_USER_ID',
  
  // Scanner errors
  SCANNER_ERROR: 'SCANNER_ERROR',
  CAMERA_ERROR: 'CAMERA_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  
  // AI service errors
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  ANALYSIS_ERROR: 'ANALYSIS_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  
  // Product errors
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  PRODUCT_DATA_INCOMPLETE: 'PRODUCT_DATA_INCOMPLETE',
  
  // User errors
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  PROFILE_INCOMPLETE: 'PROFILE_INCOMPLETE',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SCAN_COMPLETE: 'Product scanned successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  PRODUCT_CACHED: 'Product information saved',
  SYNC_COMPLETE: 'Data synchronized successfully',
} as const;