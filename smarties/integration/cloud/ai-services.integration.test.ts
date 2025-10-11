import { OpenAIService } from '../../src/services/ai/openai';
import { AnthropicService } from '../../src/services/ai/anthropic';

describe('AI Services Integration Tests', () => {
  let openaiService: OpenAIService;
  let anthropicService: AnthropicService;

  beforeAll(() => {
    const openaiConfig = {
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
      model: 'gpt-3.5-turbo',
      maxTokens: 150,
      temperature: 0.1,
    };

    const anthropicConfig = {
      apiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
      model: 'claude-3-haiku-20240307',
      maxTokens: 150,
      temperature: 0.1,
    };

    openaiService = new OpenAIService(openaiConfig);
    anthropicService = new AnthropicService(anthropicConfig);
  });

  describe('OpenAI Service', () => {
    it('should analyze dietary compliance successfully', async () => {
      if (!process.env.OPENAI_API_KEY) {
        console.log('Skipping OpenAI test - no API key provided');
        return;
      }

      const productData = {
        name: 'Peanut Butter Cookies',
        ingredients: ['flour', 'peanuts', 'sugar', 'butter', 'eggs'],
        allergens: ['peanuts', 'dairy', 'eggs']
      };

      const userRestrictions = {
        allergies: ['peanuts'],
        medical: [],
        religious: [],
        lifestyle: []
      };

      const result = await openaiService.analyzeDietaryCompliance(productData, userRestrictions);
      
      expect(result).toBeTruthy();
      expect(result.safe).toBe(false);
      expect(result.violations).toContain('peanuts');
    }, 20000);

    it('should handle API errors gracefully', async () => {
      const badService = new OpenAIService({
        apiKey: 'invalid-key',
        model: 'gpt-3.5-turbo',
        maxTokens: 150,
        temperature: 0.1,
      });

      const productData = {
        name: 'Test Product',
        ingredients: ['water'],
        allergens: []
      };

      const userRestrictions = {
        allergies: [],
        medical: [],
        religious: [],
        lifestyle: []
      };

      await expect(badService.analyzeDietaryCompliance(productData, userRestrictions))
        .rejects.toThrow();
    }, 10000);
  });

  describe('Anthropic Service', () => {
    it('should analyze dietary compliance successfully', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping Anthropic test - no API key provided');
        return;
      }

      const productData = {
        name: 'Vegetable Soup',
        ingredients: ['water', 'carrots', 'celery', 'onions', 'salt'],
        allergens: []
      };

      const userRestrictions = {
        allergies: [],
        medical: [],
        religious: [],
        lifestyle: ['vegan']
      };

      const result = await anthropicService.analyzeDietaryCompliance(productData, userRestrictions);
      
      expect(result).toBeTruthy();
      expect(result.safe).toBe(true);
      expect(result.violations).toHaveLength(0);
    }, 20000);

    it('should handle API errors gracefully', async () => {
      const badService = new AnthropicService({
        apiKey: 'invalid-key',
        model: 'claude-3-haiku-20240307',
        maxTokens: 150,
        temperature: 0.1,
      });

      const productData = {
        name: 'Test Product',
        ingredients: ['water'],
        allergens: []
      };

      const userRestrictions = {
        allergies: [],
        medical: [],
        religious: [],
        lifestyle: []
      };

      await expect(badService.analyzeDietaryCompliance(productData, userRestrictions))
        .rejects.toThrow();
    }, 10000);
  });

  describe('Service Failover', () => {
    it('should fallback from OpenAI to Anthropic on failure', async () => {
      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('Skipping failover test - no Anthropic API key provided');
        return;
      }

      // Create a service with invalid OpenAI key but valid Anthropic key
      const failoverService = {
        async analyzeDietaryCompliance(productData: any, userRestrictions: any) {
          try {
            const badOpenAI = new OpenAIService({
              apiKey: 'invalid-key',
              model: 'gpt-3.5-turbo',
              maxTokens: 150,
              temperature: 0.1,
            });
            return await badOpenAI.analyzeDietaryCompliance(productData, userRestrictions);
          } catch (error) {
            console.log('OpenAI failed, falling back to Anthropic');
            return await anthropicService.analyzeDietaryCompliance(productData, userRestrictions);
          }
        }
      };

      const productData = {
        name: 'Test Product',
        ingredients: ['water', 'salt'],
        allergens: []
      };

      const userRestrictions = {
        allergies: [],
        medical: [],
        religious: [],
        lifestyle: []
      };

      const result = await failoverService.analyzeDietaryCompliance(productData, userRestrictions);
      expect(result).toBeTruthy();
      expect(result.safe).toBe(true);
    }, 30000);
  });
});