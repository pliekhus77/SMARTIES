import { VectorSearchService } from '../search/VectorSearchService';
import { EmbeddingService } from '../EmbeddingService';
import { Product } from '../../models/Product';

export interface DietaryRestriction {
  type: 'vegan' | 'vegetarian' | 'kosher' | 'halal' | 'gluten_free' | 'organic' | 'keto' | 'paleo';
  required: boolean;
}

export interface ComplianceResult {
  compliant: boolean;
  confidence: number;
  violations: string[];
  warnings: string[];
  certifications: string[];
}

export interface DietaryAnalysis {
  overallCompliance: boolean;
  confidence: number;
  results: { [key: string]: ComplianceResult };
}

export class DietaryComplianceService {
  private readonly CERTIFICATION_KEYWORDS = {
    kosher: ['kosher', 'kasher', 'ou', 'ok kosher', 'star-k', 'kof-k'],
    halal: ['halal', 'halaal', 'islamic', 'muslim'],
    organic: ['organic', 'usda organic', 'certified organic', 'bio'],
    vegan: ['vegan', 'plant-based', 'certified vegan'],
    vegetarian: ['vegetarian', 'veggie']
  };

  private readonly PROHIBITED_INGREDIENTS = {
    vegan: ['milk', 'egg', 'honey', 'gelatin', 'whey', 'casein', 'albumin', 'meat', 'fish', 'chicken', 'beef', 'pork'],
    vegetarian: ['meat', 'fish', 'chicken', 'beef', 'pork', 'gelatin', 'rennet'],
    kosher: ['pork', 'shellfish', 'mixing meat and dairy'],
    halal: ['pork', 'alcohol', 'wine', 'beer', 'gelatin'],
    gluten_free: ['wheat', 'barley', 'rye', 'gluten', 'flour']
  };

