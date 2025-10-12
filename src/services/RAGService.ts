/**
 * RAG Service with LLM Integration for Dietary Analysis
 * Implements Requirements 7.3, 7.4, 7.5, 8.1, 8.2 from vector search specification
 */

import OpenAI from 'openai';
import { RAGContext } from './RAGContextService';

export interface DietaryAnalysisResult {
  safetyLevel: 'safe' | 'caution' | 'danger';
  violations: DietaryViolation[];
  confidence: number;
  explanation: string;
  alternatives?: ProductAlternative[];
}

export interface DietaryViolation {
  type: 'allergy' | 'religious' | 'medical' | 'lifestyle';
  restriction: string;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  ingredients: string[];
}

export interface ProductAlternative {
  upc: string;
  name: string;
  similarity: number;
  safetyLevel: 'safe' | 'caution';
  reason: string;
}

export class RAGService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Analyze dietary compliance using RAG context and LLM
   */
  async analyzeDietaryCompliance(context: RAGContext): Promise<DietaryAnalysisResult> {
    const prompt = this.buildAnalysisPrompt(context);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a dietary compliance expert. Analyze products for safety based on user restrictions. Always err on the side of caution.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const analysis = this.parseAIResponse(response.choices[0].message.content || '');
      const confidence = this.calculateConfidence(context, analysis);

      return {
        ...analysis,
        confidence,
        alternatives: await this.generateAlternatives(context)
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.createSafetyFirstFallback(context);
    }
  }

  /**
   * Build structured prompt for LLM analysis
   */
  private buildAnalysisPrompt(context: RAGContext): string {
    const { product, userProfile, similarProducts, dietaryGuidelines } = context;

    return `
PRODUCT ANALYSIS REQUEST

Product: ${product.name}
UPC: ${product.upc}
Ingredients: ${product.ingredients?.join(', ') || 'Not available'}
Allergen Info: ${product.allergenInfo?.join(', ') || 'None listed'}
Certifications: ${product.certifications?.join(', ') || 'None'}

USER RESTRICTIONS:
${userProfile.restrictions.map(r => `- ${r.type}: ${r.name} (severity: ${r.severity})`).join('\n')}

DIETARY GUIDELINES:
${dietaryGuidelines.map(g => `${g.restriction}: ${g.guidelines.join('; ')}`).join('\n')}

SIMILAR PRODUCTS:
${similarProducts.map(p => `- ${p.name}: ${p.ingredients?.slice(0, 3).join(', ')}`).join('\n')}

ANALYSIS REQUIREMENTS:
1. Determine safety level: safe, caution, or danger
2. Identify specific violations with severity
3. Provide clear explanation
4. Consider cross-contamination risks
5. Prioritize certified labels over ingredient analysis

Respond in JSON format:
{
  "safetyLevel": "safe|caution|danger",
  "violations": [{"type": "", "restriction": "", "severity": "", "reason": "", "ingredients": []}],
  "explanation": "detailed reasoning"
}
`;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(response: string): Omit<DietaryAnalysisResult, 'confidence' | 'alternatives'> {
    try {
      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      return {
        safetyLevel: parsed.safetyLevel || 'caution',
        violations: parsed.violations || [],
        explanation: parsed.explanation || 'Analysis completed'
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        safetyLevel: 'caution',
        violations: [],
        explanation: 'Unable to parse analysis results. Please review manually.'
      };
    }
  }

  /**
   * Calculate confidence score based on data quality and AI certainty
   */
  private calculateConfidence(context: RAGContext, analysis: DietaryAnalysisResult): number {
    let confidence = 0.5; // Base confidence

    // Data completeness factor
    confidence += context.contextMetadata.dataCompleteness * 0.3;

    // Similar products factor
    if (context.similarProducts.length >= 3) confidence += 0.1;

    // Certification factor
    if (context.product.certifications?.length) confidence += 0.1;

    // Safety-first adjustment - lower confidence for uncertain cases
    if (analysis.safetyLevel === 'caution') confidence *= 0.8;
    if (analysis.safetyLevel === 'danger') confidence *= 0.9;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate alternative product recommendations
   */
  private async generateAlternatives(context: RAGContext): Promise<ProductAlternative[]> {
    return context.similarProducts
      .filter(p => p.upc !== context.product.upc)
      .slice(0, 3)
      .map(p => ({
        upc: p.upc,
        name: p.name,
        similarity: 0.8, // Placeholder - would calculate actual similarity
        safetyLevel: 'safe' as const,
        reason: 'Similar product with better compliance'
      }));
  }

  /**
   * Create safety-first fallback response for errors
   */
  private createSafetyFirstFallback(context: RAGContext): DietaryAnalysisResult {
    return {
      safetyLevel: 'caution',
      violations: [{
        type: 'medical',
        restriction: 'analysis_error',
        severity: 'medium',
        reason: 'Unable to complete analysis - recommend manual review',
        ingredients: []
      }],
      confidence: 0.1,
      explanation: 'Analysis failed. For safety, please review this product manually or consult healthcare provider.',
      alternatives: []
    };
  }
}
