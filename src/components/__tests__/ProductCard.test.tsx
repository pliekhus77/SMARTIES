import { TestProductBuilder } from '../../test/builders/testDataBuilders';

// Simple ProductCard logic for testing (without React Native dependencies)
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    allergens: string[];
    isCompliant: boolean;
  };
  onPress?: () => void;
  onFavorite?: () => void;
}

class ProductCardLogic {
  static formatAllergens(allergens: string[]): string {
    return allergens.length > 0 ? `Allergens: ${allergens.join(', ')}` : 'No allergens';
  }

  static getComplianceStatus(isCompliant: boolean): string {
    return isCompliant ? 'Safe' : 'Warning';
  }

  static getComplianceColor(isCompliant: boolean): string {
    return isCompliant ? 'green' : 'red';
  }

  static validateProduct(product: ProductCardProps['product']): boolean {
    return !!(product.id && product.name);
  }
}

describe('ProductCard Logic', () => {
  describe('formatAllergens', () => {
    it('should format allergens correctly', () => {
      const allergens = ['milk', 'peanuts'];
      const result = ProductCardLogic.formatAllergens(allergens);
      expect(result).toBe('Allergens: milk, peanuts');
    });

    it('should handle no allergens', () => {
      const result = ProductCardLogic.formatAllergens([]);
      expect(result).toBe('No allergens');
    });

    it('should handle single allergen', () => {
      const result = ProductCardLogic.formatAllergens(['milk']);
      expect(result).toBe('Allergens: milk');
    });
  });

  describe('getComplianceStatus', () => {
    it('should return Safe for compliant products', () => {
      const result = ProductCardLogic.getComplianceStatus(true);
      expect(result).toBe('Safe');
    });

    it('should return Warning for non-compliant products', () => {
      const result = ProductCardLogic.getComplianceStatus(false);
      expect(result).toBe('Warning');
    });
  });

  describe('getComplianceColor', () => {
    it('should return green for safe products', () => {
      const result = ProductCardLogic.getComplianceColor(true);
      expect(result).toBe('green');
    });

    it('should return red for unsafe products', () => {
      const result = ProductCardLogic.getComplianceColor(false);
      expect(result).toBe('red');
    });
  });

  describe('validateProduct', () => {
    it('should validate complete product', () => {
      const product = {
        ...TestProductBuilder.safeProduct(),
        isCompliant: true,
      };

      const result = ProductCardLogic.validateProduct(product);
      expect(result).toBe(true);
    });

    it('should reject product without id', () => {
      const product = {
        id: '',
        name: 'Test Product',
        allergens: [],
        isCompliant: true,
      };

      const result = ProductCardLogic.validateProduct(product);
      expect(result).toBe(false);
    });

    it('should reject product without name', () => {
      const product = {
        id: '1',
        name: '',
        allergens: [],
        isCompliant: true,
      };

      const result = ProductCardLogic.validateProduct(product);
      expect(result).toBe(false);
    });
  });

  describe('integration with test builders', () => {
    it('should work with milk product', () => {
      const product = {
        ...TestProductBuilder.milkProduct(),
        isCompliant: false,
      };

      expect(ProductCardLogic.formatAllergens(product.allergens)).toBe('Allergens: milk');
      expect(ProductCardLogic.getComplianceStatus(product.isCompliant)).toBe('Warning');
      expect(ProductCardLogic.validateProduct(product)).toBe(true);
    });

    it('should work with safe product', () => {
      const product = {
        ...TestProductBuilder.safeProduct(),
        isCompliant: true,
      };

      expect(ProductCardLogic.formatAllergens(product.allergens)).toBe('No allergens');
      expect(ProductCardLogic.getComplianceStatus(product.isCompliant)).toBe('Safe');
      expect(ProductCardLogic.validateProduct(product)).toBe(true);
    });
  });
});
