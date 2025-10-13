# Requirements Document

## Introduction

This specification covers the implementation of Google ML Kit barcode scanning functionality for the SMARTIES mobile application. The goal is to replace the current backend-dependent barcode scanning with a direct client-side implementation using Google ML Kit for barcode detection and the Open Food Facts API for product data retrieval. This approach eliminates the need for a custom backend while providing a world-class barcode scanning experience with instant feedback, proper error handling, and seamless integration with the existing dietary analysis workflow.

## Requirements

### Requirement 1

**User Story:** As a user opening the ScanScreen, I want to see an intuitive camera viewfinder with clear guidance so that I know exactly how to scan a barcode effectively.

#### Acceptance Criteria

1. WHEN the ScanScreen loads THEN the system SHALL display a camera preview with Google ML Kit barcode detection enabled
2. WHEN the camera view is active THEN the system SHALL show a semi-transparent overlay with a clear rectangular cutout in the center for barcode targeting
3. WHEN the viewfinder is displayed THEN the system SHALL include helpful text such as "Center the barcode in the frame" below the target area
4. WHEN the camera initializes THEN the system SHALL enable continuous auto-focus and tap-to-focus functionality
5. WHEN the scan interface is ready THEN the system SHALL provide a manual torch toggle button for low-light conditions

### Requirement 2

**User Story:** As a user scanning a barcode, I want immediate feedback when a barcode is detected so that I know the scan was successful and the app is processing the result.

#### Acceptance Criteria

1. WHEN Google ML Kit detects a valid barcode THEN the system SHALL provide immediate haptic feedback (short vibration)
2. WHEN a barcode is successfully scanned THEN the system SHALL play a pleasant audio cue (quick beep sound)
3. WHEN barcode detection occurs THEN the system SHALL briefly animate the viewfinder box (flash green) to provide visual confirmation
4. WHEN the scan is confirmed THEN the system SHALL immediately display a loading indicator while fetching product data
5. WHEN multiple barcodes are in view THEN the system SHALL prioritize the barcode closest to the center of the target area

### Requirement 3

**User Story:** As a user who encounters scanning difficulties, I want alternative options and helpful features so that I can still access product information even when the camera scan fails.

#### Acceptance Criteria

1. WHEN the scanner is active THEN the system SHALL provide a "Enter barcode manually" button as an escape hatch for damaged barcodes
2. WHEN low light is detected THEN the system SHALL automatically suggest turning on the flashlight with a helpful message
3. WHEN no barcode is detected for 10 seconds THEN the system SHALL show a helpful tip about barcode positioning or lighting
4. WHEN the manual entry option is selected THEN the system SHALL open a numeric input dialog with barcode format validation
5. WHEN manual entry is completed THEN the system SHALL process the barcode using the same workflow as camera scanning

### Requirement 4

**User Story:** As a user scanning various barcode formats, I want the system to handle different barcode types correctly so that all my products can be identified regardless of their barcode format.

#### Acceptance Criteria

1. WHEN Google ML Kit detects a barcode THEN the system SHALL accept EAN-8, EAN-13, UPC-A, and UPC-E formats
2. WHEN a barcode is captured THEN the system SHALL validate the barcode format and check digit before processing
3. WHEN an invalid barcode is detected THEN the system SHALL continue scanning without interruption and show a brief "Invalid barcode" message
4. WHEN a valid barcode is confirmed THEN the system SHALL normalize it according to Open Food Facts requirements (13-digit format with leading zeros)
5. WHEN barcode normalization is complete THEN the system SHALL proceed with the Open Food Facts API call

### Requirement 5

**User Story:** As a user scanning products, I want the app to retrieve product information directly from Open Food Facts so that I get accurate, up-to-date product data without relying on a custom backend.

#### Acceptance Criteria

