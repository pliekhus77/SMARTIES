/**
 * Cross-Platform Test Setup
 * Task 8.4: Setup configuration for cross-platform compatibility tests
 * 
 * This file configures the test environment for consistent cross-platform
 * testing across iOS and Android platforms.
 * 
 * Requirements: 3.5
 */

import 'react-native-gesture-handler/jestSetup';
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules for cross-platform testing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock platform-specific modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    Platform: {
      ...RN.Platform,
      OS: 'ios', // Default to iOS, can be overridden in tests
      Version: '16.0',
      select: jest.fn((platforms) => {
        const currentPlatform = RN.Platform.OS || 'ios';
        return platforms[currentPlatform] || platforms.default;
      }),
    },
    Dimensions: {
      ...RN.Dimensions,
      get: jest.fn(() => ({
        width: 375,
        height: 667,
        scale: 2,
        fontScale: 1,
      })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    StatusBar: {
      setBarStyle: jest.fn(),
      setBackgroundColor: jest.fn(),
      setTranslucent: jest.fn(),
      setHidden: jest.fn(),
    },
    InteractionManager: {
      runAfterInteractions: jest.fn((callback) => {
        setTimeout(callback, 0);
        return { cancel: jest.fn() };
      }),
      createInteractionHandle: jest.fn(() => 1),
      clearInteractionHandle: jest.fn(),
    },
  };
});

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    appOwnership: 'standalone',
    deviceName: 'Test Device',
    deviceYearClass: 2020,
    experienceUrl: 'exp://test.app',
    expoVersion: '49.0.0',
    isDevice: true,
    platform: {
      ios: {
        buildNumber: '1',
        platform: 'ios',
        systemVersion: '16.0',
      },
      android: {
        versionCode: 1,
        platform: 'android',
        systemVersion: '13',
      },
    },
    statusBarHeight: 44,
    systemFonts: ['System'],
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  brand: 'Apple',
  manufacturer: 'Apple',
  modelName: 'iPhone 12',
  modelId: 'iPhone13,2',
  deviceName: 'Test iPhone',
  deviceType: 1,
  osName: 'iOS',
  osVersion: '16.0',
  platformApiLevel: null,
  deviceYearClass: 2020,
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: jest.fn(() => null),
  setStatusBarStyle: jest.fn(),
  setStatusBarBackgroundColor: jest.fn(),
  setStatusBarTranslucent: jest.fn(),
  setStatusBarHidden: jest.fn(),
}));

// Mock navigation modules
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    canGoBack: jest.fn(() => true),
    getState: jest.fn(() => ({
      index: 0,
      routes: [{ name: 'ScanStack', key: 'scan-key' }],
    })),
    dispatch: jest.fn(),
    setParams: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    removeListener: jest.fn(),
    isFocused: jest.fn(() => true),
  }),
  useRoute: () => ({
    key: 'test-route-key',
    name: 'TestScreen',
    params: {},
  }),
  useFocusEffect: jest.fn((callback) => {
    callback();
  }),
  useIsFocused: jest.fn(() => true),
  NavigationContainer: ({ children }: any) => children,
  DefaultTheme: {
    dark: false,
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      card: '#FFFFFF',
      text: '#000000',
      border: '#E5E5E5',
      notification: '#FF3B30',
    },
  },
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock storage modules
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

// Mock camera and barcode scanner
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Constants: {
      Type: {
        back: 'back',
        front: 'front',
      },
      FlashMode: {
        on: 'on',
        off: 'off',
        auto: 'auto',
        torch: 'torch',
      },
    },
  },
}));

jest.mock('expo-barcode-scanner', () => ({
  BarCodeScanner: {
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    Constants: {
      BarCodeType: {
        qr: 'qr',
        pdf417: 'pdf417',
        aztec: 'aztec',
        ean13: 'ean13',
        ean8: 'ean8',
        upc_e: 'upc_e',
        code39: 'code39',
        code93: 'code93',
        code128: 'code128',
        codabar: 'codabar',
        itf14: 'itf14',
        interleaved2of5: 'interleaved2of5',
      },
    },
  },
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color, ...props }: any) => {
    const MockIcon = require('react-native').Text;
    return MockIcon({ children: name, ...props });
  },
  MaterialIcons: ({ name, size, color, ...props }: any) => {
    const MockIcon = require('react-native').Text;
    return MockIcon({ children: name, ...props });
  },
  FontAwesome: ({ name, size, color, ...props }: any) => {
    const MockIcon = require('react-native').Text;
    return MockIcon({ children: name, ...props });
  },
}));

