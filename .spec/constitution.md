# SMARTIES Constitution

**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2025-10-17

## Purpose

This constitution establishes the foundational principles, technical standards, and quality requirements for SMARTIES (Scan‑based Mobile Allergen Risk Tracking & IntelligencE Suite) development.

## Core Mission

Empower users to make safe dietary choices instantly through barcode scanning with real-time compliance alerts for allergies, religious restrictions, medical conditions, and lifestyle preferences.

## Safety-First Principles

### 1. Zero Critical Misses
- No false negatives for severe allergies (FDA Top 14)
- Fail-safe defaults when data is uncertain
- Explicit warnings for incomplete product data
- Strict mode for allergies/medical (any violation = red alert)

### 2. Performance Requirements
- Barcode recognition: <1 second target, <2 seconds critical
- Product lookup: <2 seconds cached, <5 seconds API
- AI analysis: <3 seconds target, <5 seconds critical
- App launch: <2 seconds to scanner ready
- Battery impact: <5% drain per hour active scanning

### 3. Alert System
- 🔴 Red: Violation/Danger - Critical restrictions violated
- 🟡 Yellow: Caution - Possible risk or data uncertainty  
- 🟢 Green: Safe - Compliant with all user restrictions

## Technical Architecture Standards

### Required Technology Stack
- **Mobile Framework**: .NET MAUI 8.0 + C# 12 cross-platform
- **MVVM Pattern**: CommunityToolkit.Mvvm with proper separation
- **Local Storage**: SQLite-net-pcl with device keychain encryption
- **Barcode Scanning**: ZXing.Net.Maui for cross-platform scanning
- **Product Data**: Open Food Facts API (direct HTTP calls)
- **AI Analysis**: OpenAI/Anthropic APIs for dietary compliance
- **Offline-First**: Core safety features work without network

### Project Structure (Non-Negotiable)
```
SMARTIES.MAUI/
├── Models/              # Product, UserProfile, DietaryAnalysis
├── Services/            # OpenFoodFacts, DietaryAnalysis, UserProfile, ProductCache, Barcode
├── ViewModels/          # Scanner, Profile, History, ProductDetail
├── Views/               # XAML pages with accessibility support
├── Platforms/           # Android/Windows platform-specific code
└── Resources/           # Icons, fonts, styles, localization
```

### Code Quality Standards
- C# 12 with nullable reference types enabled
- Async/await patterns consistently applied
- Interface-based dependency injection
- >80% test coverage for critical paths (100% for safety logic)
- Static analysis compliance with .NET analyzers
- Accessibility (WCAG 2.1 AA) compliance mandatory

## Implementation Patterns (Mandatory)

### MVVM Pattern Implementation
```csharp
// ViewModels must use CommunityToolkit.Mvvm
[ObservableObject]
public partial class ScannerViewModel
{
    [ObservableProperty]
    private bool isScanning;
    
    [ObservableProperty] 
    private Product? currentProduct;
    
    [RelayCommand]
    private async Task ScanBarcodeAsync()
    {
        // Implementation with proper error handling
    }
}
```

### Error Handling Pattern (Required)
```csharp
// Result pattern (mandatory for all service methods)
public record Result<T>(bool IsSuccess, T? Value, string? Error)
{
    public static Result<T> Success(T value) => new(true, value, null);
    public static Result<T> Failure(string error) => new(false, default, error);
}
```

### API Integration Patterns

#### Open Food Facts Integration
```csharp
public class OpenFoodFactsService : IOpenFoodFactsService
{
    private const string BaseUrl = "https://world.openfoodfacts.org/api/v2/product";
    
    public async Task<Product?> GetProductAsync(string barcode, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/{NormalizeBarcode(barcode)}.json";
        var response = await _httpClient.GetAsync(url, ct);
        
        if (!response.IsSuccessStatusCode) return null;
        
        var json = await response.Content.ReadAsStringAsync(ct);
        var apiResponse = JsonSerializer.Deserialize<OpenFoodFactsResponse>(json);
        
        return apiResponse?.Status == 1 ? MapToProduct(apiResponse.Product) : null;
    }
}
```

## Dietary Coverage & Business Rules

