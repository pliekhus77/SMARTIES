/**
 * RAG Context Construction Service for Dietary Analysis
 * Implements Requirements 7.1, 7.2 from vector search specification
 */

import { VectorSearchService } from './search/VectorSearchService';
import { UserProfile, Product, DietaryRestriction } from '../types/core';

export interface RAGContext {
  product: Product;
  userProfile: UserProfile;
  similarProducts: Product[];
  dietaryGuidelines: DietaryGuideline[];
  contextMetadata: ContextMetadata;
}

export interface DietaryGuideline {
  type: 'allergy' | 'religious' | 'medical' | 'lifestyle';
  restriction: string;
  guidelines: string[];
  certifications?: string[];
}

export interface ContextMetadata {
  dataCompleteness: number;
  similarityThreshold: number;
  contextSize: number;
  generatedAt: Date;
}

export class RAGContextService {
  private vectorSearch: VectorSearchService;
  private dietaryGuidelines: Map<string, DietaryGuideline>;

  constructor(vectorSearch: VectorSearchService) {
    this.vectorSearch = vectorSearch;
    this.dietaryGuidelines = this.initializeDietaryGuidelines();
  }

  /**
   * Build comprehensive RAG context for dietary analysis
   */
  async buildRAGContext(product: Product, userProfile: UserProfile): Promise<RAGContext> {
    const similarProducts = await this.findSimilarProducts(product, userProfile);
    const relevantGuidelines = this.getRelevantGuidelines(userProfile.restrictions);
    const metadata = this.calculateContextMetadata(product, similarProducts);

    return {
      product,
      userProfile,
      similarProducts,
      dietaryGuidelines: relevantGuidelines,
      contextMetadata: metadata
    };
  }

  /**
   * Find similar products using vector search
   */
  private async findSimilarProducts(product: Product, userProfile: UserProfile): Promise<Product[]> {
    if (!product.embedding) {
      return [];
    }

    try {
      const results = await this.vectorSearch.findSimilarProducts(
        product.embedding,
        {
          limit: 5,
          threshold: 0.7,
          filters: {
            category: product.category,
            excludeUPC: product.upc
          }
        }
      );

      return results.map(r => r.product);
    } catch (error) {
      console.error('Failed to find similar products:', error);
      return [];
    }
  }

  /**
   * Get relevant dietary guidelines for user restrictions
   */
  private getRelevantGuidelines(restrictions: DietaryRestriction[]): DietaryGuideline[] {
    const guidelines: DietaryGuideline[] = [];

    for (const restriction of restrictions) {
      const guideline = this.dietaryGuidelines.get(restriction.type);
      if (guideline) {
        guidelines.push(guideline);
      }
    }

    return guidelines;
  }

  /**
   * Calculate context metadata for quality assessment
   */
  private calculateContextMetadata(product: Product, similarProducts: Product[]): ContextMetadata {
    let completeness = 0;
    
    // Product data completeness
    if (product.ingredients?.length) completeness += 0.4;
    if (product.nutritionFacts) completeness += 0.2;
    if (product.certifications?.length) completeness += 0.2;
    if (product.allergenInfo?.length) completeness += 0.2;

    return {
      dataCompleteness: completeness,
      similarityThreshold: 0.7,
      contextSize: similarProducts.length,
      generatedAt: new Date()
    };
  }

  /**
   * Initialize dietary guidelines database
   */
  private initializeDietaryGuidelines(): Map<string, DietaryGuideline> {
    const guidelines = new Map<string, DietaryGuideline>();

    // Allergy guidelines
    guidelines.set('peanuts', {
      type: 'allergy',
      restriction: 'peanuts',
      guidelines: [
        'Check for peanut ingredients and derivatives',
        'Look for "may contain peanuts" warnings',
        'Verify manufacturing facility safety'
      ]
    });

    // Religious guidelines
    guidelines.set('halal', {
      type: 'religious',
      restriction: 'halal',
      guidelines: [
        'Prioritize Halal certification symbols',
        'Check for pork and alcohol derivatives',
        'Verify gelatin sources'
      ],
      certifications: ['Halal', 'Islamic Food and Nutrition Council']
    });

    // Lifestyle guidelines
    guidelines.set('vegan', {
      type: 'lifestyle',
      restriction: 'vegan',
      guidelines: [
        'Check for all animal-derived ingredients',
        'Verify processing aids and additives',
        'Look for vegan certification'
      ],
      certifications: ['Certified Vegan', 'Vegan Society']
    });

    return guidelines;
  }
}
