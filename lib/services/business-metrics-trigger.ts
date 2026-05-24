/**
 * 🎯 Business Metrics Trigger Service
 * Handles automatic triggering of business metrics calculations
 */

import * as cron from 'node-cron';
import { connectDB } from '../mongodb';
import { ObjectId } from 'mongodb';

class BusinessMetricsTriggerService {
  private isRunning: boolean = false;
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Trigger business metrics calculation immediately
   */
  async triggerCalculation(options: {
    region?: string;
    zone?: string;
    batch?: string;
    branch?: string;
    businessCode?: string;
    periodType?: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all-time';
    forceRecalculate?: boolean;
    accountId?: string;
  } = {}) {
    if (this.isRunning) {
      console.log('⚠️ Business metrics calculation already running, skipping...');
      return { success: false, message: 'Calculation already in progress' };
    }

    this.isRunning = true;

    try {
      console.log('🚀 Triggering business metrics calculation...');

      // Import the calculation function directly to avoid HTTP calls
      const { calculateBusinessWiseData } = await import('./business-wise-data-calculator');

      const result = await calculateBusinessWiseData({
        region: options.region,
        zone: options.zone,
        batch: options.batch,
        branch: options.branch,
        businessCode: options.businessCode,
        corporateAccountId: options.accountId,
        // For periodType, if not all-time, we could calculate dates, but for now assume all-time
      });

      if (result.success && result.data && result.data.length > 0) {
        // Store the results in businessmetrics collection
        try {
          const { db } = await connectDB();
          const businessMetrics = db.collection('businessmetrics');
          const businessUnitsCollection = db.collection('businessunits');

          for (const row of result.data) {
            // Get the business unit to extract corporate_account_id
            const businessUnit = await businessUnitsCollection.findOne({ businessCode: row.businessCode });
            const corporateAccountId = businessUnit?.corporate_account_id || options.accountId;

            if (!corporateAccountId) {
              console.error(`No corporate_account_id found for business unit: ${row.businessCode}`);
              continue;
            }

            const metrics = {
              businessId: row.businessCode,
              businessName: row.rowLabels,
              businessCode: row.businessCode,
              businessCategory: row.businessCategory,
              region: options.region || 'All',
              zone: options.zone,
              batch: options.batch,
              branch: options.branch,
              corporate_account_id: new ObjectId(corporateAccountId),
              periodInfo: {
                calculationDate: new Date(),
                periodType: options.periodType || 'all-time',
                periodStart: new Date(0), // For all-time
                periodEnd: new Date(),
                year: new Date().getFullYear()
              },
              participants: {
                totalParticipants: row.totalParticipants,
                activeParticipants: row.totalParticipants,
                newParticipants: row.totalParticipants,
                totalVideos: row.totalVideos,
                analyzedVideos: row.totalVideos
              },
              bodyLanguage: {
                averageBodyLanguage: row.avgMaxBL, // Approximate
                maximumBodyLanguage: row.avgMaxBL,
                minimumBodyLanguage: row.avgMinBL,
                bodyLanguageImprovementRate: row.avgBIRPercent,
                avgMinBodyLanguage: row.avgMinBL,
                avgMaxBodyLanguage: row.avgMaxBL,
                participantsWithBL: row.totalParticipants
              },
              vocalTone: {
                averageVocalTone: row.avgMaxVT,
                maximumVocalTone: row.avgMaxVT,
                minimumVocalTone: row.avgMinVT,
                vocalToneImprovementRate: row.avgVIRPercent,
                avgMinVocalTone: row.avgMinVT,
                avgMaxVocalTone: row.avgMaxVT,
                participantsWithVT: row.totalParticipants
              },
              wordPower: {
                averageWordPower: row.avgMaxWP,
                maximumWordPower: row.avgMaxWP,
                minimumWordPower: row.avgMinWP,
                wordPowerImprovementRate: row.avgWIRPercent,
                avgMinWordPower: row.avgMinWP,
                avgMaxWordPower: row.avgMaxWP,
                participantsWithWP: row.totalParticipants
              },
              overall: {
                avgOverallImprovementRate: row.avgOIRPercent,
                avgMaxOverallScore: row.avgMaxOS,
                avgMinOverallScore: row.avgMinOS,
                avgBodyLanguageImprovementRate: row.avgBIRPercent,
                avgVocalToneImprovementRate: row.avgVIRPercent,
                avgWordPowerImprovementRate: row.avgWIRPercent,
                overallEngagementScore: row.totalVideos > 0 ? 100 : 0,
                completionRate: row.totalVideos > 0 ? 100 : 0
              },
              metadata: {
                calculatedAt: new Date(),
                calculatedBy: 'trigger-system',
                version: 3,
                dataSource: 'business-wise-data-calculator',
                isActive: true,
                dataPointsUsed: row.totalVideos
              }
            };

            // Check if metrics already exist for this business unit and period
            const existingMetrics = await businessMetrics.findOne({
              businessId: metrics.businessId,
              'periodInfo.periodType': metrics.periodInfo.periodType,
              corporate_account_id: metrics.corporate_account_id
            });

            if (existingMetrics) {
              await businessMetrics.updateOne(
                { _id: existingMetrics._id },
                { $set: metrics }
              );
              console.log(`Updated metrics for business unit: ${row.businessCode}`);
            } else {
              const insertResult = await businessMetrics.insertOne(metrics);
              console.log(`Inserted new metrics for business unit: ${row.businessCode}, ID: ${insertResult.insertedId}`);
            }
          }
          
          console.log(`✅ Successfully stored metrics for ${result.data.length} business units`);
        } catch (dbError) {
          console.error('❌ Error storing business metrics in database:', dbError);
          return { success: false, error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}` };
        }
      }

      if (result.success) {
        console.log('✅ Business metrics calculation completed:', result.message);
        return { success: true, data: result };
      } else {
        console.error('❌ Business metrics calculation failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error triggering business metrics calculation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Trigger batch calculation for all business units
   */
  async triggerBatchCalculation(options: {
    periodType?: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all-time';
    forceRecalculate?: boolean;
    accountId?: string;
  } = {}) {
    try {
      console.log('🚀 Triggering batch business metrics calculation...');

      // For batch calculation, we still need to use the API endpoint that handles multiple business units
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/business-metrics/calculate-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': options.accountId || 'default'
        },
        body: JSON.stringify({
          periodType: options.periodType || 'all-time',
          forceRecalculate: options.forceRecalculate || false
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Batch business metrics calculation completed');
        return { success: true, data: result };
      } else {
        const error = await response.json();
        console.error('❌ Batch business metrics calculation failed:', error);
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('❌ Error triggering batch calculation:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Schedule automatic business metrics calculation
   */
  scheduleCalculation(cronExpression: string, options: {
    name: string;
    region?: string;
    zone?: string;
    batch?: string;
    branch?: string;
    businessCode?: string;
    periodType?: 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'all-time';
    forceRecalculate?: boolean;
    accountId?: string;
  }) {
    // Stop existing job if it exists
    this.stopScheduledCalculation(options.name);

    const job = cron.schedule(cronExpression, async () => {
      console.log(`⏰ Running scheduled business metrics calculation: ${options.name}`);
      await this.triggerCalculation(options);
    });

    this.cronJobs.set(options.name, job);
    console.log(`📅 Scheduled business metrics calculation: ${options.name} (${cronExpression})`);

    return job;
  }

  /**
   * Stop a scheduled calculation
   */
  stopScheduledCalculation(name: string) {
    const job = this.cronJobs.get(name);
    if (job) {
      job.stop();
      this.cronJobs.delete(name);
      console.log(`🛑 Stopped scheduled calculation: ${name}`);
    }
  }

  /**
   * Setup default scheduled calculations
   */
  setupDefaultSchedules() {
    // Daily calculation at 2 AM
    this.scheduleCalculation('0 2 * * *', {
      name: 'daily-calculation',
      periodType: 'all-time',
      forceRecalculate: false
    });

    // Weekly calculation every Monday at 3 AM
    this.scheduleCalculation('0 3 * * 1', {
      name: 'weekly-calculation',
      periodType: 'weekly',
      forceRecalculate: true
    });

    // Monthly calculation on 1st at 4 AM
    this.scheduleCalculation('0 4 1 * *', {
      name: 'monthly-calculation',
      periodType: 'monthly',
      forceRecalculate: true
    });

    console.log('📅 Default business metrics schedules activated');
  }

  /**
   * Stop all scheduled calculations
   */
  stopAllSchedules() {
    for (const [name, job] of this.cronJobs) {
      job.stop();
      console.log(`🛑 Stopped scheduled calculation: ${name}`);
    }
    this.cronJobs.clear();
  }

  /**
   * Get status of scheduled jobs
   */
  getScheduledJobsStatus() {
    const jobs = [];
    for (const [name] of this.cronJobs) {
      jobs.push({
        name,
        running: true, // Job is scheduled and active
        scheduled: true
      });
    }
    return {
      totalJobs: jobs.length,
      jobs,
      isRunning: this.isRunning
    };
  }
}

// Export singleton instance
export const businessMetricsTrigger = new BusinessMetricsTriggerService();

// Export convenience functions
export const triggerBusinessMetricsCalculation = (options?: Parameters<BusinessMetricsTriggerService['triggerCalculation']>[0]) =>
  businessMetricsTrigger.triggerCalculation(options);

export const triggerBatchBusinessMetricsCalculation = (options?: Parameters<BusinessMetricsTriggerService['triggerBatchCalculation']>[0]) =>
  businessMetricsTrigger.triggerBatchCalculation(options);

export const scheduleBusinessMetricsCalculation = (cronExpression: string, options: Parameters<BusinessMetricsTriggerService['scheduleCalculation']>[1]) =>
  businessMetricsTrigger.scheduleCalculation(cronExpression, options);
