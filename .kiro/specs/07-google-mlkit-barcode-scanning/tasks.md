# Implementation Plan

- [x] 1. Set up Google ML Kit dependencies and project configuration
  - Install react-native-ml-kit and required native dependencies for barcode scanning
  - Configure Android and iOS native modules for Google ML Kit integration
  - Set up camera permissions in platform-specific configuration files
  - Create TypeScript type definitions for ML Kit barcode detection interfaces
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 2. Implement core barcode detection service
  - [x] 2.1 Create BarcodeDetectionService with Google ML Kit integration
    - Write service class with ML Kit barcode detector initialization
    - Implement barcode format detection for EAN-8, EAN-13, UPC-A, UPC-E formats
    - Add barcode validation logic with check digit calculation
    - Create barcode normalization function for 13-digit format with leading zeros
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Add barcode validation and error handling
    - Implement check digit validation algorithm for different barcode formats
    - Create error classification system for invalid barcodes and detection failures
    - Add barcode format recognition and conversion logic
    - Write validation result interfaces with detailed error information
    - _Requirements: 4.2, 4.3, 4.4_

  - [x] 2.3 Write unit tests for barcode detection and validation
    - Create test cases for barcode format detection and normalization
    - Test check digit validation with valid and invalid barcodes
    - Mock ML Kit responses for different barcode scenarios
    - Test error handling for malformed and unsupported barcodes
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Create camera view component with ML Kit integration
  - [x] 3.1 Build CameraView component with viewfinder overlay
    - Create React Native camera component with ML Kit barcode detection
    - Implement semi-transparent overlay with rectangular cutout for barcode targeting
    - Add continuous auto-focus and tap-to-focus functionality
    - Create viewfinder animation and visual feedback for barcode detection
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.3_

  - [x] 3.2 Implement immediate feedback system for barcode detection
    - Add haptic feedback (vibration) when barcode is successfully detected
    - Implement audio cue (beep sound) for successful barcode scanning
    - Create visual confirmation with viewfinder box animation (flash green)
    - Add loading indicator display during product data processing
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Add torch control and low-light handling
    - Implement manual torch toggle button with proper state management
    - Add ambient light detection for automatic torch suggestions
    - Create low-light guidance messages and user interface elements
    - Handle torch state persistence and cleanup on component unmount
    - _Requirements: 1.5, 3.2_

  - [x] 3.4 Write component tests for camera functionality
    - Test camera initialization and permission handling
    - Mock ML Kit barcode detection events and verify component responses
    - Test viewfinder overlay rendering and animation states
    - Verify torch control functionality and state management
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4. Implement Open Food Facts API integration service
  - [x] 4.1 Create ProductLookupService for API communication
    - Build service class for Open Food Facts API v2 integration
    - Implement proper User-Agent header formatting as required by API guidelines
    - Create API URL construction with normalized barcode parameter
    - Add request timeout and retry configuration for network resilience
    - _Requirements: 5.1, 5.2, 5.5_

  - [x] 4.2 Add comprehensive API response handling
    - Parse API responses for status 1 (found) and status 0 (not found) cases
    - Extract product name, ingredients, allergens, and nutritional data from response
    - Handle network errors with appropriate error classification and user messages
    - Implement server error detection and recovery strategies
    - _Requirements: 5.3, 5.4, 5.5_

  - [x] 4.3 Create product not found flow with contribution support
    - Design user-friendly "Product Not Found" screen without error messaging
    - Implement "Be the first to add this product!" call-to-action button
    - Create web view integration for Open Food Facts product creation form
    - Pre-populate barcode field in web form and handle return navigation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.4 Write integration tests for API service
    - Mock Open Food Facts API responses for found and not found products
    - Test network error handling and retry mechanisms
    - Verify User-Agent header formatting and API URL construction
    - Test product data parsing and error response handling
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Implement product caching system for offline capability
  - [x] 5.1 Create ProductCacheService with AsyncStorage integration
    - Build cache service with AsyncStorage for local product data persistence
    - Implement TTL (Time To Live) system with 7-day expiration for cached products
    - Add cache size management with 100-product limit and LRU eviction
    - Create cache statistics tracking for monitoring and debugging
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 5.2 Add cache lookup and refresh logic
    - Implement cache-first lookup strategy before making API calls
    - Add automatic cache refresh for products older than 7 days
    - Create background cache update while displaying cached data to users
    - Handle cache corruption and data validation for stored products
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 5.3 Implement offline detection and fallback handling
    - Add network connectivity monitoring with real-time status updates
    - Create offline mode indicator in user interface
    - Implement graceful fallback to cached data when network is unavailable
    - Add offline guidance messages and connectivity restoration handling
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 5.4 Write tests for caching and offline functionality
    - Test cache storage, retrieval, and TTL expiration logic
    - Mock network connectivity states and verify offline behavior
    - Test cache size limits and LRU eviction mechanisms
    - Verify data integrity and corruption handling in cache operations
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3_

