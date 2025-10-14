# Advanced Features Design Document

## Overview

This design document outlines the implementation of advanced features for the SMARTIES MAUI application, building upon the core scanning and analysis functionality. The advanced features include family profile management, intelligent product recommendations, comprehensive analytics, advanced search capabilities, custom restriction rules, social sharing, health tracking integration, store-specific features, educational content, smart notifications, community contributions, and enhanced accessibility features.

The design follows the existing SMARTIES architecture patterns using .NET MAUI with MVVM, SQLite for local storage, Open Food Facts API integration, and AI-powered dietary analysis while maintaining the safety-first design principles and sub-3-second response time requirements.

## Architecture

### High-Level Architecture

The advanced features extend the existing four-layer SMARTIES architecture:

```
SMARTIES.MAUI/
├── Models/                     # Extended data models
│   ├── FamilyProfile.cs        # Family member profiles
│   ├── Recommendation.cs       # Product recommendations
│   ├── Analytics.cs           # Usage analytics and insights
│   ├── CustomRestriction.cs   # User-defined restrictions
│   └── EducationalContent.cs  # Learning materials
├── Services/                   # Enhanced business services
│   ├── IFamilyProfileService.cs
│   ├── IRecommendationService.cs
│   ├── IAnalyticsService.cs
│   ├── IAdvancedSearchService.cs
│   ├── ICustomRestrictionService.cs
│   ├── ISocialSharingService.cs
│   ├── IHealthTrackingService.cs
│   ├── IStoreIntegrationService.cs
│   ├── IEducationalContentService.cs
│   ├── INotificationService.cs
│   └── ICommunityContributionService.cs
├── ViewModels/                 # Extended ViewModels
│   ├── FamilyProfileViewModel.cs
│   ├── RecommendationsViewModel.cs
│   ├── AnalyticsViewModel.cs
│   ├── AdvancedSearchViewModel.cs
│   └── EducationalContentViewModel.cs
└── Views/                      # New UI pages
    ├── FamilyProfilesPage.xaml
    ├── RecommendationsPage.xaml
    ├── AnalyticsPage.xaml
    ├── AdvancedSearchPage.xaml
    └── EducationalContentPage.xaml
```

### Design Decisions

**Family Profile Architecture**: Implemented as a composition pattern where each profile contains its own set of dietary restrictions, preferences, and scan history. This allows for complete isolation between family members while maintaining shared application settings.

**Recommendation Engine**: Uses a hybrid approach combining collaborative filtering (based on similar user patterns) and content-based filtering (based on product attributes). The engine operates locally to maintain privacy while leveraging anonymized usage patterns.

**Analytics Processing**: Implements a local-first analytics approach where all data processing occurs on-device, with optional anonymized aggregation for community insights. This maintains user privacy while enabling valuable trend analysis.

## Components and Interfaces

### Family Profile Management

#### FamilyProfile Model
```csharp
public class FamilyProfile
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string? PhotoPath { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Dietary restrictions specific to this profile
    public List<DietaryRestriction> Restrictions { get; set; }
    public List<string> PreferredBrands { get; set; }
    public List<string> AvoidedIngredients { get; set; }
    
    // Profile-specific settings
    public ComplianceLevel DefaultComplianceLevel { get; set; }
    public NotificationPreferences NotificationSettings { get; set; }
}
```

#### IFamilyProfileService Interface
```csharp
public interface IFamilyProfileService
{
    Task<List<FamilyProfile>> GetAllProfilesAsync();
    Task<FamilyProfile?> GetActiveProfileAsync();
    Task<FamilyProfile> CreateProfileAsync(FamilyProfile profile);
    Task<FamilyProfile> UpdateProfileAsync(FamilyProfile profile);
    Task DeleteProfileAsync(Guid profileId);
    Task SetActiveProfileAsync(Guid profileId);
    Task<FamilyProfile> DuplicateProfileAsync(Guid sourceProfileId, string newName);
}
```

**Design Rationale**: The family profile system uses a single active profile pattern to simplify the scanning workflow while maintaining complete separation of data between family members. Profile switching is designed to be quick (one-tap) with visual indicators.

### Recommendation Engine

#### Recommendation Model
```csharp
public class ProductRecommendation
{
    public string ProductBarcode { get; set; }
    public string ProductName { get; set; }
    public string Brand { get; set; }
    public RecommendationType Type { get; set; } // Similar, Alternative, Complementary, Trending
    public double ConfidenceScore { get; set; }
    public string Reasoning { get; set; }
    public DateTime GeneratedAt { get; set; }
    public bool IsNew { get; set; }
    public List<string> MatchingPreferences { get; set; }
}

public enum RecommendationType
{
    Similar,        // Similar products to ones user likes
    Alternative,    // Different brands of same product type
    Complementary,  // Products that go well together
    Trending,       // Popular products matching preferences
    Seasonal        // Seasonal products matching preferences
}
```

