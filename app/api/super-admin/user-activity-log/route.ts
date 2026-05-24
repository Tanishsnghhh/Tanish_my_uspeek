import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uspeak-pro';
const DB_NAME = 'uspeak-pro';
const USERS_COLLECTION = 'users';
const EMPLOYEE_PROFILES_COLLECTION = 'employeeprofiles';

// GET - Fetch user activity data for super admin
export async function GET(request: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(USERS_COLLECTION);
    const employeeProfilesCollection = db.collection(EMPLOYEE_PROFILES_COLLECTION);

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const email = searchParams.get('email') || '';

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};
    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    // Fetch users with employee profiles using aggregation
    const users = await usersCollection.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'employeeprofiles',
          localField: '_id',
          foreignField: 'user_id',
          as: 'employeeProfile'
        }
      },
      {
        $addFields: {
          employeeProfile: { $arrayElemAt: ['$employeeProfile', 0] }
        }
      },
      { $sort: { lastLoginAt: -1, created_at: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]).toArray();

    // Get total count for pagination
    const totalCount = await usersCollection.countDocuments(filter);

    // Transform the data to match frontend expectations
    const transformedUsers = users.map(user => {
      const employeeProfile = user.employeeProfile || {};
      
      return {
        id: user._id.toString(),
        firstName: employeeProfile.first_name || user.firstName || user.first_name || 'N/A',
        lastName: employeeProfile.last_name || user.lastName || user.last_name || 'N/A',
        email: user.email || 'N/A',
        phone: employeeProfile.phoneNumber || user.phone || 'N/A',
        ipAddress: 'N/A', // Not available in current data structure
        loginStatus: user.lastLoginAt ? '1' : '0', // 1 if has login, 0 if never logged in
        date: user.lastLoginAt 
          ? new Date(user.lastLoginAt).toLocaleDateString('en-GB')
          : user.created_at 
            ? new Date(user.created_at).toLocaleDateString('en-GB')
            : 'N/A',
        department: employeeProfile.department || 'N/A',
        jobTitle: employeeProfile.job_title || 'N/A',
        status: user.status || 'N/A',
        role: user.role || 'N/A',
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
        createdAt: user.created_at ? new Date(user.created_at).toISOString() : null
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext,
          hasPrev
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user activity data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user activity data',
        data: {
          users: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
            limit: 50,
            hasNext: false,
            hasPrev: false
          }
        }
      },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
