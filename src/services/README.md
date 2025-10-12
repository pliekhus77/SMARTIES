# Embedding Service Documentation

## Overview

The HuggingFace Embedding Service provides vector embedding generation for the SMARTIES application using Sentence Transformers. It supports generating 384-dimensional embeddings for ingredients, product names, and allergen information with built-in caching and batch processing capabilities.

## Features

- **Local Processing**: Uses Hugging Face Sentence Transformers locally (no API costs)
- **High Performance**: Batch processing with configurable concurrency
- **Intelligent Caching**: LRU cache with TTL to avoid recomputation
- **Memory Management**: Configurable memory limits and cleanup
- **Error Handling**: Comprehensive error handling with retry logic
- **TypeScript Support**: Full type safety with detailed interfaces

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TypeScript    │    │     Python       │    │  Sentence       │
│   Service       │───▶│    Interface     │───▶│  Transformers   │
│   (Node.js)     │    │    Script        │    │   (all-MiniLM)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   LRU Cache     │    │   JSON I/O       │    │  384-dim        │
│   (Memory)      │    │   Interface      │    │  Embeddings     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Quick Start

### 1. Basic Usage

```typescript
import { embeddingService } from '../services/EmbeddingService';

// Initialize the service
await embeddingService.initialize();

// Generate embeddings
const ingredientEmbedding = await embeddingService.generateIngredientEmbedding(
  'wheat flour, sugar, chocolate chips'
);

const productEmbedding = await embeddingService.generateProductNameEmbedding(
  'Chocolate Chip Cookies'
);

const allergenEmbedding = await embeddingService.generateAllergenEmbedding(
  ['wheat', 'eggs', 'milk']
);

console.log(`Generated ${ingredientEmbedding.length}-dimensional embedding`);
```

### 2. Batch Processing

```typescript
import { EmbeddingRequest } from '../types/EmbeddingService';

const requests: EmbeddingRequest[] = [
  { id: '1', text: 'organic almonds', type: 'ingredient' },
  { id: '2', text: 'Almond Cookies', type: 'product_name' },
  { id: '3', text: 'tree nuts', type: 'allergen' }
];

const responses = await embeddingService.generateEmbeddingsBatch(requests, {
  batch_size: 32,
  progress_callback: (processed, total) => {
    console.log(`Progress: ${processed}/${total}`);
  }
});

responses.forEach(response => {
  if (response.success) {
    console.log(`${response.id}: ${response.embedding.length} dimensions`);
  }
});
```

### 3. Custom Configuration

```typescript
import { createEmbeddingService } from '../services/EmbeddingService';

const customService = createEmbeddingService({
  batch_size: 16,
  timeout_seconds: 60,
  cache_config: {
    max_entries: 5000,
    ttl_hours: 12,
    cleanup_interval_minutes: 30,
    memory_limit_mb: 50
  }
});

await customService.initialize();
```

## API Reference

### Core Methods

#### `initialize(): Promise<void>`
Initializes the embedding service and loads the Sentence Transformer model.

#### `generateIngredientEmbedding(text: string): Promise<number[]>`
Generates a 384-dimensional embedding for ingredient text with preprocessing optimized for food ingredients.

#### `generateProductNameEmbedding(text: string): Promise<number[]>`
Generates a 384-dimensional embedding for product names.

#### `generateAllergenEmbedding(allergens: string | string[]): Promise<number[]>`
Generates a 384-dimensional embedding for allergen information.

#### `generateEmbeddingsBatch(requests: EmbeddingRequest[], config?: BatchConfig): Promise<EmbeddingResponse[]>`
Processes multiple embedding requests efficiently with configurable batch size and concurrency.

### Utility Methods

#### `getModelInfo(): Promise<ModelInfo>`
Returns information about the loaded model including dimensions and configuration.

#### `getStats(): EmbeddingStats`
Returns service usage statistics including cache hit rates and processing times.

#### `getCacheStats(): CacheStats`
Returns cache usage information including size, hit rate, and memory usage.

#### `clearCache(type?: EmbeddingType): Promise<void>`
Clears the embedding cache, optionally filtered by embedding type.

#### `shutdown(): Promise<void>`
Shuts down the service and cleans up resources.

## Configuration Options

### EmbeddingServiceConfig

```typescript
interface HuggingFaceEmbeddingConfig {
  model_name: string;              // 'all-MiniLM-L6-v2'
  cache_directory: string;         // './models_cache'
  batch_size: number;             // 32
  cpu_threads: number;            // 4
  python_executable?: string;      // 'python'
  service_script_path: string;    // './embedding_service_interface.py'
  timeout_seconds: number;        // 30
  max_retries: number;           // 3
  cache_config: EmbeddingCacheConfig;
}
```

### CacheConfig

