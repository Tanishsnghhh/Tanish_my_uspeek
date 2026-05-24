import { NextRequest, NextResponse } from 'next/server';
import { AssignmentEmployee, AssignmentInstance, AssignmentMaster, EmployeeProfile } from '@/lib/models';
import connectDB from '@/lib/database';

// GET /api/assignments/analytics - Get comprehensive assignment analytics
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy'); // 'department', 'assignment_type', 'status'
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();
    
    // Get all instances for this account in the date range
    const instances = await AssignmentInstance!.find({
      account_id: accountId,
      created_at: { $gte: start, $lte: end }
    }).select('_id assignment_id assignment_scope status created_at deadline');
    
    if (instances.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalAssignments: 0,
            completedAssignments: 0,
            overdueAssignments: 0,
            completionRate: 0,
            averageProgress: 0
          },
          breakdown: [],
          trends: []
        }
      });
    }
    
    const instanceIds = instances.map(instance => instance._id);
    
    // Get all employee assignments for these instances
    const employeeAssignments: any[] = AssignmentEmployee ? await AssignmentEmployee!.find({
      instance_id: { $in: instanceIds }
    }).populate('employee_id', 'department job_title') : [];
    
    // Calculate summary statistics
    const totalAssignments = employeeAssignments.length;
    const completedAssignments = employeeAssignments.filter(a => a.status === 'COMPLETED').length;
    const overdueAssignments = employeeAssignments.filter(a => a.status === 'OVERDUE').length;
    const inProgressAssignments = employeeAssignments.filter(a => a.status === 'IN_PROGRESS').length;
    
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
    const averageProgress = employeeAssignments.reduce((sum, a) => sum + (a.progress_percentage || 0), 0) / totalAssignments;
    
    // Group by department
    const departmentBreakdown = await EmployeeProfile!.aggregate([
      { $match: { account_id: accountId, isActive: true } },
      {
        $lookup: {
          from: 'assignmentemployees',
          localField: '_id',
          foreignField: 'employee_id',
          as: 'assignments'
        }
      },
      {
        $addFields: {
          totalAssignments: { $size: '$assignments' },
          completedAssignments: {
            $size: {
              $filter: {
                input: '$assignments',
                cond: { $eq: ['$$this.status', 'COMPLETED'] }
              }
            }
          },
          overdueAssignments: {
            $size: {
              $filter: {
                input: '$assignments',
                cond: { $eq: ['$$this.status', 'OVERDUE'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$department',
          totalEmployees: { $sum: 1 },
          totalAssignments: { $sum: '$totalAssignments' },
          completedAssignments: { $sum: '$completedAssignments' },
          overdueAssignments: { $sum: '$overdueAssignments' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalAssignments', 0] },
              { $multiply: [{ $divide: ['$completedAssignments', '$totalAssignments'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);
    
    // Group by assignment type
    const assignmentTypeBreakdown = AssignmentMaster ? await AssignmentMaster!.aggregate([
      {
        $lookup: {
          from: 'assignmentinstances',
          localField: '_id',
          foreignField: 'assignment_id',
          as: 'instances'
        }
      },
      {
        $lookup: {
          from: 'assignmentemployees',
          localField: 'instances._id',
          foreignField: 'instance_id',
          as: 'employeeAssignments'
        }
      },
      {
        $addFields: {
          totalAssignments: { $size: '$employeeAssignments' },
          completedAssignments: {
            $size: {
              $filter: {
                input: '$employeeAssignments',
                cond: { $eq: ['$$this.status', 'COMPLETED'] }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$assignment_type',
          totalAssignments: { $sum: '$totalAssignments' },
          completedAssignments: { $sum: '$completedAssignments' }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $gt: ['$totalAssignments', 0] },
              { $multiply: [{ $divide: ['$completedAssignments', '$totalAssignments'] }, 100] },
              0
            ]
          }
        }
      }
    ]) : [];
    
    // Status breakdown
    const statusBreakdown = [
      { status: 'ASSIGNED', count: employeeAssignments.filter(a => a.status === 'ASSIGNED').length },
      { status: 'IN_PROGRESS', count: inProgressAssignments },
      { status: 'COMPLETED', count: completedAssignments },
      { status: 'OVERDUE', count: overdueAssignments },
      { status: 'CANCELLED', count: employeeAssignments.filter(a => a.status === 'CANCELLED').length }
    ];
    
    // Weekly trends (last 8 weeks)
    const weeklyTrends = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(end);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekInstances = instances.filter(instance => 
        instance.created_at >= weekStart && instance.created_at <= weekEnd
      );
      
      const weekInstanceIds = weekInstances.map(instance => instance._id);
      const weekAssignments = employeeAssignments.filter(assignment => 
        weekInstanceIds.includes(assignment.instance_id)
      );
      
      weeklyTrends.push({
        week: weekStart.toISOString().split('T')[0],
        newAssignments: weekInstances.length,
        completedAssignments: weekAssignments.filter(a => a.status === 'COMPLETED').length,
        totalActive: weekAssignments.filter(a => ['ASSIGNED', 'IN_PROGRESS'].includes(a.status)).length
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalAssignments,
          completedAssignments,
          overdueAssignments,
          inProgressAssignments,
          completionRate: Math.round(completionRate * 100) / 100,
          averageProgress: Math.round(averageProgress * 100) / 100
        },
        breakdown: {
          byDepartment: departmentBreakdown,
          byAssignmentType: assignmentTypeBreakdown,
          byStatus: statusBreakdown
        },
        trends: weeklyTrends,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching assignment analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
