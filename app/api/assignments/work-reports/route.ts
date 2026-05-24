import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import AssignmentWorkReport from '@/lib/models/AssignmentWorkReport';
import AssignmentEmployee from '@/lib/models/AssignmentEmployee';
import EmployeeProfile from '@/lib/models/EmployeeProfile';

// GET /api/assignments/work-reports - Get work reports for an assignment
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const assignmentEmployeeId = searchParams.get('assignmentEmployeeId');
    const employeeId = searchParams.get('employeeId');
    const accountId = searchParams.get('accountId');
    
    if (!assignmentEmployeeId && !employeeId) {
      return NextResponse.json(
        { success: false, error: 'Assignment Employee ID or Employee ID is required' },
        { status: 400 }
      );
    }
    
    let query: any = {};
    if (assignmentEmployeeId) {
      query.assignment_employee_id = assignmentEmployeeId;
    }
    if (employeeId) {
      query.employee_id = employeeId;
    }
    if (accountId) {
      query.account_id = accountId;
    }
    
    const reports = await AssignmentWorkReport!.find(query)
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
      .sort({ created_at: -1 })
      .lean();
    
    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    console.error('Error fetching work reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work reports' },
      { status: 500 }
    );
  }
}

// POST /api/assignments/work-reports - Create a new work report
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      assignment_employee_id, 
      employee_id,
      account_id,
      content, 
      attachments, 
      work_date, 
      hours_spent, 
      tags,
      status = 'SUBMITTED',
      submitted_by_employee = false,
      submitted_by_admin = false,
      user_id
    } = body;
    
    if (!assignment_employee_id || !employee_id || !account_id || !content) {
      return NextResponse.json(
        { success: false, error: 'Assignment Employee ID, Employee ID, Account ID, and content are required' },
        { status: 400 }
      );
    }

    // Debug log the submission tracking fields
    console.log('Work Report Submission Debug:', {
      submitted_by_employee,
      submitted_by_admin,
      user_id,
      employee_id,
      account_id
    });
    
    // Verify the assignment employee exists
    const assignmentEmployee = await AssignmentEmployee!.findById(assignment_employee_id);
    if (!assignmentEmployee) {
      return NextResponse.json(
        { success: false, error: 'Assignment employee not found' },
        { status: 404 }
      );
    }
    
    // Verify the employee exists
    const employee = await EmployeeProfile!.findById(employee_id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }
    
    const workReport = new (AssignmentWorkReport as any)({
      assignment_employee_id,
      employee_id,
      account_id,
      corporate_account_id: account_id, // Include corporate account ID
      content,
      attachments,
      work_date: work_date ? new Date(work_date) : new Date(),
      hours_spent,
      tags,
      status,
      submitted_by_employee: submitted_by_employee || false,
      submitted_by_admin: submitted_by_admin || false,
      submitted_by_user_id: user_id,
      submitted_at: (status === 'SUBMITTED' || status === 'APPROVED') ? new Date() : undefined
    });
    
    await workReport.save();
    console.log('📝 Work report saved successfully');
    
    // Update assignment employee status based on work report status
    console.log('🔍 Checking assignment employee status update...', {
      assignmentEmployeeId: assignmentEmployee._id,
      currentStatus: assignmentEmployee.status,
      workReportStatus: status,
      shouldUpdate: assignmentEmployee.status === 'ASSIGNED' || assignmentEmployee.status === 'IN_PROGRESS'
    });
    
    if (assignmentEmployee.status === 'ASSIGNED' || assignmentEmployee.status === 'IN_PROGRESS') {
      // If work report is submitted, update assignment to completed as well
      if (status === 'SUBMITTED') {
        console.log('🚀 Updating assignment to COMPLETED status');
        assignmentEmployee.status = 'COMPLETED';
        assignmentEmployee.progress_percentage = 100; // Mark as complete when submitted
        assignmentEmployee.completed_at = new Date(); // Set completion timestamp
      } else if (assignmentEmployee.status === 'ASSIGNED') {
        // Only move to IN_PROGRESS if it was previously ASSIGNED and not submitted
        console.log('🔄 Updating assignment to IN_PROGRESS status');
        assignmentEmployee.status = 'IN_PROGRESS';
        assignmentEmployee.progress_percentage = 50; // Set to 50% when in progress
        assignmentEmployee.started_at = new Date(); // Set started timestamp
      }
      
      const saveResult = await assignmentEmployee.save();
      console.log('✅ Assignment employee updated successfully:', {
        id: assignmentEmployee._id,
        newStatus: assignmentEmployee.status,
        newProgress: assignmentEmployee.progress_percentage,
        updatedAt: saveResult.updated_at
      });
    } else {
      console.log('ℹ️ No status update needed. Current status:', assignmentEmployee.status);
    }
    
    const populatedReport = await AssignmentWorkReport!.findById(workReport._id)
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
    
    return NextResponse.json({ 
      success: true, 
      data: populatedReport,
      message: 'Work report created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating work report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create work report' },
      { status: 500 }
    );
  }
}
