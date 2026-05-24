import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const USERS_COLLECTION = 'users';

export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(USERS_COLLECTION);

    // Get query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const countryFilter = searchParams.get('country') || '';
    const locationFilter = searchParams.get('location') || '';

    // Build aggregation pipeline to get unique countries with their details
    const pipeline: any[] = [
      // Match users that have country, countryCode, phoneCode, and location data
      {
        $match: {
          country: { $exists: true, $ne: null, $ne: '' },
          countryCode: { $exists: true, $ne: null, $ne: '' },
          phoneCode: { $exists: true, $ne: null, $ne: '' },
          location: { $exists: true, $ne: null, $ne: '' }
        }
      },
      // Group by country to get unique combinations with all related data
      {
        $group: {
          _id: {
            country: { $toLower: '$country' }
          },
          country: { $first: '$country' },
          countryCode: { $first: '$countryCode' },
          phoneCode: { $first: '$phoneCode' },
          location: { $first: '$location' },
          userCount: { $sum: 1 }
        }
      },
      // Apply filters if provided
      ...(countryFilter ? [{
        $match: {
          country: { $regex: countryFilter, $options: 'i' }
        }
      }] : []),
      ...(locationFilter ? [{
        $match: {
          location: { $regex: locationFilter, $options: 'i' }
        }
      }] : []),
      // Sort by country name
      {
        $sort: { country: 1 }
      }
    ];

    // Get total count for pagination
    const totalCountPipeline = [
      ...pipeline,
      { $count: 'total' }
    ];
    
    const totalCountResult = await usersCollection.aggregate(totalCountPipeline).toArray();
    const totalCount = totalCountResult.length > 0 ? totalCountResult[0].total : 0;

    // Add pagination to the main pipeline
    const paginatedPipeline = [
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ];

    // Execute the main query
    const countries = await usersCollection.aggregate(paginatedPipeline).toArray();

    // Transform the data to match the expected format
    const transformedCountries = countries.map((country, index) => ({
      id: (page - 1) * limit + index + 1, // Generate sequential ID for display
      countryCode: country.countryCode,
      name: country.country,
      location: country.location,
      phoneCode: country.phoneCode,
      userCount: country.userCount // Number of users in this country
    }));

    return NextResponse.json({
      success: true,
      data: transformedCountries,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        limit: limit
      }
    });

  } catch (error: any) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch countries data',
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
