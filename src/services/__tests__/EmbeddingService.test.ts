/**
 * Unit tests for HuggingFace Embedding Service
 * Tests embedding generation, caching, and batch processing functionality
 */

import { HuggingFaceEmbeddingService, createEmbeddingService } from '../EmbeddingService';
import {
  EmbeddingRequest,
  EmbeddingServiceError,
  validateEmbeddingText,
  validateEmbedding,
  validateBatchRequests
} from '../../types/EmbeddingService';

// Mock child_process to avoid actual Python execution in tests
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    access: jest.fn()
  }
}));

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
const mockFsAccess = fs.access as jest.MockedFunction<typeof fs.access>;

describe('EmbeddingService', () => {
  let service: HuggingFaceEmbeddingService;
  let mockPythonProcess: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful file access
    mockFsAccess.mockResolvedValue(undefined);
    
    // Create mock Python process
    mockPythonProcess = {
      stdout: {
        on: jest.fn()
      },
      stderr: {
        on: jest.fn()
      },
      on: jest.fn(),
      kill: jest.fn()
    };
    
    mockSpawn.mockReturnValue(mockPythonProcess);
    
    // Create service instance with long cleanup interval to avoid timer issues in tests
    service = new HuggingFaceEmbeddingService({
      timeout_seconds: 5,
      max_retries: 1,
      cache_config: {
        max_entries: 100,
        ttl_hours: 1,
        cleanup_interval_minutes: 60, // Long interval to avoid interference
        memory_limit_mb: 10
      }
    });
  });

  afterEach(async () => {
    if (service) {
      await service.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid Python service', async () => {
      // Mock successful model info response
      mockPythonProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => {
            callback(0); // Success exit code
          }, 10);
        }
      });

      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              model_name: 'all-MiniLM-L6-v2',
              embedding_dimension: 384,
              max_sequence_length: 256,
              is_loaded: true
            }));
          }, 5);
        }
      });

      await service.initialize();
      expect(service.isReady()).toBe(true);
    });

    it('should throw error if Python service is not accessible', async () => {
      mockFsAccess.mockRejectedValue(new Error('File not found'));

      await expect(service.initialize()).rejects.toThrow(EmbeddingServiceError);
    });

    it('should throw error if Python service fails to load model', async () => {
      mockPythonProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => {
            callback(1); // Error exit code
          }, 10);
        }
      });

      mockPythonProcess.stderr.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback('Model loading failed');
          }, 5);
        }
      });

      await expect(service.initialize()).rejects.toThrow(EmbeddingServiceError);
    });
  });

  describe('Single Embedding Generation', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockPythonProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              model_name: 'all-MiniLM-L6-v2',
              embedding_dimension: 384,
              is_loaded: true
            }));
          }, 5);
        }
      });

      await service.initialize();
    });

    it('should generate ingredient embedding successfully', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      
      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              embedding: mockEmbedding
            }));
          }, 5);
        }
      });

      const embedding = await service.generateIngredientEmbedding('wheat flour, sugar, eggs');
      
      expect(embedding).toHaveLength(384);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should generate product name embedding successfully', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      
      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              embedding: mockEmbedding
            }));
          }, 5);
        }
      });

      const embedding = await service.generateProductNameEmbedding('Chocolate Chip Cookies');
      
      expect(embedding).toHaveLength(384);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should generate allergen embedding successfully', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      
      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              embedding: mockEmbedding
            }));
          }, 5);
        }
      });

      const embedding = await service.generateAllergenEmbedding(['wheat', 'eggs', 'milk']);
      
      expect(embedding).toHaveLength(384);
      expect(embedding.every(val => typeof val === 'number')).toBe(true);
    });

    it('should throw validation error for empty text', async () => {
      await expect(service.generateIngredientEmbedding('')).rejects.toThrow(EmbeddingServiceError);
      await expect(service.generateProductNameEmbedding('')).rejects.toThrow(EmbeddingServiceError);
    });

    it('should throw error if service not initialized', async () => {
      const uninitializedService = new HuggingFaceEmbeddingService();
      
      await expect(uninitializedService.generateIngredientEmbedding('test')).rejects.toThrow(EmbeddingServiceError);
    });
  });

  describe('Batch Processing', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockPythonProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              model_name: 'all-MiniLM-L6-v2',
              embedding_dimension: 384,
              is_loaded: true
            }));
          }, 5);
        }
      });

      await service.initialize();
    });

    it('should process batch requests successfully', async () => {
      const requests: EmbeddingRequest[] = [
        { id: '1', text: 'wheat flour, sugar', type: 'ingredient' },
        { id: '2', text: 'Chocolate Cookies', type: 'product_name' },
        { id: '3', text: 'wheat, milk', type: 'allergen' }
      ];

      const mockEmbeddings = [
        new Array(384).fill(0).map(() => Math.random()),
        new Array(384).fill(0).map(() => Math.random()),
        new Array(384).fill(0).map(() => Math.random())
      ];

      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              embeddings: mockEmbeddings
            }));
          }, 5);
        }
      });

      const responses = await service.generateEmbeddingsBatch(requests);

      expect(responses).toHaveLength(3);
      expect(responses.every(r => r.success)).toBe(true);
      expect(responses.every(r => r.embedding.length === 384)).toBe(true);
    });

    it('should validate batch requests', async () => {
      const invalidRequests: EmbeddingRequest[] = [
        { id: '', text: 'test', type: 'ingredient' }, // Empty ID
        { id: '2', text: '', type: 'product_name' }, // Empty text
        { id: '3', text: 'test', type: 'invalid' as any } // Invalid type
      ];

      await expect(service.generateEmbeddingsBatch(invalidRequests)).rejects.toThrow(EmbeddingServiceError);
    });

    it('should handle duplicate IDs in batch', async () => {
      const duplicateRequests: EmbeddingRequest[] = [
        { id: '1', text: 'test1', type: 'ingredient' },
        { id: '1', text: 'test2', type: 'product_name' } // Duplicate ID
      ];

      await expect(service.generateEmbeddingsBatch(duplicateRequests)).rejects.toThrow(EmbeddingServiceError);
    });
  });

  describe('Caching', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockPythonProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              model_name: 'all-MiniLM-L6-v2',
              embedding_dimension: 384,
              is_loaded: true
            }));
          }, 5);
        }
      });

      await service.initialize();
    });

    it('should cache embeddings and return cached results', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());
      let callCount = 0;

      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          callCount++;
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              embedding: mockEmbedding
            }));
          }, 5);
        }
      });

      // First call should generate embedding
      const embedding1 = await service.generateIngredientEmbedding('wheat flour');
      expect(embedding1).toEqual(mockEmbedding);

      // Second call should return cached result
      const embedding2 = await service.generateIngredientEmbedding('wheat flour');
      expect(embedding2).toEqual(mockEmbedding);

      // Should have only called Python service once
      expect(callCount).toBe(1);

      const stats = service.getStats();
      expect(stats.cache_hits).toBe(1);
      expect(stats.cache_misses).toBe(1);
    });

    it('should clear cache when requested', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random());

      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              embedding: mockEmbedding
            }));
          }, 5);
        }
      });

      // Generate and cache embedding
      await service.generateIngredientEmbedding('wheat flour');

      // Clear cache
      await service.clearCache();

      // Check cache stats
      const cacheStats = service.getCacheStats();
      expect(cacheStats.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      // Mock successful initialization
      mockPythonProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback(JSON.stringify({
              success: true,
              model_name: 'all-MiniLM-L6-v2',
              embedding_dimension: 384,
              is_loaded: true
            }));
          }, 5);
        }
      });

      await service.initialize();
    });

    it('should handle Python process errors', async () => {
      mockPythonProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => {
            callback(new Error('Python process failed'));
          }, 5);
        }
      });

      await expect(service.generateIngredientEmbedding('test')).rejects.toThrow(EmbeddingServiceError);
    });

    it('should handle invalid JSON response', async () => {
      mockPythonProcess.stdout.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'data') {
          setTimeout(() => {
            callback('invalid json response');
          }, 5);
        }
      });

      mockPythonProcess.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
      });

      await expect(service.generateIngredientEmbedding('test')).rejects.toThrow(EmbeddingServiceError);
    });
  });

  describe('Statistics', () => {
    it('should track embedding generation statistics', async () => {
      const initialStats = service.getStats();
      expect(initialStats.total_requests).toBe(0);
      expect(initialStats.cache_hits).toBe(0);
      expect(initialStats.cache_misses).toBe(0);
    });

    it('should provide cache statistics', () => {
      const cacheStats = service.getCacheStats();
      expect(cacheStats).toHaveProperty('size');
      expect(cacheStats).toHaveProperty('hit_rate');
      expect(cacheStats).toHaveProperty('memory_usage_mb');
      expect(cacheStats).toHaveProperty('oldest_entry');
    });
  });
});