1. WHEN a normalized barcode is ready THEN the system SHALL make a GET request to https://world.openfoodfacts.org/api/v2/product/{barcode}.json
2. WHEN making API calls THEN the system SHALL include a proper User-Agent header in the format "SMARTIES - React Native - Version X.X - https://smarties.app - scan"
3. WHEN the API returns status 1 THEN the system SHALL parse the product object for name, ingredients, allergens, and nutritional data
4. WHEN the API returns status 0 THEN the system SHALL display a "Product Not Found" screen with an option to add the product to Open Food Facts
5. WHEN network errors occur THEN the system SHALL show a clear error message with retry options and offline guidance

### Requirement 6

**User Story:** As a user who scans an unknown product, I want to be empowered to contribute to the database so that the product becomes available for future users.

#### Acceptance Criteria

1. WHEN a product is not found (status 0) THEN the system SHALL display a friendly "Product Not Found" message without showing it as an error
2. WHEN the not found screen is shown THEN the system SHALL include a prominent "Be the first to add this product!" call-to-action button
3. WHEN the user chooses to add a product THEN the system SHALL open the Open Food Facts product creation form in a web view
4. WHEN the web view is opened THEN the system SHALL pre-populate the barcode field with the scanned code
5. WHEN the user completes product addition THEN the system SHALL return to the scan screen and suggest rescanning the product

### Requirement 7

**User Story:** As a user with an active internet connection, I want my scanned products to be cached locally so that I can access them quickly in future scans and have some offline capability.

#### Acceptance Criteria

1. WHEN product data is successfully retrieved THEN the system SHALL cache the complete product information locally using AsyncStorage
2. WHEN a barcode is scanned THEN the system SHALL first check the local cache before making an API call
3. WHEN cached data exists and is less than 7 days old THEN the system SHALL use the cached data and proceed to dietary analysis
4. WHEN cached data is older than 7 days THEN the system SHALL make an API call to refresh the data while showing the cached version
5. WHEN the cache reaches 100 products THEN the system SHALL remove the oldest entries to maintain performance

### Requirement 8

**User Story:** As a user scanning products offline, I want basic functionality to work so that I can still use previously scanned products and get guidance on connectivity requirements.

#### Acceptance Criteria

1. WHEN the device is offline and a barcode is scanned THEN the system SHALL check for cached product data first
2. WHEN cached data is available offline THEN the system SHALL proceed with dietary analysis using the cached information
3. WHEN no cached data exists offline THEN the system SHALL display a clear "No internet connection" message with guidance
4. WHEN connectivity is restored THEN the system SHALL automatically retry failed API calls and update cached data
5. WHEN offline mode is active THEN the system SHALL show a subtle indicator in the UI to inform users of the connectivity status

### Requirement 9

**User Story:** As a user completing a successful scan, I want the system to seamlessly integrate with the existing dietary analysis workflow so that I get immediate safety feedback.

#### Acceptance Criteria

1. WHEN product data is successfully obtained (from API or cache) THEN the system SHALL automatically trigger the existing allergen analysis process
2. WHEN dietary analysis is complete THEN the system SHALL navigate to the appropriate result screen (Severe, Warning, or All Clear) based on existing requirements
3. WHEN scan results are processed THEN the system SHALL save the scan to history using the existing scan history functionality
4. WHEN the user returns from result screens THEN the system SHALL return to the active camera view ready for the next scan
5. WHEN multiple rapid scans occur THEN the system SHALL queue the requests and process them in order without UI conflicts

### Requirement 10

**User Story:** As a user with accessibility needs, I want the barcode scanning feature to work with screen readers and accessibility features so that I can use the app independently.

#### Acceptance Criteria

1. WHEN VoiceOver or TalkBack is enabled THEN the system SHALL provide audio descriptions of the camera view and scanning status
2. WHEN a barcode is detected THEN the system SHALL announce "Barcode detected, processing product information" via accessibility services
3. WHEN scanning fails or succeeds THEN the system SHALL provide clear audio feedback about the result and next steps
4. WHEN manual entry is needed THEN the system SHALL ensure the input dialog is fully accessible with proper labels and hints
5. WHEN accessibility features are active THEN the system SHALL provide alternative interaction methods for torch control and manual entry