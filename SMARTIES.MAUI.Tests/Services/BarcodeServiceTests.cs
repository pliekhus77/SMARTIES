using Microsoft.Extensions.Logging;
using Moq;
using SMARTIES.MAUI.Services;
using Xunit;

namespace SMARTIES.MAUI.Tests.Services;

public class BarcodeServiceTests
{
    private readonly BarcodeService _barcodeService;
    private readonly Mock<ILogger<BarcodeService>> _mockLogger;

    public BarcodeServiceTests()
    {
        _mockLogger = new Mock<ILogger<BarcodeService>>();
        _barcodeService = new BarcodeService();
    }

    [Theory]
    [InlineData("12345678", true)]        // EAN-8
    [InlineData("123456789012", true)]    // UPC-A
    [InlineData("1234567890123", true)]   // EAN-13
    [InlineData("1234567", false)]        // Too short
    [InlineData("12345678901234", false)] // Too long
    [InlineData("", false)]               // Empty
    [InlineData(null, false)]             // Null
    [InlineData("12345abc", false)]       // Contains letters
    public void ValidateBarcodeFormat_ShouldReturnExpectedResult(string barcode, bool expected)
    {
        // Act
        var result = _barcodeService.ValidateBarcodeFormat(barcode);

        // Assert
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("12345678", "0000012345678")]      // EAN-8 to 13 digits
    [InlineData("123456789012", "0123456789012")]  // UPC-A to 13 digits
    [InlineData("1234567890123", "1234567890123")] // EAN-13 unchanged
    [InlineData("", "")]                           // Empty unchanged
    public void NormalizeBarcode_ShouldReturnExpectedResult(string barcode, string expected)
    {
        // Act
        var result = _barcodeService.NormalizeBarcode(barcode);

        // Assert
        Assert.Equal(expected, result);
    }

    [Fact]
    public void OnBarcodeDetected_WithValidBarcode_ShouldTriggerEvent()
    {
        // Arrange
        var eventTriggered = false;
        string? detectedBarcode = null;
        
        _barcodeService.BarcodeDetected += (sender, args) =>
        {
            eventTriggered = true;
            detectedBarcode = args.Barcode;
        };

        // Act
        _barcodeService.OnBarcodeDetected("123456789012", ZXing.Net.Maui.BarcodeFormat.Ean13);

        // Assert
        Assert.True(eventTriggered);
        Assert.Equal("0123456789012", detectedBarcode);
    }

    [Fact]
    public void OnBarcodeDetected_WithInvalidBarcode_ShouldNotTriggerEvent()
    {
        // Arrange
        var eventTriggered = false;
        
        _barcodeService.BarcodeDetected += (sender, args) =>
        {
            eventTriggered = true;
        };

        // Act
        _barcodeService.OnBarcodeDetected("invalid", ZXing.Net.Maui.BarcodeFormat.Ean13);

        // Assert
        Assert.False(eventTriggered);
    }

    [Fact]
    public void OnBarcodeDetected_WithinCooldownPeriod_ShouldNotTriggerEvent()
    {
        // Arrange
        var eventCount = 0;
        
        _barcodeService.BarcodeDetected += (sender, args) =>
        {
            eventCount++;
        };

        // Act
        _barcodeService.OnBarcodeDetected("123456789012", ZXing.Net.Maui.BarcodeFormat.Ean13);
        _barcodeService.OnBarcodeDetected("123456789012", ZXing.Net.Maui.BarcodeFormat.Ean13);

        // Assert
        Assert.Equal(1, eventCount);
    }
}