#### IRecommendationService Interface
```csharp
public interface IRecommendationService
{
    Task<List<ProductRecommendation>> GetRecommendationsAsync(Guid profileId, int count = 10);
    Task<List<ProductRecommendation>> GetSimilarProductsAsync(string barcode, Guid profileId);
    Task<List<ProductRecommendation>> GetAlternativesAsync(string barcode, Guid profileId);
    Task RecordUserFeedbackAsync(string barcode, RecommendationFeedback feedback);
    Task RefreshRecommendationsAsync(Guid profileId);
}
```

**Design Rationale**: The recommendation engine operates on local scan history and preferences to maintain privacy. It uses a scoring algorithm that considers dietary compliance, user preferences, and product similarity. The feedback mechanism allows continuous improvement of recommendations.

### Analytics and Insights

#### Analytics Model
```csharp
public class DietaryAnalytics
{
    public Guid ProfileId { get; set; }
    public DateTimeOffset PeriodStart { get; set; }
    public DateTimeOffset PeriodEnd { get; set; }
    
    // Compliance metrics
    public double ComplianceRate { get; set; }
    public int TotalScans { get; set; }
    public int CompliantProducts { get; set; }
    public int ViolationCount { get; set; }
    
    // Pattern analysis
    public List<CategoryInsight> CategoryBreakdown { get; set; }
    public List<BrandInsight> PreferredBrands { get; set; }
    public List<ViolationPattern> CommonViolations { get; set; }
    public List<NutritionalGap> IdentifiedGaps { get; set; }
    
    // Trends
    public ComplianceTrend WeeklyTrend { get; set; }
    public List<ImprovementSuggestion> Suggestions { get; set; }
}
```

#### IAnalyticsService Interface
```csharp
public interface IAnalyticsService
{
    Task<DietaryAnalytics> GenerateAnalyticsAsync(Guid profileId, TimeSpan period);
    Task<List<ComplianceTrend>> GetComplianceTrendsAsync(Guid profileId, int weeks);
    Task<List<CategoryInsight>> GetCategoryInsightsAsync(Guid profileId);
    Task<AnalyticsExport> ExportDataAsync(Guid profileId, ExportFormat format);
    Task<List<ImprovementSuggestion>> GetPersonalizedSuggestionsAsync(Guid profileId);
}
```

**Design Rationale**: Analytics processing occurs entirely on-device to maintain privacy. The system provides actionable insights rather than just raw data, helping users understand their dietary patterns and make informed improvements.

### Advanced Search and Filtering

#### AdvancedSearchCriteria Model
```csharp
public class AdvancedSearchCriteria
{
    public string? TextQuery { get; set; }
    public List<string> Categories { get; set; } = new();
    public List<string> Brands { get; set; } = new();
    public ComplianceFilter ComplianceFilter { get; set; }
    public NutritionalCriteria? NutritionalLimits { get; set; }
    public List<string> RequiredCertifications { get; set; } = new();
    public List<string> ExcludedIngredients { get; set; } = new();
    public PriceRange? PriceRange { get; set; }
    public bool OnlyAvailableInStores { get; set; }
}

public class NutritionalCriteria
{
    public Range<double>? CaloriesPerServing { get; set; }
    public Range<double>? SodiumMg { get; set; }
    public Range<double>? SugarG { get; set; }
    public Range<double>? FatG { get; set; }
    public Range<double>? ProteinG { get; set; }
}
```

#### IAdvancedSearchService Interface
```csharp
public interface IAdvancedSearchService
{
    Task<SearchResults> SearchProductsAsync(AdvancedSearchCriteria criteria, Guid profileId);
    Task<List<Product>> GetSuggestedProductsAsync(Guid profileId, string category);
    Task<ProductComparison> CompareProductsAsync(List<string> barcodes, Guid profileId);
    Task<ShoppingList> CreateShoppingListAsync(List<string> barcodes, Guid profileId);
    Task<List<Product>> FindAlternativesAsync(string barcode, Guid profileId);
}
```

**Design Rationale**: The advanced search leverages both local cached data and real-time Open Food Facts API queries. Search results are pre-filtered based on the active profile's dietary restrictions to reduce cognitive load on users.

