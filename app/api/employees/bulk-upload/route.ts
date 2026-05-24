import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User, EmployeeProfile, CorporateAccount, License, AuditLog } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import mongoose from 'mongoose';

// Helper function to create audit logs for bulk upload
async function createBulkUploadAuditLog(
  corporateAccountId: any,
  actionType: string,
  details: string,
  request: NextRequest,
  targetEmployeeId?: any,
  targetUserId?: any,
  targetLicenseId?: any
) {
  try {
    // For bulk upload, we'll use the corporate account as the performer
    // In a real scenario, you'd get the actual user ID from the authentication context
    const auditLog = await AuditLog.create({
      performed_by_user_id: corporateAccountId, // Using corporate account ID as placeholder
      target_user_id: targetUserId,
      action_type: actionType,
      details: details,
      timestamp: new Date()
    });
    return auditLog;
  } catch (error) {
    // Don't fail the main operation if audit log fails
    return null;
  }
}

export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { employees, updateExisting = false } = body;

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        { error: 'No employees data provided' },
        { status: 400 }
      );
    }
    
    // Create a default admin (which acts as corporate account)
    const admin = await CorporateAccount!.create({
      email: `admin_${Date.now()}@testcompany.com`,
      password: 'TempAdmin123!',
      companyName: `Test Company ${Date.now()}`,
      subscriptionPlan: 'basic',
      maxEmployees: 1000,
      firstName: 'Bulk',
      lastName: 'Admin'
    });
    
    // Create audit log for admin account creation
    await createBulkUploadAuditLog(
      admin._id,
      'CREATE_CORPORATE_ACCOUNT',
      `Admin account created for bulk upload: ${admin.companyName}`,
      request
    );

    const results = {
      success: 0,
      failed: 0,
      created: 0,
      updated: 0,
      errors: [] as string[],
      createdEmployees: [] as Array<{
        firstName: string;
        lastName: string;
        email: string;
        tempPassword: string;
        employeeId: string;
      }>
    };

    // Process each employee
    for (let i = 0; i < employees.length; i++) {
      const employeeData = employees[i];
      
      try {
        // Validate required fields
        if (!employeeData.firstName || !employeeData.lastName || !employeeData.email) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing required fields (firstName, lastName, or email)`);
          continue;
        }

        const email = employeeData.email.toLowerCase().trim();
        
        // Check if employee already exists
        const existingUser = await User!.findOne({ email });

        if (existingUser) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Employee with email ${email} already exists`);
          continue;
        }

        // Create new employee
        
        // Create license
        const newLicense = await License.create({
          license_type: 'USPEAK_PRO',
          status: 'ASSIGNED',
          corporate_account_id: corporateAccountId,
          license_key: `USP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          features: ['VIDEO_ANALYSIS', 'LEARNING_LESSONS', 'PROGRESS_TRACKING'],
          maxUsers: 1
        });

        // Generate a unique temporary password
        const tempPassword = generateTempPassword();

        // Create User record first
        const newUser = await User!.create({
          email,
          password_hash: tempPassword,
          role: 'EMPLOYEE',
          status: 'ACTIVE',
          account_id: admin._id,
          passwordChanged: false, // Mark as not changed initially
          tempPassword: tempPassword, // Store the temporary password for display
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          first_name: employeeData.firstName,
          last_name: employeeData.lastName
        });

        // Create EmployeeProfile record linked to the User
        const newEmployee = await EmployeeProfile!.create({
          user_id: newUser!._id,
          corporate_account_id: admin._id,
          first_name: employeeData.firstName,
          last_name: employeeData.lastName,
          phoneNumber: employeeData.phoneNumber || '',
          department: employeeData.department || '',
          job_title: employeeData.jobTitle || '',
          employeeId: `EMP-${Date.now()}-${i}`,
          hireDate: new Date(),
          isActive: true,
          licenseId: newLicense._id
        });

        // Update license to assign it to the employee
        await License.findByIdAndUpdate(newLicense._id, {
          assigned_to_employee_id: newEmployee._id,
          assigned_at: new Date()
        });

        // Create audit log for employee creation
        await createBulkUploadAuditLog(
          admin._id,
          'ADD_EMPLOYEE',
          `Employee created via bulk upload: ${employeeData.firstName} ${employeeData.lastName} (${email})`,
          request,
          newEmployee._id,
          newUser!._id,
          newLicense._id
        );
        
        // Add to created employees list
        results.createdEmployees.push({
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: email,
          tempPassword: tempPassword,
          employeeId: newEmployee.employeeId
        });
        
        results.created++;
        results.success++;
        
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    // Create audit log for the overall bulk upload operation
    await createBulkUploadAuditLog(
      admin._id,
      'BULK_UPLOAD',
      `Bulk upload completed: ${results.created} employees created, ${results.failed} failed, ${results.success} total successful`,
      request
    );
    
    return NextResponse.json({
      success: true,
      message: `Bulk upload completed. ${results.success} successful, ${results.failed} failed.`,
      results
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error during bulk upload' },
      { status: 500 }
    );
  }
}

// Helper function to generate temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