### Comprehensive Dietary Analysis
- **Allergies**: FDA Top 14 (Milk, Eggs, Fish, Shellfish, TreeNuts, Peanuts, Wheat, Soybeans, Sesame, Sulfites, Mustard, Celery, Lupin, Molluscs)
- **Religious**: Halal, Kosher, Hindu vegetarian, Jain, Buddhist
- **Medical**: Diabetes, Hypertension, Celiac, Kidney Disease, Heart Disease
- **Lifestyle**: Vegan, Vegetarian, Keto, Paleo, Organic-only, Non-GMO

### Compliance Logic Priority
1. **Certified Labels** (Halal/Kosher symbols) override ingredient analysis
2. **Allergen Warnings** take precedence over lifestyle preferences
3. **Medical Restrictions** cannot be overridden by user
4. **Cross-Contamination** warnings for manufacturing facilities
5. **Ingredient Hierarchy**: Base ingredients → additives → processing aids

## Security & Privacy (SABSA-Based)

### Defense in Depth
- **Local Encryption**: User profiles encrypted with device keychain
- **Data Minimization**: Only necessary restrictions and recent scans stored
- **No Backend**: Privacy by design - no user data on our servers
- **HTTPS Only**: All API communications encrypted (TLS 1.2+)
- **Input Validation**: Whitelist approach, sanitize all outputs

### Threat Mitigation (STRIDE)
- **Spoofing**: Device-based authentication, no remote user accounts
- **Tampering**: SQLite integrity checks, API response validation
- **Repudiation**: Local audit logging for safety-critical actions
- **Information Disclosure**: Encrypted local storage, no PII in logs
- **Denial of Service**: Offline core functionality, API rate limiting
- **Elevation of Privilege**: Minimal permissions, secure API key storage

## Testing Strategy (TDD/BDD Required)

### Mandatory Testing Artifacts
- **testing-plan.md**: Required for every feature specification
- **Unit Tests**: TDD Red-Green-Refactor for all services/ViewModels
- **Integration Tests**: API interactions and database operations
- **BDD Tests**: Gherkin scenarios for user acceptance criteria

### Critical Path Testing (100% Coverage)
- Barcode scanning → product lookup → dietary analysis → warning display
- Edge cases: Unknown products, network failures, corrupted barcodes
- Performance: Scan speed, memory usage, battery impact
- Accessibility: Screen reader compatibility, high contrast mode

## Quality Gates (Build Blockers)

- [ ] All unit tests pass (>80% coverage, 100% for safety logic)
- [ ] Integration tests pass (API and database)
- [ ] BDD scenarios pass (user acceptance)
- [ ] Security scans pass (SAST/dependency scanning)
- [ ] Performance benchmarks met (<3s scan-to-result)
- [ ] Accessibility validation complete (screen reader testing)
- [ ] Architecture tests pass (NetArchTest layer validation)

## Compliance Requirements

### Regulatory Standards
- **FDA**: Allergen labeling accuracy (>99% detection rate)
- **GDPR**: Right to deletion, data portability, consent management
- **WCAG 2.1 AA**: Full accessibility compliance
- **Privacy**: Local-only data storage, no user tracking

### Success Metrics
- **Safety**: >99% allergen detection, >95% lifestyle accuracy
- **Performance**: <3 seconds scan-to-result average
- **Engagement**: 70% retention after 30 days, 3-5 scans per session
- **Quality**: >4.5 app store rating, <0.1% crash rate

## Anti-Patterns & Violations

### Prohibited Practices
❌ Hardcoded secrets or API keys in source code  
❌ Blocking async calls with .Result or .Wait()  
❌ Business logic in ViewModels or Views  
❌ Direct database access from ViewModels  
❌ Missing input validation or sanitization  
❌ False negatives for critical allergen detection  

### Required Practices
✅ Interface-based dependency injection  
✅ Proper error handling with user-friendly messages  
✅ Offline-first architecture for core safety features  
✅ Comprehensive logging for debugging and monitoring  
✅ Test-driven development with comprehensive coverage  

## Governance

### Amendment Process
1. Propose changes via GitHub issue with `constitution` label
2. Technical review by architecture team
3. Stakeholder approval required for principle changes
4. Version increment and changelog update

### Enforcement
- Automated checks in CI/CD pipeline
- Code review requirements
- Architecture decision records (ADRs) for deviations
- Regular compliance audits

---

**This constitution is the foundational governance document for SMARTIES development. All technical decisions must align with these principles to ensure user safety, technical excellence, and regulatory compliance.**
