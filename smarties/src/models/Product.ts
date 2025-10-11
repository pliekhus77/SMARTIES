/**
 * Product data model
 * Represents food product information from various sources
 */

export interface NutritionalInfo {
  calories?: number;
  sodium?: number;
  sugar?: number;
  protein?: number;
  fat?: number;
  carbohydrates?: number;
  fiber?: number;
  [key: string]: number | undefined;
}

export interface DietaryFlags {
  vegan?: boolean;
  kosher?: boolean;
  halal?: boolean;
  gluten_free?: boolean;
  organic?: boolean;
  non_gmo?: boolean;
}

export interface Product {
  _id?: string;
  upc: string;
  name: string;
  brand: string;
  ingredients: string[];
  allergens: string[];
  nutritional_info: NutritionalInfo;
  dietary_flags: DietaryFlags;
  source: string;
  last_updated: Date;
  confidence_score: number;
  image_url?: string;
  category?: string;
  serving_size?: string;
}

export class ProductModel implements Product {
  _id: string;
  upc: string;
  name: string;
  brand: string;
  ingredients: string[];
  allergens: string[];
  nutritional_info: NutritionalInfo;
  dietary_flags: DietaryFlags;
  source: string;
  last_updated: Date;
  confidence_score: number;
  image_url: string;
  category: string;
  serving_size: string;

  constructor(data: Product) {
    this._id = data._id ?? '';
    this.upc = data.upc;
    this.name = data.name;
    this.brand = data.brand;
    this.ingredients = data.ingredients;
    this.allergens = data.allergens;
    this.nutritional_info = data.nutritional_info;
    this.dietary_flags = data.dietary_flags;
    this.source = data.source;
    this.last_updated = data.last_updated;
    this.confidence_score = data.confidence_score;
    this.image_url = data.image_url ?? '';
    this.category = data.category ?? '';
    this.serving_size = data.serving_size ?? '';
  }

  /**
   * Check if product contains specific allergen
   */
  containsAllergen(allergen: string): boolean {
    return this.allergens.some(a => 
      a.toLowerCase().includes(allergen.toLowerCase())
    ) || this.ingredients.some(ingredient => 
      ingredient.toLowerCase().includes(allergen.toLowerCase())
    );
  }

  /**
   * Get formatted ingredient list
   */
  getFormattedIngredients(): string {
    return this.ingredients.join(', ');
  }

  /**
   * Check if product meets dietary flag requirement
   */
  meetsDietaryRequirement(requirement: keyof DietaryFlags): boolean {
    return this.dietary_flags[requirement] === true;
  }

  /**
   * Get product age in days
   */
  getDataAge(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.last_updated.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if product data is stale (older than 30 days)
   */
  isDataStale(): boolean {
    return this.getDataAge() > 30;
  }
}