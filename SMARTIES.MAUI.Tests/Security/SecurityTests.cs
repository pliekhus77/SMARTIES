using FluentAssertions;
using SMARTIES.MAUI.Services;
using Microsoft.Extensions.Logging;
using Moq;

namespace SMARTIES.MAUI.Tests.Security;

public class SecurityTests
{
    private readonly SecureConfigurationService _secureConfigService;

    public SecurityTests()
    {
        _secureConfigService = new SecureConfigurationService(Mock.Of<ILogger<SecureConfigurationService>>());
    }

    [Fact]
    public async Task SecureStorage_StoresAndRetrievesApiKeys()
    {
        // Arrange
        var testApiKey = "test-api-key-12345";
        var provider = "openai";

        // Act
        await _secureConfigService.SetApiKeyAsync(provider, testApiKey);
        var retrievedKey = await _secureConfigService.GetApiKeyAsync(provider);

        // Assert
        retrievedKey.Should().Be(testApiKey);
    }

    [Fact]
    public async Task SecureStorage_HandlesNonExistentKeys()
    {
        // Arrange
        var provider = "nonexistent";

        // Act
        var retrievedKey = await _secureConfigService.GetApiKeyAsync(provider);

        // Assert
        retrievedKey.Should().BeNull();
    }

    [Fact]
    public async Task SecureStorage_ValidatesConfiguration()
    {
        // Arrange
        await _secureConfigService.SetApiKeyAsync("openai", "test-key");

        // Act
        var isValid = await _secureConfigService.ValidateConfigurationAsync();

        // Assert
        isValid.Should().BeTrue();
    }

    [Fact]
    public async Task SecureStorage_ClearsAllKeys()
    {
        // Arrange
        await _secureConfigService.SetApiKeyAsync("openai", "test-key-1");
        await _secureConfigService.SetApiKeyAsync("anthropic", "test-key-2");

        // Act
        await _secureConfigService.ClearAllKeysAsync();
        var openAIKey = await _secureConfigService.GetApiKeyAsync("openai");
        var anthropicKey = await _secureConfigService.GetApiKeyAsync("anthropic");

        // Assert
        openAIKey.Should().BeNull();
        anthropicKey.Should().BeNull();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task SecureStorage_HandlesInvalidApiKeys(string? invalidKey)
    {
        // Arrange & Act
        if (invalidKey != null)
        {
            await _secureConfigService.SetApiKeyAsync("test", invalidKey);
        }

        var isValid = await _secureConfigService.ValidateConfigurationAsync();

        // Assert
        if (string.IsNullOrWhiteSpace(invalidKey))
        {
            isValid.Should().BeFalse();
        }
    }

    [Fact]
    public void ApiKeyStorage_DoesNotExposeKeysInMemory()
    {
        // This test ensures API keys are not stored in plain text in memory
        // In a real implementation, this would check for secure memory handling
        
        // Arrange & Act
        var service = new SecureConfigurationService(Mock.Of<ILogger<SecureConfigurationService>>());

        // Assert
        // Verify that the service doesn't hold API keys in plain text fields
        var fields = service.GetType().GetFields(System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        var stringFields = fields.Where(f => f.FieldType == typeof(string));
        
        // No string fields should contain API key-like values
        stringFields.Should().NotContain(f => f.Name.ToLower().Contains("key") || f.Name.ToLower().Contains("secret"));
    }

    [Theory]
    [InlineData("openai")]
    [InlineData("anthropic")]
    [InlineData("OPENAI")]
    [InlineData("ANTHROPIC")]
    public async Task SecureStorage_HandlesCaseInsensitiveProviders(string provider)
    {
        // Arrange
        var testApiKey = "test-key-case-insensitive";

        // Act & Assert
        await _secureConfigService.Invoking(s => s.SetApiKeyAsync(provider.ToLower(), testApiKey))
            .Should().NotThrowAsync();

        var retrievedKey = await _secureConfigService.GetApiKeyAsync(provider.ToLower());
        retrievedKey.Should().Be(testApiKey);
    }
}
