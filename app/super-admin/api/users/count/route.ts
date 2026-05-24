import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Fetch total user count for super admin
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

    // Fetch total registered users (all users with ACTIVE status)
    const totalUsers = await User!.countDocuments({ status: 'ACTIVE' });

    // Fetch B2B users (users with corporate accounts)
    const b2bUsers = await User!.countDocuments({ 
      status: 'ACTIVE',
      account_id: { $exists: true, $ne: null }
    });

    // Fetch direct users (users without corporate accounts)
    const directUsers = await User!.countDocuments({ 
      status: 'ACTIVE',
      $or: [
        { account_id: { $exists: false } },
        { account_id: null }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        b2bUsers,
        directUsers
      }
    });

  } catch (error: any) {
    console.error('Error fetching user counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user counts' },
      { status: 500 }
    );
  }
}
