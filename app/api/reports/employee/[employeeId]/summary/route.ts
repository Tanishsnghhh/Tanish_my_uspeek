import { NextRequest, NextResponse } from 'next/server';
import { 
  LessonActivity, 
  VideoUploadActivity, 
  EmployeeScoreHistory, 
  EmployeeProfile,
  EmployeeAttributeValue,
  CustomAttributeDefinition,
  AssignmentEmployee
} from '@/lib/models';
import connectDB from '@/lib/database';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// GET /api/reports/employee/[employeeId]/summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    await connectDB();

    const { employeeId } = await params;
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const includeTrend = searchParams.get('includeTrend') === 'true';
    const includeAssignments = searchParams.get('includeAssignments') === 'true';

    // Dates are optional: default to full range when not provided (start = epoch, end = now).
    const startDate = start ? new Date(start as string) : new Date(0);
    const endDate = end ? new Date(end as string) : new Date();

    // Validate date formats only when provided by the client
    if ((start && isNaN(startDate.getTime())) || (end && isNaN(endDate.getTime()))) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Extract account_id from JWT token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authorization token required' },
        { status: 401 }
      );
    }

    let accountId: string;
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded?.corporateAccountId) {
        return NextResponse.json(
          { success: false, error: 'Invalid token: missing account ID' },
          { status: 401 }
        );
      }
      accountId = decoded.corporateAccountId;
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const employeeObjectId = new mongoose.Types.ObjectId(employeeId);

    // Fetch employee profile with attributes - allow any admin to access any employee
    const employeeResult = await EmployeeProfile!.aggregate([
      { 
        $match: { 
          _id: employeeObjectId,
          isActive: { $ne: false } // Allow null/undefined as active 
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $project: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          department: 1,
          job_title: 1,
          employeeId: 1,
          hireDate: 1,
          isActive: 1,
          account_id: 1, // Direct account_id from employee profile
          user: {
            $cond: {
              if: { $gt: [{ $size: '$user' }, 0] },
              then: {
                first_name: { $arrayElemAt: ['$user.first_name', 0] },
                last_name: { $arrayElemAt: ['$user.last_name', 0] },
                account_id: { $arrayElemAt: ['$user.account_id', 0] }
              },
              else: null
            }
          }
        }
      }
    ]);

    if (!employeeResult || employeeResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const employee = employeeResult[0];
    
    // Use the employee's account ID or fall back to the token's account ID
    const employeeAccountId = employee.user?.account_id || employee.account_id || accountId;

    // Get employee attributes
    const attributeValues = await EmployeeAttributeValue!.find({
      employee_id: employeeObjectId
    })
    .populate('attribute_id', 'name position')
    .lean();

    const attributes = attributeValues.map((av: any) => ({
      name: av.attribute_id?.name || 'Unknown',
      position: av.attribute_id?.position || 0,
      value: av.value
    }));

    // Calculate metrics for the time window using employee's account ID
    const [lessonStats, videoStats, scoreImprovement] = await Promise.all([
      // Lesson activity stats
      LessonActivity!.aggregate([
        {
          $match: {
            account_id: new mongoose.Types.ObjectId(employeeAccountId),
            employee_id: employeeObjectId,
            attempted_at: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            avgScore: { $avg: { $ifNull: ['$score', null] } },
            lessonsCompleted: { $addToSet: '$lesson_id' },
            timeSpentMinutes: { $sum: '$time_spent_minutes' }
          }
        },
        {
          $project: {
            avgScore: { $round: ['$avgScore', 1] },
            lessonsCompleted: { $size: '$lessonsCompleted' },
            timeSpentMinutes: 1
          }
        }
      ]),

      // Video upload stats
      VideoUploadActivity!.countDocuments({
        account_id: employeeAccountId,
        employee_id: employeeObjectId,
        upload_date: { $gte: startDate, $lte: endDate }
      }),

      // Score improvement calculation
      EmployeeScoreHistory.aggregate([
        {
          $match: {
            account_id: new mongoose.Types.ObjectId(employeeAccountId),
            employee_id: employeeObjectId,
            recorded_at: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $sort: { recorded_at: 1 }
        },
        {
          $group: {
            _id: null,
            first: { $first: '$score' },
            last: { $last: '$score' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const lessonData = lessonStats[0] || { avgScore: null, lessonsCompleted: 0, timeSpentMinutes: 0 };
    const improvement = scoreImprovement[0] || { first: null, last: null, count: 0 };

    let improvementData = null;
    if (improvement.count > 0 && improvement.first !== null && improvement.last !== null) {
      const delta = improvement.last - improvement.first;
      const deltaPct = improvement.first > 0 ? (delta / improvement.first) * 100 : 0;
      improvementData = {
        first: improvement.first,
        last: improvement.last,
        delta: Math.round(delta * 10) / 10,
        deltaPct: Math.round(deltaPct * 100) / 100
      };
    }

    // Build response
    const response: any = {
      employeeId: employeeId,
      window: { start, end },
      profile: {
        name: `${employee.user?.first_name || employee.first_name || ''} ${employee.user?.last_name || employee.last_name || ''}`.trim(),
        department: employee.department || '',
        jobTitle: employee.job_title || ''
      },
      attributes,
      metrics: {
        avgScore: lessonData.avgScore,
        lessonsCompleted: lessonData.lessonsCompleted,
        timeSpentMinutes: lessonData.timeSpentMinutes,
        videosUploaded: videoStats,
        improvement: improvementData
      }
    };

    // Add trend data if requested
    if (includeTrend) {
      const [scoresTrend, videosByWeek, timeSpentByDay] = await Promise.all([
        // Score trend
        EmployeeScoreHistory.find({
          account_id: employeeAccountId,
          employee_id: employeeObjectId,
          recorded_at: { $gte: startDate, $lte: endDate }
        })
        .sort({ recorded_at: 1 })
        .select('score recorded_at')
        .lean(),

        // Videos by week
        VideoUploadActivity!.aggregate([
          {
            $match: {
              account_id: new mongoose.Types.ObjectId(employeeAccountId),
              employee_id: employeeObjectId,
              upload_date: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$upload_date' },
                week: { $week: '$upload_date' }
              },
              count: { $sum: 1 }
            }
          },
          {
            $project: {
              t: {
                $concat: [
                  { $toString: '$_id.year' },
                  '-W',
                  { $toString: '$_id.week' }
                ]
              },
              count: 1
            }
          },
          { $sort: { '_id.year': 1, '_id.week': 1 } }
        ]),

        // Time spent by day
        LessonActivity!.aggregate([
          {
            $match: {
              account_id: new mongoose.Types.ObjectId(employeeAccountId),
              employee_id: employeeObjectId,
              attempted_at: { $gte: startDate, $lte: endDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$attempted_at'
                }
              },
              minutes: { $sum: '$time_spent_minutes' }
            }
          },
          {
            $project: {
              t: '$_id',
              minutes: 1
            }
          },
          { $sort: { '_id': 1 } }
        ])
      ]);

      response.trend = {
        scores: scoresTrend.map((s: any) => ({
          t: s.recorded_at.toISOString().split('T')[0],
          score: s.score
        })),
        videosByWeek: videosByWeek.map((v: any) => ({
          t: v.t,
          count: v.count
        })),
        timeSpentByDay: timeSpentByDay.map((t: any) => ({
          t: t.t,
          minutes: t.minutes
        }))
      };
    }

    // Add assignments data if requested
    if (includeAssignments) {
      const assignments = await AssignmentEmployee!.find({
        employee_id: employeeObjectId,
        assigned_at: { $gte: startDate, $lte: endDate }
      })
      .populate({
        path: 'instance_id',
        select: 'assignment_id status created_at',
        populate: {
          path: 'assignment_id',
          select: 'title'
        }
      })
      .select('status completed_at progress_percentage score')
      .lean();

      const assignmentData = await Promise.all(assignments.map(async (assignment: any) => {
        // Count videos and lessons for this assignment
        const [videosCount, lessonsCount] = await Promise.all([
          VideoUploadActivity!.countDocuments({
            assignment_employee_id: assignment._id
          }),
          LessonActivity!.distinct('lesson_id', {
            assignment_employee_id: assignment._id
          }).then(lessons => lessons.length)
        ]);

        return {
          instanceId: assignment.instance_id?._id?.toString(),
          title: assignment.instance_id?.assignment_id?.title || 'Unknown',
          status: assignment.status,
          completedAt: assignment.completed_at?.toISOString(),
          videosUploaded: videosCount,
          lessons: lessonsCount,
          score: assignment.score
        };
      }));

      response.assignments = assignmentData;
    }

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching employee summary:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
