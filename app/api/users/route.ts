import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User, EmployeeProfile, CorporateAccount } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Fetch users from database
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

    // Fetch users from database filtered by corporate account
    const users = await User!.find({ 
      status: 'ACTIVE',
      account_id: corporateAccountId
    })
      .populate('account_id', 'companyName')
      .select('_id email role status created_at updated_at lastLoginAt account_id firstName lastName')
      .sort({ created_at: -1 })
      .lean();

    // Transform the data to match the expected format
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      status: user.status,
      accountId: user.account_id?._id?.toString() || user.account_id?.toString() || 'unknown',
      accountName: user.account_id && typeof user.account_id === 'object' && 'companyName' in user.account_id
        ? (user.account_id as { companyName?: string }).companyName || null
        : null,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLoginAt: user.lastLoginAt
    }));

    return NextResponse.json({
      success: true,
      data: transformedUsers
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create a new user (only CorporateAccount admins can do this)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get token from header and verify
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
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

    // Only CorporateAccount admins can create users
    if (decoded.role !== 'ADMIN' && decoded.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Only corporate account admins can create users' },
        { status: 403 }
      );
    }

    // Get request data
    const { firstName, lastName, email, role, companyName } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, role' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['EMPLOYEE', 'CORPORATE_ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be EMPLOYEE or CORPORATE_ADMIN' },
        { status: 400 }
      );
    }

    // For CORPORATE_ADMIN, companyName is required
    if (role === 'CORPORATE_ADMIN' && !companyName) {
      return NextResponse.json(
        { error: 'Company name is required for corporate admin users' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User!.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // For CORPORATE_ADMIN, check if company name already exists
    if (role === 'CORPORATE_ADMIN') {
      const existingCompany = await CorporateAccount!.findOne({ 
        companyName: new RegExp(`^${companyName.trim()}$`, 'i') 
      });
      if (existingCompany) {
        return NextResponse.json(
          { error: 'A company with this name already exists. Please choose a different company name.' },
          { status: 409 }
        );
      }
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create new User record (all users go to users collection)
    const newUser = await User!.create({
      email: email.toLowerCase(),
      password_hash: tempPassword, // Will be hashed by pre-save hook
      role: role,
      status: 'ACTIVE',
      account_id: decoded.corporateAccountId || decoded.account_id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim()
    });

    console.log('Created new user:', {
      id: newUser!._id,
      email: newUser!.email,
      role: newUser!.role
    });

    // Create EmployeeProfile only for EMPLOYEE users (not for CORPORATE_ADMIN)
    let employeeProfile = null;
    if (role === 'EMPLOYEE') {
      const employeeId = `EMP-${Date.now()}`;
      employeeProfile = await EmployeeProfile!.create({
        user_id: newUser!._id,
        corporate_account_id: decoded.corporateAccountId || decoded.account_id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        department: 'General',
        job_title: 'Employee',
        employeeId: employeeId,
        hireDate: new Date(),
        isActive: true
      });

      console.log('Created EmployeeProfile:', {
        id: employeeProfile._id,
        employeeId: employeeId,
        jobTitle: employeeProfile.job_title
      });
    } else {
      console.log('Skipped EmployeeProfile creation for CORPORATE_ADMIN user');
    }

    // If CORPORATE_ADMIN, also create CorporateAccount
    let corporateAccount = null;
    if (role === 'CORPORATE_ADMIN') {
      try {
        corporateAccount = await CorporateAccount!.create({
          email: email.toLowerCase(),
          password: tempPassword, // Will be hashed by pre-save hook
          role: 'ADMIN',
          status: 'ACTIVE',
          companyName: companyName.trim(),
          subscriptionPlan: 'basic', // Default plan
          maxEmployees: 100, // Default limit
          firstName: firstName.trim(),
          lastName: lastName.trim()
        });

        // Update user's account_id to point to the new corporate account
        newUser!.account_id = corporateAccount._id;
        await newUser!.save();

        console.log('Created CorporateAccount:', {
          id: corporateAccount._id,
          companyName: corporateAccount.companyName
        });
      } catch (corporateError: any) {
        console.error('Error creating CorporateAccount:', corporateError);
        
        // If corporate account creation fails, delete the user we just created
        await User!.findByIdAndDelete(newUser!._id);
        
        if (corporateError.code === 11000) {
          // Duplicate key error
          if (corporateError.keyPattern?.companyName) {
            return NextResponse.json(
              { error: 'A company with this name already exists. Please choose a different company name.' },
              { status: 409 }
            );
          } else if (corporateError.keyPattern?.email) {
            return NextResponse.json(
              { error: 'A corporate account with this email already exists.' },
              { status: 409 }
            );
          }
        }
        
        return NextResponse.json(
          { error: 'Failed to create corporate account: ' + corporateError.message },
          { status: 500 }
        );
      }
    }

    // Return success response
    const responseData: any = {
      success: true,
      message: 'User created successfully',
      tempPassword: tempPassword,
      user: {
        id: newUser!._id.toString(),
        email: newUser!.email,
        firstName: newUser!.firstName,
        lastName: newUser!.lastName,
        role: newUser!.role,
        status: newUser!.status,
        createdAt: newUser!.created_at
      }
    };

    // Include employee profile info if created (only for EMPLOYEE users)
    if (employeeProfile) {
      responseData.employeeProfile = {
        id: employeeProfile._id.toString(),
        employeeId: employeeProfile.employeeId,
        department: employeeProfile.department,
        jobTitle: employeeProfile.job_title
      };
    }

    // Include corporate account info if created
    if (corporateAccount) {
      responseData.corporateAccount = {
        id: corporateAccount._id.toString(),
        companyName: corporateAccount.companyName,
        subscriptionPlan: corporateAccount.subscriptionPlan,
        maxEmployees: corporateAccount.maxEmployees
      };
    }

    return NextResponse.json(responseData, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
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