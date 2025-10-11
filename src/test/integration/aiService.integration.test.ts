import { TestProductBuilder, TestUserProfileBuilder, TestScanResultBuilder } from '../builders/testDataBuilders';
import { IntegrationTestUtils, integrationConfig } from './setup';

// Mock AI service for integration testing
class AIServiceIntegration {
  private mockResponses = new Map<string, any>();
  private callHistory: Array<{ service: string; prompt: string; timestamp: Date }> = [];

  // OpenAI integration
  async analyzeProductCompliance(product: any, userProfile: any): Promise<{
    isCompliant: boolean;
    violations: string[];
    warnings: string[];
    confidence: number;
    reasoning: string;
  }> {
    const prompt = this.buildCompliancePrompt(product, userProfile);
    this.recordCall('openai', prompt);

    // Check for mock response
    const mockKey = `compliance_${product.id}_${userProfile.id}`;
    if (this.mockResponses.has(mockKey)) {
      return this.mockResponses.get(mockKey);
    }

    // Default analysis logic
    const violations = this.detectViolations(product, userProfile);
    const warnings = this.detectWarnings(product, userProfile);
    
    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
      confidence: this.calculateConfidence(product, userProfile),
      reasoning: this.generateReasoning(product, userProfile, violations, warnings),
    };
  }

  async generateRecommendations(userProfile: any, scanHistory: any[]): Promise<{
    recommendations: string[];
    alternativeProducts: string[];
    dietaryTips: string[];
  }> {
    const prompt = this.buildRecommendationPrompt(userProfile, scanHistory);
    this.recordCall('openai', prompt);

    const mockKey = `recommendations_${userProfile.id}`;
    if (this.mockResponses.has(mockKey)) {
      return this.mockResponses.get(mockKey);
    }

    return {
      recommendations: this.generateBasicRecommendations(userProfile),
      alternativeProducts: this.suggestAlternatives(userProfile, scanHistory),
      dietaryTips: this.provideDietaryTips(userProfile),
    };
  }

  // Anthropic integration (fallback)
  async analyzeProductWithAnthropic(product: any, userProfile: any): Promise<any> {
    const prompt = this.buildAnthropicPrompt(product, userProfile);
    this.recordCall('anthropic', prompt);

    const mockKey = `anthropic_${product.id}_${userProfile.id}`;
    if (this.mockResponses.has(mockKey)) {
      return this.mockResponses.get(mockKey);
    }

    // Fallback to basic analysis
    return this.analyzeProductCompliance(product, userProfile);
  }

  // Vector similarity search simulation
  async findSimilarProducts(product: any, limit: number = 5): Promise<any[]> {
    const prompt = `Find products similar to: ${product.name}`;
    this.recordCall('vector_search', prompt);

    const mockKey = `similar_${product.id}`;
    if (this.mockResponses.has(mockKey)) {
      return this.mockResponses.get(mockKey);
    }

    // Generate mock similar products
    return Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      id: IntegrationTestUtils.generateTestId(),
      name: `Similar Product ${i + 1}`,
      similarity: 0.8 - (i * 0.1),
      allergens: product.allergens,
    }));
  }

  // Private helper methods
  private buildCompliancePrompt(product: any, userProfile: any): string {
    return `Analyze dietary compliance for product "${product.name}" with ingredients: ${product.ingredients.join(', ')}. User has allergies: ${userProfile.allergens.join(', ')} and dietary restrictions: ${userProfile.dietaryRestrictions.join(', ')}.`;
  }

  private buildRecommendationPrompt(userProfile: any, scanHistory: any[]): string {
    return `Generate recommendations for user with allergies: ${userProfile.allergens.join(', ')} based on ${scanHistory.length} previous scans.`;
  }

  private buildAnthropicPrompt(product: any, userProfile: any): string {
    return `Human: Analyze this product for dietary safety: ${JSON.stringify({ product, userProfile })}\n\nAssistant:`;
  }

  private detectViolations(product: any, userProfile: any): string[] {
    return product.allergens.filter((allergen: string) =>
      userProfile.allergens.includes(allergen)
    );
  }

  private detectWarnings(product: any, userProfile: any): string[] {
    const warnings: string[] = [];
    
    if (userProfile.dietaryRestrictions.includes('vegan')) {
      const nonVeganIngredients = ['milk', 'eggs', 'honey', 'gelatin'];
      const foundNonVegan = product.ingredients.filter((ingredient: string) =>
        nonVeganIngredients.some(nv => ingredient.toLowerCase().includes(nv))
      );
      if (foundNonVegan.length > 0) {
        warnings.push(`Contains non-vegan ingredients: ${foundNonVegan.join(', ')}`);
      }
    }

    if (userProfile.medicalConditions.includes('diabetes')) {
      const highSugarIngredients = ['sugar', 'corn syrup', 'fructose'];
      const foundSugar = product.ingredients.filter((ingredient: string) =>
        highSugarIngredients.some(sugar => ingredient.toLowerCase().includes(sugar))
      );
      if (foundSugar.length > 0) {
        warnings.push(`High sugar content may affect blood glucose`);
      }
    }

    return warnings;
  }

  private calculateConfidence(product: any, userProfile: any): number {
    let confidence = 0.8; // Base confidence
    
    // Higher confidence if product has detailed ingredient list
    if (product.ingredients && product.ingredients.length > 0) {
      confidence += 0.1;
    }
    
    // Higher confidence if allergens are explicitly listed
    if (product.allergens && product.allergens.length >= 0) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private generateReasoning(product: any, userProfile: any, violations: string[], warnings: string[]): string {
    if (violations.length > 0) {
      return `Product contains ${violations.join(', ')} which matches user's allergen profile.`;
    }
    
    if (warnings.length > 0) {
      return `Product may not align with user's dietary preferences: ${warnings.join('; ')}.`;
    }
    
    return `Product appears safe for user's dietary restrictions and preferences.`;
  }

  private generateBasicRecommendations(userProfile: any): string[] {
    const recommendations = ['Always check ingredient labels carefully'];
    
    if (userProfile.allergens.includes('milk')) {
      recommendations.push('Look for dairy-free alternatives');
    }
    
    if (userProfile.dietaryRestrictions.includes('vegan')) {
      recommendations.push('Consider certified vegan products');
    }
    
    return recommendations;
  }

  private suggestAlternatives(userProfile: any, scanHistory: any[]): string[] {
    return ['Organic alternatives', 'Store brand options', 'Specialty diet products'];
  }

  private provideDietaryTips(userProfile: any): string[] {
    return ['Read labels carefully', 'Contact manufacturers when unsure', 'Keep emergency medication handy'];
  }

  private recordCall(service: string, prompt: string): void {
    this.callHistory.push({
      service,
      prompt,
      timestamp: new Date(),
    });
  }

  // Test utilities
  mockResponse(key: string, response: any): void {
    this.mockResponses.set(key, response);
  }

  getCallHistory(): Array<{ service: string; prompt: string; timestamp: Date }> {
    return [...this.callHistory];
  }

  clear(): void {
    this.mockResponses.clear();
    this.callHistory = [];
  }
}