  private readonly INGREDIENT_SUBSTITUTIONS = {
    'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk'],
    'butter': ['vegan butter', 'coconut oil', 'olive oil'],
    'egg': ['flax egg', 'chia egg', 'applesauce'],
    'honey': ['maple syrup', 'agave nectar', 'date syrup'],
    'gelatin': ['agar', 'carrageenan', 'pectin']
  };

  constructor(
    private vectorSearchService: VectorSearchService,
    private embeddingService: EmbeddingService
  ) {}

  async analyzeCompliance(product: Product, restrictions: DietaryRestriction[]): Promise<DietaryAnalysis> {
    const results: { [key: string]: ComplianceResult } = {};

    for (const restriction of restrictions) {
      results[restriction.type] = await this.checkSingleRestriction(product, restriction);
    }

    const overallCompliance = Object.values(results).every(result => result.compliant);
    const confidence = this.calculateOverallConfidence(results);

    return {
      overallCompliance,
      confidence,
      results
    };
  }

  private async checkSingleRestriction(product: Product, restriction: DietaryRestriction): Promise<ComplianceResult> {
    const violations: string[] = [];
    const warnings: string[] = [];
    const certifications: string[] = [];

    // Check explicit dietary flags first
    const flagResult = this.checkDietaryFlags(product, restriction.type);
    if (flagResult.explicit !== null) {
      return {
        compliant: flagResult.explicit,
        confidence: 0.9,
        violations: flagResult.explicit ? [] : ['Product marked as non-compliant'],
        warnings: [],
        certifications: flagResult.certifications
      };
    }

    // Check certifications
    const foundCertifications = this.findCertifications(product, restriction.type);
    certifications.push(...foundCertifications);

    // Check prohibited ingredients
    const ingredientViolations = this.checkProhibitedIngredients(product, restriction.type);
    violations.push(...ingredientViolations);

    // Check for substitutions
    const substitutionWarnings = await this.checkIngredientSubstitutions(product, restriction.type);
    warnings.push(...substitutionWarnings);

    // Vector similarity check for cultural compliance
    const culturalCompliance = await this.checkCulturalCompliance(product, restriction.type);
    if (!culturalCompliance.compliant) {
      violations.push(...culturalCompliance.violations);
    }

    const compliant = violations.length === 0;
    const confidence = this.calculateConfidence(compliant, certifications.length, violations.length, warnings.length);

    return {
      compliant,
      confidence,
      violations,
      warnings,
      certifications
    };
  }

  private checkDietaryFlags(product: Product, restrictionType: string): { explicit: boolean | null; certifications: string[] } {
    const flags = product.dietaryFlags;
    const certifications: string[] = [];

    switch (restrictionType) {
      case 'vegan':
        return { explicit: flags?.vegan ?? null, certifications };
      case 'vegetarian':
        return { explicit: flags?.vegetarian ?? null, certifications };
      case 'kosher':
        return { explicit: flags?.kosher ?? null, certifications };
      case 'halal':
        return { explicit: flags?.halal ?? null, certifications };
      case 'gluten_free':
        return { explicit: flags?.glutenFree ?? null, certifications };
      case 'organic':
        return { explicit: flags?.organic ?? null, certifications };
      default:
        return { explicit: null, certifications };
    }
  }

  private findCertifications(product: Product, restrictionType: string): string[] {
    const keywords = this.CERTIFICATION_KEYWORDS[restrictionType] || [];
    const certifications: string[] = [];
    
    const searchText = [
      product.name,
      ...(product.ingredients || []),
      ...(product.allergens || [])
    ].join(' ').toLowerCase();

    keywords.forEach(keyword => {
      if (searchText.includes(keyword.toLowerCase())) {
        certifications.push(keyword);
      }
    });

    return certifications;
  }

  private checkProhibitedIngredients(product: Product, restrictionType: string): string[] {
    const prohibited = this.PROHIBITED_INGREDIENTS[restrictionType] || [];
    const violations: string[] = [];
    
    const ingredientsText = (product.ingredients || []).join(' ').toLowerCase();

    prohibited.forEach(ingredient => {
      if (ingredientsText.includes(ingredient.toLowerCase())) {
        violations.push(`Contains prohibited ingredient: ${ingredient}`);
      }
    });

    return violations;
  }

  private async checkIngredientSubstitutions(product: Product, restrictionType: string): Promise<string[]> {
    const warnings: string[] = [];
    const ingredients = product.ingredients || [];

    for (const ingredient of ingredients) {
      const substitutions = this.INGREDIENT_SUBSTITUTIONS[ingredient.toLowerCase()];
      if (substitutions && restrictionType === 'vegan') {
        warnings.push(`Consider substituting ${ingredient} with: ${substitutions.join(', ')}`);
      }
    }

    return warnings;
  }

  private async checkCulturalCompliance(product: Product, restrictionType: string): Promise<{ compliant: boolean; violations: string[] }> {
    try {
      if (restrictionType !== 'kosher' && restrictionType !== 'halal') {
        return { compliant: true, violations: [] };
      }

      const queryText = `${restrictionType} compliant food`;
      const embedding = await this.embeddingService.generateEmbedding(queryText);
      
      if (!embedding) {
        return { compliant: true, violations: [] };
      }

      const similarProducts = await this.vectorSearchService.searchByIngredients(embedding, {
        similarityThreshold: 0.8,
        maxResults: 10,
        dietaryFilters: { [restrictionType]: true }
      });

      const isCompliant = similarProducts.some(result => 
        result.product.upc === product.upc && result.similarityScore > 0.85
      );

      return {
        compliant: isCompliant,
        violations: isCompliant ? [] : [`Product may not meet ${restrictionType} cultural requirements`]
      };
    } catch (error) {
      console.error('Cultural compliance check failed:', error);
      return { compliant: true, violations: [] };
    }
  }

  private calculateConfidence(compliant: boolean, certifications: number, violations: number, warnings: number): number {
    let confidence = 0.5; // Base confidence

    if (compliant) {
      confidence += 0.3; // Boost for compliance
      confidence += Math.min(0.2, certifications * 0.1); // Boost for certifications
    } else {
      confidence -= Math.min(0.3, violations * 0.1); // Penalty for violations
    }

    confidence -= Math.min(0.1, warnings * 0.02); // Small penalty for warnings

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private calculateOverallConfidence(results: { [key: string]: ComplianceResult }): number {
    const confidences = Object.values(results).map(r => r.confidence);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  async findAlternativeProducts(product: Product, restrictions: DietaryRestriction[]): Promise<Product[]> {
    try {
      const productEmbedding = await this.embeddingService.generateEmbedding(product.name);
      if (!productEmbedding) return [];

      const dietaryFilters: any = {};
      restrictions.forEach(restriction => {
        if (restriction.required) {
          dietaryFilters[restriction.type] = true;
        }
      });

      const alternatives = await this.vectorSearchService.searchByProductName(productEmbedding, {
        similarityThreshold: 0.6,
        maxResults: 10,
        dietaryFilters
      });

      return alternatives
        .filter(result => result.product.upc !== product.upc)
        .map(result => result.product);
    } catch (error) {
      console.error('Alternative product search failed:', error);
      return [];
    }
  }

  validateCertificationEquivalency(cert1: string, cert2: string, restrictionType: string): boolean {
    const keywords = this.CERTIFICATION_KEYWORDS[restrictionType] || [];
    const cert1Lower = cert1.toLowerCase();
    const cert2Lower = cert2.toLowerCase();

    // Check if both certifications are in the same category
    const cert1Valid = keywords.some(keyword => cert1Lower.includes(keyword));
    const cert2Valid = keywords.some(keyword => cert2Lower.includes(keyword));

    return cert1Valid && cert2Valid;
  }
}