```typescript
interface EmbeddingCacheConfig {
  max_entries: number;            // 10000
  ttl_hours: number;             // 24
  cleanup_interval_minutes: number; // 60
  memory_limit_mb: number;       // 100
}
```

### BatchConfig

```typescript
interface BatchConfig {
  batch_size: number;            // Items per batch
  max_concurrent_batches: number; // Parallel batches
  timeout_seconds: number;       // Batch timeout
  retry_attempts: number;        // Retry failed batches
  progress_callback?: (processed: number, total: number) => void;
}
```

## Performance Characteristics

### Benchmarks (on typical development machine)

- **Single Embedding**: ~50-100ms (first time), ~1-5ms (cached)
- **Batch Processing**: ~1000-2000 embeddings/minute
- **Memory Usage**: ~90MB model + ~100MB cache (configurable)
- **Cache Hit Rate**: Typically 60-80% in production workloads

### Optimization Tips

1. **Use Batch Processing**: Much more efficient than individual requests
2. **Configure Cache**: Increase cache size for better hit rates
3. **Adjust Batch Size**: Larger batches = better throughput, more memory
4. **Monitor Memory**: Set appropriate memory limits for your environment

## Error Handling

The service provides comprehensive error handling with specific error types:

```typescript
try {
  const embedding = await embeddingService.generateIngredientEmbedding(text);
} catch (error) {
  if (error instanceof EmbeddingServiceError) {
    switch (error.errorType) {
      case 'validation':
        console.log('Input validation failed:', error.message);
        break;
      case 'model_load':
        console.log('Model loading failed:', error.message);
        break;
      case 'generation':
        console.log('Embedding generation failed:', error.message);
        break;
      case 'timeout':
        console.log('Request timed out:', error.message);
        break;
      case 'cache':
        console.log('Cache operation failed:', error.message);
        break;
    }
  }
}
```

## Testing

### Unit Tests

```bash
npm test src/services/__tests__/EmbeddingService.test.ts
```

### Integration Tests

```bash
python test-embedding-integration.py
```

### Example Usage

```bash
npx ts-node src/services/examples/EmbeddingServiceExample.ts
```

## Dependencies

### Python Dependencies
- `sentence-transformers`: Core embedding model
- `torch`: PyTorch backend
- `numpy`: Numerical operations
- `transformers`: Hugging Face transformers

### Node.js Dependencies
- `child_process`: Python process spawning
- `crypto`: Hash generation for caching
- `fs`: File system operations

## Troubleshooting

### Common Issues

1. **Python Not Found**
   ```
   Error: Failed to start Python process
   ```
   - Solution: Install Python 3.8+ and ensure it's in PATH
   - Or specify `python_executable` in config

2. **Model Download Fails**
   ```
   Error: Failed to load model
   ```
   - Solution: Check internet connection for initial model download
   - Model is cached locally after first download

3. **Memory Issues**
   ```
   Error: Out of memory
   ```
   - Solution: Reduce `batch_size` or `cache_config.max_entries`
   - Monitor memory usage with `getCacheStats()`

4. **Timeout Errors**
   ```
   Error: Python command timeout
   ```
   - Solution: Increase `timeout_seconds` in config
   - Check system performance and CPU usage

### Performance Issues

1. **Slow First Request**
   - Expected: Model loading takes 5-10 seconds initially
   - Solution: Call `initialize()` during app startup

2. **High Memory Usage**
   - Check cache size with `getCacheStats()`
   - Reduce `cache_config.max_entries` if needed
   - Clear cache periodically with `clearCache()`

3. **Low Cache Hit Rate**
   - Increase `cache_config.ttl_hours` for longer retention
   - Increase `cache_config.max_entries` for more storage
   - Check if text preprocessing is consistent

## Production Deployment

### Recommendations

1. **Resource Allocation**
   - CPU: 2+ cores recommended for batch processing
   - Memory: 2GB+ for model + cache + application
   - Disk: 500MB for model cache

2. **Configuration**
   ```typescript
   const productionConfig = {
     batch_size: 64,
     timeout_seconds: 60,
     max_retries: 3,
     cache_config: {
       max_entries: 50000,
       ttl_hours: 48,
       cleanup_interval_minutes: 30,
       memory_limit_mb: 500
     }
   };
   ```

3. **Monitoring**
   - Monitor cache hit rates (target: >70%)
   - Track average response times
   - Set up alerts for error rates
   - Monitor memory usage trends

4. **Scaling**
   - Use multiple service instances for high load
   - Consider Redis for shared caching across instances
   - Implement circuit breakers for resilience

## Contributing

When contributing to the embedding service:

1. **Add Tests**: All new features must include unit tests
2. **Update Documentation**: Keep this README current
3. **Performance Testing**: Benchmark changes with realistic data
4. **Error Handling**: Ensure comprehensive error coverage
5. **Type Safety**: Maintain full TypeScript type coverage

## License

This embedding service is part of the SMARTIES project and follows the same MIT license.