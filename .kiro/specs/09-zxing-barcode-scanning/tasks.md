# Implementation Plan: ZXing Barcode Scanning

- [x] 1. Set up ZXing.Net.Maui infrastructure and dependencies
  - Install ZXing.Net.Maui and ZXing.Net.Maui.Controls NuGet packages
  - Configure MauiProgram.cs with UseBarcodeReader() extension
  - Add platform-specific camera permissions to AndroidManifest.xml and Package.appxmanifest
  - Register barcode scanning services in dependency injection container
  - _Requirements: 1.4, 7.3_

- [x] 2. Implement core barcode service interface and base implementation
  - Create IBarcodeService interface with scanning, validation, and feedback methods
  - Implement BarcodeService base class with ZXing.Net.Maui integration
  - Add barcode format validation for EAN-8, EAN-13, UPC-A, UPC-E, and Code-128
  - Implement barcode normalization to 13-digit format
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3. Create barcode detection and feedback mechanisms
  - Implement haptic feedback using MAUI Essentials HapticFeedback
  - Add audio feedback for successful barcode detection
  - Create 2-second cooldown mechanism to prevent duplicate scans
  - Implement BarcodeDetectedEventArgs with format and timing information
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 4. Build camera permissions and initialization system
  - Implement camera permission request using MAUI Essentials Permissions API
  - Create permission denied dialog with settings redirect functionality
  - Add camera initialization error handling with fallback to manual entry
  - Implement proper camera resource management for app backgrounding
  - _Requirements: 1.4, 1.5, 7.4_

- [x] 5. Develop ScannerViewModel with MVVM pattern
  - Create ScannerViewModel using CommunityToolkit.Mvvm ObservableObject
  - Add observable properties for IsScanning, IsProcessing, and ScanningInstructions
  - Implement RelayCommands for StartScanning, StopScanning, ManualEntry, and ToggleFlashlight
  - Add integration with existing OpenFoodFactsService and DietaryAnalysisService
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 6. Create custom camera view with scanning overlay
  - Build SmartiesCameraView component extending ContentView
  - Integrate ZXing camera view with semi-transparent overlay
  - Add rectangular scanning area with "Center barcode in the frame" instruction
  - Implement green border animation for successful barcode detection
  - _Requirements: 1.1, 1.2, 1.3, 2.3_

- [x] 7. Implement manual entry fallback functionality
  - Create manual barcode entry dialog with numeric input validation
  - Add barcode format validation for manually entered codes
  - Integrate manual entry with same product lookup workflow as camera scanning
  - Provide helpful tips for damaged or unreadable barcodes
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 8. Add flashlight control for low-light scanning
  - Implement flashlight availability detection using device capabilities
  - Create flashlight toggle functionality with visual indicator
  - Add automatic flashlight suggestion for low-light conditions
  - Provide guidance for optimal barcode positioning and lighting
  - _Requirements: 10.1, 10.2, 10.4_

- [x] 9. Build comprehensive error handling system
  - Create ScannerErrorHandler with categorized error responses
  - Implement user-friendly error messages for each error type
  - Add logging for camera permissions, ZXing failures, and performance issues
  - Create graceful fallback to manual entry for all error scenarios
  - _Requirements: 8.1, 8.2, 8.3, 4.5_

- [x] 10. Implement accessibility features for screen readers
  - Add accessibility labels and descriptions for all scanner UI elements
  - Implement audio announcements for barcode detection success
  - Create voice-guided instructions for barcode positioning
  - Ensure manual entry dialog is fully accessible with proper labels
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11. Add battery optimization and performance features
  - Implement 30-second scanning timeout with "Tap to continue" overlay
  - Add automatic camera pause/resume for app backgrounding
  - Create adaptive camera settings for battery efficiency
  - Implement memory management for camera frames and resources
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 12. Create platform-specific implementations
  - Implement AndroidBarcodeService with rear camera and autofocus configuration
  - Create WindowsBarcodeService with default camera device selection
  - Add platform-specific camera optimization and resource management
  - Ensure consistent API across platforms while handling hardware differences
  - _Requirements: 7.1, 7.2, 7.5_

- [x] 13. Integrate with existing SMARTIES services workflow
  - Connect barcode scanning to OpenFoodFactsService.GetProductAsync method
  - Integrate with DietaryAnalysisService.AnalyzeProductAsync for compliance checking
  - Add navigation to ProductDetailPage with analysis results
  - Implement scan history saving via ProductCacheService
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 14. Update ScannerPage XAML and wire up ViewModel
  - Replace mock scanning implementation with ZXing camera view
  - Add manual entry button and flashlight toggle to UI
  - Implement loading indicators and scanning guidance overlays
  - Connect ViewModel commands to UI elements with proper data binding
  - _Requirements: 1.1, 1.2, 1.3, 6.4_

- [x] 15. Create comprehensive unit tests for barcode functionality
  - Write unit tests for BarcodeService validation and normalization methods
  - Test ScannerViewModel commands and state management
  - Create mock tests for camera permissions and error handling
  - Add tests for barcode format validation and edge cases
  - _Requirements: 3.1, 3.2, 3.3, 8.4_

- [x] 16. Implement integration tests for complete scanning workflow
  - Test end-to-end flow from barcode detection to product lookup
  - Create integration tests for OpenFoodFactsService and DietaryAnalysisService
  - Test error handling and fallback scenarios
  - Validate performance metrics and timing requirements
  - _Requirements: 6.1, 6.2, 6.3, 8.5_

- [x] 17. Add accessibility and performance testing
  - Test screen reader compatibility with VoiceOver/TalkBack
  - Validate voice guidance and audio feedback functionality
  - Performance test scanning speed and battery usage
  - Test camera resource management and memory optimization
  - _Requirements: 5.1, 5.2, 9.1, 9.5_
