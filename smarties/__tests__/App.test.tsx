import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('renders correctly', () => {
    const { getByText } = render(<App />);
    
    // Check if the app title is rendered
    expect(getByText('SMARTIES')).toBeTruthy();
    expect(getByText('Scan-based Mobile Allergen Risk Tracking')).toBeTruthy();
  });

  it('displays the scan screen', () => {
    const { getByText } = render(<App />);
    
    // Check if the scan screen content is rendered
    expect(getByText('Scan Screen')).toBeTruthy();
  });
});