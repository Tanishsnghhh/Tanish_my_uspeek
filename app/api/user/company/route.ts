import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { CorporateAccount, User } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Get company settings
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

    // Get user to check role and get account_id
    const user = await User!.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is corporate admin
    if (user.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Corporate admin required.' },
        { status: 403 }
      );
    }

    // Get corporate account
    const corporateAccount = await CorporateAccount!.findById(user.account_id);
    if (!corporateAccount) {
      return NextResponse.json(
        { error: 'Corporate account not found' },
        { status: 404 }
      );
    }

    // Return company settings
    const companySettings = {
      companyName: corporateAccount.companyName,
      subscriptionPlan: corporateAccount.subscriptionPlan,
      maxEmployees: corporateAccount.maxEmployees,
      firstName: corporateAccount.firstName,
      lastName: corporateAccount.lastName,
      email: corporateAccount.email
    };

    return NextResponse.json({
      success: true,
      company: companySettings
    });

  } catch (error: any) {
    console.error('Error fetching company settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company settings' },
      { status: 500 }
    );
  }
}

// PUT - Update company settings
export async function PUT(request: NextRequest) {
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

    // Get user to check role and get account_id
    const user = await User!.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is corporate admin
    if (user.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Corporate admin required.' },
        { status: 403 }
      );
    }

    // Get request data
    const { companyName, subscriptionPlan, maxEmployees, firstName, lastName } = await request.json();

    // Validate required fields
    if (!companyName || !subscriptionPlan || !maxEmployees || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate subscription plan
    const validPlans = ['basic', 'professional', 'enterprise'];
    if (!validPlans.includes(subscriptionPlan)) {
      return NextResponse.json(
        { error: 'Invalid subscription plan' },
        { status: 400 }
      );
    }

    // Validate max employees
    if (maxEmployees < 1 || maxEmployees > 50000) {
      return NextResponse.json(
        { error: 'Max employees must be between 1 and 50000' },
        { status: 400 }
      );
    }

    // Update corporate account
    const updateData: any = {
      companyName: companyName.trim(),
      subscriptionPlan,
      maxEmployees: parseInt(maxEmployees),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      updatedAt: new Date()
    };

    await CorporateAccount!.findByIdAndUpdate(user.account_id, updateData);

    return NextResponse.json({
      success: true,
      message: 'Company settings updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating company settings:', error);
    return NextResponse.json(
      { error: 'Failed to update company settings' },
      { status: 500 }
    );
  }
}
