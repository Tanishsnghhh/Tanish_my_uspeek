import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User, EmployeeProfile } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// GET - Get user profile
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

    // Get user from database
    const user = await User!.findById(decoded.userId)
      .populate('account_id', 'companyName')
      .select('_id email firstName lastName first_name last_name role status account_id lastLoginAt created_at settings')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get employee profile if exists
    let employeeProfile = null;
    if (user.role === 'EMPLOYEE' || user.role === 'CORPORATE_USER') {
      employeeProfile = await EmployeeProfile!.findOne({ user_id: user._id })
        .select('department job_title phoneNumber employeeId')
        .lean();
    }

    // Transform user data
    const userProfile = {
      id: user._id.toString(),
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      email: user.email,
      role: user.role,
      companyName: user.account_id && typeof user.account_id === 'object' && 'companyName' in user.account_id
        ? (user.account_id as { companyName?: string }).companyName || ''
        : '',
      department: employeeProfile?.department || '',
      jobTitle: employeeProfile?.job_title || '',
      phoneNumber: employeeProfile?.phoneNumber || '',
      location: user.settings?.profile?.location || '',
      bio: user.settings?.profile?.bio || '',
      lastLoginAt: user.lastLoginAt,
      createdAt: user.created_at
    };

    return NextResponse.json({
      success: true,
      user: userProfile
    });

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
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

    // Get request data
    const profileData = await request.json();

    // Update user record
    const updateData: any = {};
    if (profileData.firstName !== undefined) {
      updateData.firstName = profileData.firstName.trim();
      updateData.first_name = profileData.firstName.trim(); // Also update the alternative field
    }
    if (profileData.lastName !== undefined) {
      updateData.lastName = profileData.lastName.trim();
      updateData.last_name = profileData.lastName.trim(); // Also update the alternative field
    }

    if (Object.keys(updateData).length > 0) {
      await User!.findByIdAndUpdate(decoded.userId, updateData);
    }

    // Update employee profile if exists
    const user = await User!.findById(decoded.userId);
    if (user && (user.role === 'EMPLOYEE' || user.role === 'CORPORATE_USER')) {
      const employeeUpdateData: any = {};
      if (profileData.department) employeeUpdateData.department = profileData.department.trim();
      if (profileData.jobTitle) employeeUpdateData.job_title = profileData.jobTitle.trim();
      if (profileData.phoneNumber !== undefined) employeeUpdateData.phoneNumber = profileData.phoneNumber.trim();
      if (profileData.firstName) employeeUpdateData.first_name = profileData.firstName.trim();
      if (profileData.lastName) employeeUpdateData.last_name = profileData.lastName.trim();

      if (Object.keys(employeeUpdateData).length > 0) {
        await EmployeeProfile!.findOneAndUpdate(
          { user_id: decoded.userId },
          employeeUpdateData,
          { upsert: false }
        );
      }
    }

    // Store location and bio in user settings since they're not in EmployeeProfile
    if (profileData.location !== undefined || profileData.bio !== undefined) {
      const currentUser = await User!.findById(decoded.userId);
      if (currentUser) {
        const currentSettings: any = currentUser!.settings || {};
        const profileSettings: any = currentSettings.profile || { location: '', bio: '' };
        
        if (profileData.location !== undefined) profileSettings.location = profileData.location.trim();
        if (profileData.bio !== undefined) profileSettings.bio = profileData.bio.trim();
        
        currentSettings.profile = profileSettings;
        
        await User!.findByIdAndUpdate(decoded.userId, {
          settings: currentSettings,
          updated_at: new Date()
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
