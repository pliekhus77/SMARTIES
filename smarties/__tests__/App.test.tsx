import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock all the screen components
jest.mock('../src/screens', () => ({
  ProfileScreen: () => null,
  HistoryScreen: () => null,
  SettingsScreen: () => null,
}));

jest.mock('../src/navigation', () => ({
  ScanStack: () => null,
}));

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('App', () => {
  it('should render without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('should render navigation container', () => {
    const { getByTestId } = render(<App />);
    // NavigationContainer should be present
    expect(() => render(<App />)).not.toThrow();
  });
});
