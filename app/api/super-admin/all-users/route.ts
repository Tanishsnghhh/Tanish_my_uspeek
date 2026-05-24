import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectDB();
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Filter parameters
    const emailFilter = searchParams.get('email') || '';
    const phoneFilter = searchParams.get('phone') || '';
    const roleFilter = searchParams.get('role') || '';
    const statusFilter = searchParams.get('status') || '';
    
    const users = db.collection('users');
    const employeeProfiles = db.collection('employeeprofiles');
    const corporateAccounts = db.collection('corporateaccounts');
    
    // Build match query
    const matchQuery: any = {};
    if (emailFilter) {
      matchQuery.email = { $regex: emailFilter, $options: 'i' };
    }
    if (roleFilter) {
      matchQuery.role = roleFilter;
    }
    if (statusFilter) {
      matchQuery.status = statusFilter;
    }
    
    // Aggregate users with their profiles and corporate account info
    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'employeeprofiles',
          localField: '_id',
          foreignField: 'user_id',
          as: 'employeeProfile'
        }
      },
      {
        $lookup: {
          from: 'corporateaccounts',
          localField: 'account_id',
          foreignField: '_id',
          as: 'corporateAccount'
        }
      },
      {
        $unwind: {
          path: '$employeeProfile',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$corporateAccount',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          // Combine first and last names for display
          displayFirstName: {
            $ifNull: [
              '$firstName',
              { $ifNull: ['$first_name', { $ifNull: ['$employeeProfile.first_name', 'N/A'] }] }
            ]
          },
          displayLastName: {
            $ifNull: [
              '$lastName',
              { $ifNull: ['$last_name', { $ifNull: ['$employeeProfile.last_name', 'N/A'] }] }
            ]
          },
          phoneNumber: { $ifNull: ['$employeeProfile.phoneNumber', 'N/A'] }
        }
      },
      {
        $addFields: {
          userName: { $concat: ['$displayFirstName', ' ', '$displayLastName'] }
        }
      }
    ];
    
    // Add phone filter if provided (must be done after the lookup)
    if (phoneFilter) {
      pipeline.push({
        $match: {
          phoneNumber: { $regex: phoneFilter, $options: 'i' }
        }
      } as any);
    }
    
    // Get total count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await users.aggregate(countPipeline).toArray();
    const totalRecords = countResult.length > 0 ? countResult[0].total : 0;
    
    // Add sorting, skip, and limit
    pipeline.push(
      { $sort: { created_at: -1 } } as any,
      { $skip: skip } as any,
      { $limit: limit } as any
    );
    
    // Execute the aggregation
    const usersData = await users.aggregate(pipeline).toArray();
    
    // Format the response
    const formattedUsers = usersData.map((user: any) => ({
      id: user._id.toString(),
      email: user.email || 'N/A',
      firstName: user.displayFirstName,
      lastName: user.displayLastName,
      userName: user.userName,
      phone: user.phoneNumber,
      isActive: user.status === 'ACTIVE',
      status: user.status || 'UNKNOWN',
      role: user.role || 'N/A',
      companyName: user.corporateAccount?.companyName || 'N/A',
      accountId: user.account_id?.toString() || 'N/A',
      department: user.employeeProfile?.department || 'N/A',
      jobTitle: user.employeeProfile?.job_title || 'N/A',
      employeeId: user.employeeProfile?.employeeId || 'N/A',
      location: user.location || user.city || 'N/A',
      country: user.country || 'N/A',
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('en-GB') : 'Never',
      createdAt: user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : 'N/A',
      updatedAt: user.updated_at ? new Date(user.updated_at).toLocaleDateString('en-GB') : 'N/A'
    }));
    
    // Get statistics
    const statsAggregation = await users.aggregate([
      {
        $facet: {
          byRole: [
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    ]).toArray();
    
    const stats = statsAggregation[0];
    const roleStats = stats.byRole.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    const statusStats = stats.byStatus.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        recordsPerPage: limit,
        hasNextPage: page < Math.ceil(totalRecords / limit),
        hasPrevPage: page > 1
      },
      stats: {
        total: stats.total[0]?.count || 0,
        byRole: roleStats,
        byStatus: statusStats,
        activeUsers: statusStats.ACTIVE || 0,
        inactiveUsers: (statusStats.DEACTIVATED || 0) + (statusStats.DELETED || 0)
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users data' },
      { status: 500 }
    );
  }
}
