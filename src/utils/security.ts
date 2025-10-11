// Security utilities for the SMARTIES application
export class SecurityUtils {
  // Generate secure random string for session IDs, etc.
  static generateSecureId(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Simple rate limiting for API calls
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (key: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(key)) {
        requests.set(key, []);
      }
      
      const keyRequests = requests.get(key)!;
      
      // Remove old requests outside the window
      const validRequests = keyRequests.filter(time => time > windowStart);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(key, validRequests);
      return true;
    };
  }

  // Mask sensitive data for logging
  static maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars * 2) {
      return '*'.repeat(data.length);
    }
    
    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - (visibleChars * 2));
    
    return `${start}${middle}${end}`;
  }

  // Validate API key format
  static isValidApiKey(key: string, prefix: string): boolean {
    return key.startsWith(prefix) && key.length > prefix.length + 10;
  }

  // Check for common security issues in user input
  static detectSecurityThreats(input: string): string[] {
    const threats: string[] = [];
    
    // Check for SQL injection patterns
    if (/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION)\b)/i.test(input)) {
      threats.push('Potential SQL injection');
    }
    
    // Check for XSS patterns
    if (/<script|javascript:|on\w+\s*=/i.test(input)) {
      threats.push('Potential XSS attack');
    }
    
    // Check for path traversal
    if (/\.\.\/|\.\.\\/.test(input)) {
      threats.push('Potential path traversal');
    }
    
    return threats;
  }
}

// Rate limiters for different operations
export const rateLimiters = {
  // API calls: 100 requests per minute
  apiCalls: SecurityUtils.createRateLimiter(100, 60 * 1000),
  
  // Barcode scans: 30 scans per minute
  barcodeScans: SecurityUtils.createRateLimiter(30, 60 * 1000),
  
  // User profile updates: 10 updates per hour
  profileUpdates: SecurityUtils.createRateLimiter(10, 60 * 60 * 1000)
};
