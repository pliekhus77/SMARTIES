/**
 * Tests for VectorSearchService
 * Validates Task 6.1: Vector search index configurations for 384-dimension embeddings
 */

import { VectorSearchService } from '../VectorSearchService';
import { DatabaseService } from '../DatabaseService';

// Mock DatabaseService
jest.mock('../DatabaseService');

describe('VectorSearchService', () => {
  let vectorSearchService: VectorSearchService;
  let mockDatabaseService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = {
      connect: jest.fn().mockResolvedValue({ success: true }),
      disconnect: jest.fn().mockResolvedValue(undefined),
    } as any;

    vectorSearchService = new VectorSearchService(mockDatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Vector Search Index Configuration', () => {
    test('should validate correct vector search index configuration', () => {
      const validConfig = {
        name: 'test_vector_index',
        type: 'vectorSearch' as const,
        definition: {
          fields: [
            {
              type: 'vector' as const,
              path: 'ingredients_embedding',
              numDimensions: 384,
              similarity: 'cosine' as const
            },
            {
              type: 'filter' as const,
              path: 'dietary_flags.vegan'
            }
          ]
        }
      };

      const result = vectorSearchService.validateIndexConfiguration(validConfig);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid vector dimensions', () => {
      const invalidConfig = {
        name: 'test_vector_index',
        type: 'vectorSearch' as const,
        definition: {
          fields: [
            {
              type: 'vector' as const,
              path: 'ingredients_embedding',
              numDimensions: 512, // Wrong dimension
              similarity: 'cosine' as const
            }
          ]
        }
      };

      const result = vectorSearchService.validateIndexConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vector field at index 0 must have 384 dimensions');
    });

    test('should reject invalid similarity metric', () => {
      const invalidConfig = {
        name: 'test_vector_index',
        type: 'vectorSearch' as const,
        definition: {
          fields: [
            {
              type: 'vector' as const,
              path: 'ingredients_embedding',
              numDimensions: 384,
              similarity: 'invalid' as any
            }
          ]
        }
      };

      const result = vectorSearchService.validateIndexConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Vector field at index 0 must have valid similarity metric');
    });

    test('should require valid index name', () => {
      const invalidConfig = {
        name: '',
        type: 'vectorSearch' as const,
        definition: {
          fields: [
            {
              type: 'vector' as const,
              path: 'ingredients_embedding',
              numDimensions: 384,
              similarity: 'cosine' as const
            }
          ]
        }
      };

      const result = vectorSearchService.validateIndexConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Index name is required and must be a string');
    });

    test('should require vectorSearch type', () => {
      const invalidConfig = {
        name: 'test_index',
        type: 'text' as any,
        definition: {
          fields: [
            {
              type: 'vector' as const,
              path: 'ingredients_embedding',
              numDimensions: 384,
              similarity: 'cosine' as const
            }
          ]
        }
      };

      const result = vectorSearchService.validateIndexConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Index type must be "vectorSearch"');
    });

    test('should validate filter field paths', () => {
      const invalidConfig = {
        name: 'test_vector_index',
        type: 'vectorSearch' as const,
        definition: {
          fields: [
            {
              type: 'filter' as const,
              path: '' // Empty path
            }
          ]
        }
      };

      const result = vectorSearchService.validateIndexConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Filter field at index 0 must have a valid path');
    });
  });

  describe('Atlas Search Commands Generation', () => {
    test('should generate valid MongoDB Atlas Search commands', () => {
      const commands = vectorSearchService.generateAtlasSearchCommands();
      
      expect(commands).toHaveLength(4);
      
      // Check ingredients embedding index command
      expect(commands[0]).toContain('ingredients_embedding_index');
      expect(commands[0]).toContain('ingredients_embedding');
      expect(commands[0]).toContain('384');
      expect(commands[0]).toContain('cosine');
      expect(commands[0]).toContain('dietary_flags.vegan');
      
      // Check product name embedding index command
      expect(commands[1]).toContain('product_name_embedding_index');
      expect(commands[1]).toContain('product_name_embedding');
      expect(commands[1]).toContain('brands_tags');
      
      // Check allergens embedding index command
      expect(commands[2]).toContain('allergens_embedding_index');
      expect(commands[2]).toContain('allergens_embedding');
      expect(commands[2]).toContain('allergens_tags');
      
      // Check compound vector index command
      expect(commands[3]).toContain('compound_vector_index');
      expect(commands[3]).toContain('ingredients_embedding');
      expect(commands[3]).toContain('product_name_embedding');
    });

    test('should include all required filter fields', () => {
      const commands = vectorSearchService.generateAtlasSearchCommands();
      
      // Ingredients index should have dietary filters
      expect(commands[0]).toContain('dietary_flags.vegan');
      expect(commands[0]).toContain('dietary_flags.vegetarian');
      expect(commands[0]).toContain('dietary_flags.gluten_free');
      
      // Product name index should have brand and category filters
      expect(commands[1]).toContain('brands_tags');
      expect(commands[1]).toContain('categories_tags');
      expect(commands[1]).toContain('data_quality_score');
      
      // Allergens index should have allergen-related filters
      expect(commands[2]).toContain('allergens_tags');
      expect(commands[2]).toContain('traces_tags');
      expect(commands[2]).toContain('allergens_hierarchy');
      
      // Compound index should have comprehensive filters
      expect(commands[3]).toContain('dietary_flags');
      expect(commands[3]).toContain('allergens_tags');
      expect(commands[3]).toContain('data_quality_score');
      expect(commands[3]).toContain('popularity_score');
    });
  });

  describe('Vector Search Index Creation', () => {
    test('should create all vector search indexes successfully', async () => {
      const result = await vectorSearchService.createVectorSearchIndexes();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully created');
      expect(result.errors).toBeUndefined();
    });

    test('should list vector search indexes', async () => {
      const result = await vectorSearchService.listVectorSearchIndexes();
      
      expect(result.success).toBe(true);
      expect(result.indexes).toHaveLength(4);
      expect(result.indexes).toContain('ingredients_embedding_index');
      expect(result.indexes).toContain('product_name_embedding_index');
      expect(result.indexes).toContain('allergens_embedding_index');
      expect(result.indexes).toContain('compound_vector_index');
    });
  });

  describe('Task 6.1 Requirements Validation', () => {
    test('should configure indexes for 384-dimension embeddings', () => {
      const commands = vectorSearchService.generateAtlasSearchCommands();
      
      // All vector fields should have 384 dimensions
      commands.forEach(command => {
        if (command.includes('numDimensions')) {
          expect(command).toContain('"numDimensions": 384');
        }
      });
    });

    test('should use cosine similarity for all vector fields', () => {
      const commands = vectorSearchService.generateAtlasSearchCommands();
      
      // All vector fields should use cosine similarity
      commands.forEach(command => {
        if (command.includes('similarity')) {
          expect(command).toContain('"similarity": "cosine"');
        }
      });
    });

    test('should create compound indexes for hybrid search optimization', () => {
      const commands = vectorSearchService.generateAtlasSearchCommands();
      
      // Compound index should have multiple vector fields
      const compoundIndex = commands[3];
      expect(compoundIndex).toContain('ingredients_embedding');
      expect(compoundIndex).toContain('product_name_embedding');
      expect(compoundIndex).toContain('compound_vector_index');
    });

    test('should configure filtering indexes for dietary flags and allergen tags', () => {
      const commands = vectorSearchService.generateAtlasSearchCommands();
      
      // Check that all required filter fields are present
      const allCommands = commands.join(' ');
      
      // Dietary flags filters
      expect(allCommands).toContain('dietary_flags.vegan');
      expect(allCommands).toContain('dietary_flags.vegetarian');
      expect(allCommands).toContain('dietary_flags.gluten_free');
      
      // Allergen filters
      expect(allCommands).toContain('allergens_tags');
      expect(allCommands).toContain('traces_tags');
      expect(allCommands).toContain('allergens_hierarchy');
      
      // Quality and popularity filters
      expect(allCommands).toContain('data_quality_score');
      expect(allCommands).toContain('popularity_score');
    });
  });
});
