/**
 * Product Search Service
 * Orchestrates product lookup and allergen analysis
 */

import { ProductService } from './ProductService';
import { SmartiesAPIClient } from './api/SmartiesAPIClient';
import { AllergenService, AllergenAnalysisResult } from './AllergenService';
import { ProfileService } from './profile/ProfileService';
import { Product, UserProfile } from '../types';

export interface ProductSearchResult {
  success: boolean;
  product?: Product;
  analysisResult?: AllergenAnalysisResult;
  error?: string;
}

export class ProductSearchService {
  private productService: ProductService;
  private allergenService: AllergenService;
  private profileService: ProfileService;

  constructor() {
    const apiClient = new SmartiesAPIClient();
    this.productService = new ProductService(apiClient);
    this.allergenService = new AllergenService();
    this.profileService = new ProfileService();
  }

  /**
   * Search for product by UPC and analyze for allergens
   */
  async searchAndAnalyze(upc: string): Promise<ProductSearchResult> {
    try {
      // Get product data
      const productResponse = await this.productService.searchByUPC(upc);
      
      if (!productResponse.success || !productResponse.data) {
        return {
          success: false,
          error: productResponse.error || 'Product not found'
        };
      }

      const product = productResponse.data;

      // Get user profile
      const userProfile = await this.getUserProfile();
      
      if (!userProfile) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      // Analyze for allergens
      const analysisResult = this.allergenService.analyzeProduct(product, userProfile);

      return {
        success: true,
        product,
        analysisResult
      };

    } catch (error) {
      console.error('Product search and analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get current user profile with restrictions
   */
  private async getUserProfile(): Promise<UserProfile | null> {
    try {
      const restrictions = await this.profileService.getUserRestrictions();
      
      // Create a basic user profile with restrictions
      return {
        id: 'current-user',
        name: 'Current User',
        email: 'user@example.com',
        restrictions,
        preferences: {
          notifications: true,
          autoSave: true,
          language: 'en',
          theme: 'light'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  }
}