// Mock React Native Paper
jest.mock('react-native-paper', () => ({
  Button: ({ children, onPress, ...props }: any) => {
    const MockButton = require('react-native').TouchableOpacity;
    const MockText = require('react-native').Text;
    return MockButton({ onPress, ...props, children: MockText({ children }) });
  },
  Card: ({ children, ...props }: any) => {
    const MockView = require('react-native').View;
    return MockView({ ...props, children });
  },
  Text: ({ children, ...props }: any) => {
    const MockText = require('react-native').Text;
    return MockText({ ...props, children });
  },
  Surface: ({ children, ...props }: any) => {
    const MockView = require('react-native').View;
    return MockView({ ...props, children });
  },
  ActivityIndicator: (props: any) => {
    const MockView = require('react-native').View;
    return MockView(props);
  },
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  }),
  useSafeAreaFrame: () => ({
    x: 0,
    y: 0,
    width: 375,
    height: 667,
  }),
}));

// Mock gesture handler
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  PanGestureHandler: ({ children }: any) => children,
  TapGestureHandler: ({ children }: any) => children,
  State: {
    BEGAN: 'BEGAN',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    ACTIVE: 'ACTIVE',
    END: 'END',
  },
}));

// Mock reanimated
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  withTiming: jest.fn((value) => value),
  withSpring: jest.fn((value) => value),
  runOnJS: jest.fn((fn) => fn),
}));

// Global test utilities
global.mockPlatform = (platform: 'ios' | 'android', version?: string | number) => {
  const RN = require('react-native');
  RN.Platform.OS = platform;
  RN.Platform.Version = version || (platform === 'ios' ? '16.0' : 33);
};

global.mockScreenDimensions = (width: number, height: number, scale: number = 2) => {
  const RN = require('react-native');
  RN.Dimensions.get.mockReturnValue({
    width,
    height,
    scale,
    fontScale: 1,
  });
};

// Performance monitoring utilities
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Console utilities for test debugging
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset platform to iOS by default
  global.mockPlatform('ios');
  
  // Reset screen dimensions to iPhone default
  global.mockScreenDimensions(375, 667);
  
  // Clear all mocks
  jest.clearAllMocks();
});

afterEach(() => {
  // Clean up any test-specific mocks
  jest.restoreAllMocks();
});

// Suppress specific warnings during testing
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
     args[0].includes('Warning: componentWillReceiveProps has been renamed') ||
     args[0].includes('Warning: componentWillMount has been renamed'))
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};

console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('expo-constants') ||
     args[0].includes('expo-device') ||
     args[0].includes('react-native-paper'))
  ) {
    return;
  }
  originalConsoleWarn.call(console, ...args);
};

// Export test utilities
export const testUtils = {
  mockPlatform: global.mockPlatform,
  mockScreenDimensions: global.mockScreenDimensions,
  
  // Platform-specific test helpers
  runOnBothPlatforms: (testFn: (platform: 'ios' | 'android') => void) => {
    ['ios', 'android'].forEach((platform) => {
      describe(`on ${platform}`, () => {
        beforeEach(() => {
          global.mockPlatform(platform as 'ios' | 'android');
        });
        
        testFn(platform as 'ios' | 'android');
      });
    });
  },
  
  // Screen size test helpers
  runOnDifferentScreenSizes: (testFn: (size: { width: number; height: number; name: string }) => void) => {
    const screenSizes = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 360, height: 640, name: 'Android Small' },
      { width: 412, height: 869, name: 'Android Large' },
    ];
    
    screenSizes.forEach((size) => {
      describe(`on ${size.name} (${size.width}x${size.height})`, () => {
        beforeEach(() => {
          global.mockScreenDimensions(size.width, size.height);
        });
        
        testFn(size);
      });
    });
  },
};