- [x] 6. Create manual entry fallback component
  - [x] 6.1 Build ManualEntryModal for barcode input
    - Create modal component with numeric input field for barcode entry
    - Implement barcode format validation and real-time input feedback
    - Add proper keyboard handling and input formatting for different barcode types
    - Create submission and cancellation handling with proper state management
    - _Requirements: 3.4, 3.5_

  - [x] 6.2 Add manual entry integration with scan workflow
    - Integrate manual entry modal with main scanning screen
    - Process manually entered barcodes through same validation and lookup workflow
    - Add "Enter barcode manually" button with proper accessibility labels
    - Handle manual entry results with same navigation flow as camera scanning
    - _Requirements: 3.1, 3.4, 3.5_

  - [x] 6.3 Write tests for manual entry functionality
    - Test barcode input validation and format checking
    - Verify modal display, submission, and cancellation behavior
    - Test integration with main scanning workflow and navigation
    - Mock barcode processing and verify consistent behavior with camera scanning
    - _Requirements: 3.1, 3.4, 3.5_

- [x] 7. Implement accessibility features for inclusive design
  - [x] 7.1 Add screen reader support for camera interface
    - Implement VoiceOver and TalkBack announcements for scanning status
    - Add audio descriptions for camera view and scanning guidance
    - Create accessibility labels for all interactive elements and buttons
    - Implement audio feedback for barcode detection and processing states
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 7.2 Create accessible manual entry and error handling
    - Add proper accessibility labels and hints for manual entry input fields
    - Implement screen reader announcements for error states and recovery steps
    - Create accessible torch control with clear audio descriptions
    - Add keyboard navigation support for all interactive elements
    - _Requirements: 10.4, 10.5_

  - [x] 7.3 Write accessibility tests and validation
    - Test screen reader compatibility with automated accessibility testing tools
    - Verify keyboard navigation and focus management throughout the scanning flow
    - Test audio announcements and haptic feedback for accessibility features
    - Validate compliance with WCAG guidelines for mobile accessibility
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8. Integrate with existing dietary analysis workflow
  - [x] 8.1 Connect scan results to allergen analysis service
    - Modify existing dietary analysis service to accept Open Food Facts product data
    - Ensure product data format compatibility with current allergen detection logic
    - Add proper error handling for dietary analysis integration
    - Maintain existing navigation flow to result screens (Severe, Warning, All Clear)
    - _Requirements: 9.1, 9.2_

  - [x] 8.2 Implement scan history integration and navigation flow
    - Connect successful scans to existing scan history functionality
    - Ensure proper navigation return to camera view after result screen interactions
    - Add scan queuing for rapid multiple scans without UI conflicts
    - Maintain existing scan history data structure and storage patterns
    - _Requirements: 9.3, 9.4, 9.5_

  - [x] 8.3 Write integration tests for complete scan workflow
    - Test end-to-end flow from barcode detection to result screen display
    - Verify integration with existing dietary analysis and history services
    - Test navigation flow and state management throughout scanning process
    - Mock existing services and verify proper data flow and error handling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 9. Add comprehensive error handling and recovery
  - [x] 9.1 Implement error classification and user feedback system
    - Create comprehensive error type classification for all failure scenarios
    - Design user-friendly error messages with clear recovery instructions
    - Implement automatic retry mechanisms with exponential backoff for network errors
    - Add error logging and analytics for debugging and improvement
    - _Requirements: 5.5, 8.3, 8.4_

  - [x] 9.2 Create graceful degradation and fallback strategies
    - Implement camera permission denial handling with clear user guidance
    - Add camera initialization failure recovery with manual entry fallback
    - Create network error recovery with cache fallback and retry options
    - Handle API rate limiting and server errors with appropriate user messaging
    - _Requirements: 3.1, 3.3, 5.5, 8.3_

  - [x] 9.3 Write comprehensive error handling tests
    - Test all error scenarios and verify appropriate user feedback and recovery options
    - Mock various failure conditions and validate error classification and handling
    - Test retry mechanisms and fallback strategies under different error conditions
    - Verify error logging and analytics data collection for debugging purposes
    - _Requirements: 5.5, 8.3, 8.4_

- [x] 10. Performance optimization and final integration
  - [x] 10.1 Optimize scanning performance and resource usage
    - Implement camera frame rate optimization for battery efficiency
    - Add ML Kit processing throttling to prevent device overload
    - Optimize cache lookup performance and memory usage
    - Implement request deduplication to avoid duplicate API calls
    - _Requirements: 2.4, 2.5, 7.2_

  - [x] 10.2 Add performance monitoring and analytics
    - Implement scan speed tracking from detection to result display
    - Add memory usage monitoring during continuous scanning sessions
    - Create battery impact measurement and optimization
    - Add cache performance metrics and hit rate tracking
    - _Requirements: 2.4, 2.5, 7.2, 7.5_

  - [x] 10.3 Write performance tests and validation
    - Test scan speed requirements (sub-3-second response time)
    - Measure memory usage and detect potential memory leaks
    - Test battery impact during extended scanning sessions
    - Validate cache performance with large datasets (100+ products)
    - _Requirements: 2.4, 2.5, 7.2, 7.5_
