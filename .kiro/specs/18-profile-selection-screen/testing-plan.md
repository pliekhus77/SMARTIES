# Testing Plan: Profile Selection Screen
**Created:** October 21, 2025 | **Updated:** October 21, 2025 | **Status:** Draft

## Test Strategy
**Scope:** Profile Selection Screen functionality including profile creation, selection, management, guest mode, accessibility, and navigation integration
**Approach:** Unit (TDD), Integration, BDD, Performance, Security, Accessibility
**Pyramid:** Unit 60%, Integration 25%, BDD/E2E 15%

## Unit Test Scenarios

### ProfileSelectionViewModel
**Happy Path:**
- Given first-time user, When LoadProfilesAsync called, Then IsFirstTimeUser should be true and welcome message displayed
- Given existing profiles, When LoadProfilesAsync called, Then profiles collection should be populated with ProfileDisplayItems
- Given single profile exists, When LoadProfilesAsync called, Then profile should be auto-selected and navigation triggered
- Given multiple profiles, When SelectProfileCommand executed, Then active profile should be set and navigation triggered
- Given valid profile data, When CreateProfileCommand executed, Then new profile should be created and set as active

**Failure Path:**
- Given database error, When LoadProfilesAsync called, Then error should be handled gracefully and empty list returned
- Given network unavailable, When LoadProfilesAsync called, Then cached data should be used
- Given invalid profile data, When CreateProfileCommand executed, Then validation error should be displayed
- Given navigation failure, When SelectProfileCommand executed, Then error dialog should be shown
- Given profile creation failure, When CreateProfileCommand executed, Then error message should be displayed and loading state cleared

**Edge Cases:**
- Given no profiles exist, When LoadProfilesAsync called, Then first-time user flow should be triggered
- Given profile with empty name, When validation performed, Then error should be returned
- Given duplicate profile name, When CreateProfileCommand executed, Then unique name validation should fail
- Given guest mode selected, When ContinueAsGuestCommand executed, Then temporary profile should be created
- Given last profile deletion attempt, When DeleteProfileCommand executed, Then operation should be prevented

**Range/Boundary:**
- Profile name length: empty (invalid), 1 char (valid), 50 chars (valid), 51 chars (invalid)
- Profile count: 0 (first-time), 1 (auto-select), 10 (normal), 100+ (performance test)
- Usage count: 0 (new), 1 (used once), 1000+ (heavy usage)

### UserProfileService Extensions
**Happy Path:**
- Given no profiles in database, When IsFirstTimeUserAsync called, Then should return true
- Given profiles exist in database, When IsFirstTimeUserAsync called, Then should return false
- Given guest profile request, When CreateGuestProfileAsync called, Then temporary profile with no restrictions should be created
- Given profiles exist, When GetProfileDisplayItemsAsync called, Then should return formatted display items with summaries
- Given active profile exists, When GetLastUsedProfileAsync called, Then should return most recently used profile

**Failure Path:**
- Given database connection failure, When IsFirstTimeUserAsync called, Then should throw SQLiteException
- Given corrupted profile data, When GetProfileDisplayItemsAsync called, Then should handle gracefully and skip invalid profiles
- Given no active profile, When GetLastUsedProfileAsync called, Then should return null or default profile
- Given encryption key missing, When profile creation attempted, Then should generate new key and proceed
- Given database locked, When profile operations attempted, Then should retry with exponential backoff

**Edge Cases:**
- Given profile with null dietary restrictions, When GetProfileDisplayItemsAsync called, Then should handle gracefully with empty summary
- Given profile with malformed JSON restrictions, When processing, Then should default to empty restrictions
- Given multiple profiles with same last used time, When GetLastUsedProfileAsync called, Then should return first by ID
- Given temporary profile, When GetProfileDisplayItemsAsync called, Then should exclude from permanent profile list
- Given profile with special characters in name, When processing, Then should handle correctly

**Range/Boundary:**
- Database profile count: 0, 1, 50, 100, 1000+ profiles
- Profile name with Unicode characters, emojis, special symbols
- Dietary restrictions JSON: empty array, single item, 50+ items
- Last used date: today, 1 week ago, 1 year ago, null/default

