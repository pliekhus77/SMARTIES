# Barcode Scanner Component

This directory contains the barcode scanning functionality for the SMARTIES app.

## Components

### BarcodeScanner

A React Native component that provides barcode scanning capabilities using `expo-barcode-scanner`.

#### Features

- **Camera Permission Handling**: Automatically requests and manages camera permissions
- **UPC Validation**: Validates scanned barcodes to ensure they are valid UPC formats (UPC-A, UPC-E, EAN-13)
- **Error Handling**: Graceful error handling for scanning failures and invalid barcodes
- **User Controls**: Scan again and close functionality
- **Visual Feedback**: Clear scanning overlay with instructions

#### Usage

```tsx
import { BarcodeScanner } from '../components/scanner';

const MyComponent = () => {
  const handleBarcodeScanned = (barcode: string) => {
    console.log('Scanned barcode:', barcode);
    // Process the barcode...
  };

  const handleError = (error: string) => {
    console.error('Scan error:', error);
    // Handle the error...
  };

  const handleClose = () => {
    // Close the scanner...
  };

  return (
    <BarcodeScanner
      onBarcodeScanned={handleBarcodeScanned}
      onError={handleError}
      onClose={handleClose}
    />
  );
};
```

#### Props

- `onBarcodeScanned: (barcode: string) => void` - Called when a valid barcode is scanned
- `onError?: (error: string) => void` - Called when an error occurs during scanning
- `onClose?: () => void` - Called when the user wants to close the scanner

#### Supported Barcode Types

- UPC-A (12 digits)
- UPC-E (8 digits)
- EAN-13 (13 digits)
- EAN-8 (8 digits)

## Integration with ScanScreen

The `ScanScreen` component demonstrates how to integrate the `BarcodeScanner` component:

1. **State Management**: Manages scanning state and last scanned barcode
2. **Error Handling**: Shows user-friendly error messages
3. **Success Feedback**: Displays scanned barcode and provides next steps
4. **Navigation**: Allows users to scan again or continue with other actions

## Testing

The barcode scanning functionality is thoroughly tested:

- **Component Tests**: Test the BarcodeScanner component behavior
- **Service Tests**: Test the barcode validation and processing logic
- **Integration Tests**: Test the ScanScreen integration

Run tests with:

```bash
npm test -- --testPathPattern="scanner|ScanScreen"
```

## Permissions

The app requires camera permissions to function. These are configured in:

- `app.json`: Expo configuration with permission descriptions
- `BarcodeScanner.tsx`: Runtime permission requests

## Error Handling

The scanner handles various error scenarios:

1. **Permission Denied**: Shows permission request UI
2. **Invalid Barcode**: Validates UPC format and shows error message
3. **Camera Errors**: Graceful fallback with error messages
4. **Processing Errors**: Catches and handles unexpected errors

## Future Enhancements

Potential improvements for the barcode scanner:

1. **Torch/Flash Support**: Add flashlight toggle for low-light scanning
2. **Multiple Barcode Types**: Support additional barcode formats (QR codes, Code 128, etc.)
3. **Batch Scanning**: Allow scanning multiple barcodes in sequence
4. **Image Recognition**: Fallback to image-based barcode detection when camera scanning fails
5. **Performance Optimization**: Optimize scanning speed and accuracy