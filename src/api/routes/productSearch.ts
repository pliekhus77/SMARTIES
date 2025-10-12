import { Router, Request, Response } from 'express';
import { HybridSearchService } from '../../services/search/HybridSearchService';
import { AllergenDetectionService } from '../../services/dietary/AllergenDetectionService';
import { DietaryComplianceService } from '../../services/dietary/DietaryComplianceService';
import { ProductRecommendationService } from '../../services/dietary/ProductRecommendationService';
import { performanceMonitor } from '../../services/search/PerformanceMonitor';
import { RequestValidator, RequestSanitizer } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { RateLimitManager } from '../middleware/rateLimiting';
import { NotFoundError } from '../middleware/errorHandler';

export interface SearchRequest {
  query?: string;
  upc?: string;
  filters?: {
    allergens?: string[];
    dietary?: string[];
    maxResults?: number;
    similarityThreshold?: number;
  };
}

export interface DietaryAnalysisRequest {
  upc: string;
  userAllergens?: string[];
  dietaryRestrictions?: Array<{
    type: string;
    required: boolean;
  }>;
}

export interface RecommendationRequest {
  userProfile: {
    allergens: string[];
    dietaryRestrictions: Array<{
      type: string;
      required: boolean;
    }>;
    preferences: string[];
    scanHistory?: string[];
  };
  baseProduct?: string; // UPC for alternatives
  maxResults?: number;
}

