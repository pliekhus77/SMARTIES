using FluentAssertions;
using Moq;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Models;
using SMARTIES.MAUI.Tests.Helpers;

namespace SMARTIES.MAUI.Tests.Services;

public class DietaryAnalysisServiceTests
{
    private readonly Mock<IOpenAIService> _mockOpenAI;
    private readonly Mock<IAnthropicService> _mockAnthropic;
    private readonly Mock<IRuleBasedAnalysisService> _mockRuleBased;
    private readonly DietaryAnalysisService _service;

    public DietaryAnalysisServiceTests()
    {
        _mockOpenAI = new Mock<IOpenAIService>();
        _mockAnthropic = new Mock<IAnthropicService>();
        _mockRuleBased = new Mock<IRuleBasedAnalysisService>();
        _service = new DietaryAnalysisService(_mockOpenAI.Object, _mockAnthropic.Object, _mockRuleBased.Object, Mock.Of<Microsoft.Extensions.Logging.ILogger<DietaryAnalysisService>>());
    }

    [Fact]
    public async Task AnalyzeProductAsync_WithSuccessfulOpenAI_ReturnsOpenAIResult()
    {
        // Arrange
        var analysis = DietaryAnalysisBuilder.Create().WithCompliance(ComplianceLevel.Safe).Build();
        _mockOpenAI.Setup(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()))
            .ReturnsAsync(new AIAnalysisResponse { Success = true, Analysis = analysis });

        // Act
        var result = await _service.AnalyzeProductAsync("Test Product", new List<string> { "milk" }, new List<DietaryRestrictionType> { DietaryRestrictionType.Milk });

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Safe);
        _mockOpenAI.Verify(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()), Times.Once);
        _mockAnthropic.Verify(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()), Times.Never);
    }

    [Fact]
    public async Task AnalyzeProductAsync_WithFailedOpenAI_FallsBackToAnthropic()
    {
        // Arrange
        var analysis = DietaryAnalysisBuilder.Create().WithCompliance(ComplianceLevel.Caution).Build();
        _mockOpenAI.Setup(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()))
            .ReturnsAsync(new AIAnalysisResponse { Success = false });
        _mockAnthropic.Setup(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()))
            .ReturnsAsync(new AIAnalysisResponse { Success = true, Analysis = analysis });

        // Act
        var result = await _service.AnalyzeProductAsync("Test Product", new List<string> { "milk" }, new List<DietaryRestrictionType> { DietaryRestrictionType.Milk });

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Caution);
        _mockOpenAI.Verify(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()), Times.Once);
        _mockAnthropic.Verify(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()), Times.Once);
    }

    [Fact]
    public async Task AnalyzeProductAsync_WithAllAIFailed_FallsBackToRuleBased()
    {
        // Arrange
        var analysis = DietaryAnalysisBuilder.Create().WithCompliance(ComplianceLevel.Violation).Build();
        _mockOpenAI.Setup(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()))
            .ReturnsAsync(new AIAnalysisResponse { Success = false });
        _mockAnthropic.Setup(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()))
            .ReturnsAsync(new AIAnalysisResponse { Success = false });
        _mockRuleBased.Setup(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()))
            .ReturnsAsync(analysis);

        // Act
        var result = await _service.AnalyzeProductAsync("Test Product", new List<string> { "milk" }, new List<DietaryRestrictionType> { DietaryRestrictionType.Milk });

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Violation);
        _mockRuleBased.Verify(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()), Times.Once);
    }

    [Theory]
    [InlineData("milk", DietaryRestrictionType.Milk)]
    [InlineData("eggs", DietaryRestrictionType.Eggs)]
    [InlineData("peanuts", DietaryRestrictionType.Peanuts)]
    public async Task AnalyzeProductAsync_WithAllergenIngredients_DetectsViolations(string ingredient, DietaryRestrictionType restriction)
    {
        // Arrange
        var analysis = DietaryAnalysisBuilder.Create()
            .WithCompliance(ComplianceLevel.Violation)
            .WithViolation(ViolationType.Allergen, SeverityLevel.Critical, ingredient)
            .Build();
        _mockOpenAI.Setup(x => x.AnalyzeProductAsync(It.IsAny<AIAnalysisRequest>()))
            .ReturnsAsync(new AIAnalysisResponse { Success = true, Analysis = analysis });

        // Act
        var result = await _service.AnalyzeProductAsync("Test Product", new List<string> { ingredient }, new List<DietaryRestrictionType> { restriction });

        // Assert
        result.Should().NotBeNull();
        result.OverallCompliance.Should().Be(ComplianceLevel.Violation);
        result.Violations.Should().HaveCount(1);
        result.Violations[0].Type.Should().Be(ViolationType.Allergen);
        result.Violations[0].Severity.Should().Be(SeverityLevel.Critical);
    }
}
