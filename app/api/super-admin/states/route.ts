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
    const stateFilter = searchParams.get('state') || '';
    const countryFilter = searchParams.get('country') || '';

    // Build aggregation pipeline to get unique states with their countries
    const pipeline: any[] = [
      // Match users that have state and country data
      {
        $match: {
          state: { $exists: true, $ne: null, $ne: '' },
          country: { $exists: true, $ne: null, $ne: '' }
        }
      },
      // Group by state and country to get unique combinations
      {
        $group: {
          _id: {
            state: { $toLower: '$state' },
            country: { $toLower: '$country' }
          },
          state: { $first: '$state' },
          country: { $first: '$country' },
          userCount: { $sum: 1 }
        }
      },
      // Apply filters if provided
      ...(stateFilter ? [{
        $match: {
          state: { $regex: stateFilter, $options: 'i' }
        }
      }] : []),
      ...(countryFilter ? [{
        $match: {
          country: { $regex: countryFilter, $options: 'i' }
        }
      }] : []),
      // Sort by state name
      {
        $sort: { state: 1 }
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
    const states = await usersCollection.aggregate(paginatedPipeline).toArray();

    // Transform the data to match the expected format
    const transformedStates = states.map((state, index) => ({
      id: (page - 1) * limit + index + 1, // Generate sequential ID for display
      state: state.state,
      country: state.country,
      userCount: state.userCount // Number of users in this state
    }));

    return NextResponse.json({
      success: true,
      data: transformedStates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount: totalCount,
        limit: limit
      }
    });

  } catch (error: any) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch states data',
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
