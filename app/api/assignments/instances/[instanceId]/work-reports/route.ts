import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database';
import { AssignmentInstance, InstanceWorkReport, EmployeeProfile, AssignmentEmployee, User } from '@/lib/models';
import { checkAdminPermissions, canPerformAction } from '@/lib/admin-permissions';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    // Check admin permissions for viewing work reports
    const authResult = await checkAdminPermissions(request, accountId || undefined);

    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
    }

    // Determine effective account based on role
    const tokenAccountId = authResult.corporateAccountId?.toString?.();
    let effectiveAccountId: string | null = null;

    if (authResult.isAdmin) {
      // Admins must provide accountId and it must match their token (enforced by checkAdminPermissions)
      effectiveAccountId = accountId || null;
      if (!effectiveAccountId) {
        return NextResponse.json(
          { success: false, error: 'Account ID is required' },
          { status: 400 }
        );
      }
    } else {
      // Employees can read within their own account only; ignore/override query param
      if (accountId && accountId !== tokenAccountId) {
        return NextResponse.json(
          { success: false, error: 'Access denied: account mismatch' },
          { status: 403 }
        );
      }
      effectiveAccountId = tokenAccountId || null;
      if (!effectiveAccountId) {
        return NextResponse.json(
          { success: false, error: 'Account ID is required' },
          { status: 400 }
        );
      }
    }

    // Check if user can read work reports
    const userRole = authResult.isAdmin ? 'CORPORATE_ADMIN' : 'EMPLOYEE';
    if (!canPerformAction('read', 'work-report', userRole)) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { instanceId } = await params;

    // Verify the instance exists and belongs to the account (avoid type mismatches by comparing strings)
    const instance = await AssignmentInstance!.findById(instanceId);

    if (!instance) {
      return NextResponse.json(
        { success: false, error: 'Assignment instance not found' },
        { status: 404 }
      );
    }

    const instanceAccountId = instance.account_id?.toString?.();
    if (!instanceAccountId || instanceAccountId !== effectiveAccountId.toString()) {
      return NextResponse.json(
        { success: false, error: 'Assignment instance not found' },
        { status: 404 }
      );
    }

    // Fetch work reports for this instance with employee information
    const workReports = await InstanceWorkReport.find({
      instance_id: instanceId,
      account_id: effectiveAccountId
    })
      .populate('employee_id', 'first_name last_name')
      .populate('submitted_by_user_id', 'email role')
      .sort({ created_at: -1 })
      .lean();

    // Format the reports with employee name
    const formattedReports = workReports.map((report: any) => ({
      ...report,
      employee_name: report.employee_id
        ? `${report.employee_id.first_name} ${report.employee_id.last_name}`
        : 'Unknown',
      submitted_by: report.submitted_by_user_id ? {
        user_id: report.submitted_by_user_id._id?.toString?.() || report.submitted_by_user_id,
        email: (report.submitted_by_user_id as any)?.email,
        is_admin: !!report.submitted_by_admin
      } : undefined
    }));

    return NextResponse.json({
      success: true,
      data: formattedReports
    });

  } catch (error) {
    console.error('Error fetching instance work reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
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
      submissionLink, // Support both 'link' and 'submissionLink' field names
      submitted_by_admin = false,
      submitted_by_employee = false
    } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check admin permissions (this will extract account_id and user_id from JWT)
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

    console.log('DEBUG: Authentication result:', {
      account_id,
      user_id,
      account_id_type: typeof account_id,
      user_id_type: typeof user_id,
      isAdmin: authResult.isAdmin
    });

    if (!account_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user can create work reports
    const userRole = authResult.isAdmin ? 'CORPORATE_ADMIN' : 'EMPLOYEE';
    if (!canPerformAction('create', 'work-report', userRole)) {
      return NextResponse.json(
        { success: false, error: 'Permission denied' },
        { status: 403 }
      );
    }

    await connectDB();

    const { instanceId } = await params;

    // Verify the instance exists and belongs to the account (avoid type mismatches by comparing strings)
    console.log('DEBUG: Searching for instance (byId then compare account):', { instanceId, account_id });
    const instance = await AssignmentInstance!.findById(instanceId);
    const instanceAccountId = instance?.account_id?.toString?.();
    console.log('DEBUG: Instance lookup result:', {
      found: !!instance,
      instanceId: instance?._id?.toString(),
      instanceAccountId,
      searchAccountId: account_id?.toString(),
      match: instanceAccountId === account_id?.toString()
    });
    if (!instance || instanceAccountId !== account_id?.toString()) {
      return NextResponse.json(
        { success: false, error: 'Assignment instance not found' },
        { status: 404 }
      );
    }

    console.log('DEBUG: Creating work report for:', { instanceId, account_id, user_id });

    // Debug the link field specifically
    console.log('DEBUG: Link fields received:', {
      link: typeof link === 'string' ? `"${link}"` : link,
      submissionLink: typeof submissionLink === 'string' ? `"${submissionLink}"` : submissionLink,
      linkLength: link ? link.length : 0,
      submissionLinkLength: submissionLink ? submissionLink.length : 0
    });

    // Get user/employee information (if available)
    const employeeProfile = await EmployeeProfile!.findOne({ user_id: user_id });
    console.log('DEBUG: Found employee profile:', employeeProfile ? {
      _id: employeeProfile._id,
      user_id: employeeProfile.user_id,
      first_name: employeeProfile.first_name,
      last_name: employeeProfile.last_name
    } : 'NULL');

    // For admin override: Check if an admin is submitting on behalf of an employee
    let targetEmployeeProfile = employeeProfile;
    // Default to admin override for any corporate admin; this bypasses AssignmentEmployee requirement
    let isAdminOverride = !!authResult.isAdmin;

    // If body contains target_employee_id, this is an admin submitting on behalf of an employee
    if (body.target_employee_id && authResult.isAdmin) {
      console.log('DEBUG: Admin override detected, target_employee_id:', body.target_employee_id);

      // EmployeeProfile schema does not include account_id; fetch by ID only and validate via assignment link/account check
      targetEmployeeProfile = await EmployeeProfile!.findById(body.target_employee_id);

      if (!targetEmployeeProfile) {
        return NextResponse.json(
          { success: false, error: 'Target employee not found' },
          { status: 404 }
        );
      }

      isAdminOverride = true;
      console.log('DEBUG: Admin override target employee:', {
        _id: targetEmployeeProfile!._id,
        user_id: targetEmployeeProfile!.user_id,
        first_name: targetEmployeeProfile!.first_name,
        last_name: targetEmployeeProfile!.last_name
      });

      // Optional: log whether employee's linked user matches the account
      try {
        const empUser = targetEmployeeProfile!.user_id ? await User!.findById(targetEmployeeProfile!.user_id) : null;
        console.log('DEBUG: Target employee user/account check:', {
          empUserId: empUser?._id?.toString(),
          empUserAccountId: empUser?.account_id?.toString?.(),
          matchesAccount: empUser?.account_id?.toString?.() === account_id?.toString()
        });
      } catch (e) {
        console.log('DEBUG: Could not fetch target employee user for account check');
      }
    }

    console.log('DEBUG: Override + target check:', {
      isAdmin: authResult.isAdmin,
      isAdminOverride,
      hasTargetEmployeeId: !!body.target_employee_id,
      targetEmployeeId: (body.target_employee_id || targetEmployeeProfile?._id || '').toString?.() || String(body.target_employee_id || targetEmployeeProfile?._id || '')
    });

    // Validate assignment permissions
    if (targetEmployeeProfile) {
      let employeeAssignment = null;

      if (!authResult.isAdmin) {
        // Strict check for non-admin users: must be assigned
        employeeAssignment = await AssignmentEmployee!.findOne({
          instance_id: new mongoose.Types.ObjectId(instanceId),
          employee_id: targetEmployeeProfile!._id
        });

        console.log('DEBUG: Employee assignment check (non-admin):', employeeAssignment ? {
          _id: employeeAssignment._id,
          instance_id: employeeAssignment.instance_id,
          employee_id: employeeAssignment.employee_id,
          status: employeeAssignment.status
        } : 'NULL');

        if (!employeeAssignment) {
          return NextResponse.json(
            { success: false, error: 'You are not assigned to this assignment instance' },
            { status: 403 }
          );
        }
      } else {
        // Admin bypass: optional lookup for logging/progress only
        employeeAssignment = await AssignmentEmployee!.findOne({
          instance_id: new mongoose.Types.ObjectId(instanceId),
          employee_id: targetEmployeeProfile!._id
        });
        console.log('DEBUG: Admin bypass active. Assignment (optional):', employeeAssignment ? {
          _id: employeeAssignment._id,
          status: employeeAssignment.status
        } : 'NULL - proceeding without assignment');
      }

      // Duplicate submission guard only if we found an assignment marked COMPLETED
      if (instance.assignment_scope === 'INDIVIDUAL' && employeeAssignment?.status === 'COMPLETED') {
        const existingSubmissions = await InstanceWorkReport.countDocuments({
          instance_id: instanceId,
          employee_id: targetEmployeeProfile!._id,
          status: 'SUBMITTED'
        });

        if (existingSubmissions > 0 && status === 'SUBMITTED') {
          return NextResponse.json(
            { success: false, error: 'Work has already been submitted for this individual assignment' },
            { status: 400 }
          );
        }
      }
    }

    // For admins without employee profiles and without explicit target, allow submission without employee attribution
    if (!targetEmployeeProfile && authResult.isAdmin) {
      console.log('DEBUG: Admin submission without employee profile or target_employee_id. Proceeding without employee attribution.');
    }

    // For non-admin users, targetEmployeeProfile must exist
    if (!targetEmployeeProfile && !authResult.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'No employee profile found' },
        { status: 403 }
      );
    }

    const workReport = new InstanceWorkReport({
      instance_id: instanceId,
      account_id: account_id,
      corporate_account_id: account_id, // Include corporate account ID
      employee_id: targetEmployeeProfile ? targetEmployeeProfile!._id : undefined,
      user_id: user_id,
      content,
      work_date: work_date || new Date().toISOString().split('T')[0],
      hours_spent: hours_spent || null,
      tags: tags || [],
      link: (link || submissionLink) && (link || submissionLink).trim() ? (link || submissionLink).trim() : null, // Clean link handling
      status: status || 'SUBMITTED',
      submitted_at: status === 'SUBMITTED' ? new Date() : null,
      submitted_by_user_id: user_id,
      submitted_by_admin: submitted_by_admin || isAdminOverride,
      submitted_by_employee: submitted_by_employee || (!authResult.isAdmin && !isAdminOverride) // Set true for non-admin users
    });

    console.log('DEBUG: About to save work report:', {
      instance_id: workReport.instance_id,
      account_id: workReport.account_id,
      employee_id: workReport.employee_id,
      user_id: workReport.user_id,
      content: workReport.content.substring(0, 50) + '...',
      status: workReport.status
    });

    try {
      const savedReport = await workReport.save();
      console.log('DEBUG: Successfully saved work report with ID:', savedReport._id);

      // Auto-update assignment instance and employee status when work is submitted
      if (status === 'SUBMITTED' && targetEmployeeProfile) {
        // Update the specific employee's assignment status to COMPLETED (if assignment exists)
        const employeeAssignment = await AssignmentEmployee!.findOneAndUpdate(
          {
            instance_id: new mongoose.Types.ObjectId(instanceId),
            employee_id: targetEmployeeProfile!._id
          },
          {
            status: 'COMPLETED',
            completed_at: new Date(),
            progress_percentage: 100
          },
          { new: true }
        );

        if (employeeAssignment) {
          console.log(`Employee assignment ${employeeAssignment._id} marked as COMPLETED for employee ${targetEmployeeProfile!._id}`);
        } else if (isAdminOverride) {
          console.log(`Admin override submission - no AssignmentEmployee record to update for employee ${targetEmployeeProfile!._id}`);
        }

        // For INDIVIDUAL assignments: Check if this was the only assignee
        // For BULK assignments: Check if ALL assignees have completed their work
        if (instance.assignment_scope === 'INDIVIDUAL') {
          // For individual assignments, mark the instance as completed when the assignee submits work
          const totalAssignees = await AssignmentEmployee!.countDocuments({
            instance_id: new mongoose.Types.ObjectId(instanceId)
          });

          if (totalAssignees === 1) {
            await AssignmentInstance!.findByIdAndUpdate(
              instanceId,
              {
                status: 'COMPLETED',
                updated_at: new Date()
              }
            );
            console.log(`Individual assignment instance ${instanceId} marked as COMPLETED`);
          }
        } else if (instance.assignment_scope === 'BULK') {
          // For bulk assignments, only mark as completed if ALL assignees have completed
          const totalAssignees = await AssignmentEmployee!.countDocuments({
            instance_id: new mongoose.Types.ObjectId(instanceId)
          });

          const completedAssignees = await AssignmentEmployee!.countDocuments({
            instance_id: new mongoose.Types.ObjectId(instanceId),
            status: 'COMPLETED'
          });

          if (totalAssignees > 0 && completedAssignees >= totalAssignees) {
            await AssignmentInstance!.findByIdAndUpdate(
              instanceId,
              {
                status: 'COMPLETED',
                updated_at: new Date()
              }
            );
            console.log(`Bulk assignment instance ${instanceId} marked as COMPLETED (${completedAssignees}/${totalAssignees} completed)`);
          } else {
            console.log(`Bulk assignment instance ${instanceId} progress: ${completedAssignees}/${totalAssignees} completed`);
          }
        }
      }

      return NextResponse.json({
        success: true,
        data: savedReport
      });

    } catch (saveError) {
      console.error('DEBUG: Error saving work report:', saveError);
      if (saveError instanceof Error && saveError.name === 'ValidationError') {
        console.error('DEBUG: Validation errors:', (saveError as any).errors);
      }
      return NextResponse.json(
        { success: false, error: 'Failed to save work report: ' + (saveError instanceof Error ? saveError.message : 'Unknown error') },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating instance work report:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
