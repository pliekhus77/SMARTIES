/**
 * Navigation tests for SMARTIES app
 * 
 * Tests the basic navigation structure and screen rendering
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ScanScreen, ProfileScreen, HistoryScreen, SettingsScreen } from '../screens';

// Mock the navigation container for testing
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

describe('Screen Components', () => {
  it('renders ScanScreen correctly', () => {
    const { getByText } = render(<ScanScreen />);
    expect(getByText('Ready to Scan')).toBeTruthy();
    expect(getByText('Start Scanning')).toBeTruthy();
  });

  it('renders ProfileScreen correctly', () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText('Dietary Profile')).toBeTruthy();
    expect(getByText('Set Up Profile')).toBeTruthy();
  });

  it('renders HistoryScreen correctly', () => {
    const { getByText } = render(<HistoryScreen />);
    expect(getByText('Scan Statistics')).toBeTruthy();
    expect(getByText('Recent Scans')).toBeTruthy();
  });

  it('renders SettingsScreen correctly', () => {
    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Safety Settings')).toBeTruthy();
  });
});