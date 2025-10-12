/**
 * SMARTIES API Client Service
 * Implements Requirements 1.1, 1.4 from SMARTIES API integration specification
 */

import { Product } from '../../types/product';

export interface SmartiesAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class SmartiesAPIClient {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string = 'http://localhost:3000/api', apiKey: string = '') {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  /**
   * Search product by UPC barcode
   */
  async searchProductByUPC(upc: string): Promise<Product | null> {
    try {
      const response = await fetch(`${this.baseURL}/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
        },
        body: JSON.stringify({ upc })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: SmartiesAPIResponse = await response.json();
      
      if (!data.success || !data.data) {
        return null;
      }

      return this.transformToProduct(data.data);
    } catch (error) {
      console.error('SMARTIES API search failed:', error);
      throw error;
    }
  }

  /**
   * Transform API response to internal Product model
   */
  private transformToProduct(apiData: any): Product {
    return {
      upc: apiData.upc || '',
      name: apiData.name || 'Unknown Product',
      brand: apiData.brand || '',
      category: apiData.category || '',
      ingredients: apiData.ingredients || [],
      allergenInfo: apiData.allergenInfo || [],
      nutritionFacts: apiData.nutritionFacts || null,
      certifications: apiData.certifications || [],
      embedding: apiData.embedding || null,
      createdAt: new Date(apiData.createdAt || Date.now()),
      updatedAt: new Date(apiData.updatedAt || Date.now())
    };
  }
}
