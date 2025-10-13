import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ManualEntryModal } from '../ManualEntryModal';

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

describe('ManualEntryModal', () => {
  const mockOnClose = jest.fn();
  const mockOnBarcodeEntered = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when visible', () => {
    const { getByText } = render(
      <ManualEntryModal
        visible={true}
        onClose={mockOnClose}
        onBarcodeEntered={mockOnBarcodeEntered}
      />
    );

    expect(getByText('Enter Barcode Manually')).toBeTruthy();
  });

  it('formats input to digits only', () => {
    const { getByLabelText } = render(
      <ManualEntryModal
        visible={true}
        onClose={mockOnClose}
        onBarcodeEntered={mockOnBarcodeEntered}
      />
    );

    const input = getByLabelText('Barcode input field');
    fireEvent.changeText(input, 'abc123def456');
    
    expect(input.props.value).toBe('123456');
  });

  it('shows appropriate hints for different barcode lengths', () => {
    const { getByLabelText, getByText } = render(
      <ManualEntryModal
        visible={true}
        onClose={mockOnClose}
        onBarcodeEntered={mockOnBarcodeEntered}
      />
    );

    const input = getByLabelText('Barcode input field');
    
    // Test EAN-8 detection
    fireEvent.changeText(input, '12345678');
    expect(getByText('EAN-8 format detected')).toBeTruthy();
    
    // Test UPC-A detection
    fireEvent.changeText(input, '123456789012');
    expect(getByText('UPC-A format detected')).toBeTruthy();
  });

  it('validates barcode before submission', async () => {
    const { getByLabelText, getByText } = render(
      <ManualEntryModal
        visible={true}
        onClose={mockOnClose}
        onBarcodeEntered={mockOnBarcodeEntered}
      />
    );

    const input = getByLabelText('Barcode input field');
    const submitButton = getByText('Submit');
    
    // Enter invalid barcode
    fireEvent.changeText(input, '123');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Barcode',
        expect.any(String)
      );
    });
  });

  it('calls onBarcodeEntered with valid barcode', async () => {
    const { getByLabelText, getByText } = render(
      <ManualEntryModal
        visible={true}
        onClose={mockOnClose}
        onBarcodeEntered={mockOnBarcodeEntered}
      />
    );

    const input = getByLabelText('Barcode input field');
    const submitButton = getByText('Submit');
    
    // Enter valid EAN-13 barcode
    fireEvent.changeText(input, '1234567890128');
    fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(mockOnBarcodeEntered).toHaveBeenCalledWith('1234567890128');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('closes modal when cancel is pressed', () => {
    const { getByText } = render(
      <ManualEntryModal
        visible={true}
        onClose={mockOnClose}
        onBarcodeEntered={mockOnBarcodeEntered}
      />
    );

    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});
