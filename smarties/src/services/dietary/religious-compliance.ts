/**
 * Religious dietary compliance service
 * Handles Halal, Kosher, Hindu vegetarian, Jain, Buddhist restrictions
 */

export interface ReligiousRestriction {
  type: 'halal' | 'kosher' | 'hindu-vegetarian' | 'jain' | 'buddhist';
  strictness: 'strict' | 'moderate' | 'flexible';
}

export interface ReligiousComplianceResult {
  compliant: boolean;
  violations: string[];
  warnings: string[];
  certifications: string[];
  confidence: number;
}

// Prohibited ingredients by religious restriction
const RELIGIOUS_RESTRICTIONS = {
  halal: {
    prohibited: ['pork', 'alcohol', 'gelatin', 'lard', 'bacon', 'ham'],
    requiresCertification: true
  },
  kosher: {
    prohibited: ['pork', 'shellfish', 'mixing meat and dairy'],
    requiresCertification: true
  },
  'hindu-vegetarian': {
    prohibited: ['beef', 'meat', 'fish', 'eggs', 'gelatin'],
    requiresCertification: false
  },
  jain: {
    prohibited: ['meat', 'fish', 'eggs', 'root vegetables', 'onion', 'garlic', 'potato'],
    requiresCertification: false
  },
  buddhist: {
    prohibited: ['meat', 'fish', 'alcohol', 'onion', 'garlic'],
    requiresCertification: false
  }
};

/**
 * Check religious dietary compliance
 */
export function checkReligiousCompliance(
  ingredients: string[],
  restrictions: ReligiousRestriction[],
  certifications: string[] = []
): ReligiousComplianceResult {
  const result: ReligiousComplianceResult = {
    compliant: true,
    violations: [],
    warnings: [],
    certifications,
    confidence: 0.8
  };

  const ingredientText = ingredients.join(' ').toLowerCase();

  restrictions.forEach(restriction => {
    const restrictionData = RELIGIOUS_RESTRICTIONS[restriction.type];
    
    if (!restrictionData) {
      result.warnings.push(`Unknown restriction type: ${restriction.type}`);
      return;
    }

    // Check for prohibited ingredients
    restrictionData.prohibited.forEach(prohibited => {
      if (ingredientText.includes(prohibited.toLowerCase())) {
        result.violations.push(`${prohibited} (${restriction.type})`);
        result.compliant = false;
      }
    });

    // Check certification requirements
    if (restrictionData.requiresCertification && restriction.strictness === 'strict') {
      const hasCertification = certifications.some(cert => 
        cert.toLowerCase().includes(restriction.type)
      );
      
      if (!hasCertification) {
        result.warnings.push(`No ${restriction.type} certification found`);
        result.confidence *= 0.7;
      }
    }
  });

  return result;
}

/**
 * Detect religious certifications in product data
 */
export function detectReligiousCertifications(productData: any): string[] {
  const certifications: string[] = [];
  
  // Common certification patterns
  const certificationPatterns = [
    /halal/i,
    /kosher/i,
    /vegetarian/i,
    /vegan/i,
    /jain/i,
    /buddhist/i
  ];

  const searchText = JSON.stringify(productData).toLowerCase();
  
  certificationPatterns.forEach(pattern => {
    const match = searchText.match(pattern);
    if (match) {
      certifications.push(match[0]);
    }
  });

  return certifications;
}