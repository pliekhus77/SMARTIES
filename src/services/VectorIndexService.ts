/**
 * MongoDB Atlas Vector Search Index Configuration Service
 * Implements Requirements 3.1, 3.2, 3.3, 3.4 from vector search specification
 */

import { MongoClient, Db } from 'mongodb';

export interface VectorIndexConfig {
  name: string;
  type: 'vectorSearch';
  definition: {
    fields: Array<{
      type: 'vector';
      path: string;
      numDimensions: number;
      similarity: 'cosine' | 'euclidean' | 'dotProduct';
    }>;
  };
}

export interface IndexHealthStatus {
  name: string;
  status: 'ready' | 'building' | 'failed' | 'not_found';
  queryable: boolean;
  lastUpdated?: Date;
}

export class VectorIndexService {
  private client: MongoClient;
  private db: Db;

  constructor(client: MongoClient, dbName: string) {
    this.client = client;
    this.db = client.db(dbName);
  }

  /**
   * Create vector search index for products collection
   */
  async createProductsVectorIndex(): Promise<void> {
    const collection = this.db.collection('products');
    
    const indexConfig: VectorIndexConfig = {
      name: 'products_vector_index',
      type: 'vectorSearch',
      definition: {
        fields: [
          {
            type: 'vector',
            path: 'embedding',
            numDimensions: 384,
            similarity: 'cosine'
          }
        ]
      }
    };

    try {
      await collection.createSearchIndex(indexConfig);
      console.log('Vector search index created successfully');
    } catch (error) {
      console.error('Failed to create vector index:', error);
      throw error;
    }
  }

  /**
   * Validate vector index health and readiness
   */
  async validateIndexHealth(indexName: string = 'products_vector_index'): Promise<IndexHealthStatus> {
    try {
      const collection = this.db.collection('products');
      const indexes = await collection.listSearchIndexes().toArray();
      
      const targetIndex = indexes.find(idx => idx.name === indexName);
      
      if (!targetIndex) {
        return {
          name: indexName,
          status: 'not_found',
          queryable: false
        };
      }

      return {
        name: indexName,
        status: targetIndex.status || 'ready',
        queryable: targetIndex.queryable || false,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Index health check failed:', error);
      return {
        name: indexName,
        status: 'failed',
        queryable: false
      };
    }
  }

  /**
   * Test vector search functionality
   */
  async testVectorSearch(testEmbedding: number[]): Promise<boolean> {
    try {
      const collection = this.db.collection('products');
      
      const pipeline = [
        {
          $vectorSearch: {
            index: 'products_vector_index',
            path: 'embedding',
            queryVector: testEmbedding,
            numCandidates: 10,
            limit: 5
          }
        },
        {
          $project: {
            _id: 1,
            upc: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      return results.length > 0;
    } catch (error) {
      console.error('Vector search test failed:', error);
      return false;
    }
  }
}
