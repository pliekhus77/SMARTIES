import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ScanScreen } from '../ScanScreen';

// Mock the BarcodeScanner component
jest.mock('../../components/scanner', () => ({
  BarcodeScanner: ({ onBarcodeScanned, onError, onClose }: any) => {
    const MockedBarcodeScanner = require('react-native').View;
    return (
      <MockedBarcodeScanner testID="barcode-scanner">
        <MockedBarcodeScanner 
          testID="scan-valid-barcode"
          onPress={() => onBarcodeScanned('123456789012')}
        />
        <MockedBarcodeScanner 
          testID="scan-invalid-barcode"
          onPress={() => onError('Invalid barcode')}
        />
        <MockedBarcodeScanner 
          testID="close-scanner"
          onPress={onClose}
        />
      </MockedBarcodeScanner>
    );
  },
}));

// Mock the barcode service
jest.mock('../../services/barcode', () => ({
  BarcodeScanner: jest.fn().mockImplementation(() => ({
    processScanResult: jest.fn().mockImplementation(({ data }) => {
      // Simulate UPC validation
      const upcPattern = /^(\d{8}|\d{12}|\d{13})$/;
      return upcPattern.test(data) ? data : null;
    }),
  })),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ScanScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders initial state correctly', () => {
    const { getByText } = render(<ScanScreen />);
    
    expect(getByText('Ready to Scan')).toBeTruthy();
    expect(getByText('Point your camera at a product barcode to check for dietary restrictions')).toBeTruthy();
    expect(getByText('Start Scanning')).toBeTruthy();
    expect(getByText('How to use:')).toBeTruthy();
  });

  it('shows scanner when scan button is pressed', () => {
    const { getByText, getByTestId } = render(<ScanScreen />);
    
    const scanButton = getByText('Start Scanning');
    fireEvent.press(scanButton);
    
    expect(getByTestId('barcode-scanner')).toBeTruthy();
  });

  it('processes valid barcode scan correctly', async () => {
    const { getByText, getByTestId } = render(<ScanScreen />);
    
    // Start scanning
    const scanButton = getByText('Start Scanning');
    fireEvent.press(scanButton);
    
    // Simulate valid barcode scan
    const scanValidButton = getByTestId('scan-valid-barcode');
    fireEvent.press(scanValidButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Barcode Scanned Successfully!',
        expect.stringContaining('UPC: 123456789012'),
        expect.any(Array)
      );
    });
  });

  it('handles scan errors correctly', async () => {
    const { getByText, getByTestId } = render(<ScanScreen />);
    
    // Start scanning
    const scanButton = getByText('Start Scanning');
    fireEvent.press(scanButton);
    
    // Simulate scan error
    const scanErrorButton = getByTestId('scan-invalid-barcode');
    fireEvent.press(scanErrorButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Scan Error',
        'Invalid barcode',
        expect.any(Array)
      );
    });
  });

  it('closes scanner when close button is pressed', () => {
    const { getByText, getByTestId, queryByTestId } = render(<ScanScreen />);
    
    // Start scanning
    const scanButton = getByText('Start Scanning');
    fireEvent.press(scanButton);
    
    expect(getByTestId('barcode-scanner')).toBeTruthy();
    
    // Close scanner
    const closeButton = getByTestId('close-scanner');
    fireEvent.press(closeButton);
    
    expect(queryByTestId('barcode-scanner')).toBeNull();
    expect(getByText('Ready to Scan')).toBeTruthy();
  });

  it('displays last scanned barcode', async () => {
    const { getByText, getByTestId } = render(<ScanScreen />);
    
    // Start scanning
    const scanButton = getByText('Start Scanning');
    fireEvent.press(scanButton);
    
    // Simulate valid barcode scan
    const scanValidButton = getByTestId('scan-valid-barcode');
    fireEvent.press(scanValidButton);
    
    // Dismiss alert by pressing OK
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
    
    // Check if last scanned barcode is displayed
    expect(getByText('Last scanned:')).toBeTruthy();
    expect(getByText('123456789012')).toBeTruthy();
  });
});