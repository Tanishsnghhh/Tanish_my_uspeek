import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User, CorporateAccount } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Fetch comprehensive statistics for super admin dashboard
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user has super admin privileges
    if (decoded.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Fetch all statistics in parallel for better performance
    const [
      totalUsers,
      b2bUsers,
      directUsers,
      totalCorporateAccounts,
      userRegistrationTrends
    ] = await Promise.all([
      // Total active users
      User!.countDocuments({ status: 'ACTIVE' }),
      
      // B2B users (users with corporate accounts)
      User!.countDocuments({ 
        status: 'ACTIVE',
        account_id: { $exists: true, $ne: null }
      }),
      
      // Direct users (users without corporate accounts)
      User!.countDocuments({ 
        status: 'ACTIVE',
        $or: [
          { account_id: { $exists: false } },
          { account_id: null }
        ]
      }),
      
      // Total corporate accounts
      CorporateAccount!.countDocuments({ status: 'ACTIVE' }),
      
      // User registration trends (last 12 months)
      (async () => {
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const trends = await User!.aggregate([
          {
            $match: {
              status: 'ACTIVE',
              created_at: { $gte: twelveMonthsAgo }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$created_at' },
                month: { $month: '$created_at' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 }
          }
        ]);

        return trends.map(trend => ({
          month: `${new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', { month: 'short' })} ${trend._id.year.toString().slice(-2)}`,
          count: trend.count,
          formattedMonth: `${new Date(trend._id.year, trend._id.month - 1).toLocaleDateString('en-US', { month: 'short' })} '${trend._id.year.toString().slice(-2)}`
        }));
      })()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        b2bUsers,
        directUsers,
        totalCorporateAccounts,
        userRegistrationTrends
      }
    });

  } catch (error: any) {
    console.error('Error fetching dashboard statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
