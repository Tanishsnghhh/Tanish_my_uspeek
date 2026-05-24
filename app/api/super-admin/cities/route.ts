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
    const cityFilter = searchParams.get('city') || '';
    const stateFilter = searchParams.get('state') || '';

    // Build aggregation pipeline to get unique cities with their states
    const pipeline: any[] = [
      // Match users that have city and state data
      {
        $match: {
          city: { $exists: true, $ne: null, $ne: '' },
          state: { $exists: true, $ne: null, $ne: '' }
        }
      },
      // Group by city and state to get unique combinations
      {
        $group: {
          _id: {
            city: { $toLower: '$city' },
            state: { $toLower: '$state' }
          },
          city: { $first: '$city' },
          state: { $first: '$state' },
          count: { $sum: 1 }
        }
      },
      // Apply filters if provided
      ...(cityFilter ? [{
        $match: {
          city: { $regex: cityFilter, $options: 'i' }
        }
      }] : []),
      ...(stateFilter ? [{
        $match: {
          state: { $regex: stateFilter, $options: 'i' }
        }
      }] : []),
      // Sort by city name
      {
        $sort: { city: 1 }
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
    const cities = await usersCollection.aggregate(paginatedPipeline).toArray();

    // Transform the data to match the expected format
    const transformedCities = cities.map((city, index) => ({
      id: (page - 1) * limit + index + 1, // Generate sequential ID for display
      city: city.city,
      state: city.state,
      userCount: city.count // Number of users in this city
    }));

    return NextResponse.json({
      success: true,
      data: transformedCities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        limit: limit
      }
    });

  } catch (error: any) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch cities data',
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
