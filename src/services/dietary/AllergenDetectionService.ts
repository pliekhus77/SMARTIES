import { VectorSearchService } from '../search/VectorSearchService';
import { EmbeddingService } from '../EmbeddingService';
import { Product } from '../../models/Product';

export interface AllergenRisk {
  allergen: string;
  riskLevel: 'high' | 'medium' | 'low';
  confidence: number;
  reason: string;
  sources: string[];
}

export interface AllergenAnalysis {
  detectedAllergens: AllergenRisk[];
  crossContaminationRisks: AllergenRisk[];
  overallRiskLevel: 'safe' | 'caution' | 'danger';
  confidence: number;
}

export class AllergenDetectionService {
  private readonly ALLERGEN_KEYWORDS = {
    'milk': ['milk', 'dairy', 'lactose', 'casein', 'whey', 'butter', 'cream', 'cheese'],
    'eggs': ['egg', 'albumin', 'lecithin', 'mayonnaise'],
    'fish': ['fish', 'salmon', 'tuna', 'cod', 'anchovy'],
    'shellfish': ['shrimp', 'crab', 'lobster', 'shellfish', 'crustacean'],
    'tree nuts': ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'macadamia'],
    'peanuts': ['peanut', 'groundnut'],
    'wheat': ['wheat', 'flour', 'gluten', 'bread', 'pasta'],
    'soy': ['soy', 'soybean', 'tofu', 'tempeh', 'miso']
  };

  private readonly CROSS_CONTAMINATION_PHRASES = [
    'may contain', 'processed in facility', 'manufactured on equipment', 
    'shared equipment', 'same facility'
  ];

  constructor(
    private vectorSearchService: VectorSearchService,
    private embeddingService: EmbeddingService
  ) {}

  async analyzeProduct(product: Product, userAllergens: string[]): Promise<AllergenAnalysis> {
    const detectedAllergens = await this.detectDirectAllergens(product, userAllergens);
    const crossContaminationRisks = await this.analyzeCrossContamination(product, userAllergens);
    
    const allRisks = [...detectedAllergens, ...crossContaminationRisks];
    const overallRiskLevel = this.calculateOverallRisk(allRisks);
    const confidence = this.calculateOverallConfidence(allRisks);

    return {
      detectedAllergens,
      crossContaminationRisks,
      overallRiskLevel,
      confidence
    };
  }

  private async detectDirectAllergens(product: Product, userAllergens: string[]): Promise<AllergenRisk[]> {
    const risks: AllergenRisk[] = [];

    for (const allergen of userAllergens) {
      // Check explicit allergen tags
      if (product.allergens?.includes(allergen)) {
        risks.push({
          allergen,
          riskLevel: 'high',
          confidence: 0.95,
          reason: 'Listed in allergen tags',
          sources: ['allergen_tags']
        });
        continue;
      }

      // Check ingredient similarity
      const ingredientRisk = await this.checkIngredientSimilarity(product, allergen);
      if (ingredientRisk) {
        risks.push(ingredientRisk);
      }

      // Check keyword matching
      const keywordRisk = this.checkKeywordMatching(product, allergen);
      if (keywordRisk) {
        risks.push(keywordRisk);
      }
    }

    return risks;
  }

  private async checkIngredientSimilarity(product: Product, allergen: string): Promise<AllergenRisk | null> {
    try {
      const allergenEmbedding = await this.embeddingService.generateEmbedding(allergen);
      if (!allergenEmbedding) return null;

      const similarProducts = await this.vectorSearchService.searchByAllergens(allergenEmbedding, {
        similarityThreshold: 0.7,
        maxResults: 10
      });

      const matchingProduct = similarProducts.find(result => 
        result.product.upc === product.upc || 
        result.product._id === product._id
      );

      if (matchingProduct && matchingProduct.similarityScore > 0.8) {
        return {
          allergen,
          riskLevel: 'high',
          confidence: matchingProduct.similarityScore,
          reason: 'High ingredient similarity to known allergen products',
          sources: ['vector_similarity']
        };
      }

      if (matchingProduct && matchingProduct.similarityScore > 0.7) {
        return {
          allergen,
          riskLevel: 'medium',
          confidence: matchingProduct.similarityScore,
          reason: 'Moderate ingredient similarity to allergen products',
          sources: ['vector_similarity']
        };
      }

      return null;
    } catch (error) {
      console.error('Vector similarity check failed:', error);
      return null;
    }
  }

  private checkKeywordMatching(product: Product, allergen: string): AllergenRisk | null {
    const keywords = this.ALLERGEN_KEYWORDS[allergen.toLowerCase()] || [allergen.toLowerCase()];
    const ingredientsText = product.ingredients?.join(' ').toLowerCase() || '';
    
    const matchedKeywords = keywords.filter(keyword => 
      ingredientsText.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      const confidence = Math.min(0.9, 0.6 + (matchedKeywords.length * 0.1));
      return {
        allergen,
        riskLevel: matchedKeywords.length > 1 ? 'high' : 'medium',
        confidence,
        reason: `Contains allergen keywords: ${matchedKeywords.join(', ')}`,
        sources: ['keyword_matching']
      };
    }

    return null;
  }

  private async analyzeCrossContamination(product: Product, userAllergens: string[]): Promise<AllergenRisk[]> {
    const risks: AllergenRisk[] = [];
    const ingredientsText = product.ingredients?.join(' ').toLowerCase() || '';

    for (const allergen of userAllergens) {
      const crossContaminationRisk = this.checkCrossContaminationPhrases(ingredientsText, allergen);
      if (crossContaminationRisk) {
        risks.push(crossContaminationRisk);
      }
    }

    return risks;
  }

  private checkCrossContaminationPhrases(ingredientsText: string, allergen: string): AllergenRisk | null {
    const keywords = this.ALLERGEN_KEYWORDS[allergen.toLowerCase()] || [allergen.toLowerCase()];
    
    for (const phrase of this.CROSS_CONTAMINATION_PHRASES) {
      if (ingredientsText.includes(phrase)) {
        const hasAllergenKeyword = keywords.some(keyword => 
          ingredientsText.includes(keyword) && 
          ingredientsText.indexOf(keyword) > ingredientsText.indexOf(phrase)
        );

        if (hasAllergenKeyword) {
          return {
            allergen,
            riskLevel: 'medium',
            confidence: 0.7,
            reason: `Cross-contamination warning: "${phrase}"`,
            sources: ['cross_contamination']
          };
        }
      }
    }

    return null;
  }

  private calculateOverallRisk(risks: AllergenRisk[]): 'safe' | 'caution' | 'danger' {
    if (risks.length === 0) return 'safe';

    const hasHighRisk = risks.some(risk => risk.riskLevel === 'high');
    const hasMediumRisk = risks.some(risk => risk.riskLevel === 'medium');

    if (hasHighRisk) return 'danger';
    if (hasMediumRisk) return 'caution';
    return 'safe';
  }

  private calculateOverallConfidence(risks: AllergenRisk[]): number {
    if (risks.length === 0) return 0.95; // High confidence in safety

    const avgConfidence = risks.reduce((sum, risk) => sum + risk.confidence, 0) / risks.length;
    return Math.min(0.95, avgConfidence);
  }

  async detectAllergenSynonyms(allergen: string): Promise<string[]> {
    try {
      const allergenEmbedding = await this.embeddingService.generateEmbedding(allergen);
      if (!allergenEmbedding) return [];

      const similarProducts = await this.vectorSearchService.searchByAllergens(allergenEmbedding, {
        similarityThreshold: 0.8,
        maxResults: 20
      });

      const synonyms = new Set<string>();
      
      similarProducts.forEach(result => {
        result.product.allergens?.forEach(productAllergen => {
          if (productAllergen.toLowerCase() !== allergen.toLowerCase() && 
              result.similarityScore > 0.85) {
            synonyms.add(productAllergen);
          }
        });
      });

      return Array.from(synonyms);
    } catch (error) {
      console.error('Synonym detection failed:', error);
      return [];
    }
  }
}
