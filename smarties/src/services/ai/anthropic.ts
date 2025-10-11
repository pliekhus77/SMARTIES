/**
 * Anthropic API service integration
 * Fallback AI service for dietary analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { getDietaryAnalysisPrompt } from '../../config/ai';
import { DietaryAnalysisRequest, DietaryAnalysisResponse } from './openai';

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  timeout?: number;
}

export class AnthropicService {
  private config: AnthropicConfig;
  private client: Anthropic;

  constructor(config: AnthropicConfig) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
    });
  }

  /**
   * Analyze product for dietary compliance (fallback service)
   */
  async analyzeDietaryCompliance(request: DietaryAnalysisRequest): Promise<DietaryAnalysisResponse> {
    try {
      if (!this.config.apiKey) {
        throw new Error('Anthropic API key not configured');
      }

      const prompt = this.buildAnalysisPrompt(request);
      
      const systemPrompt = 'You are a dietary safety assistant specialized in food allergen and dietary restriction analysis. Always prioritize user safety and err on the side of caution. Respond only with valid JSON.';
      const fullPrompt = `${systemPrompt}\n\n${prompt}`;

      const completion = await this.client.completions.create({
        model: this.config.model,
        max_tokens_to_sample: this.config.maxTokens,
        prompt: `\n\nHuman: ${fullPrompt}\n\nAssistant:`,
      });

      const responseContent = completion.completion;
      if (!responseContent) {
        throw new Error('Empty response from Anthropic');
      }

      const analysis = JSON.parse(responseContent.trim());
      
      // Validate response structure
      return this.validateAndNormalizeResponse(analysis);
      
    } catch (error) {
      console.error('Anthropic dietary analysis failed:', error);
      throw new Error(`Anthropic analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test Anthropic API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.config.apiKey) {
        return false;
      }

      const response = await this.client.completions.create({
        model: this.config.model,
        max_tokens_to_sample: 10,
        prompt: '\n\nHuman: Test connection. Respond with "OK".\n\nAssistant:',
      });

      return response.completion?.includes('OK') || false;
    } catch (error) {
      console.error('Anthropic connection test failed:', error);
      return false;
    }
  }

  /**
   * Build analysis prompt from request
   */
  private buildAnalysisPrompt(request: DietaryAnalysisRequest): string {
    const template = getDietaryAnalysisPrompt();
    
    return template
      .replace('{productName}', request.productName)
      .replace('{ingredients}', request.ingredients.join(', '))
      .replace('{userRestrictions}', request.userRestrictions.join(', '))
      + (request.strictMode ? '\n\nIMPORTANT: User has strict mode enabled. Be extra cautious with any potential violations.' : '');
  }

  /**
   * Validate and normalize API response
   */
  private validateAndNormalizeResponse(analysis: any): DietaryAnalysisResponse {
    return {
      safe: Boolean(analysis.safe),
      violations: Array.isArray(analysis.violations) ? analysis.violations : [],
      warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
      confidence: typeof analysis.confidence === 'number' ? Math.max(0, Math.min(1, analysis.confidence)) : 0.5,
      explanation: typeof analysis.explanation === 'string' ? analysis.explanation : 'Analysis completed'
    };
  }
}