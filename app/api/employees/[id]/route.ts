import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { EmployeeProfile, User, CorporateAccount, License } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import mongoose from 'mongoose';

// GET - Fetch individual employee profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    let { id: employeeId } = await params;
    
    // Check if it's a valid MongoDB ObjectId
    let isValidObjectId = mongoose.Types.ObjectId.isValid(employeeId);
    
    // If not a valid ObjectId, try to find by employeeId field
    if (!isValidObjectId) {
      // Try to find employee by employeeId field instead
      const employeeByCode = await EmployeeProfile!.findOne({ employeeId: employeeId });
      if (employeeByCode) {
        // Use the MongoDB _id from the found employee
        employeeId = (employeeByCode._id as mongoose.Types.ObjectId).toString();
        isValidObjectId = true;
      } else {
        return NextResponse.json(
          { error: 'Employee not found with ID: ' + employeeId },
          { status: 404 }
        );
      }
    }

    // Fetch employee with populated data
    const employee = await EmployeeProfile!.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(employeeId)
        }
      },
      {
        $lookup: {
          from: 'licenses',
          localField: 'licenseId',
          foreignField: '_id',
          as: 'license'
        }
      },
      {
        $unwind: {
          path: '$license',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: 'corporateaccounts',
          localField: 'user.account_id',
          foreignField: '_id',
          as: 'admin'
        }
      },
      {
        $unwind: {
          path: '$admin',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          id: { $toString: '$_id' },
          firstName: '$first_name',
          lastName: '$last_name',
          email: '$user.email',
          phoneNumber: 1,
          department: 1,
          jobTitle: '$job_title',
          employeeId: 1,
          hireDate: 1,
          customAttributes: {
            $ifNull: ['$custom_attributes', {}]
          },
          status: { $ifNull: ['$isActive', true] },
          videosAnalyzed: { $ifNull: ['$videosAnalyzed', 12] }, // Default to 12 if not set
          assignmentsCompleted: { $ifNull: ['$assignmentsCompleted', 8] }, // Default to 8 if not set
          overallScore: { $ifNull: ['$overallScore', 85] }, // Default to 85 if not set
          lastActive: { $ifNull: ['$lastLoginAt', '$created_at'] },
          licenseStatus: { $ifNull: ['$license.status', 'UNASSIGNED'] },
          licenseType: { $ifNull: ['$license.license_type', 'STANDARD'] },
          companyName: { $ifNull: ['$admin.companyName', 'Unknown Company'] }
        }
      }
    ]);

    if (!employee || employee.length === 0) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    const employeeData = employee[0];
    
    // Convert dates to ISO strings for JSON serialization
    if (employeeData.hireDate) {
      employeeData.hireDate = new Date(employeeData.hireDate).toISOString();
    }
    if (employeeData.lastActive) {
      employeeData.lastActive = new Date(employeeData.lastActive).toISOString();
    }

    return NextResponse.json({
      success: true,
      employee: employeeData
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update employee profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id: employeeId } = await params;
    const updateData = await request.json();

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    const currentUser = await User!.findById(decoded.userId);
    if (!currentUser || currentUser!.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
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

    // Update employee fields
    const allowedFields = [
      'first_name', 'last_name', 'phoneNumber', 'department', 'job_title',
      'isActive', 'licenseId'
    ];

    const updates: any = {};

    // Map frontend field names to database field names
    if (updateData.firstName !== undefined) updates.first_name = updateData.firstName;
    if (updateData.lastName !== undefined) updates.last_name = updateData.lastName;
    if (updateData.phoneNumber !== undefined) updates.phoneNumber = updateData.phoneNumber;
    if (updateData.department !== undefined) updates.department = updateData.department;
    if (updateData.jobTitle !== undefined) updates.job_title = updateData.jobTitle;
    if (updateData.status !== undefined) updates.isActive = updateData.status === 'ACTIVE';
    if (updateData.licenseStatus !== undefined && updateData.licenseStatus !== 'UNASSIGNED') {
      // Handle license status updates
      if (updateData.licenseStatus === 'ASSIGNED' && !employee.licenseId) {
        // Find an available license
        const availableLicense = await License.findOne({ status: 'AVAILABLE' });
        if (availableLicense) {
          updates.licenseId = availableLicense._id;
          await License.findByIdAndUpdate(availableLicense._id, { status: 'ASSIGNED' });
        }
      } else if (updateData.licenseStatus === 'AVAILABLE' && employee.licenseId) {
        // Release the license
        await License.findByIdAndUpdate(employee.licenseId, { status: 'AVAILABLE' });
        updates.licenseId = null;
      }
    }

    // Update the employee
    const updatedEmployee = await EmployeeProfile!.findByIdAndUpdate(
      employeeId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedEmployee) {
      return NextResponse.json(
        { error: 'Failed to update employee' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      employee: {
        id: updatedEmployee._id.toString(),
        firstName: updatedEmployee.first_name,
        lastName: updatedEmployee.last_name,
        email: updatedEmployee.user_id ? (await User!.findById(updatedEmployee.user_id))?.email : '',
        phoneNumber: updatedEmployee.phoneNumber,
        department: updatedEmployee.department,
        jobTitle: updatedEmployee.job_title,
        status: updatedEmployee.isActive ? 'ACTIVE' : 'DEACTIVATED',
        licenseStatus: updatedEmployee.licenseId ? 'ASSIGNED' : 'AVAILABLE'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
