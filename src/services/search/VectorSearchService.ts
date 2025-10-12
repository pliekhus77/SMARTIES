import { DatabaseService } from '../DatabaseService';
import { Product } from '../../models/Product';

export interface VectorSearchOptions {
  similarityThreshold?: number;
  maxResults?: number;
  dietaryFilters?: {
    vegan?: boolean;
    vegetarian?: boolean;
    glutenFree?: boolean;
    kosher?: boolean;
    halal?: boolean;
  };
  allergenFilters?: string[];
}

export interface VectorSearchResult {
  product: Product;
  similarityScore: number;
}

export class VectorSearchService {
  private readonly DEFAULT_SIMILARITY_THRESHOLD = 0.7;
  private readonly DEFAULT_MAX_RESULTS = 20;

  constructor(private databaseService: DatabaseService) {}

  async searchByIngredients(
    ingredientsEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const {
      similarityThreshold = this.DEFAULT_SIMILARITY_THRESHOLD,
      maxResults = this.DEFAULT_MAX_RESULTS,
      dietaryFilters,
      allergenFilters
    } = options;

    try {
      const pipeline = this.buildVectorSearchPipeline(
        'ingredients_embedding',
        ingredientsEmbedding,
        similarityThreshold,
        maxResults,
        dietaryFilters,
        allergenFilters
      );

      const results = await this.databaseService.aggregateProducts(pipeline);
      return this.formatSearchResults(results);
    } catch (error) {
      console.error('Vector search by ingredients failed:', error);
      return [];
    }
  }

  async searchByProductName(
    nameEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const {
      similarityThreshold = this.DEFAULT_SIMILARITY_THRESHOLD,
      maxResults = this.DEFAULT_MAX_RESULTS,
      dietaryFilters,
      allergenFilters
    } = options;

    try {
      const pipeline = this.buildVectorSearchPipeline(
        'product_name_embedding',
        nameEmbedding,
        similarityThreshold,
        maxResults,
        dietaryFilters,
        allergenFilters
      );

      const results = await this.databaseService.aggregateProducts(pipeline);
      return this.formatSearchResults(results);
    } catch (error) {
      console.error('Vector search by product name failed:', error);
      return [];
    }
  }

  async searchByAllergens(
    allergensEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const {
      similarityThreshold = this.DEFAULT_SIMILARITY_THRESHOLD,
      maxResults = this.DEFAULT_MAX_RESULTS,
      dietaryFilters,
      allergenFilters
    } = options;

    try {
      const pipeline = this.buildVectorSearchPipeline(
        'allergens_embedding',
        allergensEmbedding,
        similarityThreshold,
        maxResults,
        dietaryFilters,
        allergenFilters
      );

      const results = await this.databaseService.aggregateProducts(pipeline);
      return this.formatSearchResults(results);
    } catch (error) {
      console.error('Vector search by allergens failed:', error);
      return [];
    }
  }

  private buildVectorSearchPipeline(
    embeddingField: string,
    queryVector: number[],
    similarityThreshold: number,
    maxResults: number,
    dietaryFilters?: VectorSearchOptions['dietaryFilters'],
    allergenFilters?: string[]
  ): any[] {
    const pipeline: any[] = [
      {
        $vectorSearch: {
          index: `${embeddingField}_index`,
          path: embeddingField,
          queryVector,
          numCandidates: maxResults * 10,
          limit: maxResults
        }
      },
      {
        $addFields: {
          similarityScore: { $meta: 'vectorSearchScore' }
        }
      },
      {
        $match: {
          similarityScore: { $gte: similarityThreshold }
        }
      }
    ];

    // Add dietary filters
    if (dietaryFilters) {
      const dietaryMatch: any = {};
      Object.entries(dietaryFilters).forEach(([key, value]) => {
        if (value !== undefined) {
          dietaryMatch[`dietaryFlags.${key}`] = value;
        }
      });
      if (Object.keys(dietaryMatch).length > 0) {
        pipeline.push({ $match: dietaryMatch });
      }
    }

    // Add allergen filters
    if (allergenFilters && allergenFilters.length > 0) {
      pipeline.push({
        $match: {
          allergens: { $nin: allergenFilters }
        }
      });
    }

    // Sort by similarity score and popularity
    pipeline.push({
      $sort: {
        similarityScore: -1,
        popularity: -1
      }
    });

    return pipeline;
  }

  private formatSearchResults(results: any[]): VectorSearchResult[] {
    return results.map(result => ({
      product: result as Product,
      similarityScore: result.similarityScore || 0
    }));
  }
}
