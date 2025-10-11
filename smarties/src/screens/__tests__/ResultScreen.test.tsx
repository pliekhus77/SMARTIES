import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ResultScreen } from '../ResultScreen';
import { ScanStackParamList } from '../../types/navigation';

const Stack = createStackNavigator<ScanStackParamList>();

const mockNavigation = {
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    scanResult: {
      upc: '123456789',
      productName: 'Test Product',
      status: 'safe' as const,
      violations: [],
      timestamp: '2023-01-01T00:00:00.000Z',
    },
  },
};

describe('ResultScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWithNavigation = (route = mockRoute) => {
    return render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Result">
            {() => <ResultScreen route={route as any} navigation={mockNavigation as any} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    );
  };

  it('should render product information correctly', () => {
    const { getByText } = renderWithNavigation();
    
    expect(getByText('Test Product')).toBeTruthy();
    expect(getByText('SAFE')).toBeTruthy();
    expect(getByText('UPC: 123456789')).toBeTruthy();
  });

  it('should display violations when present', () => {
    const routeWithViolations = {
      params: {
        scanResult: {
          ...mockRoute.params.scanResult,
          status: 'danger' as const,
          violations: ['Contains peanuts', 'Contains dairy'],
        },
      },
    };

    const { getByText } = renderWithNavigation(routeWithViolations);
    
    expect(getByText('⚠️ Dietary Violations')).toBeTruthy();
    expect(getByText('Contains peanuts')).toBeTruthy();
    expect(getByText('Contains dairy')).toBeTruthy();
  });

  it('should navigate back when button is pressed', () => {
    const { getByText } = renderWithNavigation();
    
    const button = getByText('Scan Another Product');
    fireEvent.press(button);
    
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should display correct status colors', () => {
    const { getByText } = renderWithNavigation();
    
    const statusBadge = getByText('SAFE').parent;
    expect(statusBadge?.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#4CAF50',
      })
    );
  });
});
