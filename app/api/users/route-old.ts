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
      .populate('account_id', 'company_name')
      .select('_id email role status created_at updated_at lastLoginAt account_id')
      .sort({ created_at: -1 })
      .lean();

    console.log('Fetched users:', users.length);

    // Transform the data to match the expected format
    const transformedUsers = users.map(user => ({
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
      lastLoginAt: user.lastLoginAt
    }));

    console.log('Transformed users:', transformedUsers.length);

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

// POST - Create a new user
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

    // Check if user has admin privileges
    if (!['ADMIN', 'CORPORATE_ADMIN'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create users' },
        { status: 403 }
      );
    }

    // Get request data
    const { firstName, lastName, email, role, password, sendWelcomeEmail } = await request.json();

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
      // Specific error for deprecated role
      if (role === 'CORPORATE_USER') {
        return NextResponse.json(
          { error: 'CORPORATE_USER role has been deprecated. Use EMPLOYEE or CORPORATE_ADMIN instead.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') },
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

    // Generate password if not provided
    let userPassword = password;
    let tempPassword = null;
    
    if (!userPassword) {
      // Generate a temporary password
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      tempPassword = '';
      for (let i = 0; i < 12; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      userPassword = tempPassword;
    }

    // Create new user
    const newUser = await User!.create({
      email: email.toLowerCase(),
      password_hash: userPassword, // Will be hashed by pre-save hook
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
      role: newUser!.role,
      account_id: newUser!.account_id
    });

    // Create EmployeeProfile for EMPLOYEE role only
    let employeeProfile = null;
    if (role === 'EMPLOYEE') {
      try {
        // Generate unique employee ID
        const baseEmployeeId = `EMP-${Date.now()}`;
        let employeeId = baseEmployeeId;
        let counter = 0;
        
        // Ensure employeeId is unique
        while (await EmployeeProfile!.findOne({ employeeId })) {
          counter++;
          employeeId = `${baseEmployeeId}-${counter}`;
        }

        employeeProfile = await EmployeeProfile!.create({
          user_id: newUser!._id,
          corporate_account_id: decoded.corporateAccountId || decoded.account_id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          department: 'General', // Default department
          job_title: 'Employee', // Default job title for employees
          employeeId: employeeId,
          hireDate: new Date(),
          isActive: true
        });

        console.log('Created EmployeeProfile for user:', {
          employeeProfileId: employeeProfile._id,
          userId: newUser!._id,
          employeeId: employeeId,
          department: employeeProfile.department,
          jobTitle: employeeProfile.job_title
        });
      } catch (profileError: any) {
        console.error('Error creating EmployeeProfile:', profileError);
        // Don't fail the entire user creation if profile creation fails
        // The user can still be created and profile can be added later
      }
    }

    // TODO: Send welcome email if requested
    if (sendWelcomeEmail && tempPassword) {
      // Email sending functionality would go here
      console.log(`Would send welcome email to ${email} with temp password: ${tempPassword}`);
    }

    // Return success response
    const responseData: any = {
      success: true,
      message: 'User created successfully',
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

    // Include employee profile information if created
    if (employeeProfile) {
      responseData.employeeProfile = {
        id: employeeProfile._id.toString(),
        employeeId: employeeProfile.employeeId,
        department: employeeProfile.department,
        jobTitle: employeeProfile.job_title,
        hireDate: employeeProfile.hireDate
      };
    }

    // Include temporary password in response if generated
    if (tempPassword) {
      responseData.tempPassword = tempPassword;
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
