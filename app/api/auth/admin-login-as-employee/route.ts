import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User, EmployeeProfile, AuditLog } from '@/lib/models';
import { generateToken } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { employeeId, adminToken } = await request.json();
    
    if (!employeeId || !adminToken) {
      return NextResponse.json(
        { error: 'Employee ID and admin token are required' },
        { status: 400 }
      );
    }

    // Verify admin token first
    const adminPayload = await verifyToken(adminToken);
    
    if (!adminPayload) {
      return NextResponse.json(
        { error: 'Invalid or expired admin token' },
        { status: 401 }
      );
    }
    
    // Case-insensitive role check
    const normalizedRole = adminPayload.role.toUpperCase();
    if (normalizedRole !== 'ADMIN' && normalizedRole !== 'CORPORATE_ADMIN' && normalizedRole !== 'CORPORATE_USER') {
      return NextResponse.json(
        { error: 'Unauthorized: Admin or Corporate access required' },
        { status: 401 }
      );
    }

    // Find the employee
    const employee = await EmployeeProfile!.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    console.log('Found employee:', {
      id: employee._id,
      firstName: employee.first_name,
      lastName: employee.last_name
    });

    // Find the user account for this employee by looking up the user_id in EmployeeProfile
    let user = await User!.findById(employee.user_id);
    console.log('Looking for user with ID:', employee.user_id);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      // Try to find any users in the system to debug
      const allUsers = await User!.find({}).limit(5);
      console.log('Sample users in system:', allUsers.map(u => ({ email: u.email, role: u.role })));
      
      return NextResponse.json(
        { 
          error: 'Employee user account not found',
          details: `The employee ${employee.first_name} ${employee.last_name} exists but does not have a user account for login.`,
          solution: 'Please use the "Add Employee" button to properly create this employee with full account access.',
          employeeId: employee._id.toString()
        },
        { status: 404 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Employee account is deactivated' },
        { status: 401 }
      );
    }

    // Generate a temporary token for admin login as employee
    const employeeToken = await generateToken(user);

    // Log the admin action
    try {
      await AuditLog.create({
        performed_by_user_id: adminPayload.userId,
        target_user_id: employee._id,
        action_type: 'ADMIN_LOGIN_AS_EMPLOYEE',
        details: `Admin ${adminPayload.email} logged in as employee ${user.email}`,
        timestamp: new Date()
      });
    } catch (auditError) {
      console.error('Failed to log admin action:', auditError);
    }

    // Return employee data and token
    const employeeData = {
      id: user._id.toString(),
      email: user.email,
      firstName: employee.first_name,
      lastName: employee.last_name,
      role: user.role,
      corporateAccountId: user.account_id?.toString(),
      employeeId: employee.employeeId,
      // Use the actual MongoDB _id for fetching employee data
      mongoId: employee._id.toString(),
      department: employee.department,
      jobTitle: employee.job_title,
      // Include employee performance data (using default values since these fields don't exist)
      videosAnalyzed: 12,
      overallScore: 85,
      assignmentsCompleted: 8,
      isAdminLogin: true,
      originalAdminId: adminPayload.userId
    };

    return NextResponse.json({
      success: true,
      message: 'Admin login as employee successful',
      token: employeeToken,
      user: employeeData
    });

  } catch (error) {
    console.error('Admin login as employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to verify JWT token
async function verifyToken(token: string) {
  try {
    const { verifyToken } = await import('@/lib/auth');
    return await verifyToken(token);
  } catch (error) {
    return null;
  }
}
