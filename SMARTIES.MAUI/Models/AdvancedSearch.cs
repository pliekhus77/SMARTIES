namespace SMARTIES.MAUI.Models;

public class AdvancedSearchCriteria
{
    public string? Query { get; set; }
    public List<string> Categories { get; set; } = new();
    public List<string> Brands { get; set; } = new();
    public List<string> Ingredients { get; set; } = new();
    public List<string> ExcludedIngredients { get; set; } = new();
    public NutritionalCriteria? Nutritional { get; set; }
    public PriceCriteria? Price { get; set; }
    public bool OnlyCompliant { get; set; } = true;
    public SortOption SortBy { get; set; } = SortOption.Relevance;
}

public class NutritionalCriteria
{
    public Range<double>? Calories { get; set; }
    public Range<double>? Sugar { get; set; }
    public Range<double>? Sodium { get; set; }
    public Range<double>? Fat { get; set; }
    public Range<double>? Protein { get; set; }
}

public class PriceCriteria
{
    public Range<decimal>? PriceRange { get; set; }
    public bool OnSale { get; set; }
}

public class Range<T> where T : IComparable<T>
{
    public T? Min { get; set; }
    public T? Max { get; set; }
}

public class SearchResults
{
    public List<ProductSearchResult> Products { get; set; } = new();
    public int TotalCount { get; set; }
    public string? NextPageToken { get; set; }
}

public class ProductSearchResult
{
    public Product Product { get; set; } = new();
    public double RelevanceScore { get; set; }
    public ComplianceLevel ComplianceLevel { get; set; }
    public List<string> MatchedCriteria { get; set; } = new();
}

public enum SortOption
{
    Relevance,
    Name,
    Price,
    Nutrition,
    Compliance
}
