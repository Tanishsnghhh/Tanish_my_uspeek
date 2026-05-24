import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const CORPORATE_ACCOUNTS_COLLECTION = 'corporateaccounts';

// GET - Fetch all active corporate accounts
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const corporateAccountsCollection = db.collection(CORPORATE_ACCOUNTS_COLLECTION);

    // Fetch all active corporate accounts
    const accounts = await corporateAccountsCollection
      .find({ status: 'ACTIVE' })
      .project({
        _id: 1,
        companyName: 1,
        city: 1,
        state: 1,
        country: 1,
        email: 1
      })
      .sort({ companyName: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: accounts
    });

  } catch (error: any) {
    console.error('Error fetching corporate accounts:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch corporate accounts',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
