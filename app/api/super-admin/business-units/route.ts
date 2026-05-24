import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const BUSINESS_UNITS_COLLECTION = 'businessunits';

// GET - Fetch business units data for super admin
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const businessUnitsCollection = db.collection(BUSINESS_UNITS_COLLECTION);

    // Fetch all business units
    const allBusinessUnits = await businessUnitsCollection.find({})
      .project({ 
        businessName: 1, 
        businessCode: 1, 
        businessCategory: 1, 
        region: 1, 
        isActive: 1, 
        assignedEmployees: 1,
        createdAt: 1 
      })
      .toArray();

    // Fetch active business units count
    const activeBusinessUnitsCount = await businessUnitsCollection.countDocuments({ isActive: true });

    // Fetch inactive business units count
    const inactiveBusinessUnitsCount = await businessUnitsCollection.countDocuments({ isActive: false });

    console.log('Business units stats:', { 
      total: allBusinessUnits.length, 
      active: activeBusinessUnitsCount, 
      inactive: inactiveBusinessUnitsCount 
    });

    return NextResponse.json({
      success: true,
      data: {
        totalBusinessUnits: allBusinessUnits.length,
        activeBusinessUnits: activeBusinessUnitsCount,
        inactiveBusinessUnits: inactiveBusinessUnitsCount,
        businessUnits: allBusinessUnits
      }
    });

  } catch (error: any) {
    console.error('Error fetching business units:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch business units',
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
