import { AllergenDetectionService } from '../AllergenDetectionService';
import { DietaryComplianceService, DietaryRestriction } from '../DietaryComplianceService';
import { ProductRecommendationService, UserProfile } from '../ProductRecommendationService';
import { VectorSearchService } from '../../search/VectorSearchService';
import { EmbeddingService } from '../../EmbeddingService';
import { Product } from '../../../models/Product';

jest.mock('../../search/VectorSearchService');
jest.mock('../../EmbeddingService');

describe('Dietary Analysis Performance Tests', () => {
  let allergenService: AllergenDetectionService;
  let complianceService: DietaryComplianceService;
  let recommendationService: ProductRecommendationService;
  let mockVectorSearchService: jest.Mocked<VectorSearchService>;
  let mockEmbeddingService: jest.Mocked<EmbeddingService>;

  const testProduct: Product = {
    _id: '1',
    upc: '123456789012',
    name: 'Test Product',
    ingredients: ['water', 'sugar', 'salt'],
    allergens: ['none'],
    dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
  };

  const userProfile: UserProfile = {
    allergens: ['peanuts', 'tree nuts'],
    dietaryRestrictions: [
      { type: 'vegan', required: true },
      { type: 'gluten_free', required: true }
    ],
    preferences: ['organic', 'non-gmo'],
    scanHistory: []
  };

  beforeEach(() => {
    mockVectorSearchService = new VectorSearchService({} as any) as jest.Mocked<VectorSearchService>;
    mockEmbeddingService = new EmbeddingService() as jest.Mocked<EmbeddingService>;
    
    allergenService = new AllergenDetectionService(mockVectorSearchService, mockEmbeddingService);
    complianceService = new DietaryComplianceService(mockVectorSearchService, mockEmbeddingService);
    recommendationService = new ProductRecommendationService(
      mockVectorSearchService,
      mockEmbeddingService,
      allergenService,
      complianceService
    );

    // Setup default mocks
    mockEmbeddingService.generateEmbedding.mockResolvedValue(new Array(384).fill(0.5));
    mockVectorSearchService.searchByAllergens.mockResolvedValue([]);
    mockVectorSearchService.searchByIngredients.mockResolvedValue([]);
    mockVectorSearchService.searchByProductName.mockResolvedValue([]);

    jest.clearAllMocks();
  });

  describe('Allergen Detection Performance', () => {
    it('should complete allergen analysis within 500ms', async () => {
      const startTime = Date.now();
      
      await allergenService.analyzeProduct(testProduct, ['peanuts', 'tree nuts', 'milk']);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500);
    });

    it('should handle multiple allergens efficiently', async () => {
      const manyAllergens = Array.from({ length: 15 }, (_, i) => `allergen${i}`);
      
      const startTime = Date.now();
      await allergenService.analyzeProduct(testProduct, manyAllergens);
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(1000);
    });

    it('should maintain performance with concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 10 }, () =>
        allergenService.analyzeProduct(testProduct, ['peanuts'])
      );

      const startTime = Date.now();
      const results = await Promise.all(concurrentRequests);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(10);
      expect(totalTime).toBeLessThan(2000); // 10 requests in under 2 seconds
    });
  });

  describe('Dietary Compliance Performance', () => {
    it('should complete compliance analysis within 300ms', async () => {
      const restrictions: DietaryRestriction[] = [
        { type: 'vegan', required: true },
        { type: 'kosher', required: true },
        { type: 'gluten_free', required: true }
      ];

      const startTime = Date.now();
      await complianceService.analyzeCompliance(testProduct, restrictions);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(300);
    });

    it('should scale with number of restrictions', async () => {
      const manyRestrictions: DietaryRestriction[] = Array.from({ length: 8 }, (_, i) => ({
        type: 'vegan' as const,
        required: i % 2 === 0
      }));

      const startTime = Date.now();
      await complianceService.analyzeCompliance(testProduct, manyRestrictions);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(800);
    });
  });

  describe('Recommendation Engine Performance', () => {
    it('should generate recommendations within 2 seconds', async () => {
      mockVectorSearchService.searchByProductName.mockResolvedValue([
        { product: testProduct, similarityScore: 0.8 }
      ]);

      const startTime = Date.now();
      await recommendationService.recommendPersonalized(userProfile);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(2000);
    });

    it('should handle large recommendation requests efficiently', async () => {
      const manyProducts = Array.from({ length: 50 }, (_, i) => ({
        product: { ...testProduct, _id: i.toString(), upc: `12345678901${i}` },
        similarityScore: 0.8 - (i * 0.01)
      }));

      mockVectorSearchService.searchByProductName.mockResolvedValue(manyProducts);

      const startTime = Date.now();
      await recommendationService.recommendPersonalized(userProfile, { maxResults: 20 });
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(3000);
    });
  });

  describe('Memory Usage and Efficiency', () => {
    it('should not leak memory with repeated operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await allergenService.analyzeProduct(testProduct, ['peanuts']);
        await complianceService.analyzeCompliance(testProduct, [{ type: 'vegan', required: true }]);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large product datasets efficiently', async () => {
      const largeProduct: Product = {
        ...testProduct,
        ingredients: Array.from({ length: 100 }, (_, i) => `ingredient${i}`),
        allergens: Array.from({ length: 20 }, (_, i) => `allergen${i}`)
      };

      const startTime = Date.now();
      await allergenService.analyzeProduct(largeProduct, ['peanuts', 'milk', 'eggs']);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1000);
    });
  });

  describe('Error Recovery Performance', () => {
    it('should fail fast on service errors', async () => {
      mockEmbeddingService.generateEmbedding.mockRejectedValue(new Error('Service error'));

      const startTime = Date.now();
      const result = await allergenService.analyzeProduct(testProduct, ['peanuts']);
      const responseTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(responseTime).toBeLessThan(100); // Should fail quickly
    });

    it('should handle timeout scenarios gracefully', async () => {
      mockVectorSearchService.searchByAllergens.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 2000))
      );

      const startTime = Date.now();
      const result = await allergenService.analyzeProduct(testProduct, ['peanuts']);
      const responseTime = Date.now() - startTime;

      expect(result).toBeDefined();
      // Should either complete or timeout gracefully
      expect(responseTime).toBeLessThan(3000);
    });
  });

  describe('Accuracy vs Performance Trade-offs', () => {
    it('should maintain accuracy under time pressure', async () => {
      const timeConstrainedTests = Array.from({ length: 20 }, (_, i) => ({
        product: { ...testProduct, _id: i.toString() },
        allergen: i % 2 === 0 ? 'peanuts' : 'milk'
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        timeConstrainedTests.map(test => 
          allergenService.analyzeProduct(test.product, [test.allergen])
        )
      );
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(5000); // All tests in under 5 seconds
      expect(results.every(r => r.confidence > 0)).toBe(true);
    });

    it('should provide consistent performance across different input types', async () => {
      const testCases = [
        { allergens: ['peanuts'], restrictions: [{ type: 'vegan' as const, required: true }] },
        { allergens: ['milk', 'eggs'], restrictions: [{ type: 'vegetarian' as const, required: true }] },
        { allergens: ['tree nuts'], restrictions: [{ type: 'kosher' as const, required: true }] }
      ];

      const times: number[] = [];

      for (const testCase of testCases) {
        const startTime = Date.now();
        
        await allergenService.analyzeProduct(testProduct, testCase.allergens);
        await complianceService.analyzeCompliance(testProduct, testCase.restrictions);
        
        times.push(Date.now() - startTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      expect(maxTime - minTime).toBeLessThan(200); // Consistent performance
      expect(avgTime).toBeLessThan(500);
    });
  });
});
