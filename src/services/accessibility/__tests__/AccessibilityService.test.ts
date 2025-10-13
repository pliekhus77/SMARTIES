import { AccessibilityInfo } from 'react-native';
import { AccessibilityService } from '../AccessibilityService';

jest.mock('react-native', () => ({
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    announceForAccessibility: jest.fn(),
  },
}));

describe('AccessibilityService', () => {
  let service: AccessibilityService;

  beforeEach(() => {
    jest.clearAllMocks();
    (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(true);
    service = new AccessibilityService();
  });

  it('initializes screen reader detection', async () => {
    expect(AccessibilityInfo.isScreenReaderEnabled).toHaveBeenCalled();
    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
      'screenReaderChanged',
      expect.any(Function)
    );
  });

  it('announces barcode scanning status', () => {
    service.announceBarcodeScanningStatus('ready');
    
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'Camera ready. Position barcode within the viewfinder to scan.'
    );
  });

  it('announces product results', () => {
    service.announceProductResult('Test Product', true);
    
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'Product found: Test Product. Contains allergens. Tap for detailed analysis.'
    );
  });

  it('announces network status changes', () => {
    service.announceNetworkStatus(false);
    
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'No network connection. Using cached data only.'
    );
  });

  it('announces torch status changes', () => {
    service.announceTorchStatus(true);
    
    expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
      'Flashlight turned on'
    );
  });

  it('provides accessibility hints', () => {
    const hints = service.getAccessibilityHints();
    
    expect(hints.cameraView).toContain('Double tap');
    expect(hints.torchButton).toContain('toggle flashlight');
    expect(hints.manualEntryButton).toContain('manually');
  });

  it('cleans up event listeners', () => {
    service.cleanup();
    
    expect(AccessibilityInfo.removeEventListener).toHaveBeenCalledWith(
      'screenReaderChanged',
      expect.any(Function)
    );
  });
});
