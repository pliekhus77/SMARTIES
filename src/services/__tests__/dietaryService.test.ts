import { TestProductBuilder, TestUserProfileBuilder } from '../../test/builders/testDataBuilders';

// Simple dietary compliance service for testing
class DietaryService {
  async checkCompliance(product: any, userProfile: any) {
    // Check for direct allergen matches
    const violations = product.allergens.filter((allergen: string) =>
      userProfile.allergens.includes(allergen)
    );

    // Check for dietary restrictions
    const warnings: string[] = [];
    if (userProfile.dietaryRestrictions.includes('vegan')) {
      const nonVeganIngredients = ['milk', 'eggs', 'honey', 'gelatin'];
      const foundNonVegan = product.ingredients.filter((ingredient: string) =>
        nonVeganIngredients.includes(ingredient.toLowerCase())
      );
      if (foundNonVegan.length > 0) {
        warnings.push(`Contains non-vegan ingredients: ${foundNonVegan.join(', ')}`);
      }
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
    };
  }

  async analyzeProduct(product: any, userProfile: any) {
    const compliance = await this.checkCompliance(product, userProfile);
    
    return {
      product,
      compliance,
      recommendations: compliance.isCompliant 
        ? ['Product is safe for your dietary needs']
        : ['Consider alternative products', 'Check with healthcare provider if unsure'],
    };
  }
}

const dietaryService = new DietaryService();

describe('DietaryService', () => {
  describe('checkCompliance', () => {
    it('should detect allergen violations', async () => {
      const product = TestProductBuilder.milkProduct();
      const userProfile = TestUserProfileBuilder.milkAllergic();

      const result = await dietaryService.checkCompliance(product, userProfile);

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('milk');
    });

    it('should pass safe products', async () => {
      const product = TestProductBuilder.safeProduct();
      const userProfile = TestUserProfileBuilder.milkAllergic();

      const result = await dietaryService.checkCompliance(product, userProfile);

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect vegan violations', async () => {
      const product = TestProductBuilder.milkProduct();
      const userProfile = TestUserProfileBuilder.vegan();

      const result = await dietaryService.checkCompliance(product, userProfile);

      expect(result.warnings).toContain('Contains non-vegan ingredients: milk');
    });

    it('should handle multiple allergens', async () => {
      const product = TestProductBuilder.create()
        .withName('Mixed Nuts')
        .withIngredients(['peanuts', 'almonds', 'milk'])
        .withAllergens(['peanuts', 'tree nuts', 'milk'])
        .build();

      const userProfile = TestUserProfileBuilder.create()
        .withAllergens(['peanuts', 'milk'])
        .build();

      const result = await dietaryService.checkCompliance(product, userProfile);

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('peanuts');
      expect(result.violations).toContain('milk');
    });
  });

  describe('analyzeProduct', () => {
    it('should provide recommendations for safe products', async () => {
      const product = TestProductBuilder.safeProduct();
      const userProfile = TestUserProfileBuilder.milkAllergic();

      const result = await dietaryService.analyzeProduct(product, userProfile);

      expect(result.compliance.isCompliant).toBe(true);
      expect(result.recommendations).toContain('Product is safe for your dietary needs');
    });

    it('should provide warnings for unsafe products', async () => {
      const product = TestProductBuilder.milkProduct();
      const userProfile = TestUserProfileBuilder.milkAllergic();

      const result = await dietaryService.analyzeProduct(product, userProfile);

      expect(result.compliance.isCompliant).toBe(false);
      expect(result.recommendations).toContain('Consider alternative products');
    });

    it('should include product information in analysis', async () => {
      const product = TestProductBuilder.safeProduct();
      const userProfile = TestUserProfileBuilder.milkAllergic();

      const result = await dietaryService.analyzeProduct(product, userProfile);

      expect(result.product).toEqual(product);
      expect(result.compliance).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });
  });
});
