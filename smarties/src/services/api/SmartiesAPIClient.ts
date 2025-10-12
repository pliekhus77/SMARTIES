import { Product, APIProductResponse } from '../../types';
import { ErrorHandlingService } from '../ErrorHandlingService';
import { SMARTIES_API_BASE } from '@env';

/**
 * SMARTIES API Client for product data retrieval
 * Interfaces with the existing SMARTIES API and MongoDB database
 */
export class SmartiesAPIClient {
  private readonly apiBase: string;
  private readonly headers: Record<string, string>;
  private readonly errorHandler: ErrorHandlingService;

  constructor() {
    this.apiBase = SMARTIES_API_BASE || 'http://localhost:3002';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    this.errorHandler = ErrorHandlingService.getInstance();
  }

  /**
   * Search for a product by UPC barcode
   * @param barcode - The UPC barcode to search for
   * @returns Promise<APIProductResponse> - The API response with product data
   */
  async searchProductByUPC(barcode: string): Promise<APIProductResponse> {
    return this.errorHandler.retryWithBackoff(async () => {
      try {
        const endpoint = `${this.apiBase}/api/products/${barcode}`;
        
        const response = await this.errorHandler.safeFetch(endpoint, {
          method: 'GET',
          headers: this.headers,
        });

        if (!response.ok) {
          if (response.status === 404) {
            return {
              success: false,
              error: 'Product not found in database'
            };
          }
          
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return this.transformAPIResponse(data);
      } catch (error) {
        console.error('SmartiesAPIClient: Error searching product by UPC:', error);
        
        if (error instanceof Error) {
          await this.errorHandler.handleNetworkError(error, {
            operation: 'searchProductByUPC',
            timestamp: new Date()
          });
        }
        
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown API error'
        };
      }
    });
  }

  /**
   * Get detailed product information by product ID
   * @param productId - The MongoDB product ID
   * @returns Promise<Product> - The product details
   */
  async getProductDetails(productId: string): Promise<Product> {
    try {
      const endpoint = `${this.apiBase}/api/products/${productId}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to get product details: ${response.status}`);
      }

      const data = await response.json();
      return this.transformToProduct(data.data);
    } catch (error) {
      console.error('SmartiesAPIClient: Error getting product details:', error);
      throw error;
    }
  }

  /**
   * Transform API response to standardized format
   * @param data - Raw API response data
   * @returns APIProductResponse - Standardized response format
   */
  private transformAPIResponse(data: any): APIProductResponse {
    if (!data || !data.success) {
      return {
        success: false,
        error: data?.error || 'Invalid API response'
      };
    }

    return {
      success: true,
      data: data.data
    };
  }

  /**
   * Transform raw product data to internal Product model
   * @param rawProduct - Raw product data from API
   * @returns Product - Standardized product model
   */
  private transformToProduct(rawProduct: any): Product {
    return {
      upc: rawProduct.upc || rawProduct.barcode || '',
      name: rawProduct.name || rawProduct.product_name || 'Unknown Product',
      brand: rawProduct.brand || rawProduct.brands || undefined,
      ingredients: this.parseIngredients(rawProduct.ingredients || rawProduct.ingredients_text || ''),
      allergenInfo: {
        contains: this.parseAllergens(rawProduct.allergens?.contains || rawProduct.allergens_tags || []),
        mayContain: this.parseAllergens(rawProduct.allergens?.mayContain || rawProduct.traces_tags || [])
      },
      nutritionalInfo: rawProduct.nutritionalInfo || rawProduct.nutriments || undefined,
      imageUrl: rawProduct.imageUrl || rawProduct.image_url || undefined,
      lastUpdated: rawProduct.lastUpdated ? new Date(rawProduct.lastUpdated) : new Date(),
      source: 'database'
    };
  }

  /**
   * Parse ingredients string into array
   * @param ingredientsText - Raw ingredients text
   * @returns string[] - Array of individual ingredients
   */
  private parseIngredients(ingredientsText: string): string[] {
    if (!ingredientsText || typeof ingredientsText !== 'string') {
      return [];
    }

    // Split by common delimiters and clean up
    return ingredientsText
      .split(/[,;]/)
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0)
      .map(ingredient => ingredient.replace(/^\d+\.?\s*/, '')) // Remove numbering
      .filter(ingredient => ingredient.length > 0);
  }

  /**
   * Parse allergen tags into clean allergen names
   * @param allergenTags - Raw allergen tags from API
   * @returns string[] - Clean allergen names
   */
  private parseAllergens(allergenTags: string[] | string): string[] {
    if (!allergenTags) return [];
    
    const tags = Array.isArray(allergenTags) ? allergenTags : [allergenTags];
    
    return tags
      .map(tag => {
        // Remove prefixes like "en:" from Open Food Facts style tags
        const cleaned = tag.replace(/^[a-z]{2}:/, '').toLowerCase();
        
        // Map common allergen variations to standard names
        const allergenMap: Record<string, string> = {
          'milk': 'milk',
          'dairy': 'milk',
          'lactose': 'milk',
          'eggs': 'eggs',
          'egg': 'eggs',
          'peanuts': 'peanuts',
          'peanut': 'peanuts',
          'tree-nuts': 'tree nuts',
          'nuts': 'tree nuts',
          'soy': 'soy',
          'soya': 'soy',
          'wheat': 'wheat',
          'gluten': 'wheat',
          'fish': 'fish',
          'shellfish': 'shellfish',
          'sesame': 'sesame'
        };
        
        return allergenMap[cleaned] || cleaned;
      })
      .filter(allergen => allergen.length > 0);
  }
}