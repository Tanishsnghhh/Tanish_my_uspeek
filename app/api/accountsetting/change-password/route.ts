import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User, CorporateAccount } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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

    // Get request data
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await User!.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in User collection
    await User!.findByIdAndUpdate(decoded.userId, {
      password_hash: hashedNewPassword,
      passwordChanged: true, // Mark password as changed
      updated_at: new Date()
    });

    // If user is CORPORATE_ADMIN, also update password in CorporateAccount
    if (user.role === 'CORPORATE_ADMIN' && user.account_id) {
      try {
        await CorporateAccount!.findByIdAndUpdate(user.account_id, {
          password: hashedNewPassword,
          updatedAt: new Date()
        });
      } catch (error) {
        console.warn('Failed to update password in CorporateAccount:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error: any) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
