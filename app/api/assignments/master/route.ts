import { NextRequest, NextResponse } from 'next/server';
import { AssignmentMaster, User } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import connectDB from '@/lib/database';

// GET /api/assignments/master - Get all assignment masters
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication and get corporate account
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user and their corporate account
    const user = await User.findById(decoded.userId);
    if (!user || (user.role !== 'CORPORATE_ADMIN' && user.role !== 'EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Access denied. Corporate admin or employee role required.' },
        { status: 403 }
      );
    }

    const corporateAccountId = user.account_id;
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    
    // Always filter by corporate account for security
    let query: any = {
      corporate_account_id: corporateAccountId
    };
    
    if (type) query.assignment_type = type;
    if (difficulty) query.difficulty_level = difficulty;
    if (active !== null) query.is_active = active === 'true';
    if (search) {
      query.$text = { $search: search };
    }
    
    const assignments = await AssignmentMaster!.find(query)
      .sort({ created_at: -1 })
      .lean();
    
    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Error fetching assignment masters:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

// POST /api/assignments/master - Create new assignment master
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication and get corporate account
    const authHeader = request.headers.get('authorization');
    const token = getTokenFromHeader(authHeader || '');
    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user and their corporate account
    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'CORPORATE_ADMIN') {
      return NextResponse.json(
        { error: 'Access denied. Corporate admin role required.' },
        { status: 403 }
      );
    }

    const corporateAccountId = user.account_id;
    
    const body = await request.json();
    const { title, description, assignment_type, estimated_duration, difficulty_level, tags } = body;
    
    if (!title || !description || !assignment_type) {
      return NextResponse.json(
        { success: false, error: 'Title, description, and assignment_type are required' },
        { status: 400 }
      );
    }
    
    const assignment = new (AssignmentMaster as any)({
      title,
      description,
      assignment_type,
      estimated_duration,
      difficulty_level,
      tags: tags || [],
      corporate_account_id: corporateAccountId // Include corporate account ID
    });
    
    await assignment.save();
    
    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating assignment master:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}
