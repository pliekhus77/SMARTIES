/**
 * AI Service Integration Tests
 * Tests the AI service integration layer
 */

import { createDietaryAnalysisService, testAIServices } from '../ai-service-factory';
import { DietaryAnalysisRequest } from '../openai';

describe('AI Service Integration', () => {
  describe('Service Factory', () => {
    it('should create dietary analysis service', () => {
      const service = createDietaryAnalysisService();
      expect(service).toBeDefined();
      expect(typeof service.analyzeProduct).toBe('function');
      expect(typeof service.testServices).toBe('function');
    });

    it('should handle missing API keys gracefully', async () => {
      // This test assumes no API keys are set in test environment
      const testResult = await testAIServices();
      
      expect(testResult).toHaveProperty('configured');
      expect(testResult).toHaveProperty('openaiWorking');
      expect(testResult).toHaveProperty('anthropicWorking');
      expect(testResult).toHaveProperty('errors');
      expect(Array.isArray(testResult.errors)).toBe(true);
    });
  });

  describe('Dietary Analysis Service', () => {
    let service: ReturnType<typeof createDietaryAnalysisService>;

    beforeEach(() => {
      service = createDietaryAnalysisService();
    });

    it('should provide fallback analysis when AI services fail', async () => {
      const request: DietaryAnalysisRequest = {
        productName: 'Test Product',
        ingredients: ['milk', 'eggs', 'wheat flour'],
        userRestrictions: ['dairy', 'eggs'],
        strictMode: true
      };

      const result = await service.analyzeProduct(request, { retryAttempts: 0, retryDelay: 0 });

      expect(result).toHaveProperty('safe');
      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('explanation');
      
      expect(typeof result.safe).toBe('boolean');
      expect(Array.isArray(result.violations)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.confidence).toBe('number');
      expect(typeof result.explanation).toBe('string');
    });

    it('should detect violations in fallback mode', async () => {
      const request: DietaryAnalysisRequest = {
        productName: 'Milk Chocolate',
        ingredients: ['milk chocolate', 'sugar', 'cocoa'],
        userRestrictions: ['milk'],
        strictMode: true
      };

      const result = await service.analyzeProduct(request, { retryAttempts: 0, retryDelay: 0 });

      expect(result.safe).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should return safe for products without violations', async () => {
      const request: DietaryAnalysisRequest = {
        productName: 'Apple',
        ingredients: ['apple'],
        userRestrictions: ['milk', 'eggs'],
        strictMode: true
      };

      const result = await service.analyzeProduct(request, { retryAttempts: 0, retryDelay: 0 });

      expect(result.safe).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should handle empty ingredients gracefully', async () => {
      const request: DietaryAnalysisRequest = {
        productName: 'Unknown Product',
        ingredients: [],
        userRestrictions: ['milk'],
        strictMode: false
      };

      const result = await service.analyzeProduct(request, { retryAttempts: 0, retryDelay: 0 });

      expect(result).toBeDefined();
      expect(result.safe).toBe(true); // No ingredients means no violations
    });

    it('should handle empty restrictions gracefully', async () => {
      const request: DietaryAnalysisRequest = {
        productName: 'Milk Chocolate',
        ingredients: ['milk', 'sugar'],
        userRestrictions: [],
        strictMode: false
      };

      const result = await service.analyzeProduct(request, { retryAttempts: 0, retryDelay: 0 });

      expect(result).toBeDefined();
      expect(result.safe).toBe(true); // No restrictions means safe
    });
  });

  describe('Service Status', () => {
    it('should track service status', async () => {
      const service = createDietaryAnalysisService();
      const status = await service.testServices();

      expect(status).toHaveProperty('openai');
      expect(status).toHaveProperty('anthropic');
      expect(status).toHaveProperty('lastChecked');
      expect(status.lastChecked).toBeInstanceOf(Date);
    });

    it('should get current service status', () => {
      const service = createDietaryAnalysisService();
      const status = service.getServiceStatus();

      expect(status).toHaveProperty('openai');
      expect(status).toHaveProperty('anthropic');
      expect(status).toHaveProperty('lastChecked');
    });
  });
});