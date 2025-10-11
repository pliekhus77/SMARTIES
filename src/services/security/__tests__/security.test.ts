import { CredentialManager, SecureStorage } from '../secureStorage';
import { InputSanitizer, ValidationSchemas, Validator } from '../../../utils/validation';
import { SecurityUtils } from '../../../utils/security';

// Mock configuration
jest.mock('../../../config/config', () => ({
  config: {
    mongodb: {
      uri: 'mongodb://localhost:27017/test',
      database: 'smarties_test'
    },
    ai: {
      openaiApiKey: 'sk-test-key',
      anthropicApiKey: 'sk-ant-test-key'
    },
    apis: {
      openFoodFactsUrl: 'https://world.openfoodfacts.org/api/v0'
    },
    app: {
      nodeEnv: 'test',
      logLevel: 'info'
    }
  }
}));

// Import after mocking
const { SecureHttpClient } = require('../../api/httpClient');

// Mock secure storage for testing
class MockSecureStorage implements SecureStorage {
  private storage = new Map<string, string>();

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async clear(): Promise<void> {
    this.storage.clear();
  }
}

describe('Security Implementation', () => {
  describe('CredentialManager', () => {
    let credentialManager: CredentialManager;

    beforeEach(() => {
      credentialManager = new CredentialManager(new MockSecureStorage());
    });

    it('should store and retrieve credentials', async () => {
      await credentialManager.storeCredential('openai_key', 'sk-test-key');
      const retrieved = await credentialManager.getCredential('openai_key');
      expect(retrieved).toBe('sk-test-key');
    });

    it('should reject invalid credential keys', async () => {
      await expect(credentialManager.storeCredential('invalid_key', 'value'))
        .rejects.toThrow('Invalid credential key');
    });
  });

  describe('InputSanitizer', () => {
    it('should sanitize HTML and script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello';
      const sanitized = InputSanitizer.sanitizeString(malicious);
      expect(sanitized).toBe('Hello');
      expect(sanitized).not.toContain('<script>');
    });

    it('should sanitize special characters', () => {
      const input = 'Test <>&"\' input';
      const sanitized = InputSanitizer.sanitizeString(input);
      expect(sanitized).toBe('Test &lt;&gt;&amp;&quot;&#x27; input');
    });

    it('should sanitize barcodes to digits only', () => {
      const barcode = 'abc123def456';
      const sanitized = InputSanitizer.sanitizeBarcode(barcode);
      expect(sanitized).toBe('123456');
    });
  });

  describe('Validator', () => {
    it('should validate email addresses', () => {
      expect(Validator.isValidEmail('test@example.com')).toBe(true);
      expect(Validator.isValidEmail('invalid-email')).toBe(false);
    });

    it('should validate barcodes', () => {
      expect(Validator.isValidBarcode('12345678')).toBe(true); // 8 digits - minimum
      expect(Validator.isValidBarcode('1234567890123')).toBe(true); // 13 digits - UPC
      expect(Validator.isValidBarcode('abc123')).toBe(false);
      expect(Validator.isValidBarcode('123')).toBe(false); // too short
    });

    it('should throw validation errors with messages', () => {
      expect(() => Validator.validateInput(ValidationSchemas.email, 'invalid'))
        .toThrow('Validation failed');
    });
  });

  describe('SecurityUtils', () => {
    it('should generate secure random IDs', () => {
      const id1 = SecurityUtils.generateSecureId();
      const id2 = SecurityUtils.generateSecureId();
      
      expect(id1).toHaveLength(32);
      expect(id2).toHaveLength(32);
      expect(id1).not.toBe(id2);
    });

    it('should mask sensitive data', () => {
      const apiKey = 'sk-1234567890abcdef';
      const masked = SecurityUtils.maskSensitiveData(apiKey);
      
      expect(masked).toMatch(/^sk-1.*cdef$/);
      expect(masked).toContain('*');
    });

    it('should validate API key formats', () => {
      expect(SecurityUtils.isValidApiKey('sk-1234567890abcdef', 'sk-')).toBe(true);
      expect(SecurityUtils.isValidApiKey('invalid-key', 'sk-')).toBe(false);
      expect(SecurityUtils.isValidApiKey('sk-123', 'sk-')).toBe(false);
    });

    it('should detect security threats', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const xss = '<script>alert("xss")</script>';
      const pathTraversal = '../../../etc/passwd';

      expect(SecurityUtils.detectSecurityThreats(sqlInjection)).toContain('Potential SQL injection');
      expect(SecurityUtils.detectSecurityThreats(xss)).toContain('Potential XSS attack');
      expect(SecurityUtils.detectSecurityThreats(pathTraversal)).toContain('Potential path traversal');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', () => {
      const limiter = SecurityUtils.createRateLimiter(2, 1000); // 2 requests per second
      
      expect(limiter('user1')).toBe(true);  // First request
      expect(limiter('user1')).toBe(true);  // Second request
      expect(limiter('user1')).toBe(false); // Third request - should be blocked
    });

    it('should allow requests after window expires', async () => {
      const limiter = SecurityUtils.createRateLimiter(1, 100); // 1 request per 100ms
      
      expect(limiter('user1')).toBe(true);
      expect(limiter('user1')).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(limiter('user1')).toBe(true);
    });
  });
});
