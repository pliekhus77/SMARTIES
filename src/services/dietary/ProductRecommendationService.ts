import { VectorSearchService } from '../search/VectorSearchService';
import { EmbeddingService } from '../EmbeddingService';
import { AllergenDetectionService } from './AllergenDetectionService';
import { DietaryComplianceService, DietaryRestriction } from './DietaryComplianceService';
import { Product } from '../../models/Product';

export interface UserProfile {
  allergens: string[];
  dietaryRestrictions: DietaryRestriction[];
  preferences: string[];
  scanHistory: string[]; // UPC codes
}

export interface ProductRecommendation {
  product: Product;
  score: number;
  confidence: number;
  reasons: string[];
  safetyLevel: 'safe' | 'caution' | 'avoid';
}

export interface RecommendationOptions {
  maxResults?: number;
  includeAlternatives?: boolean;
  prioritizeSafety?: boolean;
  similarityThreshold?: number;
}

export class ProductRecommendationService {
  constructor(
    private vectorSearchService: VectorSearchService,
    private embeddingService: EmbeddingService,
    private allergenService: AllergenDetectionService,
    private complianceService: DietaryComplianceService
  ) {}

  async recommendSaferAlternatives(
    product: Product,
    userProfile: UserProfile,
    options: RecommendationOptions = {}
  ): Promise<ProductRecommendation[]> {
    const {
      maxResults = 10,
      similarityThreshold = 0.6,
      prioritizeSafety = true
    } = options;

    try {
      // Find similar products
      const similarProducts = await this.findSimilarProducts(product, maxResults * 2);
      
      // Analyze each product for safety and compliance
      const recommendations: ProductRecommendation[] = [];
      
      for (const similarProduct of similarProducts) {
        if (similarProduct.product.upc === product.upc) continue;

        const recommendation = await this.analyzeProductForUser(
          similarProduct.product,
          userProfile,
          similarProduct.similarityScore
        );

        if (recommendation.score >= similarityThreshold) {
          recommendations.push(recommendation);
        }
      }

      // Sort by safety and score
      return this.rankRecommendations(recommendations, prioritizeSafety)
        .slice(0, maxResults);

    } catch (error) {
      console.error('Safer alternatives recommendation failed:', error);
      return [];
    }
  }

  async recommendPersonalized(
    userProfile: UserProfile,
    options: RecommendationOptions = {}
  ): Promise<ProductRecommendation[]> {
    const {
      maxResults = 15,
      similarityThreshold = 0.5
    } = options;

    try {
      // Generate recommendations based on user preferences and history
      const preferenceRecommendations = await this.getPreferenceBasedRecommendations(
        userProfile,
        maxResults
      );

      const historyRecommendations = await this.getHistoryBasedRecommendations(
        userProfile,
        maxResults
      );

      // Merge and deduplicate recommendations
      const allRecommendations = this.mergeRecommendations([
        preferenceRecommendations,
        historyRecommendations
      ]);

      // Filter by similarity threshold and safety
      const filteredRecommendations = allRecommendations.filter(rec => 
        rec.score >= similarityThreshold && rec.safetyLevel !== 'avoid'
      );

      return this.rankRecommendations(filteredRecommendations, true)
        .slice(0, maxResults);

    } catch (error) {
      console.error('Personalized recommendations failed:', error);
      return [];
    }
  }

  async discoverSimilarProducts(
    query: string,
    userProfile: UserProfile,
    options: RecommendationOptions = {}
  ): Promise<ProductRecommendation[]> {
    const {
      maxResults = 20,
      similarityThreshold = 0.4
    } = options;

    try {
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      if (!queryEmbedding) return [];

      // Search across different embedding types
      const [ingredientResults, nameResults] = await Promise.all([
        this.vectorSearchService.searchByIngredients(queryEmbedding, {
          maxResults: maxResults / 2,
          similarityThreshold,
          dietaryFilters: this.getDietaryFilters(userProfile)
        }),
        this.vectorSearchService.searchByProductName(queryEmbedding, {
          maxResults: maxResults / 2,
          similarityThreshold,
          dietaryFilters: this.getDietaryFilters(userProfile)
        })
      ]);

      // Combine and analyze results
      const allResults = [...ingredientResults, ...nameResults];
      const recommendations: ProductRecommendation[] = [];

      for (const result of allResults) {
        const recommendation = await this.analyzeProductForUser(
          result.product,
          userProfile,
          result.similarityScore
        );
        recommendations.push(recommendation);
      }

      return this.deduplicateAndRank(recommendations, maxResults);

    } catch (error) {
      console.error('Similar product discovery failed:', error);
      return [];
    }
  }

  private async findSimilarProducts(product: Product, maxResults: number) {
    const productEmbedding = await this.embeddingService.generateEmbedding(product.name);
    if (!productEmbedding) return [];

    return await this.vectorSearchService.searchByProductName(productEmbedding, {
      maxResults,
      similarityThreshold: 0.3
    });
  }

