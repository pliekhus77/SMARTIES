/**
 * OpenAI API service integration
 * Primary AI service for dietary analysis
 */

import OpenAI from 'openai';
import { getDietaryAnalysisPrompt } from '../../config/ai';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout?: number;
}

export interface DietaryAnalysisRequest {
  productName: string;
  ingredients: string[];
  userRestrictions: string[];
  strictMode: boolean;
}

export interface DietaryAnalysisResponse {
  safe: boolean;
  violations: string[];
  warnings: string[];
  confidence: number;
  explanation: string;
}

export class OpenAIService {
  private config: OpenAIConfig;
  private client: OpenAI;

  constructor(config: OpenAIConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
    });
  }

  /**
   * Analyze product for dietary compliance
   */
  async analyzeDietaryCompliance(request: DietaryAnalysisRequest): Promise<DietaryAnalysisResponse> {
    try {
      if (!this.config.apiKey) {
        throw new Error('OpenAI API key not configured');
      }

      const prompt = this.buildAnalysisPrompt(request);
      
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a dietary safety assistant specialized in food allergen and dietary restriction analysis. Always prioritize user safety and err on the side of caution.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        response_format: { type: 'json_object' }
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      const analysis = JSON.parse(responseContent);
      
      // Validate response structure
      return this.validateAndNormalizeResponse(analysis);
      
    } catch (error) {
      console.error('OpenAI dietary analysis failed:', error);
      throw new Error(`OpenAI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test OpenAI API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.config.apiKey) {
        return false;
      }

      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: 'user', content: 'Test connection. Respond with "OK".' }],
        max_tokens: 10,
        temperature: 0
      });

      return response.choices[0]?.message?.content?.includes('OK') || false;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
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