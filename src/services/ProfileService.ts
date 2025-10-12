import AsyncStorage from '@react-native-async-storage/async-storage';
import { DietaryRestriction, AllergenType, SeverityLevel } from '../types/DietaryRestriction';

export interface ProfileService {
  getRestrictions(): Promise<DietaryRestriction[]>;
  addRestriction(restriction: DietaryRestriction): Promise<void>;
  updateRestriction(id: string, updates: Partial<DietaryRestriction>): Promise<void>;
  deleteRestriction(id: string): Promise<void>;
  syncProfile(): Promise<void>;
}

export class MockProfileService implements ProfileService {
  private static readonly STORAGE_KEY = 'dietary_restrictions';
  private restrictions: DietaryRestriction[] = [];

  async getRestrictions(): Promise<DietaryRestriction[]> {
    try {
      const stored = await AsyncStorage.getItem(MockProfileService.STORAGE_KEY);
      this.restrictions = stored ? JSON.parse(stored) : [];
      return this.restrictions;
    } catch (error) {
      console.error('Failed to load restrictions:', error);
      return [];
    }
  }

  async addRestriction(restriction: DietaryRestriction): Promise<void> {
    this.validateRestriction(restriction);
    this.restrictions.push(restriction);
    await this.saveRestrictions();
  }

  async updateRestriction(id: string, updates: Partial<DietaryRestriction>): Promise<void> {
    const index = this.restrictions.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Restriction not found');
    
    this.restrictions[index] = { ...this.restrictions[index], ...updates };
    await this.saveRestrictions();
  }

  async deleteRestriction(id: string): Promise<void> {
    this.restrictions = this.restrictions.filter(r => r.id !== id);
    await this.saveRestrictions();
  }

  async syncProfile(): Promise<void> {
    // Mock sync - in real implementation would sync with backend
    console.log('Profile synced');
  }

  private async saveRestrictions(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        MockProfileService.STORAGE_KEY,
        JSON.stringify(this.restrictions)
      );
    } catch (error) {
      console.error('Failed to save restrictions:', error);
      throw error;
    }
  }

  private validateRestriction(restriction: DietaryRestriction): void {
    if (!restriction.id || !restriction.allergen || !restriction.severity) {
      throw new Error('Invalid restriction data');
    }
    
    if (!Object.values(AllergenType).includes(restriction.allergen)) {
      throw new Error('Invalid allergen type');
    }
    
    if (!Object.values(SeverityLevel).includes(restriction.severity)) {
      throw new Error('Invalid severity level');
    }
  }
}