### Custom Restriction Rules

#### CustomRestriction Model
```csharp
public class CustomRestriction
{
    public Guid Id { get; set; }
    public Guid ProfileId { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public RestrictionType Type { get; set; }
    public SeverityLevel Severity { get; set; }
    public bool IsActive { get; set; }
    
    // Rule definition
    public List<IngredientRule> IngredientRules { get; set; }
    public List<NutritionalRule> NutritionalRules { get; set; }
    public List<TemporalRule> TemporalRules { get; set; }
    public int Priority { get; set; } // For conflict resolution
}

public class IngredientRule
{
    public string IngredientPattern { get; set; } // Regex pattern
    public RuleAction Action { get; set; } // Warn, Block, Allow
    public string? AlternativeSuggestion { get; set; }
}

public class TemporalRule
{
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public List<DayOfWeek> ApplicableDays { get; set; }
    public DateTime? ExpirationDate { get; set; }
}
```

**Design Rationale**: Custom restrictions use a rule-based engine that allows complex logic while maintaining performance. Rules are evaluated in priority order with conflict resolution mechanisms to handle overlapping restrictions.

## Data Models

### Enhanced Database Schema

The advanced features extend the existing SQLite database with new tables:

```sql
-- Family Profiles
CREATE TABLE FamilyProfiles (
    Id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    PhotoPath TEXT,
    IsActive INTEGER NOT NULL DEFAULT 0,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    RestrictionsJson TEXT NOT NULL,
    PreferencesJson TEXT NOT NULL
);

-- Product Recommendations
CREATE TABLE ProductRecommendations (
    Id TEXT PRIMARY KEY,
    ProfileId TEXT NOT NULL,
    ProductBarcode TEXT NOT NULL,
    RecommendationType INTEGER NOT NULL,
    ConfidenceScore REAL NOT NULL,
    Reasoning TEXT,
    GeneratedAt TEXT NOT NULL,
    IsViewed INTEGER DEFAULT 0,
    UserFeedback INTEGER, -- Like/Dislike/Neutral
    FOREIGN KEY (ProfileId) REFERENCES FamilyProfiles(Id)
);

-- Analytics Data
CREATE TABLE AnalyticsEvents (
    Id TEXT PRIMARY KEY,
    ProfileId TEXT NOT NULL,
    EventType TEXT NOT NULL,
    EventData TEXT NOT NULL, -- JSON
    Timestamp TEXT NOT NULL,
    FOREIGN KEY (ProfileId) REFERENCES FamilyProfiles(Id)
);

-- Custom Restrictions
CREATE TABLE CustomRestrictions (
    Id TEXT PRIMARY KEY,
    ProfileId TEXT NOT NULL,
    Name TEXT NOT NULL,
    RuleDefinition TEXT NOT NULL, -- JSON
    IsActive INTEGER NOT NULL DEFAULT 1,
    Priority INTEGER NOT NULL DEFAULT 0,
    CreatedAt TEXT NOT NULL,
    FOREIGN KEY (ProfileId) REFERENCES FamilyProfiles(Id)
);

-- Shopping Lists
CREATE TABLE ShoppingLists (
    Id TEXT PRIMARY KEY,
    ProfileId TEXT NOT NULL,
    Name TEXT NOT NULL,
    CreatedAt TEXT NOT NULL,
    UpdatedAt TEXT NOT NULL,
    ItemsJson TEXT NOT NULL,
    FOREIGN KEY (ProfileId) REFERENCES FamilyProfiles(Id)
);
```

### Data Relationships

- **FamilyProfile** → **ScanHistory** (One-to-Many): Each profile maintains its own scan history
- **FamilyProfile** → **CustomRestrictions** (One-to-Many): Profiles can have multiple custom rules
- **FamilyProfile** → **ProductRecommendations** (One-to-Many): Recommendations are profile-specific
- **FamilyProfile** → **AnalyticsEvents** (One-to-Many): Analytics data is tracked per profile

**Design Rationale**: The database design maintains referential integrity while allowing for efficient queries. JSON columns are used for complex nested data that doesn't require relational queries, optimizing for mobile performance.

## Error Handling

### Advanced Features Error Scenarios

#### Family Profile Management Errors
- **Profile Creation Failures**: Handle duplicate names, storage limitations, invalid data
- **Profile Switching Errors**: Manage concurrent access, corrupted profile data
- **Profile Deletion Conflicts**: Prevent deletion of active profiles, handle cascade deletions

