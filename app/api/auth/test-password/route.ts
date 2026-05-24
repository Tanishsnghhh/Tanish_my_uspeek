import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User } from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing password comparison...');
    
    await connectDB();
    console.log('Database connected');
    
    const { email, password } = await request.json();
    console.log('Testing password for:', email);
    
    // Find the user
    const user = await User!.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log('User found:', user.email);
    // Password hash is not logged for security reasons
    
    // Test password comparison
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    
    return NextResponse.json({
      success: true,
      passwordValid: isPasswordValid,
      userEmail: user.email,
      userRole: user.role
    });
    
  } catch (error) {
    console.error('Password test error:', error);
    return NextResponse.json(
      { error: 'Password test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
