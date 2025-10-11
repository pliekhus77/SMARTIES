import { TestProductBuilder, TestUserProfileBuilder } from '../builders/testDataBuilders';
import { IntegrationTestUtils, IntegrationMockServices, integrationConfig } from './setup';

// Integration service that combines all components
class ScanningWorkflowService {
  async scanProduct(barcode: string, userId: string): Promise<{
    product: any;
    compliance: any;
    scanResult: any;
  }> {
    // Step 1: Validate barcode
    if (!/^\d{8,14}$/.test(barcode)) {
      throw new Error('Invalid barcode format');
    }

    // Step 2: Look up product in database
    let product = await this.findProductByBarcode(barcode);
    
    // Step 3: If not found, fetch from external API
    if (!product) {
      product = await this.fetchProductFromExternalAPI(barcode);
      if (product) {
        await this.saveProduct(product);
      }
    }

    if (!product) {
      throw new Error('Product not found');
    }

    // Step 4: Get user profile
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Step 5: Analyze dietary compliance
    const compliance = await this.analyzeDietaryCompliance(product, userProfile);

    // Step 6: Save scan result
    const scanResult = await this.saveScanResult({
      productId: product.id,
      userId,
      timestamp: new Date(),
      isCompliant: compliance.isCompliant,
      violations: compliance.violations,
      warnings: compliance.warnings,
    });

    return { product, compliance, scanResult };
  }

  private async findProductByBarcode(barcode: string): Promise<any> {
    // Simulate database lookup
    const mockResponse = IntegrationMockServices.getResponse(`db_product_${barcode}`);
    return mockResponse || null;
  }

  private async fetchProductFromExternalAPI(barcode: string): Promise<any> {
    // Simulate Open Food Facts API call
    const mockResponse = IntegrationMockServices.getResponse(`openfoodfacts_${barcode}`);
    if (mockResponse) {
      return {
        id: IntegrationTestUtils.generateTestId(),
        upc: barcode,
        name: mockResponse.product_name || 'Unknown Product',
        ingredients: mockResponse.ingredients_text?.split(', ') || [],
        allergens: mockResponse.allergens_tags || [],
      };
    }
    return null;
  }

  private async saveProduct(product: any): Promise<any> {
    // Simulate saving to database
    console.log(`Saving product ${product.id} to database`);
    return product;
  }

  private async getUserProfile(userId: string): Promise<any> {
    // Simulate user profile lookup
    const mockResponse = IntegrationMockServices.getResponse(`db_user_${userId}`);
    return mockResponse || null;
  }

