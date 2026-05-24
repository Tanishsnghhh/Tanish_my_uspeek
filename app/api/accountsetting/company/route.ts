import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getTokenFromHeader, verifyToken } from '@/lib/auth';
import { User, CorporateAccount } from '@/lib/models';

// GET - Get business units for the company
export async function GET(request: NextRequest) {
  try {
    const { db } = await connectDB();
    
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

    const { searchParams } = new URL(request.url);
    
    // Use corporate account ID from token instead of hardcoded value
    const accountId = corporateAccountId;
    
    const businessUnits = db.collection('businessunits');
    const units = await businessUnits
      .find({ 
        corporate_account_id: new ObjectId(corporateAccountId),
        isActive: true 
      })
      .sort({ businessName: 1 })
      .toArray();
    
    // Also get available employees, regions, zones, etc. for assignment
    const employeeProfiles = db.collection('employeeprofiles');
    const employees = await employeeProfiles.find({
      corporate_account_id: new ObjectId(corporateAccountId),
      isActive: true
    }).toArray();
    
    // Extract unique values for dropdowns
    const availableOptions = {
      regions: [...new Set(employees.map(e => e.custom_attributes?.position_1).filter(Boolean))],
      zones: [...new Set(employees.map(e => e.custom_attributes?.position_2).filter(Boolean))],
      batches: [...new Set(employees.map(e => e.custom_attributes?.position_3).filter(Boolean))],
      branches: [...new Set(employees.map(e => e.custom_attributes?.position_4).filter(Boolean))],
      departments: [...new Set(employees.map(e => e.department).filter(Boolean))],
      jobTitles: [...new Set(employees.map(e => e.job_title).filter(Boolean))],
      employees: employees.map(e => ({
        id: e.user_id,
        name: `${e.first_name} ${e.last_name}`,
        employeeId: e.employeeId,
        department: e.department,
        region: e.custom_attributes?.position_1
      }))
    };
    
    return NextResponse.json({
      success: true,
      businessUnits: units,
      availableOptions,
      totalUnits: units.length
    });
    
  } catch (error) {
    console.error('Error fetching business units:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch business units', details: errorMessage },
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
