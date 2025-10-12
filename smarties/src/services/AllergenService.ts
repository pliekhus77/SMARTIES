/**
 * Allergen Detection and Analysis Service
 * Implements Requirements 2.1, 2.2, 2.3, 2.4 from SMARTIES API integration specification
 */

import { Product, UserProfile, DietaryRestriction } from '../types';

export interface AllergenAnalysisResult {
  severity: 'safe' | 'mild' | 'severe';
  violations: AllergenViolation[];
  riskLevel: string;
  recommendations: string[];
}

export interface AllergenViolation {
  allergen: string;
  type: 'contains' | 'may_contain' | 'cross_contamination';
  severity: 'low' | 'medium' | 'high';
  ingredients: string[];
  userRestriction: DietaryRestriction;
}

export class AllergenService {
  private allergenPatterns: Map<string, string[]> = new Map([
    ['milk', ['milk', 'dairy', 'lactose', 'casein', 'whey', 'butter', 'cream', 'cheese']],
    ['eggs', ['egg', 'albumin', 'lecithin', 'lysozyme', 'ovalbumin']],
    ['fish', ['fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine']],
    ['shellfish', ['shrimp', 'crab', 'lobster', 'oyster', 'scallop', 'clam', 'mussel']],
    ['tree_nuts', ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut', 'brazil nut']],
    ['peanuts', ['peanut', 'groundnut', 'arachis']],
    ['wheat', ['wheat', 'gluten', 'flour', 'semolina', 'bulgur', 'spelt']],
    ['soybeans', ['soy', 'soybean', 'tofu', 'tempeh', 'miso', 'edamame']],
    ['sesame', ['sesame', 'tahini', 'sesamum']]
  ]);

  /**
   * Analyze product for allergen violations
   */
  analyzeProduct(product: Product, userProfile: UserProfile): AllergenAnalysisResult {
    const violations: AllergenViolation[] = [];

    for (const restriction of userProfile.restrictions) {
      if (restriction.category === 'allergen') {
        const violation = this.checkAllergen(product, restriction);
        if (violation) {
          violations.push(violation);
        }
      }
    }

    const severity = this.determineSeverity(violations);
    const riskLevel = this.calculateRiskLevel(violations);
    const recommendations = this.generateRecommendations(violations);

    return {
      severity,
      violations,
      riskLevel,
      recommendations
    };
  }

  /**
   * Check for specific allergen in product
   */
  private checkAllergen(product: Product, restriction: DietaryRestriction): AllergenViolation | null {
    const allergenKey = restriction.name.toLowerCase().replace(' ', '_');
    const patterns = this.allergenPatterns.get(allergenKey) || [restriction.name.toLowerCase()];

    // Check direct allergen info
    if (product.allergenInfo) {
      // Check contains array
      if (product.allergenInfo.contains) {
        for (const allergenInfo of product.allergenInfo.contains) {
          if (patterns.some(pattern => allergenInfo.toLowerCase().includes(pattern))) {
            return {
              allergen: restriction.name,
              type: 'contains' as const,
              severity: restriction.severity === 'anaphylactic' ? 'high' : restriction.severity === 'severe' ? 'medium' : 'low',
              ingredients: [allergenInfo],
              userRestriction: restriction
            };
          }
        }
      }
      
      // Check mayContain array
      if (product.allergenInfo.mayContain) {
        for (const allergenInfo of product.allergenInfo.mayContain) {
          if (patterns.some(pattern => allergenInfo.toLowerCase().includes(pattern))) {
            return {
              allergen: restriction.name,
              type: 'may_contain' as const,
              severity: restriction.severity === 'anaphylactic' ? 'high' : restriction.severity === 'severe' ? 'medium' : 'low',
              ingredients: [allergenInfo],
              userRestriction: restriction
            };
          }
        }
      }
    }

    // Check ingredients
    const matchingIngredients: string[] = [];
    if (product.ingredients) {
      for (const ingredient of product.ingredients) {
        if (patterns.some(pattern => ingredient.toLowerCase().includes(pattern))) {
          matchingIngredients.push(ingredient);
        }
      }
    }

    if (matchingIngredients.length > 0) {
      return {
        allergen: restriction.name,
        type: 'contains',
        severity: restriction.severity === 'anaphylactic' ? 'high' : restriction.severity === 'severe' ? 'medium' : 'low',
        ingredients: matchingIngredients,
        userRestriction: restriction
      };
    }

    return null;
  }

  /**
   * Determine overall severity level
   */
  private determineSeverity(violations: AllergenViolation[]): 'safe' | 'mild' | 'severe' {
    if (violations.length === 0) return 'safe';

    const hasHighSeverity = violations.some(v => v.severity === 'high');
    const hasDirectContains = violations.some(v => v.type === 'contains');

    if (hasHighSeverity && hasDirectContains) return 'severe';
    if (hasHighSeverity || hasDirectContains) return 'severe';
    
    return 'mild';
  }

  /**
   * Calculate risk level description
   */
  private calculateRiskLevel(violations: AllergenViolation[]): string {
    if (violations.length === 0) return 'No Risk';

    const highSeverityCount = violations.filter(v => v.severity === 'high').length;
    const containsCount = violations.filter(v => v.type === 'contains').length;

    if (highSeverityCount > 0 && containsCount > 0) return 'Anaphylactic Risk';
    if (highSeverityCount > 0) return 'High Risk';
    if (containsCount > 0) return 'Moderate Risk';
    
    return 'Low Risk';
  }

  /**
   * Generate safety recommendations
   */
  private generateRecommendations(violations: AllergenViolation[]): string[] {
    if (violations.length === 0) {
      return ['Product appears safe for your dietary restrictions'];
    }

    const recommendations: string[] = [];
    const hasHighSeverity = violations.some(v => v.severity === 'high');

    if (hasHighSeverity) {
      recommendations.push('DO NOT CONSUME - Contains allergens that may cause severe reactions');
      recommendations.push('Consult your healthcare provider if accidentally consumed');
    } else {
      recommendations.push('Exercise caution - Product contains allergens you should avoid');
    }

    recommendations.push('Consider finding alternative products');
    recommendations.push('Always read ingredient labels carefully');

    return recommendations;
  }
}