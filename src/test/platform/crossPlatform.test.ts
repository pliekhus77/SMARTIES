import { PlatformTestUtils, CrossPlatformTestRunner } from './platformUtils';
import { TestProductBuilder, TestUserProfileBuilder } from '../builders/testDataBuilders';

// Cross-platform service that adapts to different platforms
class CrossPlatformBarcodeService {
  async scanBarcode(): Promise<string> {
    const platform = PlatformTestUtils.getCurrentPlatform();
    
    if (!PlatformTestUtils.isFeatureAvailable('barcode_scanner')) {
      throw new Error(`Barcode scanner not available on ${platform.os}`);
    }

    // Platform-specific scanning behavior
    const scanDelay = platform.os === 'ios' ? 100 : 150;
    await new Promise(resolve => setTimeout(resolve, scanDelay));
    
    const mockBarcodes = ['1234567890123', '9876543210987', '5555555555555'];
    return mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
  }

  async requestPermissions(): Promise<boolean> {
    return await PlatformTestUtils.requestPermission('camera');
  }

  getSupportedFormats(): string[] {
    const platform = PlatformTestUtils.getCurrentPlatform();
    
    const commonFormats = ['UPC-A', 'UPC-E', 'EAN-13', 'EAN-8', 'Code 128', 'QR Code'];
    const androidExtraFormats = ['Code 39', 'Data Matrix'];
    
    return platform.os === 'android' 
      ? [...commonFormats, ...androidExtraFormats]
      : commonFormats;
  }
}

class CrossPlatformStorageService {
  async saveData(key: string, data: any): Promise<void> {
    const platform = PlatformTestUtils.getCurrentPlatform();
    const storagePath = PlatformTestUtils.getStoragePath('documents');
    
    console.log(`Saving data on ${platform.os} to: ${storagePath}`);
    
    // Platform-specific storage delays
    const saveDelay = platform.os === 'ios' ? 50 : 75;
    await new Promise(resolve => setTimeout(resolve, saveDelay));
  }

  async loadData(key: string): Promise<any> {
    const platform = PlatformTestUtils.getCurrentPlatform();
    const storagePath = PlatformTestUtils.getStoragePath('documents');
    
    console.log(`Loading data on ${platform.os} from: ${storagePath}`);
    
    // Platform-specific load delays
    const loadDelay = platform.os === 'ios' ? 30 : 50;
    await new Promise(resolve => setTimeout(resolve, loadDelay));
    
    return { key, platform: platform.os, timestamp: Date.now() };
  }
}