  private async analyzeProductForUser(
    product: Product,
    userProfile: UserProfile,
    baseSimilarity: number
  ): Promise<ProductRecommendation> {
    const reasons: string[] = [];
    let safetyLevel: 'safe' | 'caution' | 'avoid' = 'safe';
    let confidence = baseSimilarity;

    // Check allergen safety
    const allergenAnalysis = await this.allergenService.analyzeProduct(product, userProfile.allergens);
    if (allergenAnalysis.overallRiskLevel === 'danger') {
      safetyLevel = 'avoid';
      reasons.push('Contains allergens you must avoid');
      confidence *= 0.3;
    } else if (allergenAnalysis.overallRiskLevel === 'caution') {
      safetyLevel = 'caution';
      reasons.push('May contain trace allergens');
      confidence *= 0.7;
    } else {
      reasons.push('Safe from your allergens');
      confidence *= 1.1;
    }

    // Check dietary compliance
    const complianceAnalysis = await this.complianceService.analyzeCompliance(
      product,
      userProfile.dietaryRestrictions
    );
    
    if (!complianceAnalysis.overallCompliance) {
      const requiredViolations = Object.entries(complianceAnalysis.results)
        .filter(([_, result]) => !result.compliant)
        .map(([type, _]) => type);
      
      if (requiredViolations.length > 0) {
        safetyLevel = safetyLevel === 'avoid' ? 'avoid' : 'caution';
        reasons.push(`Does not meet ${requiredViolations.join(', ')} requirements`);
        confidence *= 0.6;
      }
    } else {
      reasons.push('Meets all your dietary requirements');
      confidence *= 1.2;
    }

    // Check user preferences
    const preferenceMatch = this.checkPreferenceMatch(product, userProfile.preferences);
    if (preferenceMatch.score > 0) {
      reasons.push(`Matches preferences: ${preferenceMatch.matches.join(', ')}`);
      confidence *= (1 + preferenceMatch.score * 0.3);
    }

    // Calculate final score
    const score = Math.min(0.95, confidence * baseSimilarity);

    return {
      product,
      score,
      confidence: Math.min(0.95, confidence),
      reasons,
      safetyLevel
    };
  }

  private async getPreferenceBasedRecommendations(
    userProfile: UserProfile,
    maxResults: number
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    for (const preference of userProfile.preferences.slice(0, 3)) {
      const embedding = await this.embeddingService.generateEmbedding(preference);
      if (!embedding) continue;

      const results = await this.vectorSearchService.searchByIngredients(embedding, {
        maxResults: maxResults / 3,
        similarityThreshold: 0.5,
        dietaryFilters: this.getDietaryFilters(userProfile)
      });

      for (const result of results) {
        const recommendation = await this.analyzeProductForUser(
          result.product,
          userProfile,
          result.similarityScore
        );
        recommendations.push(recommendation);
      }
    }

    return recommendations;
  }

  private async getHistoryBasedRecommendations(
    userProfile: UserProfile,
    maxResults: number
  ): Promise<ProductRecommendation[]> {
    // This would typically fetch products from scan history
    // For now, return empty array as we don't have access to product lookup by UPC
    return [];
  }

  private checkPreferenceMatch(product: Product, preferences: string[]): { score: number; matches: string[] } {
    const matches: string[] = [];
    const productText = [
      product.name,
      ...(product.ingredients || [])
    ].join(' ').toLowerCase();

    preferences.forEach(preference => {
      if (productText.includes(preference.toLowerCase())) {
        matches.push(preference);
      }
    });

    return {
      score: matches.length / Math.max(preferences.length, 1),
      matches
    };
  }

  private getDietaryFilters(userProfile: UserProfile) {
    const filters: any = {};
    
    userProfile.dietaryRestrictions.forEach(restriction => {
      if (restriction.required) {
        filters[restriction.type] = true;
      }
    });

    return filters;
  }

  private rankRecommendations(
    recommendations: ProductRecommendation[],
    prioritizeSafety: boolean
  ): ProductRecommendation[] {
    return recommendations.sort((a, b) => {
      if (prioritizeSafety) {
        // Safety first, then score
        const safetyOrder = { safe: 3, caution: 2, avoid: 1 };
        const safetyDiff = safetyOrder[b.safetyLevel] - safetyOrder[a.safetyLevel];
        if (safetyDiff !== 0) return safetyDiff;
      }
      
      // Then by score
      return b.score - a.score;
    });
  }

  private mergeRecommendations(recommendationSets: ProductRecommendation[][]): ProductRecommendation[] {
    const merged: ProductRecommendation[] = [];
    const seen = new Set<string>();

    recommendationSets.forEach(recommendations => {
      recommendations.forEach(rec => {
        const key = rec.product._id || rec.product.upc;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(rec);
        }
      });
    });

    return merged;
  }

  private deduplicateAndRank(
    recommendations: ProductRecommendation[],
    maxResults: number
  ): ProductRecommendation[] {
    const seen = new Set<string>();
    const deduplicated: ProductRecommendation[] = [];

    recommendations.forEach(rec => {
      const key = rec.product._id || rec.product.upc;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(rec);
      }
    });

    return this.rankRecommendations(deduplicated, true).slice(0, maxResults);
  }
}
