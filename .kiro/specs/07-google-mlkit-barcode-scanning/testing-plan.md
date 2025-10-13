# Testing Plan: Google ML Kit Barcode Scanning
**Created:** December 10, 2025 | **Updated:** December 10, 2025 | **Status:** Draft

## Test Strategy
**Scope:** Google ML Kit barcode scanning implementation with Open Food Facts API integration, caching, offline functionality, and accessibility features
**Approach:** Unit (TDD), Integration, BDD, Performance, Security, Accessibility
**Pyramid:** Unit 60%, Integration 30%, BDD/E2E 10%

## Unit Test Scenarios

### BarcodeDetectionService
**Happy Path:**
- Given a valid EAN-13 barcode "1234567890123" When validateBarcode is called Then return isValid=true and normalizedCode="1234567890123"
- Given a valid UPC-A barcode "123456789012" When normalizeBarcode is called Then return "0123456789012" (13-digit format)
- Given an EAN-8 barcode "12345678" When normalizeBarcode is called Then return "0000012345678"
- Given a valid barcode When calculateCheckDigit is called Then return true for correct check digit

**Failure Path:**
- Given an invalid barcode "abc123" When validateBarcode is called Then return isValid=false with appropriate error
- Given a barcode with invalid check digit When validateBarcode is called Then return isValid=false
- Given null/undefined input When validateBarcode is called Then throw ValidationError
- Given barcode with unsupported format When validateBarcode is called Then return format=UNKNOWN

**Edge Cases:**
- Given barcode with leading/trailing spaces When normalizeBarcode is called Then return trimmed and normalized result
- Given barcode shorter than minimum length When validateBarcode is called Then return isValid=false
- Given barcode longer than maximum length When validateBarcode is called Then return isValid=false
- Given empty string When validateBarcode is called Then return isValid=false

**Range/Boundary:**
- Test barcode lengths: 7 digits (invalid), 8 digits (EAN-8), 12 digits (UPC-A), 13 digits (EAN-13), 14 digits (invalid)
- Test check digit calculation with edge values: 0, 9, boundary cases

### ProductLookupService
**Happy Path:**
- Given valid barcode "1234567890123" When lookupProduct is called Then return success=true with product data
- Given valid API response with status=1 When parseResponse is called Then extract product name, ingredients, allergens
- Given proper configuration When buildUserAgent is called Then return "SMARTIES - React Native - Version X.X - https://smarties.app - scan"
- Given normalized barcode When buildApiUrl is called Then return "https://world.openfoodfacts.org/api/v2/product/1234567890123.json"

**Failure Path:**
- Given network timeout When lookupProduct is called Then return status=network_error with retry suggestion
- Given API response with status=0 When parseResponse is called Then return status=not_found
- Given malformed API response When parseResponse is called Then throw ParseError
- Given 500 server error When lookupProduct is called Then return status=server_error

**Edge Cases:**
- Given API response missing product_name When parseResponse is called Then handle gracefully with default values
- Given API response with null ingredients When parseResponse is called Then return empty ingredients array
- Given very large API response When parseResponse is called Then handle without memory issues
- Given special characters in product data When parseResponse is called Then properly encode/decode

**Range/Boundary:**
- Test API timeout values: 1s (too short), 5s (normal), 30s (too long), 0s (invalid)
- Test retry attempts: 0 (no retry), 3 (normal), 10 (excessive), -1 (invalid)

### ProductCacheService
**Happy Path:**
- Given valid product data When cacheProduct is called Then store with TTL and return success
- Given cached product within TTL When getCachedProduct is called Then return cached data
- Given 50 cached products When cacheProduct is called Then store successfully
- Given cache with expired entries When clearExpiredCache is called Then remove only expired entries

**Failure Path:**
- Given corrupted cache data When getCachedProduct is called Then return null and log error
- Given storage quota exceeded When cacheProduct is called Then evict oldest entries using LRU
- Given invalid product data When cacheProduct is called Then throw ValidationError
- Given storage permission denied When cacheProduct is called Then throw StorageError

**Edge Cases:**
- Given cache at exactly 100 products When cacheProduct is called Then evict oldest entry first
- Given product cached exactly 7 days ago When getCachedProduct is called Then trigger refresh
- Given cache corruption during read When getCachedProduct is called Then rebuild cache gracefully
- Given concurrent cache operations When multiple cacheProduct calls occur Then handle race conditions

**Range/Boundary:**
- Test cache sizes: 0 products, 1 product, 99 products, 100 products (limit), 101 products (overflow)
- Test TTL values: 0 days (immediate expiry), 7 days (normal), 30 days (extended), negative values (invalid)

## Integration Test Scenarios

