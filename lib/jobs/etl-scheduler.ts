/**
 * ETL Scheduler for EngagementSummary
 * Handles automated daily aggregation jobs and provides manual controls
 */

import * as cron from 'node-cron';
import { engagementETL } from './engagement-etl';

export class ETLScheduler {
  private static instance: ETLScheduler;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isInitialized = false;

  static getInstance(): ETLScheduler {
    if (!this.instance) {
      this.instance = new ETLScheduler();
    }
    return this.instance;
  }

  /**
   * Initialize the scheduler with default jobs
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('ETL Scheduler already initialized');
      return;
    }

    // Daily aggregation job - runs at 2 AM every day
    this.scheduleJob('daily-aggregation', '0 2 * * *', async () => {
      console.log('Starting scheduled daily ETL aggregation...');
      try {
        // Run for yesterday's data (to ensure all data is captured)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        await engagementETL.runDailyAggregation(yesterday);
        console.log('Scheduled ETL aggregation completed successfully');
      } catch (error) {
        console.error('Scheduled ETL aggregation failed:', error);
      }
    });

    // Weekly cleanup job - runs at 3 AM every Sunday
    this.scheduleJob('weekly-cleanup', '0 3 * * 0', async () => {
      console.log('Starting scheduled weekly cleanup...');
      try {
        await engagementETL.cleanupOldData(365); // Keep 1 year of data
        console.log('Scheduled cleanup completed successfully');
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    });

    this.isInitialized = true;
    console.log('ETL Scheduler initialized with daily aggregation and weekly cleanup jobs');
  }

  /**
   * Schedule a new job
   */
  scheduleJob(name: string, cronExpression: string, task: () => Promise<void>): void {
    // Stop existing job if it exists
    if (this.jobs.has(name)) {
      this.jobs.get(name)?.stop();
    }

    const scheduledTask = cron.schedule(cronExpression, task, {
      timezone: 'UTC'
    });

    // Stop the task initially
    scheduledTask.stop();

    this.jobs.set(name, scheduledTask);
    console.log(`Scheduled job '${name}' with cron expression: ${cronExpression}`);
  }

  /**
   * Start a specific job
   */
  startJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job) {
      job.start();
      console.log(`Started job: ${name}`);
      return true;
    }
    console.warn(`Job not found: ${name}`);
    return false;
  }

  /**
   * Stop a specific job
   */
  stopJob(name: string): boolean {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      console.log(`Stopped job: ${name}`);
      return true;
    }
    console.warn(`Job not found: ${name}`);
    return false;
  }

  /**
   * Start all jobs
   */
  startAll(): void {
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`Started job: ${name}`);
    });
  }

  /**
   * Stop all jobs
   */
  stopAll(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped job: ${name}`);
    });
  }

  /**
   * Get status of all jobs
   */
  getJobsStatus(): Array<{
    name: string;
    cronExpression: string;
    isRunning: boolean;
  }> {
    const status: Array<{
      name: string;
      cronExpression: string;
      isRunning: boolean;
    }> = [];

    this.jobs.forEach((job, name) => {
      status.push({
        name,
        cronExpression: 'Unknown', // node-cron doesn't expose the pattern
        isRunning: job.getStatus() === 'scheduled'
      });
    });

    return status;
  }

  /**
   * Destroy the scheduler and stop all jobs
   */
  destroy(): void {
    this.stopAll();
    this.jobs.clear();
    this.isInitialized = false;
    console.log('ETL Scheduler destroyed');
  }
}

// Export singleton instance
export const etlScheduler = ETLScheduler.getInstance();

// Auto-initialize in production environment
if (process.env.NODE_ENV === 'production') {
  etlScheduler.initialize();
  etlScheduler.startAll();
}
