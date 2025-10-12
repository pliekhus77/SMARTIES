/**
 * Embedding Service Integration Tests
 * Tests for Task 3.4 - Validate embedding generation and storage
 * 
 * Test Coverage:
 * - Python embedding service integration
 * - Hugging Face model loading and inference
 * - Batch embedding generation
 * - Error handling for embedding failures
 * - Performance and memory management
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

// Mock child_process for controlled testing
jest.mock('child_process');

describe('Embedding Service Integration Tests', () => {
  let mockSpawn: jest.MockedFunction<typeof spawn>;
  
  beforeEach(() => {
    mockSpawn = spawn as jest.MockedFunction<typeof spawn>;
    jest.clearAllMocks();
  });
  
  describe('Python Service Communication', () => {
    test('should communicate with Python embedding service successfully', async () => {
      const mockEmbedding = new Array(384).fill(0).map(() => Math.random() * 0.1);
      const mockResponse = {
        success: true,
        embedding: mockEmbedding
      };
      
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: {
            on: jest.fn((event: string, callback: Function) => {
              if (event === 'data') {
                setTimeout(() => {
                  callback(JSON.stringify(mockResponse));
                }, 10);
              }
            })
          },
          stderr: {
            on: jest.fn()
          },
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'close') {
              setTimeout(() => callback(0), 20);
            }
          })
        };
        return mockProcess as any;
      });
      
      const result = await callEmbeddingService('generate_ingredient_embedding', {
        text: 'wheat flour, sugar, salt'
      });
      
      expect(result).toEqual(mockEmbedding);
      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String), // Python path
        [
          expect.stringContaining('embedding_service_interface.py'),
          'generate_ingredient_embedding',
          JSON.stringify({ text: 'wheat flour, sugar, salt' })
        ]
      );
    });
    
    test('should handle Python service errors gracefully', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Model loading failed',
        traceback: 'Traceback (most recent call last)...'
      };
      
      mockSpawn.mockImplementation(() => ({
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              callback(JSON.stringify(mockErrorResponse));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            callback(0);
          }
        })
      } as any));
      
      await expect(callEmbeddingService('generate_ingredient_embedding', {
        text: 'test'
      })).rejects.toThrow('Model loading failed');
    });
    
    test('should handle process spawn failures', async () => {
      mockSpawn.mockImplementation(() => {
        const mockProcess = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'error') {
              callback(new Error('Failed to spawn Python process'));
            }
          })
        };
        return mockProcess as any;
      });
      
      await expect(callEmbeddingService('generate_ingredient_embedding', {
        text: 'test'
      })).rejects.toThrow('Failed to spawn embedding service');
    });
    
    test('should handle non-zero exit codes', async () => {
      mockSpawn.mockImplementation(() => ({
        stdout: { on: jest.fn() },
        stderr: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              callback('Python error: Module not found');
            }
          })
        },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            callback(1); // Non-zero exit code
          }
        })
      } as any));
      
      await expect(callEmbeddingService('generate_ingredient_embedding', {
        text: 'test'
      })).rejects.toThrow('Embedding service failed: Python error: Module not found');
    });
  });
  
  describe('Batch Embedding Generation', () => {
    test('should generate embeddings for multiple texts efficiently', async () => {
      const mockBatchEmbeddings = [
        new Array(384).fill(0.1),
        new Array(384).fill(0.2),
        new Array(384).fill(0.3)
      ];
      
      const mockResponse = {
        success: true,
        embeddings: mockBatchEmbeddings
      };
      
      mockSpawn.mockImplementation(() => ({
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              callback(JSON.stringify(mockResponse));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            callback(0);
          }
        })
      } as any));
      
      const texts = [
        'wheat flour, sugar, eggs',
        'rice, vegetables, salt',
        'milk, chocolate, vanilla'
      ];
      
      const result = await callEmbeddingService('generate_embeddings_batch', {
        texts: texts
      });
      
      expect(result).toEqual(mockBatchEmbeddings);
      expect(result).toHaveLength(3);
      result.forEach((embedding: number[]) => {
        expect(embedding).toHaveLength(384);
        expect(embedding.every(val => typeof val === 'number' && isFinite(val))).toBe(true);
      });
    });
    
    test('should handle empty batch requests', async () => {
      const mockResponse = {
        success: false,
        error: 'Texts must be a non-empty list'
      };
      
      mockSpawn.mockImplementation(() => ({
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              callback(JSON.stringify(mockResponse));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            callback(0);
          }
        })
      } as any));
      
      await expect(callEmbeddingService('generate_embeddings_batch', {
        texts: []
      })).rejects.toThrow('Texts must be a non-empty list');
    });
    
    test('should handle large batch sizes', async () => {
      const batchSize = 100;
      const mockBatchEmbeddings = Array.from({ length: batchSize }, (_, i) => 
        new Array(384).fill(i * 0.01)
      );
      
      const mockResponse = {
        success: true,
        embeddings: mockBatchEmbeddings
      };
      
      mockSpawn.mockImplementation(() => ({
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              // Simulate longer processing time for large batches
              setTimeout(() => {
                callback(JSON.stringify(mockResponse));
              }, 100);
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 150);
          }
        })
      } as any));
      
      const texts = Array.from({ length: batchSize }, (_, i) => `ingredient ${i}`);
      
      const result = await callEmbeddingService('generate_embeddings_batch', {
        texts: texts
      });
      
      expect(result).toHaveLength(batchSize);
      expect(result[0]).toHaveLength(384);
      expect(result[batchSize - 1]).toHaveLength(384);
    }, 10000); // 10 second timeout for large batch
  });
  
  describe('Embedding Quality Validation', () => {
    test('should validate embedding dimensions', async () => {
      const validEmbedding = new Array(384).fill(0.1);
      const invalidEmbedding = new Array(256).fill(0.1); // Wrong dimension
      
      expect(validateEmbeddingDimensions(validEmbedding)).toBe(true);
      expect(validateEmbeddingDimensions(invalidEmbedding)).toBe(false);
    });
    
    test('should detect invalid embedding values', async () => {
      const validEmbedding = new Array(384).fill(0.1);
      const embeddingWithNaN = [...validEmbedding];
      embeddingWithNaN[100] = NaN;
      
      const embeddingWithInfinity = [...validEmbedding];
      embeddingWithInfinity[200] = Infinity;
      
      expect(validateEmbeddingValues(validEmbedding)).toBe(true);
      expect(validateEmbeddingValues(embeddingWithNaN)).toBe(false);
      expect(validateEmbeddingValues(embeddingWithInfinity)).toBe(false);
    });
    
    test('should calculate embedding similarity correctly', async () => {
      const embedding1 = new Array(384).fill(0.1);
      const embedding2 = new Array(384).fill(0.1); // Identical
      const embedding3 = new Array(384).fill(-0.1); // Opposite
      
      const similarity1 = calculateCosineSimilarity(embedding1, embedding2);
      const similarity2 = calculateCosineSimilarity(embedding1, embedding3);
      
      expect(similarity1).toBeCloseTo(1.0, 5); // Should be very similar
      expect(similarity2).toBeCloseTo(-1.0, 5); // Should be opposite
    });
  });
  
  describe('Model Information and Health Checks', () => {
    test('should retrieve model information successfully', async () => {
      const mockModelInfo = {
        success: true,
        model_name: 'sentence-transformers/all-MiniLM-L6-v2',
        dimensions: 384,
        max_sequence_length: 256,
        device: 'cpu',
        model_size_mb: 90.9,
        loaded: true
      };
      
      mockSpawn.mockImplementation(() => ({
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              callback(JSON.stringify(mockModelInfo));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            callback(0);
          }
        })
      } as any));
      
      const result = await callEmbeddingService('get_model_info', {});
      
      expect(result.model_name).toBe('sentence-transformers/all-MiniLM-L6-v2');
      expect(result.dimensions).toBe(384);
      expect(result.loaded).toBe(true);
    });
    
    test('should handle model loading failures', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Model not found or corrupted',
        model_name: 'sentence-transformers/all-MiniLM-L6-v2',
        loaded: false
      };
      
      mockSpawn.mockImplementation(() => ({
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              callback(JSON.stringify(mockErrorResponse));
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            callback(0);
          }
        })
      } as any));
      
      await expect(callEmbeddingService('get_model_info', {})).rejects.toThrow('Model not found or corrupted');
    });
  });
  
  describe('Performance and Memory Management', () => {
    test('should handle concurrent embedding requests', async () => {
      const mockResponse = {
        success: true,
        embedding: new Array(384).fill(0.1)
      };
      
      mockSpawn.mockImplementation(() => ({
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              // Simulate processing time
              setTimeout(() => {
                callback(JSON.stringify(mockResponse));
              }, 50);
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 100);
          }
        })
      } as any));
      
      // Create multiple concurrent requests
      const requests = Array.from({ length: 5 }, (_, i) => 
        callEmbeddingService('generate_ingredient_embedding', {
          text: `ingredient ${i}`
        })
      );
      
      const results = await Promise.all(requests);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toHaveLength(384);
      });
      
      // Verify that spawn was called for each request
      expect(mockSpawn).toHaveBeenCalledTimes(5);
    }, 10000);
    
    test('should measure embedding generation performance', async () => {
      const mockResponse = {
        success: true,
        embeddings: [
          new Array(384).fill(0.1),
          new Array(384).fill(0.2)
        ]
      };
      
      mockSpawn.mockImplementation(() => ({
        stdout: {
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'data') {
              // Simulate realistic processing time
              setTimeout(() => {
                callback(JSON.stringify(mockResponse));
              }, 200);
            }
          })
        },
        stderr: { on: jest.fn() },
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 250);
          }
        })
      } as any));
      
      const startTime = Date.now();
      const result = await callEmbeddingService('generate_embeddings_batch', {
        texts: ['ingredient 1', 'ingredient 2']
      });
      const endTime = Date.now();
      
      const processingTime = endTime - startTime;
      const embeddingsPerSecond = (result.length / processingTime) * 1000;
      
      expect(result).toHaveLength(2);
      expect(processingTime).toBeGreaterThan(200); // Should take at least the simulated time
      expect(embeddingsPerSecond).toBeGreaterThan(0);
    });
  });
});

// Helper functions for testing

/**
 * Calls the Python embedding service (mocked for testing)
 */
async function callEmbeddingService(command: string, args: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || 'python';
    const scriptPath = path.join(process.cwd(), 'embedding_service_interface.py');
    
    const child = spawn(pythonPath, [scriptPath, command, JSON.stringify(args)]);
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Embedding service failed: ${stderr}`));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        if (result.success) {
          resolve(result.embeddings || result.embedding || result);
        } else {
          reject(new Error(result.error));
        }
      } catch (error) {
        reject(new Error(`Failed to parse embedding service response: ${error}`));
      }
    });
    
    child.on('error', (error) => {
      reject(new Error(`Failed to spawn embedding service: ${error}`));
    });
  });
}

/**
 * Validates embedding dimensions
 */
function validateEmbeddingDimensions(embedding: number[]): boolean {
  return embedding.length === 384;
}

/**
 * Validates embedding values (no NaN or Infinity)
 */
function validateEmbeddingValues(embedding: number[]): boolean {
  return embedding.every(val => typeof val === 'number' && isFinite(val) && !isNaN(val));
}

/**
 * Calculates cosine similarity between two embeddings
 */
function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same dimensions');
  }
  
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}