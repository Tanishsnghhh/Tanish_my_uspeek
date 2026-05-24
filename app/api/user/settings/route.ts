import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';

// Define the settings schema
interface UserSettings {
  notifications?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    assignmentNotifications: boolean;
    reportNotifications: boolean;
    marketingEmails: boolean;
  };
  security?: {
    twoFactorEnabled: boolean;
    sessionTimeout: number;
    loginAlerts: boolean;
  };
  profile?: {
    location: string;
    bio: string;
  };
}

// GET - Get user settings
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
      .select('settings')
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user settings with defaults
    const defaultSettings: UserSettings = {
      notifications: {
        emailNotifications: true,
        pushNotifications: true,
        assignmentNotifications: true,
        reportNotifications: true,
        marketingEmails: false
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 60,
        loginAlerts: true
      },
      profile: {
        location: '',
        bio: ''
      }
    };

    const settings = { ...defaultSettings, ...(user.settings || {}) };

    return NextResponse.json({
      success: true,
      ...settings
    });

  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
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
    const { type, settings } = await request.json();

    if (!type || !settings || !['notifications', 'security', 'profile'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid request data. Type must be "notifications", "security", or "profile"' },
        { status: 400 }
      );
    }

    // Get current user settings
    const user = await User!.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update the specific settings type
    const currentSettings: any = user.settings || {};
    currentSettings[type] = settings;

    // Save updated settings
    await User!.findByIdAndUpdate(decoded.userId, {
      settings: currentSettings,
      updated_at: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `${type} settings updated successfully`
    });

  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
