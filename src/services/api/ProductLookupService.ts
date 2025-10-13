import { Product, OpenFoodFactsResponse, ProductLookupResult } from '../../types/product';

export class ProductLookupService {
  private readonly baseUrl = 'https://world.openfoodfacts.org/api/v2/product';
  private readonly userAgent = 'SMARTIES/1.0 (https://github.com/smarties-app/smarties)';
  private readonly timeout = 10000; // 10 seconds

  async lookupProduct(barcode: string): Promise<ProductLookupResult> {
    try {
      const normalizedBarcode = this.normalizeBarcode(barcode);
      const url = `${this.baseUrl}/${normalizedBarcode}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500) {
          return { success: false, error: 'Server error. Please try again later.' };
        }
        return { success: false, error: `API error: ${response.status}` };
      }

      const data: OpenFoodFactsResponse = await response.json();
      
      if (data.status === 0) {
        return { success: false, error: 'Product not found' };
      }

      if (!data.product) {
        return { success: false, error: 'Invalid API response' };
      }

      const product = this.parseProduct(data.product, normalizedBarcode);
      return { success: true, product };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timeout. Please check your connection.' };
        }
        return { success: false, error: `Network error: ${error.message}` };
      }
      return { success: false, error: 'Unknown error occurred' };
    }
  }

  private normalizeBarcode(barcode: string): string {
    // Remove any non-digit characters and pad to 13 digits
    const digits = barcode.replace(/\D/g, '');
    return digits.padStart(13, '0');
  }

  private parseProduct(offProduct: any, barcode: string): Product {
    const allergens = this.parseAllergens(offProduct.allergens);
    
    return {
      barcode,
      name: offProduct.product_name || 'Unknown Product',
      ingredients: offProduct.ingredients_text,
      allergens,
      nutritionData: this.parseNutrition(offProduct.nutriments),
      imageUrl: offProduct.image_url,
      brands: offProduct.brands,
    };
  }

  private parseAllergens(allergensString?: string): string[] {
    if (!allergensString) return [];
    
    return allergensString
      .split(',')
      .map(allergen => allergen.trim().replace(/^en:/, ''))
      .filter(allergen => allergen.length > 0);
  }

  private parseNutrition(nutriments?: any): any {
    if (!nutriments) return undefined;

    return {
      energy: nutriments.energy_100g,
      fat: nutriments.fat_100g,
      saturatedFat: nutriments['saturated-fat_100g'],
      carbohydrates: nutriments.carbohydrates_100g,
      sugars: nutriments.sugars_100g,
      fiber: nutriments.fiber_100g,
      proteins: nutriments.proteins_100g,
      salt: nutriments.salt_100g,
      sodium: nutriments.sodium_100g,
    };
  }

  async retryLookup(barcode: string, maxRetries: number = 3): Promise<ProductLookupResult> {
    let lastError = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.lookupProduct(barcode);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error || 'Unknown error';
      
      // Don't retry for "not found" errors
      if (lastError.includes('not found')) {
        break;
      }
      
      // Exponential backoff
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    
    return { success: false, error: lastError };
  }
}
