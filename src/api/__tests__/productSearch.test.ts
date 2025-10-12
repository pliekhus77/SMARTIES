import request from 'supertest';
import express from 'express';
import { createProductSearchRouter } from '../routes/productSearch';
import { HybridSearchService } from '../../services/search/HybridSearchService';
import { AllergenDetectionService } from '../../services/dietary/AllergenDetectionService';
import { DietaryComplianceService } from '../../services/dietary/DietaryComplianceService';
import { ProductRecommendationService } from '../../services/dietary/ProductRecommendationService';
import { Product } from '../../models/Product';

jest.mock('../../services/search/HybridSearchService');
jest.mock('../../services/dietary/AllergenDetectionService');
jest.mock('../../services/dietary/DietaryComplianceService');
jest.mock('../../services/dietary/ProductRecommendationService');

describe('Product Search API Endpoints', () => {
  let app: express.Application;
  let mockHybridSearchService: jest.Mocked<HybridSearchService>;
  let mockAllergenService: jest.Mocked<AllergenDetectionService>;
  let mockComplianceService: jest.Mocked<DietaryComplianceService>;
  let mockRecommendationService: jest.Mocked<ProductRecommendationService>;

  const mockProduct: Product = {
    _id: '507f1f77bcf86cd799439011',
    upc: '123456789012',
    name: 'Organic Almond Milk',
    ingredients: ['almonds', 'water', 'sea salt'],
    allergens: ['tree nuts'],
    dietaryFlags: { vegan: true, vegetarian: true, glutenFree: true, kosher: false, halal: false }
  };

  beforeEach(() => {
    mockHybridSearchService = new HybridSearchService({} as any, {} as any, {} as any) as jest.Mocked<HybridSearchService>;
    mockAllergenService = new AllergenDetectionService({} as any, {} as any) as jest.Mocked<AllergenDetectionService>;
    mockComplianceService = new DietaryComplianceService({} as any, {} as any) as jest.Mocked<DietaryComplianceService>;
    mockRecommendationService = new ProductRecommendationService({} as any, {} as any, {} as any, {} as any) as jest.Mocked<ProductRecommendationService>;

    app = express();
    app.use(express.json());
    app.use('/api/products', createProductSearchRouter(
      mockHybridSearchService,
      mockAllergenService,
      mockComplianceService,
      mockRecommendationService
    ));

    jest.clearAllMocks();
  });

  describe('GET /api/products/upc/:upc', () => {
    it('should return product for valid UPC', async () => {
      mockHybridSearchService.search.mockResolvedValue({
        products: [mockProduct],
        searchStrategy: 'upc',
        totalResults: 1,
        responseTime: 45
      });

      const response = await request(app)
        .get('/api/products/upc/123456789012')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.upc).toBe('123456789012');
      expect(response.body.searchStrategy).toBe('upc');
      expect(response.body.responseTime).toBeLessThan(200);
    });

    it('should return null for non-existent UPC', async () => {
      mockHybridSearchService.search.mockResolvedValue({
        products: [],
        searchStrategy: 'upc',
        totalResults: 0,
        responseTime: 23
      });

      const response = await request(app)
        .get('/api/products/upc/999999999999')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('should handle service errors gracefully', async () => {
      mockHybridSearchService.search.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/products/upc/123456789012')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('UPC lookup failed');
    });

    it('should warn about slow responses', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      mockHybridSearchService.search.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          products: [mockProduct],
          searchStrategy: 'upc',
          totalResults: 1,
          responseTime: 150
        }), 150))
      );

      await request(app)
        .get('/api/products/upc/123456789012')
        .expect(200);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('UPC lookup exceeded 100ms')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('POST /api/products/search', () => {
    it('should perform semantic search', async () => {
      mockHybridSearchService.search.mockResolvedValue({
        products: [mockProduct],
        searchStrategy: 'vector',
        totalResults: 1,
        responseTime: 234
      });

      const searchRequest = {
        query: 'organic almond milk',
        filters: {
          maxResults: 10,
          similarityThreshold: 0.7
        }
      };

      const response = await request(app)
        .post('/api/products/search')
        .send(searchRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.searchStrategy).toBe('vector');
    });

    it('should apply dietary filters', async () => {
      mockHybridSearchService.search.mockResolvedValue({
        products: [mockProduct],
        searchStrategy: 'vector',
        totalResults: 1,
        responseTime: 156
      });

      const searchRequest = {
        query: 'milk',
        filters: {
          dietary: ['vegan', 'gluten_free'],
          allergens: ['peanuts']
        }
      };

      const response = await request(app)
        .post('/api/products/search')
        .send(searchRequest)
        .expect(200);

      expect(mockHybridSearchService.search).toHaveBeenCalledWith({
        text: 'milk',
        upc: undefined,
        filters: expect.objectContaining({
          allergenFilters: ['peanuts'],
          dietaryFilters: { vegan: true, gluten_free: true }
        })
      });
    });
  });

  describe('POST /api/products/analyze', () => {
    it('should perform dietary analysis', async () => {
      mockHybridSearchService.search.mockResolvedValue({
        products: [mockProduct],
        searchStrategy: 'upc',
        totalResults: 1,
        responseTime: 45
      });

      mockAllergenService.analyzeProduct.mockResolvedValue({
        detectedAllergens: [{
          allergen: 'tree nuts',
          riskLevel: 'high',
          confidence: 0.95,
          reason: 'Listed in allergen tags',
          sources: ['allergen_tags']
        }],
        crossContaminationRisks: [],
        overallRiskLevel: 'danger',
        confidence: 0.95
      });

      mockComplianceService.analyzeCompliance.mockResolvedValue({
        overallCompliance: true,
        confidence: 0.9,
        results: {
          vegan: {
            compliant: true,
            confidence: 0.9,
            violations: [],
            warnings: [],
            certifications: []
          }
        }
      });

      const analysisRequest = {
        upc: '123456789012',
        userAllergens: ['tree nuts'],
        dietaryRestrictions: [{ type: 'vegan', required: true }]
      };

      const response = await request(app)
        .post('/api/products/analyze')
        .send(analysisRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product.upc).toBe('123456789012');
      expect(response.body.data.allergenAnalysis.overallRiskLevel).toBe('danger');
      expect(response.body.data.complianceAnalysis.overallCompliance).toBe(true);
    });

    it('should return 404 for non-existent product', async () => {
      mockHybridSearchService.search.mockResolvedValue({
        products: [],
        searchStrategy: 'upc',
        totalResults: 0,
        responseTime: 23
      });

      const analysisRequest = {
        upc: '999999999999',
        userAllergens: ['peanuts']
      };

      const response = await request(app)
        .post('/api/products/analyze')
        .send(analysisRequest)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });
  });

  describe('POST /api/products/recommendations', () => {
    it('should generate personalized recommendations', async () => {
      const mockRecommendations = [{
        product: mockProduct,
        score: 0.87,
        confidence: 0.92,
        reasons: ['Safe from allergens', 'Meets dietary requirements'],
        safetyLevel: 'safe' as const
      }];

      mockRecommendationService.recommendPersonalized.mockResolvedValue(mockRecommendations);

      const recommendationRequest = {
        userProfile: {
          allergens: ['peanuts'],
          dietaryRestrictions: [{ type: 'vegan', required: true }],
          preferences: ['organic'],
          scanHistory: []
        },
        maxResults: 10
      };

      const response = await request(app)
        .post('/api/products/recommendations')
        .send(recommendationRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(1);
      expect(response.body.data.count).toBe(1);
    });

    it('should generate safer alternatives', async () => {
      mockHybridSearchService.search.mockResolvedValue({
        products: [mockProduct],
        searchStrategy: 'upc',
        totalResults: 1,
        responseTime: 45
      });

      const mockAlternatives = [{
        product: { ...mockProduct, upc: '987654321098', name: 'Safer Alternative' },
        score: 0.85,
        confidence: 0.88,
        reasons: ['Safe alternative'],
        safetyLevel: 'safe' as const
      }];

      mockRecommendationService.recommendSaferAlternatives.mockResolvedValue(mockAlternatives);

      const recommendationRequest = {
        baseProduct: '123456789012',
        userProfile: {
          allergens: ['tree nuts'],
          dietaryRestrictions: [],
          preferences: [],
          scanHistory: []
        }
      };

      const response = await request(app)
        .post('/api/products/recommendations')
        .send(recommendationRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recommendations).toHaveLength(1);
      expect(mockRecommendationService.recommendSaferAlternatives).toHaveBeenCalled();
    });

    it('should return 404 for non-existent base product', async () => {
      mockHybridSearchService.search.mockResolvedValue({
        products: [],
        searchStrategy: 'upc',
        totalResults: 0,
        responseTime: 23
      });

      const recommendationRequest = {
        baseProduct: '999999999999',
        userProfile: {
          allergens: [],
          dietaryRestrictions: [],
          preferences: [],
          scanHistory: []
        }
      };

      const response = await request(app)
        .post('/api/products/recommendations')
        .send(recommendationRequest)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Base product not found');
    });
  });

  describe('GET /api/products/metrics', () => {
    it('should return performance metrics', async () => {
      const response = await request(app)
        .get('/api/products/metrics?timeWindow=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('alerts');
      expect(response.body.data).toHaveProperty('thresholds');
    });
  });
});
