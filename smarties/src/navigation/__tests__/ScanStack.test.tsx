import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ScanStack } from '../ScanStack';

// Mock the screens
jest.mock('../../screens', () => ({
  ScanScreen: () => null,
  ResultScreen: () => null,
}));

describe('ScanStack', () => {
  const renderWithNavigation = (component: React.ReactElement) => {
    return render(
      <NavigationContainer>
        {component}
      </NavigationContainer>
    );
  };

  it('should render without crashing', () => {
    expect(() => renderWithNavigation(<ScanStack />)).not.toThrow();
  });

  it('should have correct initial route', () => {
    const { getByText } = renderWithNavigation(<ScanStack />);
    // The initial screen should be Scanner
    expect(() => getByText('SMARTIES Scanner')).not.toThrow();
  });
});
