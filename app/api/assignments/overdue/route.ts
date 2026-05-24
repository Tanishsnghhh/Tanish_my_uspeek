import { NextRequest, NextResponse } from 'next/server';
import { AssignmentEmployee, AssignmentInstance } from '@/lib/models';
import connectDB from '@/lib/database';

// GET /api/assignments/overdue - Get overdue assignments for an account
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const employeeId = searchParams.get('employeeId');
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    // Find instances with deadlines for this account
    const instancesWithDeadlines = await AssignmentInstance!.find({
      account_id: accountId,
      deadline: { $exists: true, $ne: null },
      status: 'ACTIVE'
    }).select('_id deadline');
    
    if (instancesWithDeadlines.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    const now = new Date();
    const instanceIds = instancesWithDeadlines.map(instance => instance._id);
    
    let query: any = {
      instance_id: { $in: instanceIds },
      status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
    };
    
    if (employeeId) {
      query.employee_id = employeeId;
    }
    
    // Find assignments that are overdue
    const overdueAssignments = await AssignmentEmployee!.find(query)
      .populate({
        path: 'instance_id',
        populate: {
          path: 'assignment_id',
          select: 'title description assignment_type'
        }
      })
      .populate('employee_id', 'first_name last_name department job_title')
      .lean();
    
    // Filter for actually overdue assignments
    const overdue = overdueAssignments.filter(assignment => {
      const instance = assignment.instance_id as any;
      return instance.deadline && new Date(instance.deadline) < now;
    });
    
    return NextResponse.json({ success: true, data: overdue });
  } catch (error: any) {
    console.error('Error fetching overdue assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch overdue assignments' },
      { status: 500 }
    );
  }
}

// POST /api/assignments/overdue/process - Process overdue assignments (update status to OVERDUE)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { accountId } = body;
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    const now = new Date();
    
    // Find all active instances with deadlines for this account
    const instancesWithDeadlines = await AssignmentInstance!.find({
      account_id: accountId,
      deadline: { $exists: true, $ne: null, $lt: now },
      status: 'ACTIVE'
    }).select('_id deadline');
    
    if (instancesWithDeadlines.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: { processed: 0, message: 'No overdue assignments found' }
      });
    }
    
    const instanceIds = instancesWithDeadlines.map(instance => instance._id);
    
    // Update all assignments that are overdue
    const result = await AssignmentEmployee!.updateMany(
      {
        instance_id: { $in: instanceIds },
        status: { $in: ['ASSIGNED', 'IN_PROGRESS'] }
      },
      {
        $set: { status: 'OVERDUE' }
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        processed: result.modifiedCount,
        message: `Updated ${result.modifiedCount} assignments to OVERDUE status`
      }
    });
    
  } catch (error: any) {
    console.error('Error processing overdue assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process overdue assignments' },
      { status: 500 }
    );
  }
}

// PUT /api/assignments/overdue/extend - Extend deadline for assignments
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { instanceId, newDeadline, reason } = body;
    
    if (!instanceId || !newDeadline) {
      return NextResponse.json(
        { success: false, error: 'Instance ID and new deadline are required' },
        { status: 400 }
      );
    }
    
    // Update the instance deadline
    const instance = await AssignmentInstance!.findByIdAndUpdate(
      instanceId,
      { 
        deadline: new Date(newDeadline),
        instructions: reason ? `Deadline extended: ${reason}` : undefined
      },
      { new: true }
    );
    
    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Assignment instance not found' },
        { status: 404 }
      );
    }
    
    // Update all OVERDUE assignments back to their previous status if they were overdue
    await AssignmentEmployee!.updateMany(
      {
        instance_id: instanceId,
        status: 'OVERDUE'
      },
      {
        $set: { status: 'ASSIGNED' }
      }
    );
    
    return NextResponse.json({ 
      success: true, 
      data: instance,
      message: 'Deadline extended successfully'
    });
    
  } catch (error: any) {
    console.error('Error extending deadline:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extend deadline' },
      { status: 500 }
    );
  }
}