export function createProductSearchRouter(
  hybridSearchService: HybridSearchService,
  allergenService: AllergenDetectionService,
  complianceService: DietaryComplianceService,
  recommendationService: ProductRecommendationService
): Router {
  const router = Router();

  // UPC Lookup Endpoint - Sub-100ms requirement
  router.get('/upc/:upc', 
    RateLimitManager.lenient(),
    RequestValidator.validate([RequestValidator.upcValidation()]),
    asyncHandler(async (req: Request, res: Response) => {
      const startTime = Date.now();
      
      const upc = RequestSanitizer.sanitizeUPC(req.params.upc);
      
      const result = await hybridSearchService.search({ upc });
      const responseTime = Date.now() - startTime;

      performanceMonitor.recordMetric({
        operation: 'upc_lookup',
        responseTime,
        timestamp: new Date(),
        success: true
      });

      if (responseTime > 100) {
        console.warn(`UPC lookup exceeded 100ms: ${responseTime}ms for ${upc}`);
      }

      res.success({
        product: result.products[0] || null,
        searchStrategy: result.searchStrategy,
        responseTime
      });
    })
  );

  // Semantic Search Endpoint
  router.post('/search',
    RateLimitManager.general(),
    RequestValidator.validate(RequestValidator.searchQueryValidation()),
    asyncHandler(async (req: Request, res: Response) => {
      const startTime = Date.now();
      
      const query = req.body.query ? RequestSanitizer.sanitizeString(req.body.query) : undefined;
      const upc = req.body.upc ? RequestSanitizer.sanitizeUPC(req.body.upc) : undefined;
      const maxResults = RequestSanitizer.sanitizeNumber(req.body.filters?.maxResults, 20);
      const similarityThreshold = RequestSanitizer.sanitizeNumber(req.body.filters?.similarityThreshold, 0.5);
      
      const result = await hybridSearchService.search({
        text: query,
        upc: upc,
        filters: {
          maxResults: Math.min(maxResults, 100),
          similarityThreshold: Math.max(0, Math.min(1, similarityThreshold)),
          allergenFilters: req.body.filters?.allergens ? RequestSanitizer.sanitizeArray(req.body.filters.allergens) : undefined,
          dietaryFilters: req.body.filters?.dietary?.reduce((acc: any, diet: string) => {
            acc[RequestSanitizer.sanitizeString(diet)] = true;
            return acc;
          }, {})
        }
      });

      const responseTime = Date.now() - startTime;

      performanceMonitor.recordMetric({
        operation: 'semantic_search',
        responseTime,
        timestamp: new Date(),
        success: true
      });

      res.success({
        products: result.products,
        totalResults: result.totalResults,
        searchStrategy: result.searchStrategy,
        responseTime
      });
    })
  );

  // Dietary Analysis Endpoint
  router.post('/analyze',
    RateLimitManager.strict(),
    RequestValidator.validate([
      RequestValidator.upcValidation(),
      RequestValidator.allergenListValidation(),
      RequestValidator.dietaryRestrictionsValidation()
    ]),
    asyncHandler(async (req: Request, res: Response) => {
      const startTime = Date.now();
      
      const upc = RequestSanitizer.sanitizeUPC(req.body.upc);
      
      const productResult = await hybridSearchService.search({ upc });
      const product = productResult.products[0];
      
      if (!product) {
        throw new NotFoundError('Product');
      }

      const userAllergens = req.body.userAllergens ? RequestSanitizer.sanitizeArray(req.body.userAllergens) : undefined;
      const dietaryRestrictions = req.body.dietaryRestrictions || undefined;

      const [allergenAnalysis, complianceAnalysis] = await Promise.all([
        userAllergens ? allergenService.analyzeProduct(product, userAllergens) : null,
        dietaryRestrictions ? complianceService.analyzeCompliance(product, dietaryRestrictions) : null
      ]);

      const responseTime = Date.now() - startTime;

      performanceMonitor.recordMetric({
        operation: 'dietary_analysis',
        responseTime,
        timestamp: new Date(),
        success: true
      });

      res.success({
        product,
        allergenAnalysis,
        complianceAnalysis,
        responseTime
      });
    })
  );

  // Product Recommendation Endpoint
  router.post('/recommendations', async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const recommendationRequest: RecommendationRequest = req.body;
      
      let recommendations;
      
      if (recommendationRequest.baseProduct) {
        // Get safer alternatives
        const productResult = await hybridSearchService.search({ 
          upc: recommendationRequest.baseProduct 
        });
        const baseProduct = productResult.products[0];
        
        if (!baseProduct) {
          return res.status(404).json({
            success: false,
            error: 'Base product not found'
          });
        }

        recommendations = await recommendationService.recommendSaferAlternatives(
          baseProduct,
          recommendationRequest.userProfile,
          { maxResults: recommendationRequest.maxResults || 10 }
        );
      } else {
        // Get personalized recommendations
        recommendations = await recommendationService.recommendPersonalized(
          recommendationRequest.userProfile,
          { maxResults: recommendationRequest.maxResults || 15 }
        );
      }

      const responseTime = Date.now() - startTime;

      performanceMonitor.recordMetric({
        operation: 'recommendations',
        responseTime,
        timestamp: new Date(),
        success: true
      });

      res.json({
        success: true,
        data: {
          recommendations,
          count: recommendations.length
        },
        responseTime
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      performanceMonitor.recordMetric({
        operation: 'recommendations',
        responseTime,
        timestamp: new Date(),
        success: false
      });

      res.status(500).json({
        success: false,
        error: 'Recommendation generation failed',
        responseTime
      });
    }
  });

  // Performance Metrics Endpoint
  router.get('/metrics', (req: Request, res: Response) => {
    const timeWindow = parseInt(req.query.timeWindow as string) || 5; // Default 5 minutes
    
    const stats = {
      upcLookup: performanceMonitor.getStats('upc_lookup', timeWindow),
      semanticSearch: performanceMonitor.getStats('semantic_search', timeWindow),
      dietaryAnalysis: performanceMonitor.getStats('dietary_analysis', timeWindow),
      recommendations: performanceMonitor.getStats('recommendations', timeWindow)
    };

    const alerts = performanceMonitor.getAlerts();

    res.json({
      success: true,
      data: {
        stats,
        alerts,
        thresholds: performanceMonitor.checkPerformanceThresholds()
      }
    });
  });

  return router;
}