describe('Cross-Platform Functionality Tests', () => {
  let barcodeService: CrossPlatformBarcodeService;
  let storageService: CrossPlatformStorageService;

  beforeEach(() => {
    barcodeService = new CrossPlatformBarcodeService();
    storageService = new CrossPlatformStorageService();
  });

  describe('Platform Comparison', () => {
    it('should detect different platforms correctly', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return PlatformTestUtils.getCurrentPlatform();
      });

      expect(results.ios).toBeDefined();
      expect(results.android).toBeDefined();
      expect((results.ios as any).os).toBe('ios');
      expect((results.android as any).os).toBe('android');
    });

    it('should report different screen dimensions per platform', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return PlatformTestUtils.getScreenDimensions();
      });

      const iosResult = results.ios as any;
      const androidResult = results.android as any;

      expect(iosResult.width).toBe(393);
      expect(iosResult.height).toBe(852);
      expect(androidResult.width).toBe(412);
      expect(androidResult.height).toBe(915);
    });

    it('should report different performance profiles per platform', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return PlatformTestUtils.getPerformanceProfile();
      });

      const iosResult = results.ios as any;
      const androidResult = results.android as any;

      expect(iosResult.cpuCores).toBe(6);
      expect(androidResult.cpuCores).toBe(8);
      expect(iosResult.memoryMB).toBe(8192);
      expect(androidResult.memoryMB).toBe(12288);
    });
  });

  describe('Barcode Scanning Cross-Platform', () => {
    it('should scan barcodes on both platforms', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return await barcodeService.scanBarcode();
      });

      expect(results.ios).toBeDefined();
      expect(results.android).toBeDefined();
      expect(typeof results.ios).toBe('string');
      expect(typeof results.android).toBe('string');
    });

    it('should request permissions on both platforms', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return await barcodeService.requestPermissions();
      });

      expect(results.ios).toBe(true);
      expect(results.android).toBe(true);
    });

    it('should report different supported formats per platform', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return barcodeService.getSupportedFormats();
      });

      const iosFormats = results.ios as string[];
      const androidFormats = results.android as string[];

      expect(iosFormats).toContain('UPC-A');
      expect(androidFormats).toContain('UPC-A');
      expect(androidFormats).toContain('Data Matrix'); // Android-specific
      expect(iosFormats).not.toContain('Data Matrix');
      expect(androidFormats.length).toBeGreaterThan(iosFormats.length);
    });

    it('should handle scanning performance differences', async () => {
      const performanceResults = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        const startTime = Date.now();
        await barcodeService.scanBarcode();
        const endTime = Date.now();
        return endTime - startTime;
      });

      const iosDuration = performanceResults.ios as number;
      const androidDuration = performanceResults.android as number;

      // iOS should be slightly faster
      expect(iosDuration).toBeLessThan(androidDuration);
      expect(iosDuration).toBeLessThan(200);
      expect(androidDuration).toBeLessThan(300);
    });
  });

  describe('Storage Cross-Platform', () => {
    it('should save data on both platforms', async () => {
      const testData = { test: 'data', timestamp: Date.now() };
      
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        await storageService.saveData('test-key', testData);
        return 'success';
      });

      expect(results.ios).toBe('success');
      expect(results.android).toBe('success');
    });

    it('should load data on both platforms', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return await storageService.loadData('test-key');
      });

      const iosResult = results.ios as any;
      const androidResult = results.android as any;

      expect(iosResult.platform).toBe('ios');
      expect(androidResult.platform).toBe('android');
      expect(iosResult.key).toBe('test-key');
      expect(androidResult.key).toBe('test-key');
    });

    it('should use different storage paths per platform', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return {
          documents: PlatformTestUtils.getStoragePath('documents'),
          cache: PlatformTestUtils.getStoragePath('cache'),
        };
      });

      const iosResult = results.ios as any;
      const androidResult = results.android as any;

      expect(iosResult.documents).toContain('Documents');
      expect(androidResult.documents).toContain('/data/data/com.smarties/files');
      expect(iosResult.cache).toContain('cache');
      expect(androidResult.cache).toContain('/data/data/com.smarties/cache');
    });

    it('should handle storage performance differences', async () => {
      const performanceResults = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        const startTime = Date.now();
        await storageService.saveData('perf-test', { data: 'test' });
        await storageService.loadData('perf-test');
        const endTime = Date.now();
        return endTime - startTime;
      });

      const iosDuration = performanceResults.ios as number;
      const androidDuration = performanceResults.android as number;

      // iOS should be faster for storage operations
      expect(iosDuration).toBeLessThan(androidDuration);
      expect(iosDuration).toBeLessThan(150);
      expect(androidDuration).toBeLessThan(200);
    });
  });

  describe('Feature Availability Cross-Platform', () => {
    it('should report consistent core feature availability', async () => {
      const coreFeatures = ['camera', 'barcode_scanner', 'push_notifications'];
      
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return coreFeatures.reduce((acc, feature) => {
          acc[feature] = PlatformTestUtils.isFeatureAvailable(feature);
          return acc;
        }, {} as Record<string, boolean>);
      });

      const iosResult = results.ios as any;
      const androidResult = results.android as any;

      // Core features should be available on both platforms
      coreFeatures.forEach(feature => {
        expect(iosResult[feature]).toBe(true);
        expect(androidResult[feature]).toBe(true);
      });
    });

    it('should handle platform-specific feature differences', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return {
          biometric_auth: PlatformTestUtils.isFeatureAvailable('biometric_auth'),
          file_system: PlatformTestUtils.isFeatureAvailable('file_system'),
          background_sync: PlatformTestUtils.isFeatureAvailable('background_sync'),
        };
      });

      const iosResult = results.ios as any;
      const androidResult = results.android as any;

      // These features should be available on both mobile platforms
      expect(iosResult.biometric_auth).toBe(true);
      expect(androidResult.biometric_auth).toBe(true);
      expect(iosResult.file_system).toBe(true);
      expect(androidResult.file_system).toBe(true);
    });
  });

  describe('Error Handling Cross-Platform', () => {
    it('should handle permission denials consistently', async () => {
      // Mock permission denial for both platforms
      jest.spyOn(PlatformTestUtils, 'requestPermission').mockResolvedValue(false);
      
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        return await barcodeService.requestPermissions();
      });

      expect(results.ios).toBe(false);
      expect(results.android).toBe(false);
      
      jest.restoreAllMocks();
    });

    it('should handle feature unavailability consistently', async () => {
      // Mock feature unavailability
      jest.spyOn(PlatformTestUtils, 'isFeatureAvailable').mockReturnValue(false);
      
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        try {
          await barcodeService.scanBarcode();
          return 'success';
        } catch (error) {
          return (error as Error).message;
        }
      });

      expect(results.ios).toContain('not available on ios');
      expect(results.android).toContain('not available on android');
      
      jest.restoreAllMocks();
    });
  });

  describe('Integration Workflow Cross-Platform', () => {
    it('should complete full scanning workflow on both platforms', async () => {
      const results = await CrossPlatformTestRunner.runOnAllPlatforms(async () => {
        // Simulate complete workflow
        const permissionGranted = await barcodeService.requestPermissions();
        if (!permissionGranted) {
          throw new Error('Permission denied');
        }

        const barcode = await barcodeService.scanBarcode();
        const product = TestProductBuilder.create().withUpc(barcode).build();
        
        await storageService.saveData(`scan_${barcode}`, {
          barcode,
          product,
          timestamp: Date.now(),
        });

        const savedData = await storageService.loadData(`scan_${barcode}`);
        
        return {
          barcode,
          product: product.name,
          saved: !!savedData,
          platform: PlatformTestUtils.getCurrentPlatform().os,
        };
      });

      const iosResult = results.ios as any;
      const androidResult = results.android as any;

      expect(iosResult.barcode).toBeDefined();
      expect(androidResult.barcode).toBeDefined();
      expect(iosResult.saved).toBe(true);
      expect(androidResult.saved).toBe(true);
      expect(iosResult.platform).toBe('ios');
      expect(androidResult.platform).toBe('android');
    });
  });
});
