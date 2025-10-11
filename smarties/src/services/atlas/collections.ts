/**
 * MongoDB Atlas collections interface
 * Defines data models and collection operations
 */

// Product data model
export interface Product {
  _id?: string;
  upc: string;
  name: string;
  brand: string;
  ingredients: string[];
  allergens: string[];
  nutritional_info: {
    calories?: number;
    sodium?: number;
    sugar?: number;
    [key: string]: number | undefined;
  };
  dietary_flags: {
    vegan?: boolean;
    kosher?: boolean;
    halal?: boolean;
    gluten_free?: boolean;
  };
  source: string;
  last_updated: Date;
  confidence_score: number;
}

// User profile data model
export interface UserProfile {
  _id?: string;
  user_id: string;
  dietary_restrictions: {
    allergies: string[];
    medical: string[];
    religious: string[];
    lifestyle: string[];
  };
  preferences: {
    strict_mode: boolean;
    notification_level: string;
    language: string;
  };
  created_at: Date;
  last_active: Date;
}

// Scan history data model
export interface ScanHistory {
  _id?: string;
  user_id: string;
  product_upc: string;
  scan_timestamp: Date;
  compliance_result: {
    safe: boolean;
    violations: string[];
    warnings: string[];
    confidence: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Collection service interfaces
export interface ProductService {
  findByUPC(upc: string): Promise<Product | null>;
  create(product: Product): Promise<Product>;
  update(upc: string, product: Partial<Product>): Promise<Product | null>;
}

export interface UserService {
  findByUserId(userId: string): Promise<UserProfile | null>;
  create(profile: UserProfile): Promise<UserProfile>;
  update(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null>;
}

export interface ScanHistoryService {
  findByUserId(userId: string): Promise<ScanHistory[]>;
  create(scanResult: ScanHistory): Promise<ScanHistory>;
}