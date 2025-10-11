/**
 * Dietary compliance checking service
 * Core business logic for dietary compliance analysis
 */

import { Product, UserProfile } from '../atlas/collections';

export interface ComplianceResult {
  safe: boolean;
  violations: string[];
  warnings: string[];
  confidence: number;
  explanation: string;
}

export class DietaryComplianceChecker {
  /**
   * Check product compliance against user dietary restrictions
   */
  async checkCompliance(product: Product, userProfile: UserProfile): Promise<ComplianceResult> {
    const violations: string[] = [];
    const warnings: string[] = [];
    let confidence = 1.0;

    try {
      // Check allergies (highest priority)
      const allergyViolations = this.checkAllergies(product, userProfile.dietary_restrictions.allergies);
      violations.push(...allergyViolations);

      // Check medical restrictions
      const medicalViolations = this.checkMedicalRestrictions(product, userProfile.dietary_restrictions.medical);
      violations.push(...medicalViolations);

      // Check religious restrictions
      const religiousViolations = this.checkReligiousRestrictions(product, userProfile.dietary_restrictions.religious);
      if (userProfile.preferences.strict_mode) {
        violations.push(...religiousViolations);
      } else {
        warnings.push(...religiousViolations);
      }

      // Check lifestyle preferences
      const lifestyleViolations = this.checkLifestylePreferences(product, userProfile.dietary_restrictions.lifestyle);
      if (userProfile.preferences.strict_mode) {
        violations.push(...lifestyleViolations);
      } else {
        warnings.push(...lifestyleViolations);
      }

      // Adjust confidence based on product data quality
      confidence = this.calculateConfidence(product, violations.length + warnings.length);

      return {
        safe: violations.length === 0,
        violations,
        warnings,
        confidence,
        explanation: this.generateExplanation(violations, warnings, product)
      };
    } catch (error) {
      console.error('Compliance check failed:', error);
      return {
        safe: false,
        violations: ['Unable to verify product safety'],
        warnings: [],
        confidence: 0.0,
        explanation: 'Compliance check failed due to technical error'
      };
    }
  }

  /**
   * Check for allergen violations
   */
  private checkAllergies(product: Product, allergies: string[]): string[] {
    const violations: string[] = [];
    
    allergies.forEach(allergy => {
      // Check explicit allergen list
      if (product.allergens.some((allergen: string) => 
        allergen.toLowerCase().includes(allergy.toLowerCase())
      )) {
        violations.push(`Contains ${allergy}`);
      }

      // Check ingredients for allergen presence
      if (product.ingredients.some((ingredient: string) => 
        ingredient.toLowerCase().includes(allergy.toLowerCase())
      )) {
        violations.push(`Contains ${allergy} in ingredients`);
      }
    });

    return violations;
  }

  /**
   * Check for medical dietary restriction violations
   */
  private checkMedicalRestrictions(product: Product, medicalRestrictions: string[]): string[] {
    const violations: string[] = [];
    
    medicalRestrictions.forEach(restriction => {
      switch (restriction.toLowerCase()) {
        case 'diabetes':
          if (product.nutritionalInfo?.sugar && product.nutritionalInfo.sugar > 15) {
            violations.push('High sugar content (diabetes restriction)');
          }
          break;
        case 'hypertension':
          if (product.nutritionalInfo?.sodium && product.nutritionalInfo.sodium > 400) {
            violations.push('High sodium content (hypertension restriction)');
          }
          break;
        case 'celiac':
          if (product.ingredients.some((ingredient: string) => 
            ingredient.toLowerCase().includes('gluten') || 
            ingredient.toLowerCase().includes('wheat')
          )) {
            violations.push('Contains gluten (celiac restriction)');
          }
          break;
      }
    });

    return violations;
  }

  /**
   * Check for religious dietary restriction violations
   */
  private checkReligiousRestrictions(product: Product, religiousRestrictions: string[]): string[] {
    const violations: string[] = [];
    
    religiousRestrictions.forEach(restriction => {
      switch (restriction.toLowerCase()) {
        case 'halal':
          if (!product.dietaryFlags.halal && this.containsPork(product)) {
            violations.push('May not be Halal certified');
          }
          break;
        case 'kosher':
          if (!product.dietaryFlags.kosher) {
            violations.push('Not Kosher certified');
          }
          break;
        case 'hindu vegetarian':
          if (this.containsMeat(product)) {
            violations.push('Contains meat (Hindu vegetarian restriction)');
          }
          break;
      }
    });

    return violations;
  }

  /**
   * Check for lifestyle preference violations
   */
  private checkLifestylePreferences(product: Product, lifestylePreferences: string[]): string[] {
    const violations: string[] = [];
    
    lifestylePreferences.forEach(preference => {
      switch (preference.toLowerCase()) {
        case 'vegan':
          if (!product.dietaryFlags.vegan && this.containsAnimalProducts(product)) {
            violations.push('Contains animal products (vegan preference)');
          }
          break;
        case 'vegetarian':
          if (this.containsMeat(product)) {
            violations.push('Contains meat (vegetarian preference)');
          }
          break;
        case 'gluten-free':
          if (!product.dietaryFlags.glutenFree && this.containsGluten(product)) {
            violations.push('Contains gluten (gluten-free preference)');
          }
          break;
      }
    });

    return violations;
  }

  /**
   * Helper methods for ingredient analysis
   */
  private containsPork(product: Product): boolean {
    const porkKeywords = ['pork', 'ham', 'bacon', 'lard', 'gelatin'];
    return product.ingredients.some((ingredient: string) =>
      porkKeywords.some(keyword => ingredient.toLowerCase().includes(keyword))
    );
  }

  private containsMeat(product: Product): boolean {
    const meatKeywords = ['beef', 'pork', 'chicken', 'turkey', 'lamb', 'meat'];
    return product.ingredients.some((ingredient: string) =>
      meatKeywords.some(keyword => ingredient.toLowerCase().includes(keyword))
    );
  }

  private containsAnimalProducts(product: Product): boolean {
    const animalKeywords = ['milk', 'cheese', 'butter', 'egg', 'honey', 'gelatin', 'whey'];
    return product.ingredients.some((ingredient: string) =>
      animalKeywords.some(keyword => ingredient.toLowerCase().includes(keyword))
    ) || this.containsMeat(product);
  }

  private containsGluten(product: Product): boolean {
    const glutenKeywords = ['wheat', 'barley', 'rye', 'gluten', 'malt'];
    return product.ingredients.some((ingredient: string) =>
      glutenKeywords.some(keyword => ingredient.toLowerCase().includes(keyword))
    );
  }

  /**
   * Calculate confidence score based on data quality and analysis complexity
   */
  private calculateConfidence(product: Product, issueCount: number): number {
    let confidence = product.confidence || 0.8;
    
    // Reduce confidence for each issue found
    confidence -= (issueCount * 0.05);
    
    // Ensure confidence stays within bounds
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Generate human-readable explanation
   */
  private generateExplanation(violations: string[], warnings: string[], product: Product): string {
    if (violations.length === 0 && warnings.length === 0) {
      return `${product.name} appears to be safe based on your dietary restrictions.`;
    }

    let explanation = `Analysis of ${product.name}:\n`;
    
    if (violations.length > 0) {
      explanation += `⚠️ Violations found: ${violations.join(', ')}\n`;
    }
    
    if (warnings.length > 0) {
      explanation += `⚡ Warnings: ${warnings.join(', ')}\n`;
    }

    return explanation;
  }
}