describe('Validation Functions', () => {
  describe('validateEmbeddingText', () => {
    it('should validate correct text', () => {
      const result = validateEmbeddingText('wheat flour, sugar');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty text', () => {
      const result = validateEmbeddingText('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject text that is too long', () => {
      const longText = 'a'.repeat(300);
      const result = validateEmbeddingText(longText, 256);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject non-string input', () => {
      const result = validateEmbeddingText(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateEmbedding', () => {
    it('should validate correct embedding', () => {
      const embedding = new Array(384).fill(0).map(() => Math.random());
      const result = validateEmbedding(embedding);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject wrong dimension', () => {
      const embedding = new Array(256).fill(0).map(() => Math.random());
      const result = validateEmbedding(embedding, 384);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject non-array input', () => {
      const result = validateEmbedding('not an array' as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject embedding with NaN values', () => {
      const embedding = [1, 2, NaN, 4];
      const result = validateEmbedding(embedding, 4);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateBatchRequests', () => {
    it('should validate correct batch requests', () => {
      const requests: EmbeddingRequest[] = [
        { id: '1', text: 'wheat flour', type: 'ingredient' },
        { id: '2', text: 'cookies', type: 'product_name' }
      ];
      const result = validateBatchRequests(requests);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty requests array', () => {
      const result = validateBatchRequests([]);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject duplicate IDs', () => {
      const requests: EmbeddingRequest[] = [
        { id: '1', text: 'wheat flour', type: 'ingredient' },
        { id: '1', text: 'cookies', type: 'product_name' }
      ];
      const result = validateBatchRequests(requests);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate ID'))).toBe(true);
    });

    it('should reject invalid embedding types', () => {
      const requests: EmbeddingRequest[] = [
        { id: '1', text: 'wheat flour', type: 'invalid_type' as any }
      ];
      const result = validateBatchRequests(requests);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid embedding type'))).toBe(true);
    });
  });
});

describe('Factory Functions', () => {
  it('should create embedding service with custom config', () => {
    const customConfig = {
      batch_size: 16,
      timeout_seconds: 60
    };

    const service = createEmbeddingService(customConfig);
    expect(service).toBeInstanceOf(HuggingFaceEmbeddingService);
  });
});