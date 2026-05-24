import { NextRequest, NextResponse } from 'next/server';
import { AssignmentEmployee } from '@/lib/models';
import connectDB from '@/lib/database';

// GET /api/assignments/instances/[instanceId]/assignees - Get assignees for an instance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    await connectDB();
    
    const { instanceId } = await params;
    
    if (!instanceId) {
      return NextResponse.json(
        { success: false, error: 'Instance ID is required' },
        { status: 400 }
      );
    }
    
    // Get all employee assignments for this instance
    const assignees = await AssignmentEmployee!.find({ 
      instance_id: instanceId 
    })
    .populate('employee_id', 'first_name last_name department job_title employeeId')
    .select('employee_id status assigned_at')
    .lean();
    
    // Transform the data to be more readable
    const assigneeData = assignees.map((assignment: any) => ({
      employee_id: assignment.employee_id?._id,
      name: assignment.employee_id 
        ? `${assignment.employee_id.first_name} ${assignment.employee_id.last_name}`
        : 'Unknown Employee',
      department: assignment.employee_id?.department,
      job_title: assignment.employee_id?.job_title,
      employeeId: assignment.employee_id?.employeeId,
      status: assignment.status,
      assigned_at: assignment.assigned_at
    }));
    
    return NextResponse.json({ 
      success: true, 
      data: assigneeData 
    });
  } catch (error: any) {
    console.error('Error fetching assignees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignees' },
      { status: 500 }
    );
  }
}
