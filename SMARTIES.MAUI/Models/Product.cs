using System.Text.Json.Serialization;
using SQLite;

namespace SMARTIES.MAUI.Models;

[Table("Products")]
public class Product
{
    [PrimaryKey]
    public string Barcode { get; set; } = string.Empty;

    public string ProductName { get; set; } = string.Empty;

    public string Brand { get; set; } = string.Empty;

    public string IngredientsText { get; set; } = string.Empty;

    public string Allergens { get; set; } = string.Empty;

    public string ImageUrl { get; set; } = string.Empty;

    public string NutritionGrades { get; set; } = string.Empty;

    public string Categories { get; set; } = string.Empty;

    public DateTime CachedAt { get; set; } = DateTime.UtcNow;

    public bool IsFromCache { get; set; }

    // Nutrition facts
    public double? EnergyKcal { get; set; }
    public double? Fat { get; set; }
    public double? SaturatedFat { get; set; }
    public double? Carbohydrates { get; set; }
    public double? Sugars { get; set; }
    public double? Fiber { get; set; }
    public double? Proteins { get; set; }
    public double? Salt { get; set; }
    public double? Sodium { get; set; }
}

// Open Food Facts API Response Models
public class OpenFoodFactsResponse
{
    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("status_verbose")]
    public string StatusVerbose { get; set; } = string.Empty;

    [JsonPropertyName("product")]
    public OpenFoodFactsProduct? Product { get; set; }
}

public class OpenFoodFactsProduct
{
    [JsonPropertyName("product_name")]
    public string ProductName { get; set; } = string.Empty;

    [JsonPropertyName("brands")]
    public string Brands { get; set; } = string.Empty;

    [JsonPropertyName("ingredients_text")]
    public string IngredientsText { get; set; } = string.Empty;

    [JsonPropertyName("allergens")]
    public string Allergens { get; set; } = string.Empty;

    [JsonPropertyName("image_url")]
    public string ImageUrl { get; set; } = string.Empty;

    [JsonPropertyName("nutrition_grades")]
    public string NutritionGrades { get; set; } = string.Empty;

    [JsonPropertyName("categories")]
    public string Categories { get; set; } = string.Empty;

    [JsonPropertyName("nutriments")]
    public OpenFoodFactsNutriments? Nutriments { get; set; }
}

public class OpenFoodFactsNutriments
{
    [JsonPropertyName("energy-kcal_100g")]
    public double? EnergyKcal { get; set; }

    [JsonPropertyName("fat_100g")]
    public double? Fat { get; set; }

    [JsonPropertyName("saturated-fat_100g")]
    public double? SaturatedFat { get; set; }

    [JsonPropertyName("carbohydrates_100g")]
    public double? Carbohydrates { get; set; }

    [JsonPropertyName("sugars_100g")]
    public double? Sugars { get; set; }

    [JsonPropertyName("fiber_100g")]
    public double? Fiber { get; set; }

    [JsonPropertyName("proteins_100g")]
    public double? Proteins { get; set; }

    [JsonPropertyName("salt_100g")]
    public double? Salt { get; set; }

    [JsonPropertyName("sodium_100g")]
    public double? Sodium { get; set; }
}