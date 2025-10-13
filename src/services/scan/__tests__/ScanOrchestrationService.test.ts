import { ScanOrchestrationService } from '../ScanOrchestrationService';
import { BarcodeResult } from '../../../types/barcode';
import { Product } from '../../../types/product';

// Mock all dependencies
jest.mock('../../api/ProductLookupService');
jest.mock('../../cache/ProductCacheService');
jest.mock('../../network/NetworkService');
jest.mock('../../accessibility/AccessibilityService');

describe('ScanOrchestrationService', () => {
  let service: ScanOrchestrationService;
  
  const mockBarcodeResult: BarcodeResult = {
    value: '1234567890123',
    format: 'EAN_13' as any,
    normalized: '1234567890123',
    isValid: true,
  };

  const mockProduct: Product = {
    barcode: '1234567890123',
    name: 'Test Product',
    ingredients: 'Water, Sugar, Milk',
    allergens: ['milk'],
  };

  beforeEach(() => {
    service = new ScanOrchestrationService();
    jest.clearAllMocks();
  });

  describe('processScan', () => {
    it('returns cached product when available', async () => {
      // Mock cache hit
      (service as any).cacheService.getProduct = jest.fn().mockResolvedValue(mockProduct);

      const result = await service.processScan(mockBarcodeResult);

      expect(result.success).toBe(true);
      expect(result.product).toEqual(mockProduct);
      expect(result.fromCache).toBe(true);
    });

    it('fetches from API when not cached and online', async () => {
      // Mock cache miss
      (service as any).cacheService.getProduct = jest.fn().mockResolvedValue(null);
      (service as any).networkService.isOnline = jest.fn().mockReturnValue(true);
      (service as any).productLookupService.retryLookup = jest.fn().mockResolvedValue({
        success: true,
        product: mockProduct,
      });
      (service as any).cacheService.setProduct = jest.fn().mockResolvedValue(undefined);

      const result = await service.processScan(mockBarcodeResult);

      expect(result.success).toBe(true);
      expect(result.product).toEqual(mockProduct);
      expect(result.fromCache).toBe(false);
    });

    it('returns error when offline and not cached', async () => {
      // Mock cache miss and offline
      (service as any).cacheService.getProduct = jest.fn().mockResolvedValue(null);
      (service as any).networkService.isOnline = jest.fn().mockReturnValue(false);

      const result = await service.processScan(mockBarcodeResult);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No network connection');
    });
  });

  describe('analyzeDietaryCompliance', () => {
    it('detects allergen violations', async () => {
      const userRestrictions = ['milk', 'gluten'];
      
      const result = await service.analyzeDietaryCompliance(mockProduct, userRestrictions);

      expect(result.severity).toBe('severe');
      expect(result.violations).toContain('Contains milk');
    });

    it('detects ingredient warnings', async () => {
      const productWithIngredients: Product = {
        ...mockProduct,
        allergens: [],
        ingredients: 'Water, Sugar, Wheat flour',
      };
      const userRestrictions = ['gluten'];
      
      const result = await service.analyzeDietaryCompliance(productWithIngredients, userRestrictions);

      expect(result.severity).toBe('severe');
      expect(result.violations.some(v => v.includes('gluten'))).toBe(true);
    });

    it('returns clear when no issues found', async () => {
      const safeProduct: Product = {
        ...mockProduct,
        allergens: [],
        ingredients: 'Water, Sugar',
      };
      const userRestrictions = ['nuts'];
      
      const result = await service.analyzeDietaryCompliance(safeProduct, userRestrictions);

      expect(result.severity).toBe('clear');
      expect(result.violations).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('getNavigationTarget', () => {
    it('returns correct screen names for each severity', () => {
      expect(service.getNavigationTarget('severe')).toBe('SevereAlertScreen');
      expect(service.getNavigationTarget('warning')).toBe('WarningScreen');
      expect(service.getNavigationTarget('clear')).toBe('AllClearScreen');
    });
  });

  describe('refreshProductData', () => {
    it('fetches fresh data and updates cache', async () => {
      (service as any).productLookupService.lookupProduct = jest.fn().mockResolvedValue({
        success: true,
        product: mockProduct,
      });
      (service as any).cacheService.refreshProduct = jest.fn().mockResolvedValue(undefined);

      const result = await service.refreshProductData('1234567890123');

      expect(result.success).toBe(true);
      expect(result.product).toEqual(mockProduct);
      expect((service as any).cacheService.refreshProduct).toHaveBeenCalledWith(
        '1234567890123',
        mockProduct
      );
    });
  });
});
