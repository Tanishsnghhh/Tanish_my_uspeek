/**
 * MongoDB Connection Service
 * Handles database connection and basic operations for U-Speak Pro
 */

import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const MONGODB_DB = process.env.MONGODB_DB || 'uspeak-pro';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectDB(): Promise<{ client: MongoClient; db: Db }> {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    console.log('🔌 Connecting to MongoDB...');

    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,  // Increased from 5000ms
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,             // Close connections after 30 seconds
      family: 4                         // Use IPv4, skip trying IPv6
    });

    await client.connect();
    const db = client.db(MONGODB_DB);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    console.log('✅ Connected to MongoDB successfully');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

export async function getCollection(collectionName: string) {
  const { db } = await connectDB();
  return db.collection(collectionName);
}

export async function closeConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('🔌 MongoDB connection closed');
  }
}

// Health check function
export async function checkConnection(): Promise<boolean> {
  try {
    const { db } = await connectDB();
    await db.admin().ping();
    return true;
  } catch (error) {
    console.error('❌ MongoDB health check failed:', error);
    return false;
  }
}

// Get database instance
export async function getDatabase(): Promise<Db> {
  const { db } = await connectDB();
  return db;
}

// Get specific collection
export async function getVideoAnalysisCollection() {
  return await getCollection('video_analysis');
}

export async function getUsersCollection() {
  return await getCollection('users');
}

export async function getAccountsCollection() {
  return await getCollection('accounts');
}
