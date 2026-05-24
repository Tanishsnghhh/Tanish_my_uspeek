/**
 * ETL Job for EngagementSummary Daily Snapshots
 * This script aggregates daily engagement data for all employees and stores
 * it in the EngagementSummary collection for efficient reporting.
 */

import connectDB from '@/lib/database';
import { 
  LessonActivity, 
  VideoUploadActivity, 
  EmployeeScoreHistory, 
  EngagementSummary 
} from '@/lib/models';

interface DailyAggregation {
  employeeId: string;
  accountId: string;
  date: Date;
  metrics: {
    lessonsCompleted: number;
    videosUploaded: number;
    timeSpentMinutes: number;
    avgScore: number | null;
    scoreCount: number;
    firstActivity: Date | null;
    lastActivity: Date | null;
  };
  attributes: Array<{
    position: string;
    name: string;
    value: string;
  }>;
}

export class EngagementETL {
  private static instance: EngagementETL;
  private isRunning = false;

  static getInstance(): EngagementETL {
    if (!this.instance) {
      this.instance = new EngagementETL();
    }
    return this.instance;
  }

  /**
   * Main ETL process - runs daily aggregation for a specific date
   */
  async runDailyAggregation(targetDate?: Date): Promise<void> {
    if (this.isRunning) {
      console.log('ETL job already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    const date = targetDate || new Date();
    
    // Set to start of day for consistent date handling
    const aggregationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nextDay = new Date(aggregationDate);
    nextDay.setDate(nextDay.getDate() + 1);

    try {
      console.log(`Starting ETL aggregation for ${aggregationDate.toISOString().split('T')[0]}`);
      
      await connectDB();
      
      // Get all active employees with activities on the target date
      const activeEmployees = await this.getActiveEmployees(aggregationDate, nextDay);
      console.log(`Found ${activeEmployees.length} active employees for ${aggregationDate.toISOString().split('T')[0]}`);

      const aggregations: DailyAggregation[] = [];

      // Process each employee
      for (const employeeId of activeEmployees) {
        try {
          const dailyData = await this.aggregateEmployeeDay(employeeId, aggregationDate, nextDay);
          if (dailyData) {
            aggregations.push(dailyData);
          }
        } catch (error) {
          console.error(`Error processing employee ${employeeId}:`, error);
        }
      }

      // Batch insert/update the aggregations
      await this.saveAggregations(aggregations);

      const duration = Date.now() - startTime;
      console.log(`ETL completed successfully in ${duration}ms. Processed ${aggregations.length} employee records.`);

    } catch (error) {
      console.error('ETL job failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get list of employees who had activity on the target date
   */
  private async getActiveEmployees(startDate: Date, endDate: Date): Promise<string[]> {
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: '$employeeId'
        }
      }
    ];

    const [lessonEmployees, videoEmployees, scoreEmployees] = await Promise.all([
      LessonActivity!.aggregate(pipeline),
      VideoUploadActivity!.aggregate(pipeline),
      EmployeeScoreHistory!.aggregate(pipeline)
    ]);

    // Combine and deduplicate employee IDs
    const allEmployeeIds = new Set<string>();
    [...lessonEmployees, ...videoEmployees, ...scoreEmployees].forEach(item => {
      if (item._id) allEmployeeIds.add(item._id.toString());
    });

    return Array.from(allEmployeeIds);
  }

  /**
   * Aggregate all metrics for a single employee on a single day
   */
  private async aggregateEmployeeDay(
    employeeId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<DailyAggregation | null> {
    try {
      const dateFilter = {
        employeeId,
        createdAt: {
          $gte: startDate,
          $lt: endDate
        }
      };

      // Aggregate lesson activities
      const lessonStats = await LessonActivity!.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            lessonsCompleted: { $sum: 1 },
            timeSpentMinutes: { $sum: '$durationMinutes' },
            firstActivity: { $min: '$createdAt' },
            lastActivity: { $max: '$createdAt' }
          }
        }
      ]);

      // Aggregate video activities
      const videoStats = await VideoUploadActivity!.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            videosUploaded: { $sum: 1 },
            firstActivity: { $min: '$createdAt' },
            lastActivity: { $max: '$createdAt' }
          }
        }
      ]);

      // Aggregate scores
      const scoreStats = await EmployeeScoreHistory!.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$score' },
            scoreCount: { $sum: 1 },
            firstActivity: { $min: '$createdAt' },
            lastActivity: { $max: '$createdAt' }
          }
        }
      ]);

      // Get employee profile with attributes
      const employeeProfile = await this.getEmployeeProfile(employeeId);
      if (!employeeProfile) {
        console.warn(`No profile found for employee ${employeeId}`);
        return null;
      }

      // Combine metrics
      const lessonData = lessonStats[0] || { lessonsCompleted: 0, timeSpentMinutes: 0 };
      const videoData = videoStats[0] || { videosUploaded: 0 };
      const scoreData = scoreStats[0] || { avgScore: null, scoreCount: 0 };

      // Calculate first and last activity times
      const activityTimes = [
        lessonData.firstActivity,
        videoData.firstActivity,
        scoreData.firstActivity
      ].filter(Boolean);

      const lastActivityTimes = [
        lessonData.lastActivity,
        videoData.lastActivity,
        scoreData.lastActivity
      ].filter(Boolean);

      return {
        employeeId,
        accountId: employeeProfile.accountId,
        date: startDate,
        metrics: {
          lessonsCompleted: lessonData.lessonsCompleted || 0,
          videosUploaded: videoData.videosUploaded || 0,
          timeSpentMinutes: lessonData.timeSpentMinutes || 0,
          avgScore: scoreData.avgScore || null,
          scoreCount: scoreData.scoreCount || 0,
          firstActivity: activityTimes.length > 0 ? new Date(Math.min(...activityTimes.map(t => t.getTime()))) : null,
          lastActivity: lastActivityTimes.length > 0 ? new Date(Math.max(...lastActivityTimes.map(t => t.getTime()))) : null
        },
        attributes: employeeProfile.attributes || []
      };

    } catch (error) {
      console.error(`Error aggregating data for employee ${employeeId}:`, error);
      return null;
    }
  }

  /**
   * Get employee profile with custom attributes
   */
  private async getEmployeeProfile(employeeId: string) {
    const { EmployeeProfile } = require('@/lib/models');
    
    return await EmployeeProfile.findById(employeeId).populate('accountId').lean();
  }

  /**
   * Save aggregated data to EngagementSummary collection
   */
  private async saveAggregations(aggregations: DailyAggregation[]): Promise<void> {
    if (aggregations.length === 0) return;

    const operations = aggregations.map(agg => ({
      updateOne: {
        filter: {
          employeeId: agg.employeeId,
          date: agg.date
        },
        update: {
          $set: {
            accountId: agg.accountId,
            ...agg.metrics,
            attributes: agg.attributes,
            lastUpdated: new Date()
          }
        },
        upsert: true
      }
    }));

    try {
      const result = await EngagementSummary.bulkWrite(operations);
      console.log(`Saved ${result.upsertedCount} new records, updated ${result.modifiedCount} existing records`);
    } catch (error) {
      console.error('Error saving aggregations:', error);
      throw error;
    }
  }

  /**
   * Run backfill for a date range
   */
  async backfillDateRange(startDate: Date, endDate: Date): Promise<void> {
    console.log(`Starting backfill from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
    
    const current = new Date(startDate);
    const dates: Date[] = [];

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    console.log(`Backfilling ${dates.length} days`);

    for (const date of dates) {
      try {
        await this.runDailyAggregation(date);
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing date ${date.toISOString().split('T')[0]}:`, error);
      }
    }

    console.log('Backfill completed');
  }

  /**
   * Clean up old aggregated data (older than specified days)
   */
  async cleanupOldData(retentionDays: number = 365): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const result = await EngagementSummary.deleteMany({
        date: { $lt: cutoffDate }
      });

      console.log(`Cleaned up ${result.deletedCount} old engagement summary records older than ${retentionDays} days`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }

  /**
   * Get ETL status and statistics
   */
  async getStatus(): Promise<{
    isRunning: boolean;
    lastProcessedDate: Date | null;
    totalRecords: number;
    recordsByDate: Array<{ date: string; count: number }>;
  }> {
    try {
      // Get the most recent date processed
      const lastRecord = await EngagementSummary.findOne({}, {}, { sort: { date: -1 } });
      
      // Get total count
      const totalRecords = await EngagementSummary.countDocuments();

      // Get records by date for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recordsByDate = await EngagementSummary.aggregate([
        {
          $match: {
            date: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        },
        {
          $project: {
            date: '$_id',
            count: 1,
            _id: 0
          }
        }
      ]);

      return {
        isRunning: this.isRunning,
        lastProcessedDate: (lastRecord as any)?.date || null,
        totalRecords,
        recordsByDate
      };
    } catch (error) {
      console.error('Error getting ETL status:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const engagementETL = EngagementETL.getInstance();

// CLI interface for running ETL manually
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'run':
      const dateArg = args[1];
      const targetDate = dateArg ? new Date(dateArg) : new Date();
      engagementETL.runDailyAggregation(targetDate)
        .then(() => process.exit(0))
        .catch(err => {
          console.error('ETL failed:', err);
          process.exit(1);
        });
      break;

    case 'backfill':
      const startDate = new Date(args[1]);
      const endDate = new Date(args[2]);
      engagementETL.backfillDateRange(startDate, endDate)
        .then(() => process.exit(0))
        .catch(err => {
          console.error('Backfill failed:', err);
          process.exit(1);
        });
      break;

    case 'cleanup':
      const retentionDays = parseInt(args[1]) || 365;
      engagementETL.cleanupOldData(retentionDays)
        .then(() => process.exit(0))
        .catch(err => {
          console.error('Cleanup failed:', err);
          process.exit(1);
        });
      break;

    case 'status':
      engagementETL.getStatus()
        .then(status => {
          console.log('ETL Status:', JSON.stringify(status, null, 2));
          process.exit(0);
        })
        .catch(err => {
          console.error('Status check failed:', err);
          process.exit(1);
        });
      break;

    default:
      console.log(`
Usage: node engagement-etl.js <command> [args]

Commands:
  run [date]              Run ETL for specific date (YYYY-MM-DD) or today
  backfill <start> <end>  Backfill date range (YYYY-MM-DD format)
  cleanup [days]          Clean up data older than specified days (default: 365)
  status                  Show ETL status and statistics

Examples:
  node engagement-etl.js run
  node engagement-etl.js run 2024-01-15
  node engagement-etl.js backfill 2024-01-01 2024-01-31
  node engagement-etl.js cleanup 90
  node engagement-etl.js status
      `);
      process.exit(1);
  }
}