### ProfileDisplayItem Model
**Happy Path:**
- Given profile with restrictions, When RestrictionSummary generated, Then should show formatted summary
- Given recent usage, When FormattedLastUsed called, Then should return "Today"
- Given profile with emoji avatar, When AvatarEmoji accessed, Then should return correct emoji
- Given profile with multiple restrictions, When RestrictionCount calculated, Then should return accurate count
- Given valid profile data, When ProfileDisplayItem created, Then all properties should be correctly mapped

**Failure Path:**
- Given null profile data, When ProfileDisplayItem created, Then should use default values
- Given invalid date, When FormattedLastUsed called, Then should handle gracefully with fallback
- Given empty restrictions, When RestrictionSummary generated, Then should return "No restrictions"
- Given null avatar emoji, When AvatarEmoji accessed, Then should return default avatar
- Given negative restriction count, When RestrictionCount accessed, Then should return 0

**Edge Cases:**
- Given profile used exactly 7 days ago, When FormattedLastUsed called, Then should return "1 week ago"
- Given profile with only lifestyle preferences, When RestrictionSummary generated, Then should prioritize allergies/medical
- Given profile with very long name, When displayed, Then should handle truncation gracefully
- Given profile never used, When FormattedLastUsed called, Then should return creation date format
- Given profile with all restriction types, When RestrictionSummary generated, Then should show abbreviated summary

**Range/Boundary:**
- Last used time: 0 hours (now), 23 hours (today), 24 hours (yesterday), 7 days (1 week), 30 days (1 month)
- Restriction count: 0, 1, 10, 50+ restrictions
- Profile name length: 1, 20, 50 characters
- Avatar emoji: single emoji, compound emoji, invalid emoji

## Integration Test Scenarios

### Profile Selection to Scanner Navigation
**Happy Path:**
- Given profile selected, When SelectProfileCommand executed, Then should navigate to scanner screen with active profile set
- Given guest mode selected, When ContinueAsGuestCommand executed, Then should create temporary profile and navigate to scanner
- Given first-time user creates profile, When profile creation completed, Then should set as active and navigate to scanner
- Given single profile exists, When app launched, Then should auto-select profile and navigate directly to scanner
- Given profile switcher accessed from main app, When profile selected, Then should update active profile and return to previous screen

**Failure Path:**
- Given navigation service unavailable, When profile selection attempted, Then should show error and remain on selection screen
- Given scanner screen not available, When navigation attempted, Then should show error dialog with retry option
- Given profile service failure, When profile selection attempted, Then should show error and allow retry
- Given database locked during navigation, When profile selection attempted, Then should wait and retry
- Given app state corrupted, When navigation attempted, Then should reset to safe state

### Database Persistence Integration
**Happy Path:**
- Given new profile created, When app restarted, Then profile should persist and be available for selection
- Given profile selected as active, When app restarted, Then same profile should be active
- Given profile deleted, When app restarted, Then profile should not appear in list
- Given guest profile created, When app restarted, Then guest profile should not persist
- Given profile updated, When app restarted, Then changes should be reflected in profile list

**Failure Path:**
- Given database corruption, When app launched, Then should attempt recovery or reset to clean state
- Given insufficient storage, When profile creation attempted, Then should show storage error
- Given database migration failure, When app updated, Then should handle gracefully with fallback
- Given concurrent access conflict, When multiple operations attempted, Then should serialize operations
- Given encryption key lost, When profile access attempted, Then should prompt for profile recreation

### Service Layer Integration
**Happy Path:**
- Given UserProfileService and NavigationService, When profile operations performed, Then services should coordinate correctly
- Given ProfileSelectionViewModel and services, When commands executed, Then should update UI state appropriately
- Given multiple services, When error occurs in one service, Then others should continue functioning
- Given service dependencies, When initialization performed, Then all services should be properly configured
- Given service lifecycle, When app suspended/resumed, Then services should maintain state correctly

**Failure Path:**
- Given service initialization failure, When app launched, Then should show error and provide recovery options
- Given service communication failure, When operations attempted, Then should handle gracefully with fallbacks
- Given service timeout, When long operations performed, Then should provide user feedback and cancellation
- Given service memory pressure, When operations performed, Then should optimize resource usage
- Given service dependency missing, When operations attempted, Then should fail gracefully with clear error

## BDD Scenarios

