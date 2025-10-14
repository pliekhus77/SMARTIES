using FluentAssertions;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Models;
using Microsoft.Extensions.Logging;
using Moq;

namespace SMARTIES.MAUI.Tests.Safety;

public class AllergenDetectionTests
{
    private readonly RuleBasedAnalysisService _service;

    public AllergenDetectionTests()
    {
        _service = new RuleBasedAnalysisService(Mock.Of<ILogger<RuleBasedAnalysisService>>());
    }

    [Theory]
    [InlineData("milk", DietaryRestrictionType.Milk)]
    [InlineData("dairy", DietaryRestrictionType.Milk)]
    [InlineData("lactose", DietaryRestrictionType.Milk)]
    [InlineData("casein", DietaryRestrictionType.Milk)]
    [InlineData("whey", DietaryRestrictionType.Milk)]
    public async Task AnalyzeProductAsync_WithMilkAllergens_DetectsViolation(string ingredient, DietaryRestrictionType restriction)
    {
        // Arrange
        var request = new AIAnalysisRequest
        {
            ProductName = "Test Product",
            Ingredients = new List<string> { ingredient },
            Restrictions = new List<DietaryRestrictionType> { restriction }
        };

        // Act
        var result = await _service.AnalyzeProductAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Violation);
        result.Violations.Should().HaveCount(1);
        result.Violations[0].Type.Should().Be(ViolationType.Allergen);
        result.Violations[0].Severity.Should().Be(SeverityLevel.Critical);
        result.Violations[0].Ingredient.Should().Be(ingredient);
    }

    [Theory]
    [InlineData("egg", DietaryRestrictionType.Eggs)]
    [InlineData("albumin", DietaryRestrictionType.Eggs)]
    [InlineData("lecithin", DietaryRestrictionType.Eggs)]
    [InlineData("mayonnaise", DietaryRestrictionType.Eggs)]
    public async Task AnalyzeProductAsync_WithEggAllergens_DetectsViolation(string ingredient, DietaryRestrictionType restriction)
    {
        // Arrange
        var request = new AIAnalysisRequest
        {
            ProductName = "Test Product",
            Ingredients = new List<string> { ingredient },
            Restrictions = new List<DietaryRestrictionType> { restriction }
        };

        // Act
        var result = await _service.AnalyzeProductAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Violation);
        result.Violations.Should().HaveCount(1);
        result.Violations[0].Type.Should().Be(ViolationType.Allergen);
        result.Violations[0].Severity.Should().Be(SeverityLevel.Critical);
    }

    [Theory]
    [InlineData("peanut", DietaryRestrictionType.Peanuts)]
    [InlineData("groundnut", DietaryRestrictionType.Peanuts)]
    public async Task AnalyzeProductAsync_WithPeanutAllergens_DetectsViolation(string ingredient, DietaryRestrictionType restriction)
    {
        // Arrange
        var request = new AIAnalysisRequest
        {
            ProductName = "Test Product",
            Ingredients = new List<string> { ingredient },
            Restrictions = new List<DietaryRestrictionType> { restriction }
        };

        // Act
        var result = await _service.AnalyzeProductAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Violation);
        result.Violations.Should().HaveCount(1);
        result.Violations[0].Type.Should().Be(ViolationType.Allergen);
        result.Violations[0].Severity.Should().Be(SeverityLevel.Critical);
    }

    [Fact]
    public async Task AnalyzeProductAsync_WithMultipleAllergens_DetectsAllViolations()
    {
        // Arrange
        var request = new AIAnalysisRequest
        {
            ProductName = "Test Product",
            Ingredients = new List<string> { "milk", "eggs", "peanuts" },
            Restrictions = new List<DietaryRestrictionType> { DietaryRestrictionType.Milk, DietaryRestrictionType.Eggs, DietaryRestrictionType.Peanuts }
        };

        // Act
        var result = await _service.AnalyzeProductAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Violation);
        result.Violations.Should().HaveCount(3);
        result.Violations.Should().OnlyContain(v => v.Type == ViolationType.Allergen);
        result.Violations.Should().OnlyContain(v => v.Severity == SeverityLevel.Critical);
    }

    [Fact]
    public async Task AnalyzeProductAsync_WithNoAllergens_ReturnsSafe()
    {
        // Arrange
        var request = new AIAnalysisRequest
        {
            ProductName = "Test Product",
            Ingredients = new List<string> { "water", "sugar", "salt" },
            Restrictions = new List<DietaryRestrictionType> { DietaryRestrictionType.Milk, DietaryRestrictionType.Eggs }
        };

        // Act
        var result = await _service.AnalyzeProductAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Safe);
        result.Violations.Should().BeEmpty();
    }

    [Theory]
    [InlineData("MILK", DietaryRestrictionType.Milk)]
    [InlineData("Milk", DietaryRestrictionType.Milk)]
    [InlineData("EGGS", DietaryRestrictionType.Eggs)]
    [InlineData("Eggs", DietaryRestrictionType.Eggs)]
    public async Task AnalyzeProductAsync_WithCaseInsensitiveAllergens_DetectsViolation(string ingredient, DietaryRestrictionType restriction)
    {
        // Arrange
        var request = new AIAnalysisRequest
        {
            ProductName = "Test Product",
            Ingredients = new List<string> { ingredient },
            Restrictions = new List<DietaryRestrictionType> { restriction }
        };

        // Act
        var result = await _service.AnalyzeProductAsync(request);

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Violation);
        result.Violations.Should().HaveCount(1);
    }
}