#### Recommendation Engine Errors
- **Insufficient Data**: Handle new users with limited scan history
- **API Failures**: Graceful degradation when Open Food Facts is unavailable
- **Performance Issues**: Timeout handling for complex recommendation calculations

#### Analytics Processing Errors
- **Data Corruption**: Validate and repair corrupted analytics data
- **Memory Constraints**: Handle large datasets on resource-limited devices
- **Export Failures**: Manage file system errors during data export

#### Custom Restriction Errors
- **Rule Conflicts**: Detect and resolve conflicting custom rules
- **Invalid Patterns**: Validate regex patterns and provide user feedback
- **Performance Impact**: Monitor and limit complex rule evaluation

### Error Recovery Strategies

```csharp
public class AdvancedFeaturesErrorHandler
{
    public async Task<Result<T>> ExecuteWithFallbackAsync<T>(
        Func<Task<T>> primaryOperation,
        Func<Task<T>> fallbackOperation,
        string operationName)
    {
        try
        {
            var result = await primaryOperation();
            return Result<T>.Success(result);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Primary operation failed for {Operation}, attempting fallback", operationName);
            
            try
            {
                var fallbackResult = await fallbackOperation();
                return Result<T>.Success(fallbackResult);
            }
            catch (Exception fallbackEx)
            {
                _logger.LogError(fallbackEx, "Fallback operation also failed for {Operation}", operationName);
                return Result<T>.Failure($"Operation {operationName} failed: {ex.Message}");
            }
        }
    }
}
```

**Design Rationale**: Error handling follows a graceful degradation pattern where advanced features fail safely without impacting core scanning functionality. Users receive clear feedback about feature availability and alternative actions.

## Testing Strategy

### Unit Testing Approach

#### Family Profile Service Testing
```csharp
[Fact]
public async Task CreateProfileAsync_ValidProfile_ReturnsCreatedProfile()
{
    // Arrange
    var profile = new FamilyProfile 
    { 
        Name = "Test Profile",
        Restrictions = new List<DietaryRestriction> { DietaryRestriction.NutAllergy }
    };
    
    // Act
    var result = await _familyProfileService.CreateProfileAsync(profile);
    
    // Assert
    Assert.NotNull(result);
    Assert.Equal("Test Profile", result.Name);
    Assert.Single(result.Restrictions);
}

[Fact]
public async Task SetActiveProfileAsync_NonExistentProfile_ThrowsNotFoundException()
{
    // Arrange
    var nonExistentId = Guid.NewGuid();
    
    // Act & Assert
    await Assert.ThrowsAsync<ProfileNotFoundException>(
        () => _familyProfileService.SetActiveProfileAsync(nonExistentId));
}
```

#### Recommendation Engine Testing
```csharp
[Fact]
public async Task GetRecommendationsAsync_NewProfile_ReturnsPopularProducts()
{
    // Arrange
    var newProfile = CreateNewProfile();
    
    // Act
    var recommendations = await _recommendationService.GetRecommendationsAsync(newProfile.Id);
    
    // Assert
    Assert.NotEmpty(recommendations);
    Assert.All(recommendations, r => Assert.Equal(RecommendationType.Trending, r.Type));
}
```

### Integration Testing

#### End-to-End Profile Workflow Testing
```csharp
[Fact]
public async Task ProfileWorkflow_CreateSwitchScan_MaintainsDataIsolation()
{
    // Arrange
    var profile1 = await CreateTestProfile("Profile 1", new[] { DietaryRestriction.NutAllergy });
    var profile2 = await CreateTestProfile("Profile 2", new[] { DietaryRestriction.GlutenFree });
    
    // Act - Scan product with profile 1
    await _familyProfileService.SetActiveProfileAsync(profile1.Id);
    var scanResult1 = await _scannerService.ScanProductAsync("123456789");
    
    // Switch to profile 2 and scan same product
    await _familyProfileService.SetActiveProfileAsync(profile2.Id);
    var scanResult2 = await _scannerService.ScanProductAsync("123456789");
    
    // Assert - Different analysis results based on profile
    Assert.NotEqual(scanResult1.ComplianceLevel, scanResult2.ComplianceLevel);
}
```

### Performance Testing

#### Analytics Performance Testing
```csharp
[Fact]
public async Task GenerateAnalyticsAsync_LargeDataset_CompletesWithinTimeLimit()
{
    // Arrange
    var profile = await CreateProfileWithLargeScanHistory(10000); // 10k scans
    
    // Act
    var stopwatch = Stopwatch.StartNew();
    var analytics = await _analyticsService.GenerateAnalyticsAsync(profile.Id, TimeSpan.FromDays(30));
    stopwatch.Stop();
    
    // Assert
    Assert.True(stopwatch.ElapsedMilliseconds < 5000, "Analytics generation took too long");
    Assert.NotNull(analytics);
}
```

