/**
 * Profile Service Interface and Implementation
 * 
 * Handles CRUD operations for dietary restrictions and profile data
 * with local storage and cloud synchronization capabilities.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { DietaryRestriction, IProfileService, SeverityLevel, AllergenType, RestrictionCategory } from '../../types/profile';

const PROFILE_STORAGE_KEY = '@smarties_profile_restrictions';

export class ProfileService implements IProfileService {
  private restrictions: DietaryRestriction[] = [];

  /**
   * Get all user dietary restrictions
   */
  async getUserRestrictions(): Promise<DietaryRestriction[]> {
    try {
      const stored = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        this.restrictions = JSON.parse(stored).map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }));
      }
      return this.restrictions;
    } catch (error) {
      console.error('Error loading restrictions:', error);
      return [];
    }
  }

  /**
   * Update an existing dietary restriction
   */
  async updateRestriction(restriction: DietaryRestriction): Promise<void> {
    try {
      const index = this.restrictions.findIndex(r => r.id === restriction.id);
      if (index !== -1) {
        this.restrictions[index] = {
          ...restriction,
          updatedAt: new Date()
        };
        await this.saveToStorage();
      }
    } catch (error) {
      console.error('Error updating restriction:', error);
      throw error;
    }
  }

  /**
   * Add a new dietary restriction
   */
  async addRestriction(
    restriction: Omit<DietaryRestriction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DietaryRestriction> {
    try {
      const newRestriction: DietaryRestriction = {
        ...restriction,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.restrictions.push(newRestriction);
      await this.saveToStorage();
      return newRestriction;
    } catch (error) {
      console.error('Error adding restriction:', error);
      throw error;
    }
  }

  /**
   * Delete a dietary restriction
   */
  async deleteRestriction(id: string): Promise<void> {
    try {
      this.restrictions = this.restrictions.filter(r => r.id !== id);
      await this.saveToStorage();
    } catch (error) {
      console.error('Error deleting restriction:', error);
      throw error;
    }
  }

  /**
   * Sync profile with cloud backend (placeholder for future implementation)
   */
  async syncProfile(): Promise<void> {
    try {
      // TODO: Implement cloud sync functionality
      console.log('Profile sync - placeholder implementation');
    } catch (error) {
      console.error('Error syncing profile:', error);
      throw error;
    }
  }

  /**
   * Save restrictions to local storage
   */
  private async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(this.restrictions));
    } catch (error) {
      console.error('Error saving to storage:', error);
      throw error;
    }
  }

  /**
   * Generate unique ID for restrictions
   */
  private generateId(): string {
    return `restriction_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Mock Profile Service for development and testing
 */
export class MockProfileService implements IProfileService {
  private mockRestrictions: DietaryRestriction[] = [
    {
      id: 'mock_1',
      name: 'Peanuts',
      type: AllergenType.PEANUTS,
      category: RestrictionCategory.ALLERGEN,
      severity: SeverityLevel.ANAPHYLACTIC,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'mock_2',
      name: 'Milk',
      type: AllergenType.MILK,
      category: RestrictionCategory.ALLERGEN,
      severity: SeverityLevel.SEVERE,
      isActive: true,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    }
  ];

  async getUserRestrictions(): Promise<DietaryRestriction[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.mockRestrictions];
  }

  async updateRestriction(restriction: DietaryRestriction): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = this.mockRestrictions.findIndex(r => r.id === restriction.id);
    if (index !== -1) {
      this.mockRestrictions[index] = {
        ...restriction,
        updatedAt: new Date()
      };
    }
  }

  async addRestriction(
    restriction: Omit<DietaryRestriction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DietaryRestriction> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newRestriction: DietaryRestriction = {
      ...restriction,
      id: `mock_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockRestrictions.push(newRestriction);
    return newRestriction;
  }

  async deleteRestriction(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.mockRestrictions = this.mockRestrictions.filter(r => r.id !== id);
  }

  async syncProfile(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Mock profile sync completed');
  }
}