### Camera and ML Kit Integration
**Happy Path:**
- Given camera permissions granted When CameraView initializes Then display camera preview with ML Kit enabled
- Given barcode in camera view When ML Kit detects barcode Then trigger onBarcodeDetected callback
- Given successful barcode detection When feedback is triggered Then provide haptic, audio, and visual feedback
- Given torch toggle When user taps torch button Then enable/disable device flashlight

**Failure Path:**
- Given camera permissions denied When CameraView initializes Then show permission request dialog
- Given camera hardware failure When CameraView initializes Then fallback to manual entry
- Given ML Kit initialization failure When barcode detection starts Then show error and fallback options
- Given low light conditions When scanning fails repeatedly Then suggest torch activation

### API and Cache Integration
**Happy Path:**
- Given cache miss When product lookup occurs Then call API and cache result
- Given cache hit within TTL When product lookup occurs Then return cached data without API call
- Given successful API response When caching occurs Then store with proper TTL and metadata
- Given offline mode with cache hit When product lookup occurs Then return cached data with offline indicator

**Failure Path:**
- Given API failure with cache miss When product lookup occurs Then show "product not found" with manual entry option
- Given API failure with expired cache When product lookup occurs Then return stale cache data with warning
- Given cache corruption When product lookup occurs Then clear cache and retry API call
- Given storage full When caching occurs Then evict oldest entries and retry

## BDD Scenarios

```gherkin
Feature: Barcode Scanning with Google ML Kit
  As a user with dietary restrictions
  I want to scan product barcodes quickly and accurately
  So that I can immediately know if products are safe for me

Scenario: Successful barcode scan with product found
  Given I am on the scan screen
  And the camera is active with ML Kit enabled
  When I point the camera at a valid barcode "1234567890123"
  And ML Kit detects the barcode
  Then I should feel haptic feedback
  And I should hear an audio confirmation
  And I should see the viewfinder flash green
  And the system should lookup the product in Open Food Facts
  And I should see the product analysis result screen

Scenario: Barcode scan with product not found
  Given I am on the scan screen
  And the camera is active
  When I scan a barcode "9999999999999" that doesn't exist in Open Food Facts
  Then I should see a "Product Not Found" screen
  And I should see a "Be the first to add this product!" button
  When I tap the add product button
  Then I should see the Open Food Facts contribution form
  And the barcode field should be pre-populated with "9999999999999"

Scenario: Offline scanning with cached product
  Given I am offline
  And I have previously scanned barcode "1234567890123"
  And the product is cached locally
  When I scan the same barcode "1234567890123"
  Then I should see the cached product information
  And I should see an offline indicator
  And the dietary analysis should work with cached data

Scenario: Manual barcode entry fallback
  Given I am on the scan screen
  And the camera cannot read a damaged barcode
  When I tap "Enter barcode manually"
  Then I should see a manual entry modal
  When I enter "1234567890123" and tap submit
  Then the system should process it like a scanned barcode
  And I should see the product analysis result

Scenario: Accessibility support for screen readers
  Given I have VoiceOver enabled on iOS
  And I am on the scan screen
  When the camera view loads
  Then I should hear "Camera ready for barcode scanning"
  When a barcode is detected
  Then I should hear "Barcode detected, processing product information"
  When the result is ready
  Then I should hear the product safety status announcement
```

## Test Data

### Happy Path Data Sets
```typescript
const validBarcodes = [
  { raw: "1234567890123", format: "EAN-13", normalized: "1234567890123" },
  { raw: "123456789012", format: "UPC-A", normalized: "0123456789012" },
  { raw: "12345678", format: "EAN-8", normalized: "0000012345678" },
  { raw: "123456", format: "UPC-E", normalized: "0000000123456" }
];

const mockProductResponse = {
  code: "1234567890123",
  status: 1,
  product: {
    product_name: "Test Product",
    ingredients_text: "Water, Sugar, Salt",
    allergens: "May contain traces of nuts",
    image_front_url: "https://example.com/image.jpg",
    nutriscore_grade: "a"
  }
};
```

### Invalid/Edge Case Data Sets
```typescript
const invalidBarcodes = [
  { raw: "", error: "Empty barcode" },
  { raw: "abc123", error: "Invalid characters" },
  { raw: "123", error: "Too short" },
  { raw: "12345678901234567890", error: "Too long" },
  { raw: "1234567890124", error: "Invalid check digit" }
];

const errorResponses = [
  { status: 0, message: "Product not found" },
  { status: 500, message: "Server error" },
  { timeout: true, message: "Network timeout" },
  { malformed: true, message: "Invalid JSON response" }
];
```

### Performance Test Data
```typescript
const performanceTestData = {
  largeCacheDataset: Array.from({length: 100}, (_, i) => ({
    barcode: `123456789012${i.toString().padStart(1, '0')}`,
    product: mockProductResponse.product,
    cachedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // Spread over 100 days
  })),
  
  rapidScanSequence: [
    "1234567890123", "2345678901234", "3456789012345", 
    "4567890123456", "5678901234567"
  ]
};
```

