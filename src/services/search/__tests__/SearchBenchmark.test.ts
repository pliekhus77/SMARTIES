import { UPCLookupService } from '../UPCLookupService';
import { VectorSearchService } from '../VectorSearchService';
import { HybridSearchService } from '../HybridSearchService';
import { DatabaseService } from '../../DatabaseService';
import { EmbeddingService } from '../../EmbeddingService';

interface BenchmarkResult {
  operation: string;
  averageTime: number;
  minTime: number;
  maxTime: number;
  p95Time: number;
  throughput: number;
  successRate: number;
}

class SearchBenchmark {
  private results: BenchmarkResult[] = [];

  constructor(
    private upcLookupService: UPCLookupService,
    private vectorSearchService: VectorSearchService,
    private hybridSearchService: HybridSearchService
  ) {}

  async runBenchmark(iterations: number = 100): Promise<BenchmarkResult[]> {
    console.log(`Starting search performance benchmark with ${iterations} iterations...`);

    await this.benchmarkUPCLookup(iterations);
    await this.benchmarkVectorSearch(iterations);
    await this.benchmarkHybridSearch(iterations);
    await this.benchmarkConcurrentLoad(50);

    return this.results;
  }

  private async benchmarkUPCLookup(iterations: number): Promise<void> {
    const times: number[] = [];
    let successes = 0;

    const testUPCs = Array.from({ length: iterations }, (_, i) => 
      `12345678901${i.toString().padStart(2, '0')}`
    );

    const startTime = Date.now();

    for (const upc of testUPCs) {
      const opStart = Date.now();
      try {
        await this.upcLookupService.lookupByUPC(upc);
        successes++;
      } catch (error) {
        // Count as failure
      }
      times.push(Date.now() - opStart);
    }

    const totalTime = Date.now() - startTime;

    this.results.push({
      operation: 'UPC Lookup',
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      p95Time: this.calculatePercentile(times, 95),
      throughput: (successes / totalTime) * 1000, // ops per second
      successRate: (successes / iterations) * 100
    });
  }

  private async benchmarkVectorSearch(iterations: number): Promise<void> {
    const times: number[] = [];
    let successes = 0;

    const queryEmbedding = new Array(384).fill(0.5);
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const opStart = Date.now();
      try {
        await this.vectorSearchService.searchByIngredients(queryEmbedding, {
          maxResults: 10
        });
        successes++;
      } catch (error) {
        // Count as failure
      }
      times.push(Date.now() - opStart);
    }

    const totalTime = Date.now() - startTime;

    this.results.push({
      operation: 'Vector Search',
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      p95Time: this.calculatePercentile(times, 95),
      throughput: (successes / totalTime) * 1000,
      successRate: (successes / iterations) * 100
    });
  }

  private async benchmarkHybridSearch(iterations: number): Promise<void> {
    const times: number[] = [];
    let successes = 0;

    const queries = Array.from({ length: iterations }, (_, i) => 
      i % 2 === 0 
        ? { upc: `12345678901${i.toString().padStart(2, '0')}` }
        : { text: `test query ${i}` }
    );

    const startTime = Date.now();

    for (const query of queries) {
      const opStart = Date.now();
      try {
        await this.hybridSearchService.search(query);
        successes++;
      } catch (error) {
        // Count as failure
      }
      times.push(Date.now() - opStart);
    }

    const totalTime = Date.now() - startTime;

    this.results.push({
      operation: 'Hybrid Search',
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      p95Time: this.calculatePercentile(times, 95),
      throughput: (successes / totalTime) * 1000,
      successRate: (successes / iterations) * 100
    });
  }

  private async benchmarkConcurrentLoad(concurrency: number): Promise<void> {
    const times: number[] = [];
    let successes = 0;

    const queries = Array.from({ length: concurrency }, (_, i) => ({
      upc: `12345678901${i.toString().padStart(2, '0')}`
    }));

    const startTime = Date.now();

    const promises = queries.map(async (query) => {
      const opStart = Date.now();
      try {
        await this.hybridSearchService.search(query);
        successes++;
        return Date.now() - opStart;
      } catch (error) {
        return Date.now() - opStart;
      }
    });

    const results = await Promise.all(promises);
    times.push(...results);

    const totalTime = Date.now() - startTime;

    this.results.push({
      operation: 'Concurrent Load',
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      p95Time: this.calculatePercentile(times, 95),
      throughput: (successes / totalTime) * 1000,
      successRate: (successes / concurrency) * 100
    });
  }

  private calculatePercentile(times: number[], percentile: number): number {
    const sorted = times.slice().sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  printResults(): void {
    console.log('\n=== Search Performance Benchmark Results ===');
    console.log('Operation'.padEnd(20) + 'Avg(ms)'.padEnd(10) + 'Min(ms)'.padEnd(10) + 
                'Max(ms)'.padEnd(10) + 'P95(ms)'.padEnd(10) + 'Ops/sec'.padEnd(10) + 'Success%');
    console.log('-'.repeat(80));

    this.results.forEach(result => {
      console.log(
        result.operation.padEnd(20) +
        result.averageTime.toFixed(1).padEnd(10) +
        result.minTime.toString().padEnd(10) +
        result.maxTime.toString().padEnd(10) +
        result.p95Time.toString().padEnd(10) +
        result.throughput.toFixed(1).padEnd(10) +
        result.successRate.toFixed(1) + '%'
      );
    });

    console.log('\n=== Performance Requirements Validation ===');
    this.validateRequirements();
  }

  private validateRequirements(): void {
    const upcResult = this.results.find(r => r.operation === 'UPC Lookup');
    const vectorResult = this.results.find(r => r.operation === 'Vector Search');

    if (upcResult) {
      const upcPassed = upcResult.averageTime < 100 && upcResult.p95Time < 150;
      console.log(`UPC Lookup (<100ms avg): ${upcPassed ? 'PASS' : 'FAIL'} - ${upcResult.averageTime.toFixed(1)}ms avg, ${upcResult.p95Time}ms P95`);
    }

    if (vectorResult) {
      const vectorPassed = vectorResult.averageTime < 500 && vectorResult.p95Time < 750;
      console.log(`Vector Search (<500ms avg): ${vectorPassed ? 'PASS' : 'FAIL'} - ${vectorResult.averageTime.toFixed(1)}ms avg, ${vectorResult.p95Time}ms P95`);
    }

    const concurrentResult = this.results.find(r => r.operation === 'Concurrent Load');
    if (concurrentResult) {
      const concurrentPassed = concurrentResult.throughput > 10; // At least 10 ops/sec
      console.log(`Concurrent Load (>10 ops/sec): ${concurrentPassed ? 'PASS' : 'FAIL'} - ${concurrentResult.throughput.toFixed(1)} ops/sec`);
    }
  }
}

