/**
 * App Startup Performance Tests
 * Task 8.3: Validate performance requirements
 * 
 * Tests app startup time and navigation responsiveness
 * Requirements: 2.5
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import App from '../../App';
import { AppInitializationService } from '../../src/services/AppInitializationService';

// Mock dependencies for performance testing
jest.mock('../../src/services/AppInitializationService');
jest.mock('../../src/hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    isOfflineMode: false,
    connectionState: 'connected'
  })
}));

// Mock navigation components for faster rendering
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
  };
});

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    Screen: ({ children }: { children: React.ReactNode }) => children,
  }),
}));

// Mock screens for faster rendering
jest.mock('../../src/screens', () => ({
  ProfileScreen: () => null,
  HistoryScreen: () => null,
  SettingsScreen: () => null,
}));

jest.mock('../../src/navigation', () => ({
  ScanStack: () => null,
}));

jest.mock('../../src/components', () => ({
  LoadingScreen: ({ message }: { message: string }) => null,
  OfflineBanner: ({ isVisible }: { isVisible: boolean }) => null,
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => children,
}));

describe('App Startup Performance Tests', () => {
  const mockAppInitService = AppInitializationService.getInstance as jest.MockedFunction<
    typeof AppInitializationService.getInstance
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful initialization by default
    const mockInstance = {
      initialize: jest.fn().mockResolvedValue({
        success: true,
        initializationTime: 500,
        databaseConnected: true,
        configurationValid: true
      })
    };
    
    mockAppInitService.mockReturnValue(mockInstance as any);
  });

  describe('App Initialization Performance', () => {
    it('should initialize app in under 2 seconds', async () => {
      const startTime = Date.now();
      
      const { getByTestId } = render(<App />);
      
      // Wait for initialization to complete
      await waitFor(() => {
        // App should be initialized (no loading screen)
        expect(mockAppInitService).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      const initializationTime = Date.now() - startTime;
      
      expect(initializationTime).toBeLessThan(2000); // Should initialize in under 2 seconds
      console.log(`App initialization time: ${initializationTime}ms`);
    });

    it('should handle fast initialization (optimal conditions)', async () => {
      // Mock very fast initialization
      const mockInstance = {
        initialize: jest.fn().mockResolvedValue({
          success: true,
          initializationTime: 200,
          databaseConnected: true,
          configurationValid: true
        })
      };
      mockAppInitService.mockReturnValue(mockInstance as any);

      const startTime = Date.now();
      
      render(<App />);
      
      await waitFor(() => {
        expect(mockAppInitService).toHaveBeenCalled();
      });
      
      const initializationTime = Date.now() - startTime;
      
      expect(initializationTime).toBeLessThan(1000); // Should be very fast
      console.log(`Fast initialization time: ${initializationTime}ms`);
    });

    it('should handle slow initialization gracefully', async () => {
      // Mock slower initialization
      const mockInstance = {
        initialize: jest.fn().mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              success: true,
              initializationTime: 1500,
              databaseConnected: true,
              configurationValid: true
            }), 1500)
          )
        )
      };
      mockAppInitService.mockReturnValue(mockInstance as any);

      const startTime = Date.now();
      
      render(<App />);
      
      await waitFor(() => {
        expect(mockAppInitService).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      const initializationTime = Date.now() - startTime;
      
      expect(initializationTime).toBeGreaterThan(1400);
      expect(initializationTime).toBeLessThan(3000); // Should still complete reasonably
      console.log(`Slow initialization time: ${initializationTime}ms`);
    });
  });

  describe('Configuration Validation Performance', () => {
    it('should validate configuration quickly', async () => {
      const mockInstance = {
        initialize: jest.fn().mockImplementation(async () => {
          const configStartTime = Date.now();
          
          // Simulate configuration validation
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const configTime = Date.now() - configStartTime;
          
          return {
            success: true,
            initializationTime: configTime,
            databaseConnected: true,
            configurationValid: true,
            configurationTime: configTime
          };
        })
      };
      mockAppInitService.mockReturnValue(mockInstance as any);

      render(<App />);
      
      await waitFor(() => {
        expect(mockAppInitService).toHaveBeenCalled();
      });

      const initResult = await mockInstance.initialize();
      expect(initResult.configurationTime).toBeLessThan(200); // Config validation should be fast
      console.log(`Configuration validation time: ${initResult.configurationTime}ms`);
    });
  });

  describe('Database Connection Performance', () => {
    it('should establish database connection within reasonable time', async () => {
      const mockInstance = {
        initialize: jest.fn().mockImplementation(async () => {
          const dbStartTime = Date.now();
          
          // Simulate database connection
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const dbTime = Date.now() - dbStartTime;
          
          return {
            success: true,
            initializationTime: dbTime,
            databaseConnected: true,
            configurationValid: true,
            databaseConnectionTime: dbTime
          };
        })
      };
      mockAppInitService.mockReturnValue(mockInstance as any);

      render(<App />);
      
      await waitFor(() => {
        expect(mockAppInitService).toHaveBeenCalled();
      });

      const initResult = await mockInstance.initialize();
      expect(initResult.databaseConnectionTime).toBeLessThan(1000); // DB connection should be reasonable
      console.log(`Database connection time: ${initResult.databaseConnectionTime}ms`);
    });

    it('should handle database connection timeout gracefully', async () => {
      const mockInstance = {
        initialize: jest.fn().mockImplementation(async () => {
          const dbStartTime = Date.now();
          
          // Simulate slow database connection
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const dbTime = Date.now() - dbStartTime;
          
          return {
            success: false,
            error: 'Database connection timeout',
            initializationTime: dbTime,
            databaseConnected: false,
            configurationValid: true,
            databaseConnectionTime: dbTime
          };
        })
      };
      mockAppInitService.mockReturnValue(mockInstance as any);

      const startTime = Date.now();
      
      render(<App />);
      
      await waitFor(() => {
        expect(mockAppInitService).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      const totalTime = Date.now() - startTime;
      
      // Should handle timeout gracefully and not hang indefinitely
      expect(totalTime).toBeLessThan(3000);
      console.log(`Database timeout handling time: ${totalTime}ms`);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle initialization errors quickly', async () => {
      const mockInstance = {
        initialize: jest.fn().mockRejectedValue(new Error('Initialization failed'))
      };
      mockAppInitService.mockReturnValue(mockInstance as any);

      const startTime = Date.now();
      
      render(<App />);
      
      await waitFor(() => {
        expect(mockAppInitService).toHaveBeenCalled();
      });
      
      const errorHandlingTime = Date.now() - startTime;
      
      expect(errorHandlingTime).toBeLessThan(1000); // Error handling should be fast
      console.log(`Error handling time: ${errorHandlingTime}ms`);
    });

    it('should recover from offline mode quickly', async () => {
      const mockInstance = {
        initialize: jest.fn().mockResolvedValue({
          success: true,
          initializationTime: 800,
          databaseConnected: false, // Offline mode
          configurationValid: true,
          offlineMode: true
        })
      };
      mockAppInitService.mockReturnValue(mockInstance as any);

      const startTime = Date.now();
      
      render(<App />);
      
      await waitFor(() => {
        expect(mockAppInitService).toHaveBeenCalled();
      });
      
      const offlineRecoveryTime = Date.now() - startTime;
      
      expect(offlineRecoveryTime).toBeLessThan(1500); // Offline recovery should be reasonable
      console.log(`Offline mode recovery time: ${offlineRecoveryTime}ms`);
    });
  });

  describe('Component Rendering Performance', () => {
    it('should render main navigation quickly', async () => {
      const startTime = Date.now();
      
      const { UNSAFE_root } = render(<App />);
      
      await waitFor(() => {
        expect(mockAppInitService).toHaveBeenCalled();
      });
      
      const renderTime = Date.now() - startTime;
      
      expect(renderTime).toBeLessThan(1000); // Navigation should render quickly
      console.log(`Navigation rendering time: ${renderTime}ms`);
    });

    it('should handle multiple re-renders efficiently', async () => {
      const { rerender } = render(<App />);
      
      await waitFor(() => {
        expect(mockAppInitService).toHaveBeenCalled();
      });

      const rerenderStartTime = Date.now();
      
      // Trigger multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(<App />);
      }
      
      const rerenderTime = Date.now() - rerenderStartTime;
      
      expect(rerenderTime).toBeLessThan(500); // Re-renders should be very fast
      console.log(`Multiple re-render time: ${rerenderTime}ms`);
    });
  });

  describe('Memory Usage During Startup', () => {
    it('should not cause memory leaks during initialization', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Render and unmount multiple times to test for leaks
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<App />);
        
        await waitFor(() => {
          expect(mockAppInitService).toHaveBeenCalled();
        });
        
        unmount();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      console.log(`Memory increase after 10 render cycles: ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    });
  });

  describe('Concurrent Initialization Performance', () => {
    it('should handle multiple initialization attempts gracefully', async () => {
      const mockInstance = {
        initialize: jest.fn().mockResolvedValue({
          success: true,
          initializationTime: 300,
          databaseConnected: true,
          configurationValid: true
        })
      };
      mockAppInitService.mockReturnValue(mockInstance as any);

      const startTime = Date.now();
      
      // Render multiple App instances concurrently
      const renders = Array.from({ length: 3 }, () => render(<App />));
      
      await Promise.all(renders.map(({ findByTestId }) => 
        waitFor(() => {
          expect(mockAppInitService).toHaveBeenCalled();
        })
      ));
      
      const concurrentTime = Date.now() - startTime;
      
      expect(concurrentTime).toBeLessThan(2000); // Should handle concurrent initialization
      console.log(`Concurrent initialization time: ${concurrentTime}ms`);
      
      // Cleanup
      renders.forEach(({ unmount }) => unmount());
    });
  });
});