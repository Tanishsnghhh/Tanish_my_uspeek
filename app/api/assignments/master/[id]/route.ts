import { NextRequest, NextResponse } from 'next/server';
import { AssignmentMaster } from '@/lib/models';
import connectDB from '@/lib/database';

// GET /api/assignments/master/[id] - Get specific assignment master
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const assignment = await AssignmentMaster!.findById(id).lean();
    
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('Error fetching assignment master:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}

// PUT /api/assignments/master/[id] - Update assignment master
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    const { title, description, assignment_type, estimated_duration, difficulty_level, tags, is_active } = body;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (assignment_type !== undefined) updateData.assignment_type = assignment_type;
    if (estimated_duration !== undefined) updateData.estimated_duration = estimated_duration;
    if (difficulty_level !== undefined) updateData.difficulty_level = difficulty_level;
    if (tags !== undefined) updateData.tags = tags;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const assignment = await AssignmentMaster!.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('Error updating assignment master:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/master/[id] - Delete assignment master
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const assignment = await AssignmentMaster!.findByIdAndDelete(id);
    
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting assignment master:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
