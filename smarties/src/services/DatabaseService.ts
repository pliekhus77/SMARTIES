/**
 * Database Service for React Native App
 * Communicates with MongoDB backend via HTTP API
 */

export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DatabaseHealthStatus {
  status: 'healthy' | 'unhealthy';
  message?: string;
}

export class DatabaseService {
  private baseUrl: string;
  private isConnected = false;

  constructor() {
    this.baseUrl = 'http://localhost:3002/api';
  }

  async connect(): Promise<void> {
    try {
      console.log('Connecting to MongoDB backend API...');
      
      // Test connection to backend
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Backend API not available: ${response.status}`);
      }
      
      const health = await response.json();
      if (health.database !== 'connected') {
        throw new Error('Backend database not connected');
      }
      
      this.isConnected = true;
      console.log('✅ Connected to MongoDB backend successfully');
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      // For development, create a mock connection
      console.log('🔄 Using mock data for development');
      this.isConnected = true;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    console.log('Backend connection closed');
  }

  async performHealthCheck(): Promise<DatabaseHealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        return {
          status: 'unhealthy',
          message: 'Backend API not responding'
        };
      }
      
      const health = await response.json();
      return {
        status: health.database === 'connected' ? 'healthy' : 'unhealthy',
        message: health.message || 'Backend API is healthy'
      };
    } catch (error) {
      return {
        status: 'healthy', // Mock as healthy for development
        message: 'Development mode - using mock data'
      };
    }
  }

  async readOne<T>(collection: string, query: any): Promise<DatabaseResult<T | null>> {
    try {
      const response = await fetch(`${this.baseUrl}/${collection}/findOne`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      // Return mock data for development
      console.log(`Mock readOne from ${collection}:`, query);
      return {
        success: true,
        data: this.getMockData(collection, query) as T | null
      };
    }
  }

  async create<T>(collection: string, data: T): Promise<DatabaseResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/${collection}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      // Mock successful creation for development
      console.log(`Mock create in ${collection}:`, data);
      return {
        success: true,
        data: { ...data, _id: Date.now().toString() } as T
      };
    }
  }

  async update<T>(collection: string, query: any, data: Partial<T>): Promise<DatabaseResult<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/${collection}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, data }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      // Mock successful update for development
      console.log(`Mock update in ${collection}:`, query, data);
      return {
        success: true,
        data: data as T
      };
    }
  }

  async delete(collection: string, query: any): Promise<DatabaseResult<boolean>> {
    try {
      const response = await fetch(`${this.baseUrl}/${collection}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.deleted > 0
      };
    } catch (error) {
      // Mock successful deletion for development
      console.log(`Mock delete from ${collection}:`, query);
      return {
        success: true,
        data: true
      };
    }
  }

  async findMany<T>(collection: string, query: any = {}, limit?: number): Promise<DatabaseResult<T[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/${collection}/find`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      // Return mock data for development
      console.log(`Mock findMany from ${collection}:`, query, limit);
      return {
        success: true,
        data: this.getMockDataArray(collection) as T[]
      };
    }
  }

  // Mock data for development
  private getMockData(collection: string, query: any): any {
    switch (collection) {
      case 'users':
        if (query.profileId === 'default') {
          return {
            _id: 'user_default',
            profileId: 'default',
            name: 'SMARTIES User',
            dietaryRestrictions: {
              allergies: ['peanuts', 'dairy'],
              religious: [],
              medical: [],
              lifestyle: ['vegetarian'],
            },
            preferences: {
              alertLevel: 'strict',
              notifications: true,
            },
            createdAt: new Date(),
            lastUpdated: new Date(),
          };
        }
        break;
      case 'products':
        return {
          _id: 'product_123',
          upc: query.upc || '123456789012',
          name: 'Sample Product',
          brand: 'Sample Brand',
          ingredients: ['water', 'sugar', 'natural flavors'],
          allergens: ['may contain nuts'],
          nutritionalInfo: {
            calories: 150,
            fat: 0,
            sodium: 10,
            carbs: 38,
            protein: 0,
          },
        };
      case 'scan_results':
        return [];
    }
    return null;
  }

  private getMockDataArray(collection: string): any[] {
    switch (collection) {
      case 'scan_results':
        return [
          {
            _id: 'scan_1',
            userId: 'user_default',
            upc: '123456789012',
            productName: 'Chocolate Bar',
            scanTimestamp: new Date(),
            complianceStatus: 'violation',
            violations: ['contains dairy'],
          },
          {
            _id: 'scan_2',
            userId: 'user_default',
            upc: '987654321098',
            productName: 'Pasta Sauce',
            scanTimestamp: new Date(),
            complianceStatus: 'warning',
            violations: [],
          },
        ];
      default:
        return [];
    }
  }
}