```gherkin
Feature: Profile Selection Screen
  As a SMARTIES user
  I want to select or create my dietary profile
  So that I can receive personalized dietary compliance checking

  Background:
    Given the SMARTIES app is installed on the device
    And the app has been launched

  Scenario: First-time user creates profile
    Given I am a first-time user with no existing profiles
    When I open the SMARTIES app
    Then I should see the welcome screen with "Welcome to SMARTIES!" message
    And I should see a "Create My Profile" button
    And I should see a "Continue as Guest" button
    And I should see a privacy notice about local data storage
    When I tap "Create My Profile"
    Then I should be navigated to the profile creation flow
    When I complete the profile creation with name "John Doe" and allergies "Peanuts, Milk"
    Then my profile should be saved locally
    And I should be navigated to the scanner screen
    And "John Doe" should be set as the active profile

  Scenario: Returning user selects existing profile
    Given I have existing profiles "Alice", "Bob", and "Charlie"
    And "Alice" was the last used profile
    When I open the SMARTIES app
    Then I should see the profile selection screen
    And I should see a list of profiles with "Alice", "Bob", and "Charlie"
    And "Alice" should be highlighted as the last used profile
    When I tap on "Bob" profile
    Then "Bob" should be set as the active profile
    And I should be navigated to the scanner screen within 1 second

  Scenario: Single profile user auto-selection
    Given I have only one profile "Sarah"
    When I open the SMARTIES app
    Then "Sarah" should be automatically selected as the active profile
    And I should be navigated directly to the scanner screen
    And I should not see the profile selection screen

  Scenario: Guest mode usage
    Given I am on the profile selection screen
    When I tap "Continue as Guest"
    Then a temporary guest profile should be created
    And I should be navigated to the scanner screen
    And I should see a banner indicating "Guest Mode - Limited functionality"
    When I scan 3 products
    Then I should be prompted to create a permanent profile
    When I close the app and reopen it
    Then the guest profile should not persist
    And I should see the profile selection screen again

  Scenario: Multiple profile management
    Given I have existing profiles "Mom", "Dad", and "Kid"
    When I am on the profile selection screen
    Then I should see all three profiles with their dietary restriction summaries
    And I should see an "Add New Profile" button
    When I tap "Add New Profile"
    Then I should be navigated to the profile creation flow
    When I long-press on "Kid" profile
    Then I should see options to "Edit" or "Delete" the profile
    When I select "Delete"
    Then I should see a confirmation dialog
    When I confirm deletion
    Then "Kid" profile should be removed from the list

  Scenario: Profile switching from main app
    Given I am on the scanner screen with "Alice" as active profile
    When I access the profile switcher from the navigation menu
    Then I should see the profile selection screen as an overlay
    And I should see my recent profiles "Alice", "Bob", "Charlie"
    When I select "Bob"
    Then "Bob" should become the active profile
    And I should return to the scanner screen
    And the profile name in the header should update to "Bob"

  Scenario: Accessibility support
    Given I have VoiceOver enabled on my device
    When I navigate to the profile selection screen
    Then all interactive elements should have semantic labels
    And I should be able to navigate using VoiceOver gestures
    When I select a profile using VoiceOver
    Then I should hear audio feedback confirming the selection
    And the focus should move logically through the interface

  Scenario: Error handling and recovery
    Given I am on the profile selection screen
    When a database error occurs during profile loading
    Then I should see an error message "Unable to load profiles. Please restart the app."
    And I should see a "Retry" button
    When I tap "Retry"
    Then the app should attempt to reload the profiles
    When profile creation fails due to storage issues
    Then I should see an error message "Failed to create profile. Please try again."
    And I should remain on the profile creation screen

  Scenario: Privacy and data protection
    Given I am on the profile selection screen
    Then I should see a privacy notice stating "All your dietary information stays on your device"
    When I create a new profile with sensitive dietary information
    Then the data should be encrypted using device keychain
    And no data should be transmitted to external servers
    When I uninstall the app
    Then all profile data should be completely removed from the device
```

## Test Data

### Test Data Sets
**Happy Path Data:**
- Profile names: "John Doe", "Alice Smith", "Bob Johnson", "Sarah Wilson"
- Dietary restrictions: Single allergy, multiple allergies, religious + medical, lifestyle only
- Usage patterns: Daily user, weekly user, new user, heavy user
- Avatar emojis: Standard emojis, compound emojis, diverse representation

**Invalid Data:**
- Profile names: Empty string, null, whitespace only, extremely long names
- Corrupted JSON: Malformed dietary restrictions, missing properties
- Invalid dates: Null dates, future dates, invalid date formats
- Database states: Corrupted database, missing tables, locked database

