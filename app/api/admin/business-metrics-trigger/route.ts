/**
 * 🎯 Admin Business Metrics Trigger API
 * Allows administrators to manually trigger business metrics calculations
 */

import { NextRequest, NextResponse } from 'next/server';
import { triggerBusinessMetricsCalculation, triggerBatchBusinessMetricsCalculation, businessMetricsTrigger } from '@/lib/services/business-metrics-trigger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      action,
      region,
      zone,
      batch,
      branch,
      businessCode,
      periodType = 'all-time',
      forceRecalculate = false,
      accountId = 'default'
    } = body;

    switch (action) {
      case 'calculate':
        // Trigger single business metrics calculation
        const result = await triggerBusinessMetricsCalculation({
          region,
          zone,
          batch,
          branch,
          businessCode,
          periodType,
          forceRecalculate,
          accountId
        });

        return NextResponse.json({
          success: result.success,
          message: result.success ? 'Business metrics calculation completed' : 'Business metrics calculation failed',
          data: result.data,
          error: result.error
        });

      case 'calculate-all':
        // Trigger batch calculation for all business units
        const batchResult = await triggerBatchBusinessMetricsCalculation({
          periodType,
          forceRecalculate,
          accountId
        });

        return NextResponse.json({
          success: batchResult.success,
          message: batchResult.success ? 'Batch business metrics calculation completed' : 'Batch business metrics calculation failed',
          data: batchResult.data,
          error: batchResult.error
        });

      case 'schedule':
        // Schedule automatic calculations
        const { cronExpression, name } = body;
        if (!cronExpression || !name) {
          return NextResponse.json({
            success: false,
            error: 'cronExpression and name are required for scheduling'
          }, { status: 400 });
        }

        businessMetricsTrigger.scheduleCalculation(cronExpression, {
          name,
          region,
          zone,
          batch,
          branch,
          periodType,
          forceRecalculate,
          accountId
        });

        return NextResponse.json({
          success: true,
          message: `Business metrics calculation scheduled: ${name}`
        });

      case 'stop-schedule':
        // Stop a scheduled calculation
        const { scheduleName } = body;
        if (!scheduleName) {
          return NextResponse.json({
            success: false,
            error: 'scheduleName is required to stop scheduling'
          }, { status: 400 });
        }

        businessMetricsTrigger.stopScheduledCalculation(scheduleName);

        return NextResponse.json({
          success: true,
          message: `Business metrics calculation stopped: ${scheduleName}`
        });

      case 'status':
        // Get status of scheduled jobs
        const status = businessMetricsTrigger.getScheduledJobsStatus();

        return NextResponse.json({
          success: true,
          data: status
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: calculate, calculate-all, schedule, stop-schedule, or status'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in admin business metrics trigger:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to trigger business metrics calculation', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get status of scheduled jobs
    const status = businessMetricsTrigger.getScheduledJobsStatus();

    return NextResponse.json({
      success: true,
      message: 'Business metrics trigger status',
      data: status
    });

  } catch (error) {
    console.error('Error getting business metrics trigger status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to get business metrics trigger status', details: errorMessage },
      { status: 500 }
    );
  }
}
