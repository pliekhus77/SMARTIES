/**
 * Database Service for React Native App
 * HTTP API + Realm local storage implementation
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
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      const uri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_DATABASE;

      if (!uri || !dbName) {
        throw new Error('MongoDB URI or database name not configured');
      }

      console.log('Connecting to MongoDB Atlas...');
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;
      console.log('✅ Connected to MongoDB Atlas successfully');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        this.isConnected = false;
        console.log('MongoDB connection closed');
      }
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }

  async performHealthCheck(): Promise<DatabaseHealthStatus> {
    try {
      if (!this.db) {
        return {
          status: 'unhealthy',
          message: 'Database not connected'
        };
      }

      // Ping the database
      await this.db.admin().ping();
      return {
        status: 'healthy',
        message: 'Database connection is healthy'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private getCollection(name: string): Collection {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection(name);
  }

  async readOne<T>(collection: string, query: any): Promise<DatabaseResult<T | null>> {
    try {
      const coll = this.getCollection(collection);
      const result = await coll.findOne(query);
      return {
        success: true,
        data: result as T | null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async create<T>(collection: string, data: T): Promise<DatabaseResult<T>> {
    try {
      const coll = this.getCollection(collection);
      const result = await coll.insertOne(data as any);
      return {
        success: true,
        data: { ...data, _id: result.insertedId } as T
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async update<T>(collection: string, query: any, data: Partial<T>): Promise<DatabaseResult<T>> {
    try {
      const coll = this.getCollection(collection);
      const result = await coll.findOneAndUpdate(
        query,
        { $set: data },
        { returnDocument: 'after' }
      );
      return {
        success: true,
        data: result as T
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async delete(collection: string, query: any): Promise<DatabaseResult<boolean>> {
    try {
      const coll = this.getCollection(collection);
      const result = await coll.deleteOne(query);
      return {
        success: true,
        data: result.deletedCount > 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async findMany<T>(collection: string, query: any = {}, limit?: number): Promise<DatabaseResult<T[]>> {
    try {
      const coll = this.getCollection(collection);
      let cursor = coll.find(query);
      
      if (limit) {
        cursor = cursor.limit(limit);
      }
      
      const results = await cursor.toArray();
      return {
        success: true,
        data: results as T[]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}