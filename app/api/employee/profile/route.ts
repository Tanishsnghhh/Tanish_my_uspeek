import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { EmployeeProfile, User } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Fetch current user's employee profile
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Find the employee profile for the current user
    const employeeProfile = await EmployeeProfile!.findOne({
      user_id: decoded.userId,
      isActive: true
    }).populate('user_id', 'firstName lastName email role');

    if (!employeeProfile) {
      return NextResponse.json(
        { error: 'Employee profile not found' },
        { status: 404 }
      );
    }

    // Get custom attributes in legacy format for backward compatibility
    const customAttributes = await employeeProfile.getCustomAttributesLegacyFormat();

    // Format the response to match the frontend interface
    const response = {
      employee: {
        _id: employeeProfile._id,
        user_id: employeeProfile.user_id,
        first_name: employeeProfile.first_name,
        last_name: employeeProfile.last_name,
        department: employeeProfile.department,
        job_title: employeeProfile.job_title,
        custom_attributes: {
          ...employeeProfile.custom_attributes,
          ...customAttributes,
          employeeId: employeeProfile.employeeId,
          hireDate: employeeProfile.hireDate,
          isActive: employeeProfile.isActive
        },
        employeeId: employeeProfile.employeeId,
        hireDate: employeeProfile.hireDate,
        isActive: employeeProfile.isActive,
        created_at: employeeProfile.created_at,
        updated_at: employeeProfile.updated_at
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update employee profile (limited fields that employees can edit)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Get token from header
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify the token
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phoneNumber } = body;

    // Find and update the employee profile
    const employeeProfile = await EmployeeProfile!.findOneAndUpdate(
      { user_id: decoded.userId, isActive: true },
      {
        phoneNumber,
        updated_at: new Date()
      },
      { new: true }
    );

    if (!employeeProfile) {
      return NextResponse.json(
        { error: 'Employee profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Employee profile updated successfully',
      employee: {
        _id: employeeProfile._id,
        user_id: employeeProfile.user_id,
        first_name: employeeProfile.first_name,
        last_name: employeeProfile.last_name,
        department: employeeProfile.department,
        job_title: employeeProfile.job_title,
        phoneNumber: employeeProfile.phoneNumber,
        employeeId: employeeProfile.employeeId,
        hireDate: employeeProfile.hireDate,
        isActive: employeeProfile.isActive,
        created_at: employeeProfile.created_at,
        updated_at: employeeProfile.updated_at
      }
    });

  } catch (error) {
    console.error('Error updating employee profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
