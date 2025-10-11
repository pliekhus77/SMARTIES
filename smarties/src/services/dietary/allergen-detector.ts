/**
 * Allergen detection service
 * Handles FDA Top 9 allergens and additional allergens
 */

export interface AllergenInfo {
  name: string;
  aliases: string[];
  severity: 'mild' | 'moderate' | 'severe';
  category: 'fda-top-9' | 'additional';
}

export interface AllergenDetectionResult {
  detected: AllergenInfo[];
  possibleCrossContamination: AllergenInfo[];
  confidence: number;
}

// FDA Top 9 allergens
const FDA_TOP_9_ALLERGENS: AllergenInfo[] = [
  {
    name: 'milk',
    aliases: ['dairy', 'lactose', 'casein', 'whey', 'butter', 'cheese', 'cream'],
    severity: 'severe',
    category: 'fda-top-9'
  },
  {
    name: 'eggs',
    aliases: ['egg', 'albumin', 'lecithin', 'mayonnaise'],
    severity: 'severe',
    category: 'fda-top-9'
  },
  {
    name: 'fish',
    aliases: ['salmon', 'tuna', 'cod', 'anchovy', 'sardine'],
    severity: 'severe',
    category: 'fda-top-9'
  },
  {
    name: 'shellfish',
    aliases: ['shrimp', 'crab', 'lobster', 'clam', 'oyster', 'scallop'],
    severity: 'severe',
    category: 'fda-top-9'
  },
  {
    name: 'tree nuts',
    aliases: ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'hazelnut'],
    severity: 'severe',
    category: 'fda-top-9'
  },
  {
    name: 'peanuts',
    aliases: ['peanut', 'groundnut', 'arachis'],
    severity: 'severe',
    category: 'fda-top-9'
  },
  {
    name: 'wheat',
    aliases: ['gluten', 'flour', 'semolina', 'bulgur', 'spelt'],
    severity: 'severe',
    category: 'fda-top-9'
  },
  {
    name: 'soybeans',
    aliases: ['soy', 'soya', 'tofu', 'tempeh', 'miso', 'edamame'],
    severity: 'severe',
    category: 'fda-top-9'
  },
  {
    name: 'sesame',
    aliases: ['sesame seed', 'tahini', 'sesame oil'],
    severity: 'moderate',
    category: 'fda-top-9'
  }
];

/**
 * Detect allergens in ingredient list
 */
export function detectAllergens(ingredients: string[]): AllergenDetectionResult {
  const detected: AllergenInfo[] = [];
  const possibleCrossContamination: AllergenInfo[] = [];
  
  const ingredientText = ingredients.join(' ').toLowerCase();
  
  FDA_TOP_9_ALLERGENS.forEach(allergen => {
    const found = allergen.aliases.some(alias => 
      ingredientText.includes(alias.toLowerCase())
    );
    
    if (found) {
      detected.push(allergen);
    }
  });
  
  // TODO: Implement cross-contamination detection logic
  
  return {
    detected,
    possibleCrossContamination,
    confidence: detected.length > 0 ? 0.9 : 0.7
  };
}

/**
 * Check if user has specific allergen restrictions
 */
export function checkAllergenRestrictions(
  userAllergens: string[],
  detectedAllergens: AllergenInfo[]
): { violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];
  
  userAllergens.forEach(userAllergen => {
    const found = detectedAllergens.find(detected => 
      detected.name.toLowerCase() === userAllergen.toLowerCase() ||
      detected.aliases.some(alias => alias.toLowerCase() === userAllergen.toLowerCase())
    );
    
    if (found) {
      if (found.severity === 'severe') {
        violations.push(found.name);
      } else {
        warnings.push(found.name);
      }
    }
  });
  
  return { violations, warnings };
}