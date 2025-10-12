/**
 * End-to-End Integration Tests
 * Task 7.4: Write end-to-end integration tests
 * 
 * Tests:
 * - Complete app initialization flow
 * - Database operations through UI components
 * - Offline mode behavior and recovery
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../../App';
import { AppInitializationService } from '../../src/services/AppInitializationService';
import { ConnectionStatusService } from '../../src/services/ConnectionStatusService';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock Expo components
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
}));

describe('App Integration Tests', () => {
  let mockAppInitService: jest.Mocked<AppInitializationService>;
  let mockConnectionService: jest.Mocked<ConnectionStatusService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AppInitializationService
    mockAppInitService = {
      initialize: jest.fn(),
      getDatabaseService: jest.fn(),
      getInitializationStatus: jest.fn(),
      cleanup: jest.fn(),
    } as any;

    // Mock ConnectionStatusService
    mockConnectionService = {
      addListener: jest.fn(),
      getCurrentStatus: jest.fn(),
      forceCheck: jest.fn(),
      cleanup: jest.fn(),
    } as any;

    jest.spyOn(AppInitializationService, 'getInstance').mockReturnValue(mockAppInitService);
    jest.spyOn(ConnectionStatusService, 'getInstance').mockReturnValue(mockConnectionService);
  });

  describe('App Initialization Flow', () => {
    test('should show loading screen during initialization', async () => {
      mockAppInitService.initialize.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, services: { database: true, configuration: true } }), 100))
      );

      const { getByText } = render(<App />);
      expect(getByText('Initializing SMARTIES...')).toBeTruthy();
    });

    test('should complete successful initialization', async () => {
      mockAppInitService.initialize.mockResolvedValue({
        success: true,
        services: { database: true, configuration: true }
      });

      mockConnectionService.addListener.mockImplementation((callback) => {
        callback({
          isOnline: true,
          isDatabaseConnected: true,
          isOfflineMode: false,
          lastChecked: new Date()
        });
        return jest.fn();
      });

      const { queryByText } = render(<App />);

      await waitFor(() => {
        expect(queryByText('Initializing SMARTIES...')).toBeNull();
      });

      expect(mockAppInitService.initialize).toHaveBeenCalled();
    });

    test('should handle initialization failure', async () => {
      mockAppInitService.initialize.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
        services: { database: false, configuration: true }
      });

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(getByText('Error: Database connection failed')).toBeTruthy();
      });
    });
  });

  describe('Database Operations Through UI', () => {
    beforeEach(() => {
      mockAppInitService.initialize.mockResolvedValue({
        success: true,
        services: { database: true, configuration: true }
      });

      mockAppInitService.getInitializationStatus.mockReturnValue(true);

      const mockDatabaseService = {
        testConnection: jest.fn().mockResolvedValue(true),
        readOne: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        read: jest.fn(),
      };
      mockAppInitService.getDatabaseService.mockReturnValue(mockDatabaseService as any);

      mockConnectionService.addListener.mockImplementation((callback) => {
        callback({
          isOnline: true,
          isDatabaseConnected: true,
          isOfflineMode: false,
          lastChecked: new Date()
        });
        return jest.fn();
      });
    });

    test('should handle profile creation through UI', async () => {
      const mockDatabaseService = mockAppInitService.getDatabaseService();
      mockDatabaseService.readOne.mockResolvedValue({ success: true, data: null });
      mockDatabaseService.create.mockResolvedValue({ success: true, data: { _id: 'user_default' } });

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(mockAppInitService.initialize).toHaveBeenCalled();
      });

      const setupButton = getByText('Set Up Profile');
      fireEvent.press(setupButton);

      await waitFor(() => {
        expect(mockDatabaseService.create).toHaveBeenCalledWith('users', expect.objectContaining({
          profileId: 'default'
        }));
      });
    });
  });

  describe('Offline Mode Behavior', () => {
    test('should show offline banner when connection is lost', async () => {
      mockAppInitService.initialize.mockResolvedValue({
        success: true,
        services: { database: true, configuration: true }
      });

      let connectionCallback: any;
      mockConnectionService.addListener.mockImplementation((callback) => {
        connectionCallback = callback;
        callback({
          isOnline: true,
          isDatabaseConnected: true,
          isOfflineMode: false,
          lastChecked: new Date()
        });
        return jest.fn();
      });

      const { getByText, queryByText } = render(<App />);

      await waitFor(() => {
        expect(mockAppInitService.initialize).toHaveBeenCalled();
      });

      expect(queryByText('Offline Mode - Limited functionality')).toBeNull();

      act(() => {
        connectionCallback({
          isOnline: false,
          isDatabaseConnected: false,
          isOfflineMode: true,
          lastChecked: new Date()
        });
      });

      await waitFor(() => {
        expect(getByText('Offline Mode - Limited functionality')).toBeTruthy();
      });
    });

    test('should handle database errors gracefully', async () => {
      mockAppInitService.initialize.mockResolvedValue({
        success: true,
        services: { database: true, configuration: true }
      });

      mockAppInitService.getInitializationStatus.mockReturnValue(true);

      const mockDatabaseService = {
        testConnection: jest.fn().mockRejectedValue(new Error('Connection timeout')),
        readOne: jest.fn().mockResolvedValue({ success: false, error: 'Database unavailable' }),
      };
      mockAppInitService.getDatabaseService.mockReturnValue(mockDatabaseService as any);

      mockConnectionService.addListener.mockImplementation((callback) => {
        callback({
          isOnline: true,
          isDatabaseConnected: true,
          isOfflineMode: false,
          lastChecked: new Date()
        });
        return jest.fn();
      });

      const { getByText } = render(<App />);

      await waitFor(() => {
        expect(mockAppInitService.initialize).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(getByText('Database Error: Database unavailable')).toBeTruthy();
      });
    });
  });
});
