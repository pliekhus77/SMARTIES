// Cross-platform testing utilities for SMARTIES

export interface PlatformInfo {
  os: 'ios' | 'android' | 'web';
  version: string;
  device: string;
  screenSize: { width: number; height: number };
}

export class PlatformTestUtils {
  // Mock platform detection for testing
  static getCurrentPlatform(): PlatformInfo {
    // In a real React Native app, this would use Platform.OS
    const mockPlatform = process.env.TEST_PLATFORM || 'ios';
    
    const platforms: Record<string, PlatformInfo> = {
      ios: {
        os: 'ios',
        version: '17.0',
        device: 'iPhone 15',
        screenSize: { width: 393, height: 852 },
      },
      android: {
        os: 'android',
        version: '14',
        device: 'Pixel 8',
        screenSize: { width: 412, height: 915 },
      },
      web: {
        os: 'web',
        version: '1.0',
        device: 'Browser',
        screenSize: { width: 1024, height: 768 },
      },
    };

    return platforms[mockPlatform] || platforms.ios;
  }

  // Platform-specific feature availability
  static isFeatureAvailable(feature: string): boolean {
    const platform = this.getCurrentPlatform();
    
    const featureSupport: Record<string, Record<string, boolean>> = {
      camera: { ios: true, android: true, web: false },
      barcode_scanner: { ios: true, android: true, web: false },
      push_notifications: { ios: true, android: true, web: true },
      biometric_auth: { ios: true, android: true, web: false },
      file_system: { ios: true, android: true, web: false },
      background_sync: { ios: true, android: true, web: false },
    };

    return featureSupport[feature]?.[platform.os] ?? false;
  }

  // Platform-specific UI dimensions
  static getScreenDimensions(): { width: number; height: number } {
    return this.getCurrentPlatform().screenSize;
  }

  // Platform-specific permissions
  static async requestPermission(permission: string): Promise<boolean> {
    const platform = this.getCurrentPlatform();
    
    // Simulate permission request behavior
    const permissionResults: Record<string, Record<string, boolean>> = {
      camera: { ios: true, android: true, web: false },
      location: { ios: true, android: true, web: true },
      notifications: { ios: true, android: true, web: true },
    };

    const granted = permissionResults[permission]?.[platform.os] ?? false;
    
    // Simulate async permission request
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return granted;
  }

  // Platform-specific storage paths
  static getStoragePath(type: 'cache' | 'documents' | 'temp'): string {
    const platform = this.getCurrentPlatform();
    
    const storagePaths: Record<string, Record<string, string>> = {
      cache: {
        ios: '/var/mobile/Containers/Data/Application/cache',
        android: '/data/data/com.smarties/cache',
        web: 'localStorage',
      },
      documents: {
        ios: '/var/mobile/Containers/Data/Application/Documents',
        android: '/data/data/com.smarties/files',
        web: 'indexedDB',
      },
      temp: {
        ios: '/tmp',
        android: '/data/data/com.smarties/cache/tmp',
        web: 'sessionStorage',
      },
    };

    return storagePaths[type][platform.os];
  }

  // Platform-specific performance characteristics
  static getPerformanceProfile(): {
    cpuCores: number;
    memoryMB: number;
    diskSpeedMBps: number;
    networkLatencyMs: number;
  } {
    const platform = this.getCurrentPlatform();
    
    const profiles: Record<string, any> = {
      ios: {
        cpuCores: 6,
        memoryMB: 8192,
        diskSpeedMBps: 1000,
        networkLatencyMs: 50,
      },
      android: {
        cpuCores: 8,
        memoryMB: 12288,
        diskSpeedMBps: 800,
        networkLatencyMs: 60,
      },
      web: {
        cpuCores: 4,
        memoryMB: 4096,
        diskSpeedMBps: 500,
        networkLatencyMs: 100,
      },
    };

    return profiles[platform.os];
  }

  // Test environment setup for specific platform
  static setupPlatformEnvironment(platform: 'ios' | 'android' | 'web'): void {
    process.env.TEST_PLATFORM = platform;
    
    // Mock platform-specific globals
    if (platform === 'ios') {
      (global as any).navigator = {
        userAgent: 'iPhone',
        platform: 'iPhone',
      };
    } else if (platform === 'android') {
      (global as any).navigator = {
        userAgent: 'Android',
        platform: 'Android',
      };
    } else {
      (global as any).navigator = {
        userAgent: 'Mozilla/5.0 (Web)',
        platform: 'Web',
      };
    }
  }

  // Cleanup platform environment
  static cleanupPlatformEnvironment(): void {
    delete process.env.TEST_PLATFORM;
    delete (global as any).navigator;
  }
}

// Platform-specific test decorators
export function testOnPlatform(platform: 'ios' | 'android' | 'web') {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const originalPlatform = process.env.TEST_PLATFORM;
      
      try {
        PlatformTestUtils.setupPlatformEnvironment(platform);
        return originalMethod.apply(this, args);
      } finally {
        if (originalPlatform) {
          process.env.TEST_PLATFORM = originalPlatform;
        } else {
          PlatformTestUtils.cleanupPlatformEnvironment();
        }
      }
    };
    
    return descriptor;
  };
}

// Cross-platform test runner
export class CrossPlatformTestRunner {
  static async runOnAllPlatforms<T>(
    testFn: () => Promise<T>,
    platforms: Array<'ios' | 'android' | 'web'> = ['ios', 'android']
  ): Promise<Record<string, T | Error>> {
    const results: Record<string, T | Error> = {};
    
    for (const platform of platforms) {
      try {
        PlatformTestUtils.setupPlatformEnvironment(platform);
        results[platform] = await testFn();
      } catch (error) {
        results[platform] = error as Error;
      } finally {
        PlatformTestUtils.cleanupPlatformEnvironment();
      }
    }
    
    return results;
  }

  static async runOnPlatform<T>(
    platform: 'ios' | 'android' | 'web',
    testFn: () => Promise<T>
  ): Promise<T> {
    try {
      PlatformTestUtils.setupPlatformEnvironment(platform);
      return await testFn();
    } finally {
      PlatformTestUtils.cleanupPlatformEnvironment();
    }
  }
}