## Test Data Management
**Location:** `tests/fixtures/` directory with TypeScript interfaces
**Generation:** Test data builders with fluent API for creating mock objects
**Cleanup:** Automatic cleanup of test cache and storage after each test suite

## Coverage Goals
- **Overall:** 85% line coverage minimum
- **Critical Path:** 100% coverage (barcode detection, API integration, dietary analysis flow)
- **Public APIs:** 100% coverage (all service interfaces)
- **Business Logic:** 95% coverage (validation, caching, error handling)
- **UI Components:** 80% coverage (camera view, manual entry, accessibility)

## Risk Assessment

### High-Risk Areas (Extra Testing Required)
1. **Barcode Detection Accuracy:** False positives/negatives could impact user safety
2. **API Integration Reliability:** Network failures must not break core functionality
3. **Cache Data Integrity:** Corrupted cache could serve incorrect product information
4. **Accessibility Compliance:** Screen reader users must have full functionality
5. **Performance Under Load:** Memory leaks during continuous scanning sessions

### Test Priorities
- **P1 (Must):** Barcode detection accuracy, API error handling, cache integrity, accessibility
- **P2 (Should):** Performance optimization, offline functionality, manual entry fallback
- **P3 (Nice to have):** Advanced error recovery, detailed analytics, edge case handling

## Testing Tools and Frameworks

### Unit Testing Stack
- **Jest:** Primary testing framework for React Native
- **React Native Testing Library:** Component testing utilities
- **MSW (Mock Service Worker):** API mocking for integration tests
- **Jest Native:** Additional React Native specific matchers

### BDD Testing Stack
- **Detox:** End-to-end testing for React Native apps
- **Cucumber.js:** Gherkin feature file execution
- **Appium:** Cross-platform mobile automation (if needed)

### Performance Testing Tools
- **Flipper:** React Native performance profiling
- **React DevTools Profiler:** Component performance analysis
- **Custom Performance Monitors:** Scan speed and memory usage tracking

### Accessibility Testing Tools
- **@testing-library/jest-native:** Accessibility testing utilities
- **React Native Accessibility Inspector:** Manual accessibility validation
- **Automated Accessibility Testing:** Integration with CI/CD pipeline

## Test Execution Strategy

### Local Development
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run BDD tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run performance tests
npm run test:performance
```

### CI/CD Pipeline Integration
- **Commit:** Unit tests (fast feedback, <2 minutes)
- **Pull Request:** Unit + Integration tests + coverage report
- **Merge to Main:** Full test suite including BDD scenarios
- **Nightly:** Performance tests + accessibility validation + security scans

### Test Environment Management
- **Development:** Mock all external services, use test data
- **Staging:** Real Open Food Facts API, test cache, simulated network conditions
- **Production:** Synthetic monitoring, real user monitoring, error tracking

## Failure Handling and Reporting

### Test Failure Policy
- **Any unit test failure:** Build fails, must fix before merge
- **Coverage below 85%:** Build fails, must add tests
- **BDD scenario failure:** Investigation required, may block release
- **Performance regression:** Alert team, investigate before release

### Test Reporting
- **Coverage Reports:** HTML reports with line-by-line coverage
- **Performance Metrics:** Scan speed, memory usage, battery impact trends
- **Accessibility Reports:** WCAG compliance validation results
- **Flaky Test Tracking:** Identify and fix unreliable tests

## Continuous Improvement

### Test Maintenance
- **Weekly:** Review flaky tests and fix or remove
- **Monthly:** Update test data and mock responses
- **Quarterly:** Review coverage goals and testing strategy
- **Per Release:** Add regression tests for bug fixes

### Metrics and KPIs
- **Test Execution Time:** Target <5 minutes for full suite
- **Test Reliability:** <1% flaky test rate
- **Coverage Trends:** Maintain or improve coverage over time
- **Bug Escape Rate:** <5% of bugs found in production vs testing

## Summary

This comprehensive testing plan ensures the Google ML Kit barcode scanning feature meets all quality, performance, and accessibility requirements. The combination of unit tests (TDD), integration tests, and BDD scenarios provides confidence in the implementation while the performance and accessibility testing ensures a world-class user experience.

**Key Testing Principles:**
1. **Safety First:** Comprehensive testing of barcode detection accuracy and dietary analysis
2. **User Experience:** Performance testing ensures sub-3-second response times
3. **Accessibility:** Full screen reader and keyboard navigation support
4. **Reliability:** Robust error handling and offline functionality
5. **Maintainability:** Clear test structure and comprehensive coverage

**Golden Rule:** If it's not tested, it's broken. Every critical path must have automated test coverage to ensure user safety and application reliability.