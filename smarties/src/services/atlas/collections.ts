/**
 * MongoDB Atlas collections interface
 * Defines collection operations using proper data models
 */

import { DatabaseService } from './database';
import { Product } from '../../models/Product';
import { UserProfile } from '../../models/UserProfile';
import { ScanHistory } from '../../models/ScanHistory';

// Re-export model types for convenience
export type { Product, UserProfile, ScanHistory };

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
  findByUserId(userId: string, limit?: number): Promise<ScanHistory[]>;
  create(scanResult: ScanHistory): Promise<ScanHistory>;
}

// Concrete implementations using DatabaseService

export class ProductRepository implements ProductService {
  constructor(private dbService: DatabaseService) {}

  async findByUPC(upc: string): Promise<Product | null> {
    return await this.dbService.findProductByUPC(upc);
  }

  async create(_product: Product): Promise<Product> {
    // For now, we'll implement this as a simple save operation
    // In a full implementation, this would use insertOne
    throw new Error('Product creation not implemented - use external APIs for product data');
  }

  async update(_upc: string, _product: Partial<Product>): Promise<Product | null> {
    // For now, we'll implement this as a simple save operation
    // In a full implementation, this would use updateOne
    throw new Error('Product updates not implemented - products are read-only from external sources');
  }
}

export class UserRepository implements UserService {
  constructor(private dbService: DatabaseService) {}

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return await this.dbService.getUserProfile(userId);
  }

  async create(profile: UserProfile): Promise<UserProfile> {
    return await this.dbService.saveUserProfile(profile);
  }

  async update(userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> {
    // Get existing profile first
    const existingProfile = await this.findByUserId(userId);
    if (!existingProfile) {
      return null;
    }

    // Merge updates with existing profile
    const updatedProfile: UserProfile = {
      ...existingProfile,
      ...profile,
      user_id: userId, // Ensure user_id doesn't change
      last_active: new Date(),
      // Ensure preferences are properly typed
      preferences: {
        ...existingProfile.preferences,
        ...profile.preferences
      }
    };

    return await this.dbService.saveUserProfile(updatedProfile);
  }
}

export class ScanHistoryRepository implements ScanHistoryService {
  constructor(private dbService: DatabaseService) {}

  async findByUserId(userId: string, limit: number = 50): Promise<ScanHistory[]> {
    return await this.dbService.getScanHistory(userId, limit);
  }

  async create(scanResult: ScanHistory): Promise<ScanHistory> {
    return await this.dbService.saveScanHistory(scanResult);
  }
}