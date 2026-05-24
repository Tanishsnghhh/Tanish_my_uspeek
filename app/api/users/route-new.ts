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

    // Fetch users from database
    const users = await User!.find({ status: 'ACTIVE' })
      .populate('account_id', 'companyName')
      .select('_id email role status created_at updated_at lastLoginAt account_id firstName lastName')
      .sort({ created_at: -1 })
      .lean();

    console.log('Fetched users:', users.length);

    // Transform the data to match the expected format
    const transformedUsers = users.map(user => ({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      accountId: user.account_id?._id?.toString() || user.account_id?.toString() || 'unknown',
      accountName: user.account_id && typeof user.account_id === 'object' && 'companyName' in user.account_id
        ? (user.account_id as { companyName?: string }).companyName || null
        : null,
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

// POST - Create a new user (SIMPLE VERSION)
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get token and verify (only CorporateAccount admins can create users)
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
    if (!decoded.corporateAccountId) {
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

    // Only two valid roles
    if (!['EMPLOYEE', 'CORPORATE_ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be EMPLOYEE or CORPORATE_ADMIN' },
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

    // Generate temporary password
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let tempPassword = '';
    for (let i = 0; i < 12; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 1. CREATE USER (always created)
    const newUser = await User!.create({
      email: email.toLowerCase(),
      password_hash: tempPassword, // Will be hashed by pre-save hook
      role: role,
      status: 'ACTIVE',
      account_id: decoded.corporateAccountId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim()
    });

    console.log(`✅ Created User: ${newUser!.email} (${newUser!.role})`);

    let employeeProfile = null;
    let corporateAccount = null;

    // 2. CREATE EMPLOYEEPROFILE (for both EMPLOYEE and CORPORATE_ADMIN)
    try {
      // Generate unique employee ID
      const baseEmployeeId = `EMP-${Date.now()}`;
      let employeeId = baseEmployeeId;
      let counter = 0;
      
      while (await EmployeeProfile!.findOne({ employeeId })) {
        counter++;
        employeeId = `${baseEmployeeId}-${counter}`;
      }

      employeeProfile = await EmployeeProfile!.create({
        user_id: newUser!._id,
        corporate_account_id: decoded.corporateAccountId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        department: role === 'EMPLOYEE' ? 'General' : 'Management',
        job_title: role === 'EMPLOYEE' ? 'Employee' : 'Corporate Admin',
        employeeId: employeeId,
        hireDate: new Date(),
        isActive: true
      });

      console.log(`✅ Created EmployeeProfile: ${employeeProfile.employeeId}`);
    } catch (profileError: any) {
      console.error('❌ Error creating EmployeeProfile:', profileError);
    }

    // 3. CREATE CORPORATEACCOUNT (only for CORPORATE_ADMIN)
    if (role === 'CORPORATE_ADMIN') {
      try {
        corporateAccount = await CorporateAccount!.create({
          email: email.toLowerCase(),
          password: tempPassword, // Will be hashed by pre-save hook
          role: 'ADMIN',
          status: 'ACTIVE',
          companyName: companyName || `${firstName} ${lastName} Company`,
          subscriptionPlan: 'basic',
          maxEmployees: 100,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        });

        // Update user to reference the new corporate account
        await User!.findByIdAndUpdate(newUser!._id, {
          account_id: corporateAccount._id
        });

        console.log(`✅ Created CorporateAccount: ${corporateAccount.companyName}`);
      } catch (corpError: any) {
        console.error('❌ Error creating CorporateAccount:', corpError);
      }
    }

    // Return success response
    const responseData: any = {
      success: true,
      message: `${role} created successfully`,
      user: {
        id: newUser!._id.toString(),
        email: newUser!.email,
        firstName: newUser!.firstName,
        lastName: newUser!.lastName,
        role: newUser!.role,
        status: newUser!.status,
        createdAt: newUser!.created_at
      },
      tempPassword: tempPassword
    };

    if (employeeProfile) {
      responseData.employeeProfile = {
        id: employeeProfile._id.toString(),
        employeeId: employeeProfile.employeeId,
        department: employeeProfile.department,
        jobTitle: employeeProfile.job_title
      };
    }

    if (corporateAccount) {
      responseData.corporateAccount = {
        id: corporateAccount._id.toString(),
        companyName: corporateAccount.companyName,
        subscriptionPlan: corporateAccount.subscriptionPlan
      };
    }

    return NextResponse.json(responseData, { status: 201 });

  } catch (error: any) {
    console.error('❌ Error creating user:', error);
    
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed: ' + error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user: ' + error.message },
      { status: 500 }
    );
  }
}
