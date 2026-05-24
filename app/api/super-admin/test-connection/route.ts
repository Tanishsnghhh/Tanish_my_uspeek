import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const COLLECTION_NAME = 'users';

// GET - Test MongoDB connection and fetch sample data
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    console.log('Attempting to connect to MongoDB:', MONGODB_URI);
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(COLLECTION_NAME);

    // Test basic operations
    const totalCount = await usersCollection.countDocuments();
    const activeCount = await usersCollection.countDocuments({ status: 'ACTIVE' });
    
    // Get a sample of users
    const sampleUsers = await usersCollection.find({ status: 'ACTIVE' })
      .limit(5)
      .project({ email: 1, role: 1, status: 1, firstName: 1, lastName: 1, created_at: 1 })
      .toArray();

    console.log('Database stats:', { totalCount, activeCount, sampleCount: sampleUsers.length });

    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      data: {
        totalUsers: totalCount,
        activeUsers: activeCount,
        sampleUsers: sampleUsers
      }
    });

  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'MongoDB connection failed',
        details: error.message,
        connectionString: MONGODB_URI
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}
