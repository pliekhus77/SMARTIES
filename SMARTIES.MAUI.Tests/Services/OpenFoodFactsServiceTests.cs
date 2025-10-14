using FluentAssertions;
using Moq;
using Moq.Protected;
using System.Net;
using System.Text.Json;
using SMARTIES.MAUI.Services;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Tests.Services;

public class OpenFoodFactsServiceTests
{
    private readonly Mock<HttpMessageHandler> _mockHttpHandler;
    private readonly HttpClient _httpClient;
    private readonly OpenFoodFactsService _service;

    public OpenFoodFactsServiceTests()
    {
        _mockHttpHandler = new Mock<HttpMessageHandler>();
        _httpClient = new HttpClient(_mockHttpHandler.Object);
        _service = new OpenFoodFactsService(_httpClient, Mock.Of<Microsoft.Extensions.Logging.ILogger<OpenFoodFactsService>>());
    }

    [Fact]
    public async Task GetProductAsync_WithValidBarcode_ReturnsProduct()
    {
        // Arrange
        var barcode = "3017620422003";
        var responseJson = JsonSerializer.Serialize(new
        {
            status = 1,
            product = new
            {
                code = barcode,
                product_name = "Nutella",
                ingredients_text = "Sugar, Palm Oil, Hazelnuts, Cocoa",
                allergens = "nuts"
            }
        });

        _mockHttpHandler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(responseJson)
            });

        // Act
        var result = await _service.GetProductAsync(barcode);

        // Assert
        result.Should().NotBeNull();
        result!.Barcode.Should().Be(barcode);
        result.ProductName.Should().Be("Nutella");
        result.Ingredients.Should().Contain("Sugar");
        result.Allergens.Should().Contain("nuts");
    }

    [Fact]
    public async Task GetProductAsync_WithInvalidBarcode_ReturnsNull()
    {
        // Arrange
        var barcode = "invalid";
        var responseJson = JsonSerializer.Serialize(new { status = 0 });

        _mockHttpHandler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(responseJson)
            });

        // Act
        var result = await _service.GetProductAsync(barcode);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetProductAsync_WithNetworkError_ThrowsException()
    {
        // Arrange
        var barcode = "123456789";
        _mockHttpHandler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .ThrowsAsync(new HttpRequestException("Network error"));

        // Act & Assert
        await _service.Invoking(s => s.GetProductAsync(barcode))
            .Should().ThrowAsync<HttpRequestException>();
    }

    [Theory]
    [InlineData("123456789012")]
    [InlineData("1234567890123")]
    [InlineData("12345678901234")]
    public async Task GetProductAsync_WithValidBarcodeFormats_MakesCorrectRequest(string barcode)
    {
        // Arrange
        var responseJson = JsonSerializer.Serialize(new { status = 0 });
        _mockHttpHandler.Protected()
            .Setup<Task<HttpResponseMessage>>("SendAsync", ItExpr.IsAny<HttpRequestMessage>(), ItExpr.IsAny<CancellationToken>())
            .ReturnsAsync(new HttpResponseMessage
            {
                StatusCode = HttpStatusCode.OK,
                Content = new StringContent(responseJson)
            });

        // Act
        await _service.GetProductAsync(barcode);

        // Assert
        _mockHttpHandler.Protected().Verify(
            "SendAsync",
            Times.Once(),
            ItExpr.Is<HttpRequestMessage>(req => req.RequestUri!.ToString().Contains(barcode)),
            ItExpr.IsAny<CancellationToken>());
    }
}
