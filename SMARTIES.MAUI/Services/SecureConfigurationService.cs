using Microsoft.Extensions.Logging;

namespace SMARTIES.MAUI.Services;

public interface ISecureConfigurationService
{
    Task<string?> GetApiKeyAsync(string provider);
    Task SetApiKeyAsync(string provider, string apiKey);
    Task<bool> ValidateConfigurationAsync();
    Task ClearAllKeysAsync();
}

public class SecureConfigurationService : ISecureConfigurationService
{
    private readonly ILogger<SecureConfigurationService> _logger;
    private const string OpenAIKeyName = "openai_api_key";
    private const string AnthropicKeyName = "anthropic_api_key";

    public SecureConfigurationService(ILogger<SecureConfigurationService> logger)
    {
        _logger = logger;
    }

    public async Task<string?> GetApiKeyAsync(string provider)
    {
        try
        {
            var keyName = provider.ToLower() switch
            {
                "openai" => OpenAIKeyName,
                "anthropic" => AnthropicKeyName,
                _ => throw new ArgumentException($"Unknown provider: {provider}")
            };

            return await SecureStorage.GetAsync(keyName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve API key for provider {Provider}", provider);
            return null;
        }
    }

    public async Task SetApiKeyAsync(string provider, string apiKey)
    {
        try
        {
            var keyName = provider.ToLower() switch
            {
                "openai" => OpenAIKeyName,
                "anthropic" => AnthropicKeyName,
                _ => throw new ArgumentException($"Unknown provider: {provider}")
            };

            await SecureStorage.SetAsync(keyName, apiKey);
            _logger.LogInformation("API key set for provider {Provider}", provider);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to store API key for provider {Provider}", provider);
            throw;
        }
    }

    public async Task<bool> ValidateConfigurationAsync()
    {
        try
        {
            var openAIKey = await GetApiKeyAsync("openai");
            var anthropicKey = await GetApiKeyAsync("anthropic");

            return !string.IsNullOrWhiteSpace(openAIKey) || !string.IsNullOrWhiteSpace(anthropicKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Configuration validation failed");
            return false;
        }
    }

    public async Task ClearAllKeysAsync()
    {
        try
        {
            SecureStorage.Remove(OpenAIKeyName);
            SecureStorage.Remove(AnthropicKeyName);
            _logger.LogInformation("All API keys cleared");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to clear API keys");
            throw;
        }
    }
}
