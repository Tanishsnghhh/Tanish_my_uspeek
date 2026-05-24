import { NextRequest, NextResponse } from 'next/server';
import { 
  LessonActivity, 
  VideoUploadActivity, 
  EmployeeScoreHistory,
  EmployeeProfile
} from '@/lib/models';
import connectDB from '@/lib/database';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// GET /api/reports/employee/[employeeId]/timeseries
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
    const series = searchParams.get('series');

    // Validate required parameters: only 'series' is required. Dates are optional and default to full range.
    if (!series) {
      return NextResponse.json(
        { success: false, error: 'Series parameter is required' },
        { status: 400 }
      );
    }

    if (!['scores', 'videos', 'timeSpent', 'lessons'].includes(series)) {
      return NextResponse.json(
        { success: false, error: 'Series must be one of: scores, videos, timeSpent, lessons' },
        { status: 400 }
      );
    }

    const startDate = start ? new Date(start as string) : new Date(0);
    const endDate = end ? new Date(end as string) : new Date();

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

    // Validate that the employee exists and get their account ID
    const employeeExists = await EmployeeProfile!.aggregate([
      { 
        $match: { 
          _id: employeeObjectId,
          isActive: true 
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
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $project: {
          _id: 1,
          user: {
            account_id: '$user.account_id'
          }
        }
      },
      {
        $limit: 1
      }
    ]);

    if (!employeeExists || employeeExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    const employee = employeeExists[0];
    const employeeAccountId = employee.user.account_id; // Use employee's account ID for activity queries

    let timeseriesData: any[] = [];

    switch (series) {
      case 'scores':
        timeseriesData = await EmployeeScoreHistory.find({
          account_id: employeeAccountId,
          employee_id: employeeObjectId,
          recorded_at: { $gte: startDate, $lte: endDate }
        })
        .sort({ recorded_at: 1 })
        .select('score recorded_at')
        .lean();

        timeseriesData = timeseriesData.map((item: any) => ({
          t: item.recorded_at.toISOString().split('T')[0],
          value: item.score
        }));
        break;

      case 'videos':
        timeseriesData = await VideoUploadActivity!.aggregate([
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
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$upload_date'
                }
              },
              value: { $sum: 1 }
            }
          },
          {
            $project: {
              t: '$_id',
              value: 1,
              _id: 0
            }
          },
          { $sort: { t: 1 } }
        ]);
        break;

      case 'timeSpent':
        timeseriesData = await LessonActivity!.aggregate([
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
              value: { $sum: '$time_spent_minutes' }
            }
          },
          {
            $project: {
              t: '$_id',
              value: 1,
              _id: 0
            }
          },
          { $sort: { t: 1 } }
        ]);
        break;

      case 'lessons':
        timeseriesData = await LessonActivity!.aggregate([
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
                date: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$attempted_at'
                  }
                }
              },
              lessons: { $addToSet: '$lesson_id' }
            }
          },
          {
            $project: {
              t: '$_id.date',
              value: { $size: '$lessons' },
              _id: 0
            }
          },
          { $sort: { t: 1 } }
        ]);
        break;
    }

    return NextResponse.json({
      success: true,
      data: timeseriesData,
      series,
      employeeId: employeeId,
      window: { start, end }
    });

  } catch (error) {
    console.error('Error fetching timeseries data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
