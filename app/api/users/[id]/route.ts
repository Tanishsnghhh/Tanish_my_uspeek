import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User, EmployeeProfile, CorporateAccount, AssignmentInstance } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Fetch detailed user information by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if user has admin privileges
    if (decoded.role !== 'ADMIN' && decoded.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get corporate account ID from token
    const corporateAccountId = decoded.corporateAccountId || decoded.account_id;
    if (!corporateAccountId) {
      return NextResponse.json(
        { error: 'Corporate account ID not found' },
        { status: 400 }
      );
    }

    const { id: userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user with populated account information, filtered by corporate account
    const user = await User!.findOne({ 
      _id: userId,
      account_id: corporateAccountId
    })
      .populate('account_id', 'company_name')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let detailedUser: any = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
      accountId: user.account_id?._id?.toString() || user.account_id?.toString() || 'unknown',
      accountName: user.account_id && typeof user.account_id === 'object' && 'company_name' in user.account_id
        ? (user.account_id as { company_name?: string }).company_name || null
        : null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.lastLoginAt,
      // Name fields from User model (prioritize these)
      firstName: user.firstName || user.first_name || null,
      lastName: user.lastName || user.last_name || null,
    };

    // Fetch additional information based on role
    if (user.role === 'EMPLOYEE' || user.role === 'CORPORATE_USER') {
      // Try to get EmployeeProfile data
      const employeeProfile = await EmployeeProfile!.findOne({ user_id: user._id })
        .populate('managerId', 'first_name last_name employeeId')
        .populate('licenseId', 'license_type')
        .lean();

      if (employeeProfile) {
        detailedUser!.employeeProfile = {
          employeeId: employeeProfile.employeeId,
          firstName: employeeProfile.first_name,
          lastName: employeeProfile.last_name,
          phoneNumber: employeeProfile.phoneNumber,
          department: employeeProfile.department,
          jobTitle: employeeProfile.job_title,
          hireDate: employeeProfile.hireDate,
          isActive: employeeProfile.isActive,
          manager: employeeProfile.managerId && typeof employeeProfile.managerId === 'object' && '_id' in employeeProfile.managerId ? {
            id: employeeProfile.managerId._id.toString(),
            name: `${(employeeProfile.managerId as any).first_name || 'Unknown'} ${(employeeProfile.managerId as any).last_name || 'Manager'}`,
            employeeId: (employeeProfile.managerId as any).employeeId
          } : null,
          license: employeeProfile.licenseId ? {
            id: employeeProfile.licenseId._id.toString(),
            type: (employeeProfile.licenseId as any).license_type
          } : null,
          customAttributes: employeeProfile.custom_attributes ? 
            (employeeProfile.custom_attributes instanceof Map ? 
              Object.fromEntries(employeeProfile.custom_attributes) : 
              employeeProfile.custom_attributes) : 
            {}
        };

        // Override name fields with EmployeeProfile data if User model doesn't have them
        if (!detailedUser!.firstName) {
          detailedUser!.firstName = employeeProfile.first_name;
        }
        if (!detailedUser!.lastName) {
          detailedUser!.lastName = employeeProfile.last_name;
        }
      }

      // Get assignment statistics for employees
      const assignmentStats = await AssignmentInstance!.aggregate([
        { $match: { employee_id: user._id } },
        {
          $group: {
            _id: null,
            totalAssignments: { $sum: 1 },
            completedAssignments: {
              $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
            },
            pendingAssignments: {
              $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
            },
            inProgressAssignments: {
              $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] }
            }
          }
        }
      ]);

      if (assignmentStats.length > 0) {
        detailedUser!.assignmentStats = assignmentStats[0];
      }
    }

    // For Corporate Admins, get account management information
    if (user.role === 'CORPORATE_ADMIN') {
      const accountUsers = await User!.countDocuments({
        account_id: user.account_id,
        status: 'ACTIVE'
      });

      const accountEmployees = await EmployeeProfile!.countDocuments({
        isActive: true,
        user_id: {
          $in: (await User!.find({ account_id: user.account_id }, '_id')).map(u => u._id)
        }
      });

      detailedUser!.accountManagement = {
        totalUsers: accountUsers,
        totalEmployees: accountEmployees,
        accountId: detailedUser!.accountId,
        accountName: detailedUser!.accountName
      };
    }

    return NextResponse.json({
      success: true,
      data: detailedUser
    });

  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
