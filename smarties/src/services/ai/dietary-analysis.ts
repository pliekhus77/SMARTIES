/**
 * Dietary analysis service with AI fallback logic
 * Coordinates between OpenAI and Anthropic services
 */

import { OpenAIService, DietaryAnalysisRequest, DietaryAnalysisResponse } from './openai';
import { AnthropicService } from './anthropic';

export class DietaryAnalysisService {
  private openAIService: OpenAIService;
  private anthropicService: AnthropicService;

  constructor(openAIService: OpenAIService, anthropicService: AnthropicService) {
    this.openAIService = openAIService;
    this.anthropicService = anthropicService;
  }

  /**
   * Analyze product with automatic fallback
   */
  async analyzeProduct(request: DietaryAnalysisRequest): Promise<DietaryAnalysisResponse> {
    try {
      // Try OpenAI first
      return await this.openAIService.analyzeDietaryCompliance(request);
    } catch (openAIError) {
      console.warn('OpenAI analysis failed, falling back to Anthropic:', openAIError);
      
      try {
        // Fallback to Anthropic
        return await this.anthropicService.analyzeDietaryCompliance(request);
      } catch (anthropicError) {
        console.error('Both AI services failed:', { openAIError, anthropicError });
        
        // Final fallback to basic rule-based analysis
        return this.basicRuleBasedAnalysis(request);
      }
    }
  }

  /**
   * Basic rule-based analysis as final fallback
   */
  private basicRuleBasedAnalysis(request: DietaryAnalysisRequest): DietaryAnalysisResponse {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Simple allergen detection
    const ingredients = request.ingredients.join(' ').toLowerCase();
    
    request.userRestrictions.forEach(restriction => {
      const restrictionLower = restriction.toLowerCase();
      if (ingredients.includes(restrictionLower)) {
        violations.push(restriction);
      }
    });

    return {
      safe: violations.length === 0,
      violations,
      warnings,
      confidence: 0.7, // Lower confidence for rule-based analysis
      explanation: 'Basic rule-based analysis (AI services unavailable)'
    };
  }
}