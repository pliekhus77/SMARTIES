import { config } from '../../config/config';

// HTTP client configuration with security best practices
export interface HttpClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  validateStatus?: (status: number) => boolean;
}

// Secure HTTP client class
export class SecureHttpClient {
  private config: HttpClientConfig;

  constructor(baseConfig: Partial<HttpClientConfig> = {}) {
    this.config = {
      baseURL: '',
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SMARTIES/1.0.0',
        'Accept': 'application/json'
      },
      validateStatus: (status) => status >= 200 && status < 300,
      ...baseConfig
    };

    // Ensure HTTPS for production
    if (config.app.nodeEnv === 'production' && this.config.baseURL.startsWith('http://')) {
      throw new Error('HTTPS required in production environment');
    }
  }

  async get<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
    return this.request<T>('GET', url, undefined, headers);
  }

  async post<T>(url: string, data?: unknown, headers: Record<string, string> = {}): Promise<T> {
    return this.request<T>('POST', url, data, headers);
  }

  async put<T>(url: string, data?: unknown, headers: Record<string, string> = {}): Promise<T> {
    return this.request<T>('PUT', url, data, headers);
  }

  async delete<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
    return this.request<T>('DELETE', url, undefined, headers);
  }

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    additionalHeaders: Record<string, string> = {}
  ): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
    
    // Validate URL is HTTPS in production
    if (config.app.nodeEnv === 'production' && !fullUrl.startsWith('https://')) {
      throw new Error('HTTPS required for all API calls in production');
    }

    const headers = { ...this.config.headers, ...additionalHeaders };
    
    // Remove sensitive headers from logs
    const logHeaders = { ...headers };
    if (logHeaders.Authorization) logHeaders.Authorization = '[REDACTED]';
    
    console.log(`${method} ${fullUrl}`, { headers: logHeaders });

    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        // Add security headers
        mode: 'cors',
        credentials: 'omit', // Don't send cookies
      });

      if (!this.config.validateStatus!(response.status)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData as T;
    } catch (error) {
      console.error(`API request failed: ${method} ${fullUrl}`, error);
      throw error;
    }
  }
}

// Pre-configured clients for different services
export const openFoodFactsClient = new SecureHttpClient({
  baseURL: config.apis.openFoodFactsUrl,
  timeout: 15000
});

export const openAIClient = new SecureHttpClient({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${config.ai.openaiApiKey}`,
    'Content-Type': 'application/json'
  }
});

export const anthropicClient = new SecureHttpClient({
  baseURL: 'https://api.anthropic.com/v1',
  headers: {
    'x-api-key': config.ai.anthropicApiKey,
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01'
  }
});
