/**
 * Product and API response type definitions
 */

export interface Product {
  upc: string;
  name: string;
  brand?: string;
  ingredients?: string[];
  allergenInfo?: {
    contains: string[];
    mayContain: string[];
  };
  nutritionalInfo?: any;
  imageUrl?: string;
  lastUpdated: Date;
  source: 'database' | 'api' | 'manual';
}

export interface APIProductResponse {
  success: boolean;
  data?: Product;
  error?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  restrictions: DietaryRestriction[];
  preferences: UserPreferences;
}

export interface DietaryRestriction {
  id: string;
  name: string;
  category: 'allergen' | 'religious' | 'medical' | 'lifestyle';
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylactic';
  enabled: boolean;
}

export interface UserPreferences {
  notifications: boolean;
  hapticFeedback: boolean;
  audioAlerts: boolean;
  language: string;
}