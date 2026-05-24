/**
 * 🚀 App Startup Business Metrics Setup
 * Initializes scheduled business metrics calculations when the app starts
 */

import { businessMetricsTrigger } from '@/lib/services/business-metrics-trigger';

export function setupBusinessMetricsSchedules() {
  try {
    console.log('🎯 Setting up business metrics scheduled calculations...');

    // Setup default schedules
    businessMetricsTrigger.setupDefaultSchedules();

    console.log('✅ Business metrics schedules initialized successfully');

    // Graceful shutdown handling
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down business metrics schedules...');
      businessMetricsTrigger.stopAllSchedules();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('🛑 Shutting down business metrics schedules...');
      businessMetricsTrigger.stopAllSchedules();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to setup business metrics schedules:', error);
  }
}

// Auto-setup when this module is imported (during app startup)
if (typeof window === 'undefined') { // Only run on server-side
  // Delay setup to ensure all dependencies are loaded
  setTimeout(() => {
    setupBusinessMetricsSchedules();
  }, 5000); // 5 second delay
}