describe('Search Performance Benchmark', () => {
  let benchmark: SearchBenchmark;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    databaseService = new DatabaseService({
      uri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
      database: 'smarties_benchmark_test',
      options: { serverSelectionTimeout: 5000, maxPoolSize: 20 }
    });

    try {
      await databaseService.connect();
      
      const upcLookupService = new UPCLookupService(databaseService);
      const vectorSearchService = new VectorSearchService(databaseService);
      const hybridSearchService = new HybridSearchService(
        upcLookupService,
        vectorSearchService,
        new EmbeddingService()
      );

      benchmark = new SearchBenchmark(
        upcLookupService,
        vectorSearchService,
        hybridSearchService
      );

      console.log('Connected to test database for benchmark tests');
    } catch (error) {
      console.log('Skipping benchmark tests - no database connection');
      return;
    }
  });

  afterAll(async () => {
    if (databaseService) {
      await databaseService.disconnect();
    }
  });

  it('should run comprehensive performance benchmark', async () => {
    if (!databaseService || !await databaseService.isConnected()) {
      console.log('Skipping benchmark - no database connection');
      return;
    }

    const results = await benchmark.runBenchmark(50); // Reduced for CI
    benchmark.printResults();

    expect(results).toHaveLength(4);
    
    // Validate performance requirements
    const upcResult = results.find(r => r.operation === 'UPC Lookup');
    const vectorResult = results.find(r => r.operation === 'Vector Search');

    if (upcResult) {
      expect(upcResult.averageTime).toBeLessThan(100);
      expect(upcResult.successRate).toBeGreaterThan(90);
    }

    if (vectorResult) {
      expect(vectorResult.averageTime).toBeLessThan(500);
      expect(vectorResult.successRate).toBeGreaterThan(80);
    }
  }, 60000); // 60 second timeout for benchmark

  it('should validate performance under sustained load', async () => {
    if (!databaseService || !await databaseService.isConnected()) {
      console.log('Skipping sustained load test - no database connection');
      return;
    }

    const iterations = 20;
    const startTime = Date.now();
    
    const promises = Array.from({ length: iterations }, (_, i) =>
      benchmark['hybridSearchService'].search({ 
        upc: `12345678901${i.toString().padStart(2, '0')}` 
      })
    );

    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;

    expect(results).toHaveLength(iterations);
    expect(totalTime).toBeLessThan(2000); // 20 operations in under 2 seconds
    
    const throughput = (iterations / totalTime) * 1000;
    expect(throughput).toBeGreaterThan(10); // At least 10 ops/sec
    
    console.log(`Sustained load: ${iterations} ops in ${totalTime}ms (${throughput.toFixed(1)} ops/sec)`);
  }, 30000);
});
