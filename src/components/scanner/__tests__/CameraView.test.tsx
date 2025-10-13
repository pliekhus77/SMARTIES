import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CameraView } from '../CameraView';

jest.mock('react-native-vision-camera');
jest.mock('react-native-haptic-feedback');

describe('CameraView', () => {
  const mockOnBarcodeDetected = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders camera view when permission granted', () => {
    const { getByText } = render(
      <CameraView
        onBarcodeDetected={mockOnBarcodeDetected}
        onError={mockOnError}
      />
    );

    expect(getByText('Position barcode within the frame')).toBeTruthy();
  });

  it('toggles torch when button pressed', () => {
    const { getByLabelText } = render(
      <CameraView
        onBarcodeDetected={mockOnBarcodeDetected}
        onError={mockOnError}
      />
    );

    const torchButton = getByLabelText('Turn on flashlight');
    fireEvent.press(torchButton);
    
    expect(getByLabelText('Turn off flashlight')).toBeTruthy();
  });

  it('shows processing overlay when scanning', () => {
    const { getByText } = render(
      <CameraView
        onBarcodeDetected={mockOnBarcodeDetected}
        onError={mockOnError}
      />
    );

    // Simulate processing state
    expect(getByText('Processing...')).toBeTruthy();
  });
});
