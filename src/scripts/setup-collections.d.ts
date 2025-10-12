/**
 * TypeScript declarations for setup-collections.js
 */

import { Db } from 'mongodb';

declare module './setup-collections.js' {
  export function setupCollections(): Promise<void>;
  export function createProductsCollection(db: Db): Promise<void>;
  export function createUsersCollection(db: Db): Promise<void>;
  export function createScanResultsCollection(db: Db): Promise<void>;
  export function insertSampleData(db: Db): Promise<void>;
  export function verifyDatabaseStructure(db: Db): Promise<void>;
}