import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User, CorporateAccount, AuditLog, EmployeeProfile } from '@/lib/models';
import { generateToken } from '@/lib/auth';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password, role } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    let user;
    let adminRecord;
    let isAdmin = false;

    // First, check if user exists in User collection (this includes all users: admins, employees, etc.)
    user = await User!.findOne({ email: email.toLowerCase() }).populate('account_id');
    
    // If user exists and has CORPORATE_ADMIN role, get the admin record
    if (user && user.role === 'CORPORATE_ADMIN') {
      adminRecord = await CorporateAccount!.findById(user.account_id);
      isAdmin = true;
    }

    // If no user found in User collection, check Admin collection (legacy fallback)
    if (!user && role === 'admin') {
      adminRecord = await CorporateAccount!.findOne({ email: email.toLowerCase() });
      if (adminRecord) {
        // Create a User record for this admin if it doesn't exist
        user = await User!.create({
          email: adminRecord.email,
          password_hash: adminRecord.password, // This will be hashed by pre-save hook
          role: 'CORPORATE_ADMIN',
          status: adminRecord.status,
          account_id: adminRecord._id
        });
        isAdmin = true;
      }
    }

    // If still no user found, check if it's an employee login
    if (!user) {
      user = await User!.findOne({ email: email.toLowerCase() }).populate('account_id');
      
      // If user exists but has no account_id, try to fix it from Employee record
      if (user && !user.account_id) {
        const employee = await EmployeeProfile!.findOne({ email: email.toLowerCase() });
        
        if (employee && (employee as any).account_id) {
          user.account_id = (employee as any).account_id;
          await user.save();
        }
      }
    }
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Check if corporate account is active (for non-admin users)
    if (!isAdmin && user.account_id) {
      const corporateAccount = user.account_id as any;
      if (corporateAccount.status !== 'ACTIVE') {
        return NextResponse.json(
          { error: 'Corporate account is suspended' },
          { status: 401 }
        );
      }
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = await generateToken(user);

    // Log the login action - handle missing account_id
    try {
      if (user.account_id) {
        const auditCorporateAccountId = user.account_id._id || user.account_id;
        
        // Determine specific action type based on user role
        let actionType = 'LOGIN';
        if (isAdmin) {
          actionType = 'ADMIN_LOGIN';
        } else if (user.role === 'EMPLOYEE' || user.role === 'CORPORATE_USER') {
          actionType = 'EMPLOYEE_LOGIN';
        } else if (user.role === 'CORPORATE_ADMIN') {
          actionType = 'ADMIN_LOGIN';
        } else {
          actionType = 'USER_LOGIN';
        }
        
        await AuditLog.create({
          performed_by_user_id: user._id,
          action_type: actionType,
          details: `${isAdmin ? 'Admin' : user.role === 'EMPLOYEE' ? 'Employee' : 'User'} ${user.email} logged in successfully`,
          timestamp: new Date()
        });
      } else {
        // Skip audit log creation silently
      }
    } catch (auditError) {
      // Silently handle audit log failure
    }

    // Return user data - handle different field structures for Admin vs User
    let userData: any = {};

    if (isAdmin && adminRecord) {
      // For admin users, use data from CorporateAccount
      userData = {
        id: user._id.toString(),
        email: adminRecord.email,
        firstName: adminRecord.firstName || '',
        lastName: adminRecord.lastName || '',
        role: 'ADMIN',
        corporateAccountId: (user.account_id?._id || user.account_id)?.toString(),
        companyName: adminRecord.companyName || ''
      };
    } else {
      // For regular users, use data from User model
      userData = {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        role: user.role,
        corporateAccountId: user.account_id ? (user.account_id._id || user.account_id).toString() : null,
        companyName: user.account_id ? (user.account_id as any).companyName : null
      };

      // If this is a corporate user and we don't have names, try to get from EmployeeProfile
      if (user.role !== 'CORPORATE_ADMIN' && (!userData.firstName || !userData.lastName)) {
        try {
          const employee = await EmployeeProfile!.findOne({ email: email.toLowerCase() });
          if (employee) {
            userData.firstName = userData.firstName || employee.first_name;
            userData.lastName = userData.lastName || employee.last_name;
            userData.jobTitle = employee.job_title;
            userData.department = employee.department;
            userData.employeeId = employee.employeeId;
          }
        } catch (error) {
          // Silently handle employee details fetch error
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    // Log error internally but don't expose details to client
    console.error('Login authentication failed');
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
