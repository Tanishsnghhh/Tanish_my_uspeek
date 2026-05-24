/**
 * ETL Management API Endpoint
 * Provides manual control over ETL jobs and scheduling
 */

import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { engagementETL } from '@/lib/jobs/engagement-etl';
import { etlScheduler } from '@/lib/jobs/etl-scheduler';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

async function authenticateRequest(request: NextRequest): Promise<{ user: any } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, JWT_SECRET) as any;
    
    return { user: decoded };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can access ETL management
    if (auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        const etlStatus = await engagementETL.getStatus();
        const jobsStatus = etlScheduler.getJobsStatus();
        
        return NextResponse.json({
          etl: etlStatus,
          scheduler: {
            jobs: jobsStatus
          }
        });

      case 'jobs':
        return NextResponse.json({
          jobs: etlScheduler.getJobsStatus()
        });

      default:
        return NextResponse.json({
          error: 'Invalid action. Available actions: status, jobs'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('ETL management GET error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin users can control ETL jobs
    if (auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'run-aggregation':
        {
          const { date } = params;
          const targetDate = date ? new Date(date) : new Date();
          
          // Run in background to avoid timeout
          engagementETL.runDailyAggregation(targetDate)
            .catch(error => console.error('Background ETL failed:', error));
          
          return NextResponse.json({
            message: 'ETL aggregation started',
            targetDate: targetDate.toISOString().split('T')[0]
          });
        }

      case 'backfill':
        {
          const { startDate, endDate } = params;
          
          if (!startDate || !endDate) {
            return NextResponse.json({
              error: 'startDate and endDate are required for backfill'
            }, { status: 400 });
          }

          // Run in background to avoid timeout
          engagementETL.backfillDateRange(new Date(startDate), new Date(endDate))
            .catch(error => console.error('Background backfill failed:', error));
          
          return NextResponse.json({
            message: 'ETL backfill started',
            dateRange: { startDate, endDate }
          });
        }

      case 'cleanup':
        {
          const { retentionDays = 365 } = params;
          
          // Run in background
          engagementETL.cleanupOldData(retentionDays)
            .catch(error => console.error('Background cleanup failed:', error));
          
          return NextResponse.json({
            message: 'ETL cleanup started',
            retentionDays
          });
        }

      case 'start-scheduler':
        {
          if (!etlScheduler.getJobsStatus().length) {
            etlScheduler.initialize();
          }
          etlScheduler.startAll();
          
          return NextResponse.json({
            message: 'ETL scheduler started',
            jobs: etlScheduler.getJobsStatus()
          });
        }

      case 'stop-scheduler':
        {
          etlScheduler.stopAll();
          
          return NextResponse.json({
            message: 'ETL scheduler stopped',
            jobs: etlScheduler.getJobsStatus()
          });
        }

      case 'start-job':
        {
          const { jobName } = params;
          
          if (!jobName) {
            return NextResponse.json({
              error: 'jobName is required'
            }, { status: 400 });
          }

          const success = etlScheduler.startJob(jobName);
          
          return NextResponse.json({
            message: success ? 'Job started' : 'Job not found',
            jobName,
            success
          });
        }

      case 'stop-job':
        {
          const { jobName } = params;
          
          if (!jobName) {
            return NextResponse.json({
              error: 'jobName is required'
            }, { status: 400 });
          }

          const success = etlScheduler.stopJob(jobName);
          
          return NextResponse.json({
            message: success ? 'Job stopped' : 'Job not found',
            jobName,
            success
          });
        }

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: [
            'run-aggregation',
            'backfill',
            'cleanup',
            'start-scheduler',
            'stop-scheduler',
            'start-job',
            'stop-job'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    console.error('ETL management POST error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'schedule-job':
        {
          const { name, cronExpression, type } = params;
          
          if (!name || !cronExpression || !type) {
            return NextResponse.json({
              error: 'name, cronExpression, and type are required'
            }, { status: 400 });
          }

          let task: () => Promise<void>;

          switch (type) {
            case 'daily-aggregation':
              task = async () => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                await engagementETL.runDailyAggregation(yesterday);
              };
              break;
            
            case 'cleanup':
              task = async () => {
                await engagementETL.cleanupOldData(params.retentionDays || 365);
              };
              break;
            
            default:
              return NextResponse.json({
                error: 'Invalid job type. Available types: daily-aggregation, cleanup'
              }, { status: 400 });
          }

          etlScheduler.scheduleJob(name, cronExpression, task);
          
          return NextResponse.json({
            message: 'Job scheduled successfully',
            job: { name, cronExpression, type }
          });
        }

      default:
        return NextResponse.json({
          error: 'Invalid action. Available actions: schedule-job'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('ETL management PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
