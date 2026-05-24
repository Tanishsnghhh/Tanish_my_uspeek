import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { License, EmployeeProfile, User } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Fetch available licenses or all licenses
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication and get corporate account
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user and their corporate account
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Corporate admin role required.' },
        { status: 403 }
      );
    }

    const corporateAccountId = user.account_id;

    const { searchParams } = new URL(request.url);
    const showAvailable = searchParams.get('available') === 'true';

    let query: any = {
      corporate_account_id: corporateAccountId
    };

    if (showAvailable) {
      // Find licenses that are not assigned to any employee within this corporate account
      const assignedLicenseIds = await EmployeeProfile!.distinct('licenseId', {
        licenseId: { $exists: true, $ne: null },
        corporate_account_id: corporateAccountId
      });

      query = {
        ...query,
        _id: { $nin: assignedLicenseIds },
        status: 'AVAILABLE'
      };
    }

    const licenses = await License.find(query).sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      data: licenses
    });

  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Assign license to employee
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication and get corporate account
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user and their corporate account
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Corporate admin role required.' },
        { status: 403 }
      );
    }

    const corporateAccountId = user.account_id;

    const body = await request.json();
    const { licenseId, employeeId } = body;

    if (!licenseId || !employeeId) {
      return NextResponse.json(
        { error: 'License ID and Employee ID are required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(licenseId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid license or employee ID format' },
        { status: 400 }
      );
    }

    // Check if license exists, is available, and belongs to the corporate account
    const license = await License.findById(licenseId);
    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    if (license.corporate_account_id.toString() !== corporateAccountId.toString()) {
      return NextResponse.json(
        { error: 'License does not belong to your corporate account' },
        { status: 403 }
      );
    }

    if (license.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'License is not available for assignment' },
        { status: 400 }
      );
    }

    // Check if employee exists and belongs to the same corporate account
    const employee = await EmployeeProfile!.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (!employee.corporate_account_id) {
      // Try to get corporate account ID from the user record
      const user = await User.findById(employee.user_id);
      if (user && user.account_id) {
        // Update the employee record with the corporate account ID
        employee.corporate_account_id = user.account_id;
        await employee.save();
      } else {
        return NextResponse.json(
          { error: 'Employee profile is missing corporate account information. Please contact support.' },
          { status: 400 }
        );
      }
    }

    if (employee.corporate_account_id.toString() !== corporateAccountId.toString()) {
      return NextResponse.json(
        { error: 'Employee does not belong to your corporate account' },
        { status: 403 }
      );
    }

    // Check if employee already has a license
    if (employee.licenseId) {
      return NextResponse.json(
        { error: 'Employee already has a license assigned' },
        { status: 400 }
      );
    }

    // Assign license to employee
    employee.licenseId = new mongoose.Types.ObjectId(licenseId);
    await employee.save();

    // Update license status
    license.status = 'ASSIGNED';
    license.assigned_to_employee_id = new mongoose.Types.ObjectId(employeeId);
    license.assigned_at = new Date();
    await license.save();

    return NextResponse.json({
      success: true,
      message: 'License assigned successfully',
      data: {
        employee: employee,
        license: license
      }
    });

  } catch (error) {
    console.error('Error assigning license:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Create new license
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication and get corporate account
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user and their corporate account
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Corporate admin role required.' },
        { status: 403 }
      );
    }

    const corporateAccountId = user.account_id;

    const body = await request.json();
    const { licenseType, employeeId } = body;

    if (!licenseType) {
      return NextResponse.json(
        { error: 'License type is required' },
        { status: 400 }
      );
    }

    // Validate license type
    const validTypes = ['USPEAK_BASIC', 'USPEAK_PRO', 'USPEAK_ENTERPRISE'];
    if (!validTypes.includes(licenseType)) {
      return NextResponse.json(
        { error: 'Invalid license type' },
        { status: 400 }
      );
    }

    // If employeeId is provided, create and assign license in one step
    if (employeeId) {
      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return NextResponse.json(
          { error: 'Invalid employee ID format' },
          { status: 400 }
        );
      }

      // Check if employee exists and belongs to the same corporate account
      const employee = await EmployeeProfile!.findById(employeeId);
      if (!employee) {
        return NextResponse.json(
          { error: 'Employee not found' },
          { status: 404 }
        );
      }

      if (!employee.corporate_account_id) {
        // Try to get corporate account ID from the user record
        const user = await User.findById(employee.user_id);
        if (user && user.account_id) {
          // Update the employee record with the corporate account ID
          employee.corporate_account_id = user.account_id;
          await employee.save();
        } else {
          return NextResponse.json(
            { error: 'Employee profile is missing corporate account information. Please contact support.' },
            { status: 400 }
          );
        }
      }

      if (employee.corporate_account_id.toString() !== corporateAccountId.toString()) {
        return NextResponse.json(
          { error: 'Employee does not belong to your corporate account' },
          { status: 403 }
        );
      }

      // Check if employee already has a license
      if (employee.licenseId) {
        return NextResponse.json(
          { error: 'Employee already has a license assigned' },
          { status: 400 }
        );
      }

      // Create new license with corporate account
      const newLicense = await License.create({
        license_type: licenseType,
        status: 'ASSIGNED',
        corporate_account_id: corporateAccountId,
        license_key: `USP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        features: ['VIDEO_ANALYSIS', 'LEARNING_LESSONS', 'PROGRESS_TRACKING'],
        maxUsers: 1,
        assigned_to_employee_id: new mongoose.Types.ObjectId(employeeId),
        assigned_at: new Date()
      });

      // Assign license to employee
      employee.licenseId = newLicense._id;
      await employee.save();

      return NextResponse.json({
        success: true,
        message: 'License created and assigned successfully',
        data: {
          employee: employee,
          license: newLicense
        }
      });
    } else {
      // Create license without assignment
      const newLicense = await License.create({
        license_type: licenseType,
        status: 'AVAILABLE',
        corporate_account_id: corporateAccountId,
        license_key: `USP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        features: ['VIDEO_ANALYSIS', 'LEARNING_LESSONS', 'PROGRESS_TRACKING'],
        maxUsers: 1
      });

      return NextResponse.json({
        success: true,
        message: 'License created successfully',
        data: newLicense
      });
    }

  } catch (error) {
    console.error('Error creating license:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication and get corporate account
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user and their corporate account
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Corporate admin role required.' },
        { status: 403 }
      );
    }

    const corporateAccountId = user.account_id;

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { error: 'Invalid employee ID format' },
        { status: 400 }
      );
    }

    // Find employee and verify they belong to the corporate account
    const employee = await EmployeeProfile!.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    if (!employee.corporate_account_id) {
      // Try to get corporate account ID from the user record
      const user = await User.findById(employee.user_id);
      if (user && user.account_id) {
        // Update the employee record with the corporate account ID
        employee.corporate_account_id = user.account_id;
        await employee.save();
      } else {
        return NextResponse.json(
          { error: 'Employee profile is missing corporate account information. Please contact support.' },
          { status: 400 }
        );
      }
    }

    if (employee.corporate_account_id.toString() !== corporateAccountId.toString()) {
      return NextResponse.json(
        { error: 'Employee does not belong to your corporate account' },
        { status: 403 }
      );
    }

    if (!employee.licenseId) {
      return NextResponse.json(
        { error: 'Employee does not have a license assigned' },
        { status: 400 }
      );
    }

    // Find and update license
    const license = await License.findById(employee.licenseId);
    if (license) {
      // Verify license belongs to the corporate account
      if (license.corporate_account_id.toString() !== corporateAccountId.toString()) {
        return NextResponse.json(
          { error: 'License does not belong to your corporate account' },
          { status: 403 }
        );
      }

      license.status = 'AVAILABLE';
      license.assigned_to_employee_id = undefined;
      license.assigned_at = undefined;
      await license.save();
    }

    // Remove license from employee
    employee.licenseId = undefined;
    await employee.save();

    return NextResponse.json({
      success: true,
      message: 'License unassigned successfully'
    });

  } catch (error) {
    console.error('Error unassigning license:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
