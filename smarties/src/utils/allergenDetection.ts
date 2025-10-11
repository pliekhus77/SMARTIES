/**
 * Allergen detection utility functions
 * Helper functions for identifying allergens in ingredients
 */

// FDA Top 9 allergens plus additional common allergens
export const COMMON_ALLERGENS = {
  milk: ['milk', 'dairy', 'lactose', 'casein', 'whey', 'butter', 'cheese', 'cream', 'yogurt'],
  eggs: ['egg', 'albumin', 'lecithin', 'lysozyme', 'mayonnaise'],
  fish: ['fish', 'salmon', 'tuna', 'cod', 'bass', 'flounder', 'anchovy'],
  shellfish: ['shrimp', 'crab', 'lobster', 'oyster', 'scallop', 'clam', 'mussel'],
  tree_nuts: ['almond', 'walnut', 'pecan', 'cashew', 'pistachio', 'brazil nut', 'hazelnut', 'macadamia'],
  peanuts: ['peanut', 'groundnut', 'arachis oil'],
  wheat: ['wheat', 'flour', 'gluten', 'semolina', 'durum', 'spelt', 'kamut'],
  soy: ['soy', 'soya', 'soybean', 'tofu', 'tempeh', 'miso', 'edamame'],
  sesame: ['sesame', 'tahini', 'sesamum'],
} as const;

export type AllergenType = keyof typeof COMMON_ALLERGENS;

/**
 * Detect allergens in ingredient list
 */
export function detectAllergens(ingredients: string[]): AllergenType[] {
  const detectedAllergens: AllergenType[] = [];
  const ingredientText = ingredients.join(' ').toLowerCase();

  Object.entries(COMMON_ALLERGENS).forEach(([allergen, keywords]) => {
    const hasAllergen = keywords.some(keyword => 
      ingredientText.includes(keyword.toLowerCase())
    );
    
    if (hasAllergen) {
      detectedAllergens.push(allergen as AllergenType);
    }
  });

  return detectedAllergens;
}

/**
 * Check if ingredients contain specific allergen
 */
export function containsAllergen(ingredients: string[], allergen: AllergenType): boolean {
  const keywords = COMMON_ALLERGENS[allergen];
  const ingredientText = ingredients.join(' ').toLowerCase();
  
  return keywords.some(keyword => 
    ingredientText.includes(keyword.toLowerCase())
  );
}

/**
 * Get allergen severity level
 */
export function getAllergenSeverity(allergen: AllergenType): 'high' | 'medium' | 'low' {
  const highSeverityAllergens: AllergenType[] = ['peanuts', 'tree_nuts', 'shellfish', 'fish'];
  const mediumSeverityAllergens: AllergenType[] = ['milk', 'eggs', 'soy'];
  
  if (highSeverityAllergens.includes(allergen)) {
    return 'high';
  } else if (mediumSeverityAllergens.includes(allergen)) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Get human-readable allergen name
 */
export function getAllergenDisplayName(allergen: AllergenType): string {
  const displayNames: Record<AllergenType, string> = {
    milk: 'Milk/Dairy',
    eggs: 'Eggs',
    fish: 'Fish',
    shellfish: 'Shellfish',
    tree_nuts: 'Tree Nuts',
    peanuts: 'Peanuts',
    wheat: 'Wheat/Gluten',
    soy: 'Soy',
    sesame: 'Sesame',
  };
  
  return displayNames[allergen];
}

/**
 * Check for cross-contamination warnings
 */
export function checkCrossContamination(ingredients: string[], allergens: AllergenType[]): string[] {
  const warnings: string[] = [];
  const ingredientText = ingredients.join(' ').toLowerCase();
  
  // Common cross-contamination phrases
  const crossContaminationPhrases = [
    'may contain',
    'processed in a facility',
    'manufactured on equipment',
    'produced in a facility',
    'may be present',
  ];
  
  allergens.forEach(allergen => {
    const keywords = COMMON_ALLERGENS[allergen];
    
    crossContaminationPhrases.forEach(phrase => {
      keywords.forEach(keyword => {
        if (ingredientText.includes(`${phrase} ${keyword}`)) {
          warnings.push(`May contain traces of ${getAllergenDisplayName(allergen)}`);
        }
      });
    });
  });
  
  return [...new Set(warnings)]; // Remove duplicates
}

/**
 * Analyze ingredient for hidden allergens
 */
export function analyzeHiddenAllergens(ingredient: string): AllergenType[] {
  const hiddenAllergens: AllergenType[] = [];
  const ingredientLower = ingredient.toLowerCase();
  
  // Check for hidden dairy
  if (ingredientLower.includes('natural flavor') || 
      ingredientLower.includes('artificial flavor')) {
    // Note: This is a conservative approach - flavors may contain allergens
    // In a real implementation, you'd need more specific data
  }
  
  // Check for hidden wheat/gluten
  if (ingredientLower.includes('modified food starch') ||
      ingredientLower.includes('hydrolyzed protein')) {
    // These may contain wheat unless specified otherwise
  }
  
  return hiddenAllergens;
}

/**
 * Get allergen confidence score
 */
export function getAllergenConfidence(
  ingredients: string[], 
  detectedAllergens: AllergenType[]
): number {
  let confidence = 1.0;
  
  // Reduce confidence for vague ingredients
  const vagueIngredients = ['natural flavor', 'artificial flavor', 'spices', 'seasoning'];
  const hasVagueIngredients = ingredients.some(ingredient =>
    vagueIngredients.some(vague => 
      ingredient.toLowerCase().includes(vague)
    )
  );
  
  if (hasVagueIngredients) {
    confidence -= 0.1;
  }
  
  // Reduce confidence if no explicit allergen statement
  const hasAllergenStatement = ingredients.some(ingredient =>
    ingredient.toLowerCase().includes('contains:') ||
    ingredient.toLowerCase().includes('allergens:')
  );
  
  if (!hasAllergenStatement && detectedAllergens.length > 0) {
    confidence -= 0.1;
  }
  
  return Math.max(0.1, confidence);
}