**Design Rationale**: Testing strategy focuses on data isolation between profiles, performance under load, and graceful error handling. Integration tests verify that advanced features don't interfere with core scanning functionality.

## Security Considerations

### Data Privacy and Protection

#### Profile Data Encryption
- **Local Storage Encryption**: All family profile data encrypted using device keychain
- **In-Memory Protection**: Sensitive data cleared from memory after use
- **Export Security**: Encrypted exports with user-controlled passwords

#### Analytics Privacy
- **Local Processing**: All analytics computed on-device
- **Anonymization**: Optional community insights use anonymized, aggregated data
- **Data Minimization**: Only necessary data retained for analytics

### Access Control

#### Profile Isolation
```csharp
public class ProfileSecurityService
{
    public async Task<bool> ValidateProfileAccessAsync(Guid profileId, Guid requestingUserId)
    {
        // Ensure users can only access their own profiles
        var profile = await _profileRepository.GetByIdAsync(profileId);
        return profile?.UserId == requestingUserId;
    }
    
    public async Task<List<FamilyProfile>> GetAuthorizedProfilesAsync(Guid userId)
    {
        // Return only profiles the user has access to
        return await _profileRepository.GetByUserIdAsync(userId);
    }
}
```

#### Custom Restriction Security
- **Rule Validation**: Prevent malicious regex patterns that could cause DoS
- **Execution Limits**: Timeout protection for complex rule evaluation
- **Sanitization**: Input sanitization for user-defined restriction names and descriptions

**Design Rationale**: Security follows a defense-in-depth approach with encryption, access controls, and input validation. Privacy is maintained through local processing and minimal data collection.

## Performance Optimization

### Caching Strategies

#### Multi-Level Caching
```csharp
public class AdvancedCacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly ISQLiteCache _persistentCache;
    
    public async Task<T?> GetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null)
    {
        // Level 1: Memory cache
        if (_memoryCache.TryGetValue(key, out T cachedValue))
            return cachedValue;
        
        // Level 2: Persistent cache
        var persistentValue = await _persistentCache.GetAsync<T>(key);
        if (persistentValue != null)
        {
            _memoryCache.Set(key, persistentValue, expiry ?? TimeSpan.FromMinutes(15));
            return persistentValue;
        }
        
        // Level 3: Factory method (API call, computation, etc.)
        var freshValue = await factory();
        if (freshValue != null)
        {
            await _persistentCache.SetAsync(key, freshValue, expiry ?? TimeSpan.FromHours(24));
            _memoryCache.Set(key, freshValue, expiry ?? TimeSpan.FromMinutes(15));
        }
        
        return freshValue;
    }
}
```

### Background Processing

#### Recommendation Pre-computation
```csharp
public class BackgroundRecommendationService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await PrecomputeRecommendationsAsync();
                await Task.Delay(TimeSpan.FromHours(6), stoppingToken); // Update every 6 hours
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background recommendation computation failed");
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken); // Retry after 30 minutes
            }
        }
    }
    
    private async Task PrecomputeRecommendationsAsync()
    {
        var activeProfiles = await _profileService.GetActiveProfilesAsync();
        foreach (var profile in activeProfiles)
        {
            await _recommendationService.RefreshRecommendationsAsync(profile.Id);
        }
    }
}
```

### Database Optimization

#### Indexing Strategy
```sql
-- Optimize profile queries
CREATE INDEX IX_FamilyProfiles_IsActive ON FamilyProfiles(IsActive);
CREATE INDEX IX_FamilyProfiles_UpdatedAt ON FamilyProfiles(UpdatedAt);

-- Optimize recommendation queries
CREATE INDEX IX_ProductRecommendations_ProfileId_GeneratedAt 
ON ProductRecommendations(ProfileId, GeneratedAt DESC);

-- Optimize analytics queries
CREATE INDEX IX_AnalyticsEvents_ProfileId_Timestamp 
ON AnalyticsEvents(ProfileId, Timestamp DESC);
```

**Design Rationale**: Performance optimization focuses on reducing latency for user-facing operations while using background processing for computationally intensive tasks. Caching strategies balance memory usage with response times.

This design document provides a comprehensive foundation for implementing the advanced features while maintaining the existing SMARTIES architecture principles and performance requirements. The modular design allows for incremental implementation and testing of individual features.