**Edge Case Data:**
- Boundary values: Exactly 50 character names, maximum restriction counts
- Special characters: Unicode names, emoji in names, special symbols
- Time boundaries: Profiles used exactly at day/week/month boundaries
- System states: Low memory, low storage, background app refresh disabled

**Performance Data:**
- Large datasets: 100+ profiles, 1000+ scans per profile
- Complex restrictions: 50+ dietary restrictions per profile
- Heavy usage: Profiles with years of usage history
- Concurrent operations: Multiple profile operations simultaneously

### Test Data Management
**Location:** `SMARTIES.MAUI.Tests/TestData/ProfileSelectionTestData.cs`
**Generation Method:** Builder pattern with fluent API for test data creation
**Cleanup Strategy:** Automatic cleanup after each test using test database

```csharp
public class ProfileTestDataBuilder
{
    public static UserProfile CreateBasicProfile(string name = "Test User")
    public static UserProfile CreateProfileWithAllergies(params string[] allergies)
    public static UserProfile CreateGuestProfile()
    public static List<UserProfile> CreateMultipleProfiles(int count)
    public static UserProfile CreateProfileWithUsageHistory(int scanCount, DateTime lastUsed)
}
```

## Coverage Goals
**Overall:** 80% | **Critical:** 100% | **Public APIs:** 100% | **Business Logic:** 90%+

### Critical Path Coverage (100%)
- Profile selection and activation logic
- Navigation between profile selection and scanner
- Guest mode creation and cleanup
- Database persistence operations
- Error handling for critical failures

### High Priority Coverage (90%+)
- Profile creation and validation
- Profile management operations (edit, delete)
- Accessibility features and semantic labeling
- Privacy and security implementations
- Service integration and coordination

### Standard Coverage (80%+)
- UI formatting and display logic
- Animation and visual feedback
- Performance optimization code
- Logging and diagnostics
- Configuration and setup code

## Risk Assessment

### High-Risk Areas (Extra Testing Needed)
**Profile Data Persistence:** Critical for user experience - extensive database testing required
- Test scenarios: Database corruption, migration failures, concurrent access
- Mitigation: Comprehensive integration tests, database recovery mechanisms

**Navigation Flow Integration:** Core user journey - must work flawlessly
- Test scenarios: Navigation failures, state corruption, memory pressure
- Mitigation: End-to-end BDD tests, navigation service mocking

**Guest Mode Cleanup:** Privacy requirement - temporary data must not persist
- Test scenarios: App crashes during guest mode, background app refresh
- Mitigation: Automated cleanup verification, session management testing

**Accessibility Compliance:** Legal requirement - must work with assistive technologies
- Test scenarios: Screen reader navigation, high contrast mode, dynamic text
- Mitigation: Automated accessibility testing, manual testing with real assistive technologies

**Multi-Profile Concurrency:** Data integrity risk - profile operations must be thread-safe
- Test scenarios: Simultaneous profile operations, rapid profile switching
- Mitigation: Concurrency testing, database transaction management

### Priorities
**P1 (Must):** Profile selection, navigation, data persistence, guest mode, accessibility
**P2 (Should):** Profile management, error handling, performance optimization, security
**P3 (Nice to have):** Advanced animations, detailed analytics, extended customization

### Testing Strategy by Risk Level
**High Risk:** Unit + Integration + BDD + Manual testing
**Medium Risk:** Unit + Integration + Automated UI testing  
**Low Risk:** Unit testing + Code review

## Test Execution Strategy

### Development Phase (TDD)
1. Write failing unit test for specific requirement
2. Implement minimal code to pass test
3. Refactor while keeping tests green
4. Repeat for each acceptance criteria

### Integration Phase
1. Test service interactions and database operations
2. Verify navigation flows and state management
3. Test error scenarios and recovery mechanisms
4. Validate performance under load

### System Testing Phase
1. Execute BDD scenarios end-to-end
2. Perform accessibility testing with assistive technologies
3. Conduct security testing for data protection
4. Run performance tests with realistic data volumes

### Pre-Release Phase
1. Full regression test suite execution
2. Device-specific testing (Android, Windows)
3. Accessibility compliance verification
4. Performance benchmarking and optimization

This comprehensive testing plan ensures the Profile Selection Screen meets all requirements while maintaining high quality, accessibility, and performance standards.