describe('AI Service Integration Tests', () => {
  let aiService: AIServiceIntegration;

  beforeEach(() => {
    aiService = new AIServiceIntegration();
  });

  afterEach(() => {
    aiService.clear();
  });

  describe('Product Compliance Analysis', () => {
    it('should analyze safe product correctly', async () => {
      const product = TestProductBuilder.safeProduct();
      const userProfile = TestUserProfileBuilder.milkAllergic();

      const result = await aiService.analyzeProductCompliance(product, userProfile);

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.reasoning).toContain('appears safe');
    }, integrationConfig.timeout);

    it('should detect allergen violations', async () => {
      const product = TestProductBuilder.milkProduct();
      const userProfile = TestUserProfileBuilder.milkAllergic();

      const result = await aiService.analyzeProductCompliance(product, userProfile);

      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('milk');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.reasoning).toContain('matches user\'s allergen profile');
    }, integrationConfig.timeout);

    it('should detect dietary restriction warnings', async () => {
      const product = TestProductBuilder.milkProduct();
      const userProfile = TestUserProfileBuilder.vegan();

      const result = await aiService.analyzeProductCompliance(product, userProfile);

      expect(result.warnings).toContain(expect.stringContaining('non-vegan ingredients'));
      expect(result.reasoning).toContain('dietary preferences');
    }, integrationConfig.timeout);

    it('should handle medical conditions', async () => {
      const product = TestProductBuilder.create()
        .withName('Sweet Candy')
        .withIngredients(['sugar', 'corn syrup', 'artificial flavors'])
        .build();
      const userProfile = TestUserProfileBuilder.diabetic();

      const result = await aiService.analyzeProductCompliance(product, userProfile);

      expect(result.warnings).toContain(expect.stringContaining('blood glucose'));
    }, integrationConfig.timeout);

    it('should use mocked responses when available', async () => {
      const product = TestProductBuilder.safeProduct();
      const userProfile = TestUserProfileBuilder.safeUser();
      
      const mockResponse = {
        isCompliant: false,
        violations: ['custom violation'],
        warnings: [],
        confidence: 0.95,
        reasoning: 'Mocked response for testing',
      };

      aiService.mockResponse(`compliance_${product.id}_${userProfile.id}`, mockResponse);

      const result = await aiService.analyzeProductCompliance(product, userProfile);

      expect(result).toEqual(mockResponse);
    }, integrationConfig.timeout);
  });

  describe('Recommendation Generation', () => {
    it('should generate basic recommendations', async () => {
      const userProfile = TestUserProfileBuilder.milkAllergic();
      const scanHistory = [
        TestScanResultBuilder.safeResult(),
        TestScanResultBuilder.violationResult(['milk']),
      ];

      const result = await aiService.generateRecommendations(userProfile, scanHistory);

      expect(result.recommendations).toContain('Always check ingredient labels carefully');
      expect(result.recommendations).toContain('Look for dairy-free alternatives');
      expect(result.alternativeProducts).toBeDefined();
      expect(result.dietaryTips).toBeDefined();
    }, integrationConfig.timeout);

    it('should provide vegan-specific recommendations', async () => {
      const userProfile = TestUserProfileBuilder.vegan();
      const scanHistory: any[] = [];

      const result = await aiService.generateRecommendations(userProfile, scanHistory);

      expect(result.recommendations).toContain('Consider certified vegan products');
    }, integrationConfig.timeout);
  });

  describe('Anthropic Fallback', () => {
    it('should use Anthropic as fallback service', async () => {
      const product = TestProductBuilder.nutProduct();
      const userProfile = TestUserProfileBuilder.nutAllergic();

      const result = await aiService.analyzeProductWithAnthropic(product, userProfile);

      expect(result).toBeDefined();
      expect(result.isCompliant).toBe(false);
      expect(result.violations).toContain('peanuts');

      const callHistory = aiService.getCallHistory();
      expect(callHistory.some(call => call.service === 'anthropic')).toBe(true);
    }, integrationConfig.timeout);
  });

  describe('Vector Similarity Search', () => {
    it('should find similar products', async () => {
      const product = TestProductBuilder.milkProduct();

      const result = await aiService.findSimilarProducts(product, 3);

      expect(result).toHaveLength(3);
      expect(result[0].similarity).toBeGreaterThan(result[1].similarity);
      expect(result.every(p => p.id && p.name && p.similarity)).toBe(true);
    }, integrationConfig.timeout);

    it('should use mocked similar products', async () => {
      const product = TestProductBuilder.safeProduct();
      const mockSimilar = [
        { id: '1', name: 'Mock Similar 1', similarity: 0.9, allergens: [] },
        { id: '2', name: 'Mock Similar 2', similarity: 0.8, allergens: [] },
      ];

      aiService.mockResponse(`similar_${product.id}`, mockSimilar);

      const result = await aiService.findSimilarProducts(product);

      expect(result).toEqual(mockSimilar);
    }, integrationConfig.timeout);
  });

  describe('Service Reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const products = [
        TestProductBuilder.milkProduct(),
        TestProductBuilder.nutProduct(),
        TestProductBuilder.safeProduct(),
      ];
      const userProfile = TestUserProfileBuilder.milkAllergic();

      const promises = products.map(product =>
        aiService.analyzeProductCompliance(product, userProfile)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.confidence > 0)).toBe(true);
    }, integrationConfig.timeout);

    it('should track API call history', async () => {
      const product = TestProductBuilder.safeProduct();
      const userProfile = TestUserProfileBuilder.safeUser();

      await aiService.analyzeProductCompliance(product, userProfile);
      await aiService.generateRecommendations(userProfile, []);
      await aiService.findSimilarProducts(product);

      const callHistory = aiService.getCallHistory();

      expect(callHistory).toHaveLength(3);
      expect(callHistory[0].service).toBe('openai');
      expect(callHistory[1].service).toBe('openai');
      expect(callHistory[2].service).toBe('vector_search');
      expect(callHistory.every(call => call.timestamp instanceof Date)).toBe(true);
    });

    it('should maintain performance under load', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 20 concurrent analysis requests
      for (let i = 0; i < 20; i++) {
        const product = TestProductBuilder.create().withName(`Product ${i}`).build();
        const userProfile = TestUserProfileBuilder.safeUser();
        promises.push(aiService.analyzeProductCompliance(product, userProfile));
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(20);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete in under 10 seconds
    }, integrationConfig.timeout);
  });
});
