/**
 * Screen Database Integration Tests
 * Task 7.4: Test database operations through UI components
 * 
 * Tests database operations in individual screens
 * Requirements: 5.2, 5.5
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ProfileScreen } from '../../src/screens/ProfileScreen';
import { HistoryScreen } from '../../src/screens/HistoryScreen';
import { AppInitializationService } from '../../src/services/AppInitializationService';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
}));

describe('Screen Database Integration Tests', () => {
  let mockAppInitService: jest.Mocked<AppInitializationService>;
  let mockDatabaseService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDatabaseService = {
      testConnection: jest.fn().mockResolvedValue(true),
      readOne: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      read: jest.fn(),
      update: jest.fn(),
    };

    mockAppInitService = {
      initialize: jest.fn(),
      getDatabaseService: jest.fn().mockReturnValue(mockDatabaseService),
      getInitializationStatus: jest.fn().mockReturnValue(true),
      cleanup: jest.fn(),
    } as any;

    jest.spyOn(AppInitializationService, 'getInstance').mockReturnValue(mockAppInitService);
  });

  describe('ProfileScreen Database Integration', () => {
    test('should load existing user profile on mount', async () => {
      const mockUser = {
        _id: 'user_default',
        profileId: 'default',
        dietaryRestrictions: {
          allergies: [{ allergen: 'peanuts', severity: 'severe', notes: 'Carry EpiPen' }],
          religious: ['halal'],
          medical: [],
          lifestyle: ['vegan'],
        },
        metadata: {
          createdAt: new Date('2023-01-01'),
          lastUpdated: new Date(),
          version: 1,
        },
      };

      mockDatabaseService.readOne.mockResolvedValue({ success: true, data: mockUser });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(mockDatabaseService.readOne).toHaveBeenCalledWith('users', { profileId: 'default' });
      });

      await waitFor(() => {
        expect(getByText('Profile Active')).toBeTruthy();
        expect(getByText('Allergies: 1')).toBeTruthy();
        expect(getByText('Manage Profile')).toBeTruthy();
      });
    });

    test('should create new profile when none exists', async () => {
      mockDatabaseService.readOne.mockResolvedValue({ success: true, data: null });
      mockDatabaseService.create.mockResolvedValue({ success: true, data: { _id: 'user_default' } });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Set Up Profile')).toBeTruthy();
      });

      const setupButton = getByText('Set Up Profile');
      fireEvent.press(setupButton);

      await waitFor(() => {
        expect(mockDatabaseService.create).toHaveBeenCalledWith('users', expect.objectContaining({
          profileId: 'default',
          dietaryRestrictions: expect.any(Object),
        }));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Profile created successfully!');
      });
    });

    test('should handle profile creation error', async () => {
      mockDatabaseService.readOne.mockResolvedValue({ success: true, data: null });
      mockDatabaseService.create.mockResolvedValue({ success: false, error: 'Database connection failed' });

      const { getByText } = render(<ProfileScreen />);

      const setupButton = getByText('Set Up Profile');
      fireEvent.press(setupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Database connection failed');
      });
    });

    test('should handle database loading error', async () => {
      mockDatabaseService.readOne.mockResolvedValue({ success: false, error: 'Connection timeout' });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Database Error: Connection timeout')).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();
      });
    });

    test('should retry loading profile on error', async () => {
      mockDatabaseService.readOne
        .mockResolvedValueOnce({ success: false, error: 'Connection timeout' })
        .mockResolvedValueOnce({ success: true, data: null });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Retry')).toBeTruthy();
      });

      const retryButton = getByText('Retry');
      fireEvent.press(retryButton);

      await waitFor(() => {
        expect(mockDatabaseService.readOne).toHaveBeenCalledTimes(2);
        expect(getByText('Set Up Profile')).toBeTruthy();
      });
    });
  });

  describe('HistoryScreen Database Integration', () => {
    test('should load scan history on mount', async () => {
      const mockScanHistory = [
        {
          _id: 'scan_1',
          userId: 'default',
          productId: 'product_1',
          scanTimestamp: new Date('2023-01-01'),
          complianceStatus: 'safe',
          violations: [],
          confidence: 0.95,
        },
        {
          _id: 'scan_2',
          userId: 'default',
          productId: 'product_2',
          scanTimestamp: new Date('2023-01-02'),
          complianceStatus: 'violation',
          violations: [{ type: 'allergy', severity: 'severe', allergen: 'peanuts' }],
          confidence: 0.98,
        },
      ];

      mockDatabaseService.read.mockResolvedValue({ success: true, data: mockScanHistory });

      const { getByText } = render(<HistoryScreen />);

      await waitFor(() => {
        expect(mockDatabaseService.read).toHaveBeenCalledWith('scan_results', {});
      });

      await waitFor(() => {
        expect(getByText('2')).toBeTruthy(); // Total scans
        expect(getByText('1')).toBeTruthy(); // Safe products
        expect(getByText('Product ID: product_1')).toBeTruthy();
        expect(getByText('Product ID: product_2')).toBeTruthy();
      });
    });

    test('should show empty state when no scans exist', async () => {
      mockDatabaseService.read.mockResolvedValue({ success: true, data: [] });

      const { getByText } = render(<HistoryScreen />);

      await waitFor(() => {
        expect(getByText('0')).toBeTruthy(); // Total scans
        expect(getByText('No scans yet')).toBeTruthy();
        expect(getByText('Start scanning products to see your history here')).toBeTruthy();
      });
    });

    test('should clear scan history', async () => {
      const mockScanHistory = [
        {
          _id: 'scan_1',
          userId: 'default',
          productId: 'product_1',
          scanTimestamp: new Date(),
          complianceStatus: 'safe',
          violations: [],
          confidence: 0.95,
        },
      ];

      mockDatabaseService.read.mockResolvedValue({ success: true, data: mockScanHistory });
      mockDatabaseService.delete.mockResolvedValue({ success: true });

      const { getByText } = render(<HistoryScreen />);

      await waitFor(() => {
        expect(getByText('Clear All')).toBeTruthy();
      });

      const clearButton = getByText('Clear All');
      fireEvent.press(clearButton);

      await waitFor(() => {
        expect(mockDatabaseService.delete).toHaveBeenCalledWith('scan_results', {});
      });
    });

    test('should handle scan history loading error', async () => {
      mockDatabaseService.read.mockResolvedValue({ success: false, error: 'Database unavailable' });

      const { getByText } = render(<HistoryScreen />);

      await waitFor(() => {
        expect(getByText('Database Error: Database unavailable')).toBeTruthy();
        expect(getByText('Retry')).toBeTruthy();
      });
    });

    test('should calculate statistics correctly', async () => {
      const mockScanHistory = [
        { complianceStatus: 'safe', violations: [] },
        { complianceStatus: 'violation', violations: [{}] },
        { complianceStatus: 'warning', violations: [{}] },
        { complianceStatus: 'safe', violations: [] },
      ];

      mockDatabaseService.read.mockResolvedValue({ success: true, data: mockScanHistory });

      const { getAllByText } = render(<HistoryScreen />);

      await waitFor(() => {
        expect(getAllByText('4')[0]).toBeTruthy(); // Total scans
        expect(getAllByText('2')[0]).toBeTruthy(); // Safe products  
        expect(getAllByText('2')[1]).toBeTruthy(); // Warnings
      });
    });
  });

  describe('Database Service Initialization', () => {
    test('should handle uninitialized database service', async () => {
      mockAppInitService.getInitializationStatus.mockReturnValue(false);

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Database Error: Database not initialized')).toBeTruthy();
      });
    });

    test('should handle database service error', async () => {
      mockAppInitService.getDatabaseService.mockImplementation(() => {
        throw new Error('Service unavailable');
      });

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Database Error: Service unavailable')).toBeTruthy();
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading indicator during database operations', async () => {
      // Simulate slow database operation
      mockDatabaseService.readOne.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: null }), 100))
      );

      const { getByText } = render(<ProfileScreen />);

      expect(getByText('Loading profile...')).toBeTruthy();

      await waitFor(() => {
        expect(getByText('Set Up Profile')).toBeTruthy();
      });
    });

    test('should show loading indicator during profile creation', async () => {
      mockDatabaseService.readOne.mockResolvedValue({ success: true, data: null });
      
      // Simulate slow create operation
      mockDatabaseService.create.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: {} }), 100))
      );

      const { getByText } = render(<ProfileScreen />);

      await waitFor(() => {
        expect(getByText('Set Up Profile')).toBeTruthy();
      });

      const setupButton = getByText('Set Up Profile');
      fireEvent.press(setupButton);

      // Should show loading state in button
      await waitFor(() => {
        expect(setupButton.props.accessibilityState?.disabled).toBe(true);
      });
    });
  });
});
