import { UPCLookupService } from './UPCLookupService';
import { VectorSearchService, VectorSearchOptions, VectorSearchResult } from './VectorSearchService';
import { EmbeddingService } from '../EmbeddingService';
import { Product } from '../../models/Product';

export interface SearchQuery {
  text?: string;
  upc?: string;
  filters?: VectorSearchOptions;
}

export interface HybridSearchResult {
  products: Product[];
  searchStrategy: 'upc' | 'vector' | 'hybrid';
  totalResults: number;
  responseTime: number;
}

export class HybridSearchService {
  constructor(
    private upcLookupService: UPCLookupService,
    private vectorSearchService: VectorSearchService,
    private embeddingService: EmbeddingService
  ) {}

  async search(query: SearchQuery): Promise<HybridSearchResult> {
    const startTime = Date.now();

    try {
      // Strategy 1: Direct UPC lookup (fastest)
      if (query.upc || this.isUPCLike(query.text)) {
        const upc = query.upc || query.text!;
        const product = await this.upcLookupService.lookupByUPC(upc);
        
        return {
          products: product ? [product] : [],
          searchStrategy: 'upc',
          totalResults: product ? 1 : 0,
          responseTime: Date.now() - startTime
        };
      }

      // Strategy 2: Vector similarity search
      if (query.text) {
        const results = await this.performVectorSearch(query.text, query.filters);
        
        return {
          products: results.map(r => r.product),
          searchStrategy: 'vector',
          totalResults: results.length,
          responseTime: Date.now() - startTime
        };
      }

      return {
        products: [],
        searchStrategy: 'hybrid',
        totalResults: 0,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Hybrid search failed:', error);
      return {
        products: [],
        searchStrategy: 'hybrid',
        totalResults: 0,
        responseTime: Date.now() - startTime
      };
    }
  }

  async searchMultiModal(
    queries: SearchQuery[],
    options: { maxResults?: number; deduplication?: boolean } = {}
  ): Promise<HybridSearchResult> {
    const startTime = Date.now();
    const { maxResults = 20, deduplication = true } = options;

    try {
      const allResults: VectorSearchResult[] = [];

      // Execute all queries in parallel
      const searchPromises = queries.map(async (query) => {
        if (query.upc || this.isUPCLike(query.text)) {
          const upc = query.upc || query.text!;
          const product = await this.upcLookupService.lookupByUPC(upc);
          return product ? [{ product, similarityScore: 1.0 }] : [];
        }

        if (query.text) {
          return await this.performVectorSearch(query.text, query.filters);
        }

        return [];
      });

      const results = await Promise.all(searchPromises);
      results.forEach(result => allResults.push(...result));

      // Merge and deduplicate results
      const finalProducts = deduplication 
        ? this.deduplicateResults(allResults, maxResults)
        : allResults.slice(0, maxResults).map(r => r.product);

      return {
        products: finalProducts,
        searchStrategy: 'hybrid',
        totalResults: finalProducts.length,
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Multi-modal search failed:', error);
      return {
        products: [],
        searchStrategy: 'hybrid',
        totalResults: 0,
        responseTime: Date.now() - startTime
      };
    }
  }

  private async performVectorSearch(
    text: string,
    filters?: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    // Generate embeddings for the query text
    const embedding = await this.embeddingService.generateEmbedding(text);
    
    if (!embedding || embedding.length !== 384) {
      console.warn('Failed to generate valid embedding for query:', text);
      return [];
    }

    // Determine search strategy based on query content
    const strategy = this.selectSearchStrategy(text);

    switch (strategy) {
      case 'ingredients':
        return await this.vectorSearchService.searchByIngredients(embedding, filters);
      
      case 'product_name':
        return await this.vectorSearchService.searchByProductName(embedding, filters);
      
      case 'allergens':
        return await this.vectorSearchService.searchByAllergens(embedding, filters);
      
      default:
        // Multi-strategy search - combine results from all approaches
        const [ingredientResults, nameResults, allergenResults] = await Promise.all([
          this.vectorSearchService.searchByIngredients(embedding, { ...filters, maxResults: 10 }),
          this.vectorSearchService.searchByProductName(embedding, { ...filters, maxResults: 10 }),
          this.vectorSearchService.searchByAllergens(embedding, { ...filters, maxResults: 5 })
        ]);

        return this.mergeVectorResults([ingredientResults, nameResults, allergenResults]);
    }
  }

  private selectSearchStrategy(text: string): 'ingredients' | 'product_name' | 'allergens' | 'multi' {
    const lowerText = text.toLowerCase();

    // Allergen-focused queries
    if (lowerText.includes('allergen') || lowerText.includes('allergy') || 
        lowerText.includes('nuts') || lowerText.includes('gluten') ||
        lowerText.includes('dairy') || lowerText.includes('soy')) {
      return 'allergens';
    }

    // Ingredient-focused queries
    if (lowerText.includes('ingredient') || lowerText.includes('contains') ||
        lowerText.includes('made with') || lowerText.includes('organic')) {
      return 'ingredients';
    }

    // Product name queries (brand names, specific products)
    if (lowerText.includes('brand') || /^[A-Z][a-z]+ [A-Z]/.test(text)) {
      return 'product_name';
    }

    // Default to multi-strategy for ambiguous queries
    return 'multi';
  }

  private mergeVectorResults(resultSets: VectorSearchResult[][]): VectorSearchResult[] {
    const merged: VectorSearchResult[] = [];
    const seen = new Set<string>();

    // Weight results by search type (ingredients > names > allergens)
    const weights = [1.0, 0.8, 0.6];

    resultSets.forEach((results, index) => {
      results.forEach(result => {
        const key = result.product._id || result.product.upc;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({
            ...result,
            similarityScore: result.similarityScore * weights[index]
          });
        }
      });
    });

    // Sort by weighted similarity score
    return merged.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  private deduplicateResults(results: VectorSearchResult[], maxResults: number): Product[] {
    const seen = new Set<string>();
    const deduplicated: Product[] = [];

    // Sort by similarity score first
    const sorted = results.sort((a, b) => b.similarityScore - a.similarityScore);

    for (const result of sorted) {
      if (deduplicated.length >= maxResults) break;

      const key = result.product._id || result.product.upc;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(result.product);
      }
    }

    return deduplicated;
  }

  private isUPCLike(text?: string): boolean {
    if (!text) return false;
    
    // Remove non-numeric characters and check length
    const cleaned = text.replace(/\D/g, '');
    return cleaned.length >= 11 && cleaned.length <= 14;
  }
}
