using SQLite;
using Microsoft.Extensions.Logging;
using SMARTIES.MAUI.Models;

namespace SMARTIES.MAUI.Data;

public class AdvancedFeaturesDbService
{
    private readonly SQLiteAsyncConnection _database;
    private readonly ILogger<AdvancedFeaturesDbService> _logger;

    public AdvancedFeaturesDbService(ILogger<AdvancedFeaturesDbService> logger)
    {
        _logger = logger;
        var dbPath = Path.Combine(FileSystem.AppDataDirectory, "smarties_advanced.db3");
        _database = new SQLiteAsyncConnection(dbPath);
        
        _ = Task.Run(InitializeDatabaseAsync);
    }

    private async Task InitializeDatabaseAsync()
    {
        try
        {
            await _database.CreateTableAsync<FamilyProfile>();
            await _database.CreateTableAsync<ProductRecommendation>();
            await _database.CreateTableAsync<AnalyticsEvent>();
            await _database.CreateTableAsync<CustomRestriction>();
            
            _logger.LogInformation("Advanced features database initialized");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing advanced features database");
        }
    }

    public SQLiteAsyncConnection Database => _database;
}
