export interface Product {
  barcode: string;
  name: string;
  ingredients?: string;
  allergens?: string[];
  nutritionData?: NutritionData;
  imageUrl?: string;
  brands?: string;
}

export interface NutritionData {
  energy?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  proteins?: number;
  salt?: number;
  sodium?: number;
}

export interface OpenFoodFactsResponse {
  status: number;
  status_verbose: string;
  product?: OpenFoodFactsProduct;
}

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  ingredients_text?: string;
  allergens?: string;
  nutriments?: any;
  image_url?: string;
  brands?: string;
}

export interface ProductLookupResult {
  success: boolean;
  product?: Product;
  error?: string;
}
