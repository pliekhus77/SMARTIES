import { z } from 'zod';

// Secure storage interface for credentials
export interface SecureStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Mock implementation for development (would use react-native-keychain in production)
class DevSecureStorage implements SecureStorage {
  private storage = new Map<string, string>();

  async setItem(key: string, value: string): Promise<void> {
    if (!key || !value) {
      throw new Error('Key and value are required');
    }
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

// Credential management service
export class CredentialManager {
  constructor(private storage: SecureStorage) {}

  async storeCredential(key: string, value: string): Promise<void> {
    if (!this.isValidCredentialKey(key)) {
      throw new Error('Invalid credential key');
    }
    await this.storage.setItem(key, value);
  }

  async getCredential(key: string): Promise<string | null> {
    if (!this.isValidCredentialKey(key)) {
      throw new Error('Invalid credential key');
    }
    return await this.storage.getItem(key);
  }

  async removeCredential(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }

  private isValidCredentialKey(key: string): boolean {
    const validKeys = ['mongodb_uri', 'openai_key', 'anthropic_key', 'user_token'];
    return validKeys.includes(key);
  }
}

// Export singleton instance
export const credentialManager = new CredentialManager(new DevSecureStorage());