  private async analyzeDietaryCompliance(product: any, userProfile: any): Promise<any> {
    // Simulate AI analysis
    const violations = product.allergens.filter((allergen: string) =>
      userProfile.allergens.includes(allergen)
    );

    const warnings: string[] = [];
    if (userProfile.dietaryRestrictions.includes('vegan')) {
      const nonVeganIngredients = ['milk', 'eggs', 'honey', 'gelatin'];
      const foundNonVegan = product.ingredients.filter((ingredient: string) =>
        nonVeganIngredients.some(nv => ingredient.toLowerCase().includes(nv))
      );
      if (foundNonVegan.length > 0) {
        warnings.push(`May contain non-vegan ingredients: ${foundNonVegan.join(', ')}`);
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
    };
  }

  private async saveScanResult(scanData: any): Promise<any> {
    // Simulate saving scan result
    const scanResult = {
      id: IntegrationTestUtils.generateTestId(),
      ...scanData,
    };
    console.log(`Saving scan result ${scanResult.id} to database`);
    return scanResult;
  }
}

describe('Scanning Workflow Integration Tests', () => {
  let scanningService: ScanningWorkflowService;
  let testUserId: string;

  beforeEach(() => {
    scanningService = new ScanningWorkflowService();
    testUserId = IntegrationTestUtils.generateTestId();
  });

  describe('Complete Scanning Workflow', () => {
    it('should complete full workflow for safe product', async () => {
      const barcode = '1234567890123';
      const userProfile = TestUserProfileBuilder.milkAllergic();

      // Mock external API response
      IntegrationMockServices.mockOpenFoodFactsResponse(barcode, {
        product_name: 'Plain Rice',
        ingredients_text: 'rice',
        allergens_tags: [],
      });

      // Mock user profile in database
      IntegrationMockServices.mockResponse(`db_user_${testUserId}`, userProfile);

      const result = await scanningService.scanProduct(barcode, testUserId);

      expect(result.product).toBeDefined();
      expect(result.product.name).toBe('Plain Rice');
      expect(result.compliance.isCompliant).toBe(true);
      expect(result.compliance.violations).toHaveLength(0);
      expect(result.scanResult).toBeDefined();
      expect(result.scanResult.isCompliant).toBe(true);
    }, integrationConfig.timeout);

    it('should detect allergen violations in workflow', async () => {
      const barcode = '1234567890124';
      const userProfile = TestUserProfileBuilder.milkAllergic();

      // Mock external API response with milk product
      IntegrationMockServices.mockOpenFoodFactsResponse(barcode, {
        product_name: 'Milk Chocolate',
        ingredients_text: 'milk, cocoa, sugar',
        allergens_tags: ['milk'],
      });

      // Mock user profile in database
      IntegrationMockServices.mockResponse(`db_user_${testUserId}`, userProfile);

      const result = await scanningService.scanProduct(barcode, testUserId);

      expect(result.product.name).toBe('Milk Chocolate');
      expect(result.compliance.isCompliant).toBe(false);
      expect(result.compliance.violations).toContain('milk');
      expect(result.scanResult.isCompliant).toBe(false);
    }, integrationConfig.timeout);

    it('should handle cached products from database', async () => {
      const barcode = '1234567890125';
      const userProfile = TestUserProfileBuilder.safeUser();
      const cachedProduct = TestProductBuilder.safeProduct();

      // Mock product already in database
      IntegrationMockServices.mockResponse(`db_product_${barcode}`, cachedProduct);
      IntegrationMockServices.mockResponse(`db_user_${testUserId}`, userProfile);

      const result = await scanningService.scanProduct(barcode, testUserId);

      expect(result.product).toEqual(cachedProduct);
      expect(result.compliance.isCompliant).toBe(true);
    }, integrationConfig.timeout);

    it('should handle vegan dietary restrictions', async () => {
      const barcode = '1234567890126';
      const userProfile = TestUserProfileBuilder.vegan();

      // Mock product with milk
      IntegrationMockServices.mockOpenFoodFactsResponse(barcode, {
        product_name: 'Milk Chocolate',
        ingredients_text: 'milk, cocoa, sugar',
        allergens_tags: [],
      });

      IntegrationMockServices.mockResponse(`db_user_${testUserId}`, userProfile);

      const result = await scanningService.scanProduct(barcode, testUserId);

      expect(result.compliance.warnings).toContain(
        expect.stringContaining('May contain non-vegan ingredients')
      );
    }, integrationConfig.timeout);
  });

  describe('Error Handling', () => {
    it('should handle invalid barcode format', async () => {
      const invalidBarcode = 'invalid123';

      await expect(scanningService.scanProduct(invalidBarcode, testUserId))
        .rejects.toThrow('Invalid barcode format');
    });

    it('should handle product not found', async () => {
      const barcode = '9999999999999';
      const userProfile = TestUserProfileBuilder.safeUser();

      IntegrationMockServices.mockResponse(`db_user_${testUserId}`, userProfile);
      // No mock response for product - simulates not found

      await expect(scanningService.scanProduct(barcode, testUserId))
        .rejects.toThrow('Product not found');
    });

    it('should handle user profile not found', async () => {
      const barcode = '1234567890127';
      const invalidUserId = 'invalid_user';

      IntegrationMockServices.mockOpenFoodFactsResponse(barcode, {
        product_name: 'Test Product',
        ingredients_text: 'test',
        allergens_tags: [],
      });

      // No mock response for user - simulates not found

      await expect(scanningService.scanProduct(barcode, invalidUserId))
        .rejects.toThrow('User profile not found');
    });
  });

  describe('Performance Tests', () => {
    it('should complete workflow within acceptable time', async () => {
      const barcode = '1234567890128';
      const userProfile = TestUserProfileBuilder.safeUser();

      IntegrationMockServices.mockOpenFoodFactsResponse(barcode, {
        product_name: 'Fast Product',
        ingredients_text: 'rice',
        allergens_tags: [],
      });

      IntegrationMockServices.mockResponse(`db_user_${testUserId}`, userProfile);

      const startTime = Date.now();
      const result = await scanningService.scanProduct(barcode, testUserId);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });
  });
});
