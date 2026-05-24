import { NextRequest, NextResponse } from 'next/server';
import { AssignmentEmployee, AssignmentInstance, EmployeeProfile, User } from '@/lib/models';
import { verifyToken, getTokenFromHeader } from '@/lib/auth';
import connectDB from '@/lib/database';
import mongoose from 'mongoose';

// Add: allowed status values for validation
const ALLOWED_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'] as const;

// GET /api/assignments/employees - Get employee assignments with filters
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
    const accountId = searchParams.get('accountId');
    const employeeId = searchParams.get('employeeId');
    const instanceId = searchParams.get('instanceId');
    const status = searchParams.get('status');
    const all = searchParams.get('all'); // New parameter to fetch all employee assignments
    const id = searchParams.get('id'); // New: fetch single assignment-employee by id

    // If id is provided, fetch a single record and return early
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid id' },
          { status: 400 }
        );
      }

      const doc = await AssignmentEmployee!.findOne({
        _id: id,
        corporate_account_id: corporateAccountId
      })
        .populate({
          path: 'instance_id',
          populate: {
            path: 'assignment_id',
            select: 'title description assignment_type difficulty_level'
          }
        })
        .populate('employee_id', 'first_name last_name department job_title')
        .lean();

      if (!doc) {
        return NextResponse.json(
          { success: false, error: 'Assignment employee not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: doc });
    }
    
    // Validate status filter, if provided
    if (status && !ALLOWED_STATUSES.includes(status as any)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status filter' },
        { status: 400 }
      );
    }
    
    // Always filter by corporate account for security
    let query: any = {
      corporate_account_id: corporateAccountId
    };
    
    if (employeeId) {
      if (!mongoose.Types.ObjectId.isValid(employeeId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid employeeId' },
          { status: 400 }
        );
      }
      query.employee_id = new mongoose.Types.ObjectId(employeeId);
    }
    
    if (instanceId) {
      if (!mongoose.Types.ObjectId.isValid(instanceId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid instanceId' },
          { status: 400 }
        );
      }
      query.instance_id = new mongoose.Types.ObjectId(instanceId);
    }
    
    if (status) {
      query.status = status;
    }
    
    // If no specific instance or employee, filter by account through AssignmentInstance (only if accountId provided)
    if (!instanceId && !employeeId && accountId) {
      if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return NextResponse.json(
          { success: false, error: 'Invalid accountId' },
          { status: 400 }
        );
      }
      const instances = await AssignmentInstance!.find({ account_id: new mongoose.Types.ObjectId(accountId) }).distinct('_id');
      query.instance_id = { $in: instances };
    }
    
    const assignments = await AssignmentEmployee!.find(query)
      .populate({
        path: 'instance_id',
        populate: {
          path: 'assignment_id',
          select: 'title description assignment_type difficulty_level'
        }
      })
      .populate('employee_id', 'first_name last_name department job_title')
      .sort({ assigned_at: -1 })
      .lean();
    
    return NextResponse.json({ success: true, data: assignments });
  } catch (error: any) {
    console.error('Error fetching employee assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee assignments' },
      { status: 500 }
    );
  }
}

// PUT /api/assignments/employees - Update assignment status and progress
export async function PUT(request: NextRequest) {
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
    
    const body = await request.json();
    const { 
      assignmentEmployeeId, 
      status, 
      progress_percentage, 
      score, 
      feedback,
      submission_data 
    } = body;
    
    if (!assignmentEmployeeId || !status) {
      return NextResponse.json(
        { success: false, error: 'Assignment employee ID and status are required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentEmployeeId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assignmentEmployeeId' },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }
    
    if (progress_percentage !== undefined) {
      const num = Number(progress_percentage);
      if (!Number.isFinite(num) || num < 0 || num > 100) {
        return NextResponse.json(
          { success: false, error: 'progress_percentage must be a number between 0 and 100' },
          { status: 400 }
        );
      }
    }
    
    const updateData: any = { status };
    
    if (progress_percentage !== undefined) updateData.progress_percentage = progress_percentage;
    if (score !== undefined) updateData.score = score;
    if (feedback !== undefined) updateData.feedback = feedback;
    if (submission_data !== undefined) updateData.submission_data = submission_data;
    if (status === 'COMPLETED') updateData.completed_at = new Date();
    
    // First check if the assignment exists and belongs to the corporate account
    const existingAssignment = await AssignmentEmployee!.findById(assignmentEmployeeId);
    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify the assignment belongs to the corporate account
    if (existingAssignment.corporate_account_id.toString() !== corporateAccountId.toString()) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Assignment does not belong to your corporate account.' },
        { status: 403 }
      );
    }

    const assignment = await AssignmentEmployee!.findByIdAndUpdate(
      assignmentEmployeeId,
      updateData,
      { new: true, runValidators: true }
    ).populate('instance_id employee_id');
    
    return NextResponse.json({ success: true, data: assignment });
  } catch (error: any) {
    console.error('Error updating employee assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    );
  }
}

// POST /api/assignments/employees/bulk-update - Bulk update assignment statuses
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { updates } = body; // Array of { assignmentEmployeeId, status, progress_percentage, etc. }
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Updates array is required' },
        { status: 400 }
      );
    }

    const invalids: any[] = [];
    const cleaned = updates.map((u: any, idx: number) => {
      const id = u.assignmentEmployeeId;
      const st = u.status;
      const prog = u.progress_percentage;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        invalids.push({ index: idx, error: 'Invalid assignmentEmployeeId', id });
      }
      if (!ALLOWED_STATUSES.includes(st)) {
        invalids.push({ index: idx, error: 'Invalid status', status: st });
      }
      if (prog !== undefined) {
        const num = Number(prog);
        if (!Number.isFinite(num) || num < 0 || num > 100) {
          invalids.push({ index: idx, error: 'progress_percentage out of range', value: prog });
        }
      }
      return u;
    });

    if (invalids.length) {
      return NextResponse.json(
        { success: false, error: 'Validation failed for some updates', details: invalids },
        { status: 400 }
      );
    }
    
    const bulkOps = cleaned.map((update: any) => ({
      updateOne: {
        filter: { _id: update.assignmentEmployeeId },
        update: {
          $set: {
            status: update.status,
            ...(update.progress_percentage !== undefined && { progress_percentage: update.progress_percentage }),
            ...(update.score !== undefined && { score: update.score }),
            ...(update.feedback !== undefined && { feedback: update.feedback }),
            ...(update.submission_data !== undefined && { submission_data: update.submission_data }),
            ...(update.status === 'COMPLETED' ? { completed_at: new Date() } : {})
          }
        }
      }
    }));
    
    const result = await AssignmentEmployee!.bulkWrite(bulkOps);
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        matched: result.matchedCount, 
        modified: result.modifiedCount 
      }
    });
  } catch (error: any) {
    console.error('Error bulk updating employee assignments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk update assignments' },
      { status: 500 }
    );
  }
}
