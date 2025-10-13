import { Alert } from 'react-native';
import { ErrorHandlingService, ErrorType } from '../ErrorHandlingService';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

jest.mock('../../accessibility/AccessibilityService');

describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;

  beforeEach(() => {
    service = new ErrorHandlingService();
    jest.clearAllMocks();
  });

  describe('handleError', () => {
    it('creates error info with correct properties', () => {
      const errorInfo = service.handleError(
        ErrorType.NETWORK_ERROR,
        'Connection failed',
        new Error('Network timeout'),
        { url: 'https://api.example.com' }
      );

      expect(errorInfo.type).toBe(ErrorType.NETWORK_ERROR);
      expect(errorInfo.message).toBe('Connection failed');
      expect(errorInfo.originalError?.message).toBe('Network timeout');
      expect(errorInfo.context.url).toBe('https://api.example.com');
      expect(errorInfo.recoverable).toBe(true);
      expect(errorInfo.timestamp).toBeInstanceOf(Date);
    });

    it('logs error to error log', () => {
      service.handleError(ErrorType.CACHE_ERROR, 'Cache write failed');
      
      const errorLog = service.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].type).toBe(ErrorType.CACHE_ERROR);
    });
  });

  describe('showErrorDialog', () => {
    it('shows simple alert without recovery actions', () => {
      const errorInfo = service.handleError(
        ErrorType.VALIDATION_ERROR,
        'Invalid barcode format'
      );

      service.showErrorDialog(errorInfo);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid Barcode',
        'The barcode format is not valid. Please check and try again.',
        [{ text: 'OK' }]
      );
    });

    it('shows alert with recovery actions', () => {
      const errorInfo = service.handleError(
        ErrorType.CAMERA_PERMISSION_DENIED,
        'Camera access denied'
      );

      const recoveryActions = [
        { label: 'Open Settings', action: jest.fn(), primary: true },
        { label: 'Use Manual Entry', action: jest.fn() },
      ];

      service.showErrorDialog(errorInfo, recoveryActions);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Camera Permission Required',
        'SMARTIES needs camera access to scan barcodes. Please enable camera permissions in your device settings.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Open Settings' }),
          expect.objectContaining({ text: 'Use Manual Entry' }),
        ])
      );
    });
  });

  describe('getRecoveryActions', () => {
    it('returns appropriate actions for camera permission error', () => {
      const errorInfo = service.handleError(
        ErrorType.CAMERA_PERMISSION_DENIED,
        'Permission denied'
      );

      const actions = service.getRecoveryActions(errorInfo);

      expect(actions).toHaveLength(2);
      expect(actions[0].label).toBe('Open Settings');
      expect(actions[0].primary).toBe(true);
      expect(actions[1].label).toBe('Use Manual Entry');
    });

    it('returns retry action for network errors', () => {
      const errorInfo = service.handleError(
        ErrorType.NETWORK_ERROR,
        'Connection failed'
      );

      const actions = service.getRecoveryActions(errorInfo);

      expect(actions.some(action => action.label === 'Retry')).toBe(true);
      expect(actions.some(action => action.label === 'Check Connection')).toBe(true);
    });
  });

  describe('retryWithExponentialBackoff', () => {
    it('succeeds on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await service.retryWithExponentialBackoff(operation, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const result = await service.retryWithExponentialBackoff(operation, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Always fails'));

      await expect(
        service.retryWithExponentialBackoff(operation, 2)
      ).rejects.toThrow('Always fails');

      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('error log management', () => {
    it('maintains error log with size limit', () => {
      // Add more than 50 errors
      for (let i = 0; i < 60; i++) {
        service.handleError(ErrorType.UNKNOWN_ERROR, `Error ${i}`);
      }

      const errorLog = service.getErrorLog();
      expect(errorLog).toHaveLength(50);
      expect(errorLog[0].message).toBe('Error 10'); // First 10 should be removed
    });

    it('clears error log', () => {
      service.handleError(ErrorType.CACHE_ERROR, 'Test error');
      expect(service.getErrorLog()).toHaveLength(1);

      service.clearErrorLog();
      expect(service.getErrorLog()).toHaveLength(0);
    });
  });
});
