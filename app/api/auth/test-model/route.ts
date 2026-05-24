import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { User } from '@/lib/models';

export async function GET() {
  try {
    await connectDB();
    
    // Test basic User model functionality
    const userCount = await User!.countDocuments();
    
    // Try to find the test user
    const testUser = await User!.findOne({ email: 'admin@testcompany.com' });
    
    return NextResponse.json({
      success: true,
      userCount,
      testUserExists: !!testUser,
      modelType: typeof User
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Test failed', details: errorMessage },
      { status: 500 }
    );
  }
}
