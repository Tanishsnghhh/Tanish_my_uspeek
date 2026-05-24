import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

// Configure mongoose globally to disable buffering
if (mongoose && typeof mongoose.set === 'function') {
  mongoose.set('bufferCommands', false);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const MONGODB_DB = process.env.MONGODB_DB || 'uspeak-pro';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let isConnected = false;

async function waitForConnectionReady(timeoutMs = 5000) {
  if (mongoose.connection.readyState === 1) return;

  return new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup();
      resolve();
    };

    const onError = (err: any) => {
      cleanup();
      reject(err);
    };

    const onTimeout = () => {
      cleanup();
      reject(new Error('Timed out waiting for mongoose connection to become ready'));
    };

    const cleanup = () => {
      mongoose.connection.removeListener('open', onOpen);
      mongoose.connection.removeListener('error', onError);
      clearTimeout(timer);
    };

    mongoose.connection.once('open', onOpen);
    mongoose.connection.once('error', onError);

    const timer = setTimeout(onTimeout, timeoutMs);
  });
}

async function connectDB() {
  if (isConnected) {
    return mongoose.connection;
  }

  try {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    } as mongoose.ConnectOptions;

    // Start the connection
    await mongoose.connect(MONGODB_URI, opts);

    // Ensure the driver has reached the open/connected state before returning
    await waitForConnectionReady(5000);

    isConnected = mongoose.connection.readyState === 1;

    return mongoose.connection;
  } catch (e) {
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }
}

export default connectDB;

// Helper function to get both connection and database (for compatibility)
export async function connectDBWithDb() {
  const connection = await connectDB();
  const db = connection.db;
  if (!db) {
    throw new Error('Database instance not available');
  }
  return { connection, db };
}

// Helper functions for accessing specific collections
export async function getDatabase() {
  const connection = await connectDB();
  const db = connection.db;
  if (!db) {
    throw new Error('Database connection failed');
  }
  return db;
}

export async function getCollection(collectionName: string) {
  const db = await getDatabase();
  if (!db) {
    throw new Error('Database connection failed');
  }
  return db.collection(collectionName);
}

export async function getVideoAnalysisCollection() {
  return await getCollection('video_analysis');
}

export async function getUsersCollection() {
  return await getCollection('users');
}

export async function getAccountsCollection() {
  return await getCollection('accounts');
}

export async function checkConnection() {
  const mongooseConnected = mongoose.connection.readyState === 1;

  let nativeConnected = false;
  try {
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxIdleTimeMS: 30000,
      family: 4
    });
    await client.connect();
    const db = client.db(MONGODB_DB);
    await db.admin().ping();
    nativeConnected = true;
    await client.close();
  } catch (error) {
    console.error('Native MongoDB check failed:', error);
    nativeConnected = false;
  }

  return {
    mongoose: mongooseConnected,
    native: nativeConnected,
    overall: mongooseConnected && nativeConnected
  };
}
