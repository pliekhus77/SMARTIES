/**
 * AI Service Factory
 * Creates and configures AI services with proper error handling
 */

import { OpenAIService } from './openai';
import { AnthropicService } from './anthropic';
import { DietaryAnalysisService } from './dietary-analysis';
import { getAIConfig, validateAIConfig } from '../../config/ai';

export interface AIServiceFactory {
  createDietaryAnalysisService(): DietaryAnalysisService;
  createOpenAIService(): OpenAIService | null;
  createAnthropicService(): AnthropicService | null;
  validateConfiguration(): boolean;
}

export class DefaultAIServiceFactory implements AIServiceFactory {
  private config = getAIConfig();
  private configValidation = validateAIConfig(this.config);

  /**
   * Create the main dietary analysis service with fallback logic
   */
  createDietaryAnalysisService(): DietaryAnalysisService {
    const openAIService = this.createOpenAIService();
    const anthropicService = this.createAnthropicService();

    if (!openAIService && !anthropicService) {
      console.warn('No AI services configured, dietary analysis will use rule-based fallback only');
    }

    // Create placeholder services if not configured
    const openAI = openAIService || this.createPlaceholderOpenAIService();
    const anthropic = anthropicService || this.createPlaceholderAnthropicService();

    return new DietaryAnalysisService(openAI, anthropic);
  }

  /**
   * Create OpenAI service if configured
   */
  createOpenAIService(): OpenAIService | null {
    if (!this.configValidation.openaiValid) {
      console.warn('OpenAI API key not configured, service will not be available');
      return null;
    }

    try {
      return new OpenAIService(this.config.openai);
    } catch (error) {
      console.error('Failed to create OpenAI service:', error);
      return null;
    }
  }

  /**
   * Create Anthropic service if configured
   */
  createAnthropicService(): AnthropicService | null {
    if (!this.configValidation.anthropicValid) {
      console.warn('Anthropic API key not configured, service will not be available');
      return null;
    }

    try {
      return new AnthropicService(this.config.anthropic);
    } catch (error) {
      console.error('Failed to create Anthropic service:', error);
      return null;
    }
  }

  /**
   * Validate AI service configuration
   */
  validateConfiguration(): boolean {
    return this.configValidation.hasValidService;
  }

  /**
   * Create placeholder OpenAI service that always throws
   */
  private createPlaceholderOpenAIService(): OpenAIService {
    return new OpenAIService({
      apiKey: '',
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.1
    });
  }

  /**
   * Create placeholder Anthropic service that always throws
   */
  private createPlaceholderAnthropicService(): AnthropicService {
    return new AnthropicService({
      apiKey: '',
      model: 'claude-3-sonnet-20240229',
      maxTokens: 1000
    });
  }
}

// Singleton instance
let aiServiceFactory: AIServiceFactory | null = null;

/**
 * Get the AI service factory instance
 */
export function getAIServiceFactory(): AIServiceFactory {
  if (!aiServiceFactory) {
    aiServiceFactory = new DefaultAIServiceFactory();
  }
  return aiServiceFactory;
}

/**
 * Create a configured dietary analysis service
 */
export function createDietaryAnalysisService(): DietaryAnalysisService {
  return getAIServiceFactory().createDietaryAnalysisService();
}

/**
 * Test AI service configuration and connectivity
 */
export async function testAIServices(): Promise<{
  configured: boolean;
  openaiWorking: boolean;
  anthropicWorking: boolean;
  errors: string[];
}> {
  const factory = getAIServiceFactory();
  const errors: string[] = [];
  
  const configured = factory.validateConfiguration();
  if (!configured) {
    errors.push('No AI services are properly configured');
  }

  let openaiWorking = false;
  let anthropicWorking = false;

  try {
    const openaiService = factory.createOpenAIService();
    if (openaiService) {
      openaiWorking = await openaiService.testConnection();
      if (!openaiWorking) {
        errors.push('OpenAI service connection failed');
      }
    }
  } catch (error) {
    errors.push(`OpenAI service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    const anthropicService = factory.createAnthropicService();
    if (anthropicService) {
      anthropicWorking = await anthropicService.testConnection();
      if (!anthropicWorking) {
        errors.push('Anthropic service connection failed');
      }
    }
  } catch (error) {
    errors.push(`Anthropic service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    configured,
    openaiWorking,
    anthropicWorking,
    errors
  };
}