import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createProductSearchRouter } from './routes/productSearch';
import { DatabaseService } from '../services/DatabaseService';
import { UPCLookupService } from '../services/search/UPCLookupService';
import { VectorSearchService } from '../services/search/VectorSearchService';
import { HybridSearchService } from '../services/search/HybridSearchService';
import { EmbeddingService } from '../services/EmbeddingService';
import { AllergenDetectionService } from '../services/dietary/AllergenDetectionService';
import { DietaryComplianceService } from '../services/dietary/DietaryComplianceService';
import { ProductRecommendationService } from '../services/dietary/ProductRecommendationService';
import { addResponseHelpers } from './middleware/responseFormatter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { RateLimitManager, UsageMonitor } from './middleware/rateLimiting';

export class ProductSearchAPI {
  private app: express.Application;
  private databaseService: DatabaseService;
  private hybridSearchService: HybridSearchService;
  private allergenService: AllergenDetectionService;
  private complianceService: DietaryComplianceService;
  private recommendationService: ProductRecommendationService;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.initializeServices();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    this.app.use('/api/', RateLimitManager.general());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    this.app.use(addResponseHelpers);
    this.app.use(UsageMonitor.getInstance().middleware());

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private async initializeServices(): Promise<void> {
    // Initialize database service
    this.databaseService = new DatabaseService({
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      database: process.env.MONGODB_DATABASE || 'smarties_db'
    });

    // Initialize search services
    const upcLookupService = new UPCLookupService(this.databaseService);
    const vectorSearchService = new VectorSearchService(this.databaseService);
    const embeddingService = new EmbeddingService();
    
    this.hybridSearchService = new HybridSearchService(
      upcLookupService,
      vectorSearchService,
      embeddingService
    );

    // Initialize dietary services
    this.allergenService = new AllergenDetectionService(
      vectorSearchService,
      embeddingService
    );

    this.complianceService = new DietaryComplianceService(
      vectorSearchService,
      embeddingService
    );

    this.recommendationService = new ProductRecommendationService(
      vectorSearchService,
      embeddingService,
      this.allergenService,
      this.complianceService
    );
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.success({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
      });
    });

    // Usage statistics endpoint
    this.app.get('/stats', (req, res) => {
      res.success(UsageMonitor.getInstance().getStats());
    });

    // API routes
    this.app.use('/api/products', createProductSearchRouter(
      this.hybridSearchService,
      this.allergenService,
      this.complianceService,
      this.recommendationService
    ));

    // 404 handler
    this.app.use('*', notFoundHandler);
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);
  }

  async start(port: number = 3001): Promise<void> {
    try {
      // Connect to database
      await this.databaseService.connect();
      console.log('Database connected successfully');

      // Start server
      this.app.listen(port, () => {
        console.log(`Product Search API server running on port ${port}`);
        console.log(`Health check: http://localhost:${port}/health`);
        console.log(`API endpoints: http://localhost:${port}/api/products`);
      });

    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    if (this.databaseService) {
      await this.databaseService.disconnect();
    }
  }

  getApp(): express.Application {
    return this.app;
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const api = new ProductSearchAPI();
  const port = parseInt(process.env.PORT || '3001');
  
  api.start(port).catch(error => {
    console.error('Failed to start API server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully');
    await api.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully');
    await api.stop();
    process.exit(0);
  });
}
