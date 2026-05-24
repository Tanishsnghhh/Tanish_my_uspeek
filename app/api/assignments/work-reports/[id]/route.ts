import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import AssignmentWorkReport from '@/lib/models/AssignmentWorkReport';

// GET /api/assignments/work-reports/[id] - Get a specific work report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    
    const workReport = await AssignmentWorkReport!.findById(resolvedParams.id)
      .populate('employee_id', 'first_name last_name')
      .populate({
        path: 'assignment_employee_id',
        select: 'instance_id status',
        populate: {
          path: 'instance_id',
          select: 'assignment_id',
          populate: {
            path: 'assignment_id',
            select: 'title assignment_type'
          }
        }
      })
      .lean();
    
    if (!workReport) {
      return NextResponse.json(
        { success: false, error: 'Work report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: workReport });
  } catch (error: any) {
    console.error('Error fetching work report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work report' },
      { status: 500 }
    );
  }
}

// PUT /api/assignments/work-reports/[id] - Update a work report
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    
    const body = await request.json();
    const { 
      content, 
      attachments, 
      work_date, 
      hours_spent, 
      tags, 
      status,
      submitted_by_employee,
      submitted_by_admin,
      user_id
    } = body;
    
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (attachments !== undefined) updateData.attachments = attachments;
    if (work_date !== undefined) updateData.work_date = new Date(work_date);
    if (hours_spent !== undefined) updateData.hours_spent = hours_spent;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;
    if (submitted_by_employee !== undefined) updateData.submitted_by_employee = submitted_by_employee;
    if (submitted_by_admin !== undefined) updateData.submitted_by_admin = submitted_by_admin;
    if (user_id !== undefined) updateData.submitted_by_user_id = user_id;
    
    // Update submitted_at when status changes to SUBMITTED or APPROVED
    if (status === 'SUBMITTED' || status === 'APPROVED') {
      updateData.submitted_at = new Date();
    }
    
    const workReport = await AssignmentWorkReport!.findByIdAndUpdate(
      resolvedParams.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('employee_id', 'first_name last_name')
      .populate({
        path: 'assignment_employee_id',
        select: 'instance_id status',
        populate: {
          path: 'instance_id',
          select: 'assignment_id',
          populate: {
            path: 'assignment_id',
            select: 'title assignment_type'
          }
        }
      })
      .lean();
    
    if (!workReport) {
      return NextResponse.json(
        { success: false, error: 'Work report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: workReport,
      message: 'Work report updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating work report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update work report' },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/work-reports/[id] - Delete a work report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    
    // First, get the work report to find the associated assignment
    const workReport = await AssignmentWorkReport!.findById(resolvedParams.id);
    
    if (!workReport) {
      return NextResponse.json(
        { success: false, error: 'Work report not found' },
        { status: 404 }
      );
    }

    // Store assignment employee ID for status update
    const assignmentEmployeeId = workReport.assignment_employee_id;
    const wasSubmitted = workReport.status === 'SUBMITTED' || workReport.status === 'APPROVED';

    // Delete the work report
    await AssignmentWorkReport!.findByIdAndDelete(resolvedParams.id);
    console.log('✅ Work report deleted successfully');

    // If the deleted report was submitted/approved, we need to update the assignment status
    if (wasSubmitted && assignmentEmployeeId) {
      console.log('🔄 Updating assignment status after deleting submitted work report...');
      
      // Get the assignment employee record
      const AssignmentEmployee = (await import('@/lib/models')).AssignmentEmployee;
      const assignmentEmployee = await AssignmentEmployee!.findById(assignmentEmployeeId);
      
      if (assignmentEmployee) {
        // Check if there are any remaining submitted work reports for this assignment
        const remainingSubmittedReports = await AssignmentWorkReport!.countDocuments({
          assignment_employee_id: assignmentEmployeeId,
          status: { $in: ['SUBMITTED', 'APPROVED'] }
        });

        console.log(`📊 Remaining submitted reports: ${remainingSubmittedReports}`);

        if (remainingSubmittedReports === 0) {
          // No more submitted reports, revert status to IN_PROGRESS
          console.log('⏪ Reverting assignment status from COMPLETED to IN_PROGRESS');
          
          assignmentEmployee.status = 'IN_PROGRESS';
          assignmentEmployee.progress_percentage = 50; // Set back to 50% when in progress
          assignmentEmployee.completed_at = undefined; // Remove completion timestamp
          
          await assignmentEmployee.save();
          
          console.log('✅ Assignment status reverted successfully:', {
            id: assignmentEmployee._id,
            newStatus: assignmentEmployee.status,
            newProgress: assignmentEmployee.progress_percentage
          });
        } else {
          console.log('ℹ️ Assignment remains COMPLETED due to other submitted work reports');
        }
      } else {
        console.warn('⚠️ Assignment employee not found for status update');
      }
    } else {
      console.log('ℹ️ No assignment status update needed (report was not submitted)');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Work report deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting work report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete work report' },
      { status: 500 }
    );
  }
}
