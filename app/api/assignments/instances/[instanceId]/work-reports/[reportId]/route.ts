import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { AssignmentInstance, InstanceWorkReport, AssignmentEmployee } from '@/lib/models';
import { checkAdminPermissions, canPerformAction } from '@/lib/admin-permissions';
import mongoose from 'mongoose';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; reportId: string }> }
) {
  try {
    const body = await request.json();
    const { 
      content, 
      work_date, 
      hours_spent, 
      tags, 
      link,
      status,
      submissionLink,  // Support both 'link' and 'submissionLink'
      submitted_by_admin,
      submitted_by_employee
    } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check admin permissions (extracts account_id and user_id from JWT)
    const authResult = await checkAdminPermissions(request);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract account_id and user_id from authentication result
    const account_id = authResult.corporateAccountId;
    const user_id = authResult.userId;

    if (!account_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { instanceId, reportId } = await params;
    
    // Verify the instance exists and belongs to the account
    const instance = await AssignmentInstance!.findOne({
      _id: instanceId,
      account_id: account_id
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Assignment instance not found' },
        { status: 404 }
      );
    }

    // Get the existing work report to check ownership
    const existingReport = await InstanceWorkReport.findOne({
      _id: reportId,
      instance_id: instanceId,
      account_id: account_id
    });

    if (!existingReport) {
      return NextResponse.json(
        { success: false, error: 'Work report not found' },
        { status: 404 }
      );
    }

    // Check if user can update this work report
    const isOwner = existingReport.user_id?.toString() === authResult.userId;
    const userRole = authResult.isAdmin ? 'CORPORATE_ADMIN' : 'EMPLOYEE';
    
    if (!canPerformAction('update', 'work-report', userRole, isOwner)) {
      return NextResponse.json(
        { success: false, error: 'Permission denied: You can only edit your own work reports or admin can edit any' },
        { status: 403 }
      );
    }

    // Find and update the work report
    const updateData: any = {
      content,
      work_date: work_date,
      hours_spent: hours_spent || null,
      tags: tags || [],
      link: link || submissionLink || null,  // Support both field names
      status: status,
      updated_at: new Date(),
      ...(status === 'SUBMITTED' && {
        submitted_at: new Date()
      })
    };

    // Add submission tracking fields if provided
    if (submitted_by_admin !== undefined) updateData.submitted_by_admin = submitted_by_admin;
    if (submitted_by_employee !== undefined) updateData.submitted_by_employee = submitted_by_employee;

    const updatedReport = await InstanceWorkReport.findOneAndUpdate(
      { 
        _id: reportId,
        instance_id: instanceId,
        account_id: account_id
      },
      updateData,
      { new: true }
    );

    if (!updatedReport) {
      return NextResponse.json(
        { success: false, error: 'Work report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedReport
    });

  } catch (error) {
    console.error('Error updating instance work report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string; reportId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Check admin permissions
    const authResult = await checkAdminPermissions(request, accountId);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user can delete work reports
    if (!canPerformAction('delete', 'work-report', authResult.isAdmin ? 'CORPORATE_ADMIN' : 'EMPLOYEE')) {
      return NextResponse.json(
        { success: false, error: 'Only admins can delete work reports' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { instanceId, reportId } = await params;
    
    // Verify the instance exists and belongs to the account
    const instance = await AssignmentInstance!.findOne({
      _id: instanceId,
      account_id: accountId
    });

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Assignment instance not found' },
        { status: 404 }
      );
    }

    // For admins: delete any work report in their account
    // The admin permission check already verified they have access to this account
    const deletedReport = await InstanceWorkReport.findOneAndDelete({
      _id: reportId,
      instance_id: instanceId,
      account_id: accountId
    });

    if (!deletedReport) {
      return NextResponse.json(
        { success: false, error: 'Work report not found' },
        { status: 404 }
      );
    }

    // Check if we need to revert assignment status after deleting submitted work report
    const wasSubmitted = deletedReport.status === 'SUBMITTED' || deletedReport.status === 'APPROVED';
    
    if (wasSubmitted && deletedReport.employee_id) {
      console.log('🔄 Checking assignment status after deleting submitted work report...');
      
      // Find the assignment employee record for this instance and employee
      const assignmentEmployee = await AssignmentEmployee!.findOne({
        instance_id: new mongoose.Types.ObjectId(instanceId),
        employee_id: deletedReport.employee_id
      });
      
      if (assignmentEmployee && assignmentEmployee.status === 'COMPLETED') {
        // Check if there are any remaining submitted work reports for this assignment
        const remainingSubmittedReports = await InstanceWorkReport.countDocuments({
          instance_id: instanceId,
          employee_id: deletedReport.employee_id,
          account_id: accountId,
          status: { $in: ['SUBMITTED', 'APPROVED'] }
        });

        console.log(`📊 Remaining submitted reports for employee ${deletedReport.employee_id}: ${remainingSubmittedReports}`);

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
      } else if (!assignmentEmployee) {
        console.warn('⚠️ Assignment employee not found for status update');
      } else {
        console.log('ℹ️ Assignment status is not COMPLETED, no reversion needed');
      }
    } else {
      console.log('ℹ️ No assignment status update needed (report was not submitted or no employee_id)');
    }

    return NextResponse.json({
      success: true,
      message: 'Work report deleted successfully',
      deletedBy: {
        userId: authResult.userId,
        isAdmin: authResult.isAdmin,
        accountId: authResult.corporateAccountId
      }
    });

  } catch (error) {
    console.error('Error deleting instance work report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
