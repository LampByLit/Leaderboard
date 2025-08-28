import * as cron from 'node-cron';
import { runDailyCycle } from './cycle';

/**
 * Scheduler module for running daily cycles
 * Uses node-cron to schedule the scraper + publisher cycle
 */

let cronJob: cron.ScheduledTask | null = null;

/**
 * Starts the daily scheduler
 * Runs the cycle every day at 00:00 UTC
 */
export function startScheduler(): void {
  console.log('⏰ Starting daily scheduler...');
  console.log('📅 Scheduled to run daily at 00:00 UTC');
  
  // Schedule the job to run daily at 00:00 UTC
  // Cron format: '0 0 * * *' = every day at midnight UTC
  cronJob = cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Scheduled daily cycle triggered');
    
    try {
      await runDailyCycle();
      console.log('✅ Scheduled cycle completed successfully');
    } catch (error) {
      console.error('💥 Scheduled cycle failed:', error);
      // Don't throw here - let the scheduler continue running
    }
  }, {
    timezone: 'UTC' // Explicitly set UTC timezone
  });
  
  console.log('✅ Scheduler started successfully');
  
  // Log when the next run will be
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  nextRun.setUTCHours(0, 0, 0, 0);
  
  const timeUntilNext = nextRun.getTime() - now.getTime();
  const hoursUntilNext = Math.floor(timeUntilNext / (1000 * 60 * 60));
  const minutesUntilNext = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
  
  console.log(`⏰ Next run in ${hoursUntilNext}h ${minutesUntilNext}m`);
}

/**
 * Stops the scheduler
 */
export function stopScheduler(): void {
  if (cronJob) {
    console.log('⏹️ Stopping scheduler...');
    cronJob.stop();
    cronJob = null;
    console.log('✅ Scheduler stopped');
  }
}

/**
 * Gets the current scheduler status
 */
export function getSchedulerStatus(): { isRunning: boolean; nextRun?: Date } {
  if (!cronJob) {
    return { isRunning: false };
  }
  
  const now = new Date();
  const nextRun = new Date(now);
  nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  nextRun.setUTCHours(0, 0, 0, 0);
  
  return {
    isRunning: true,
    nextRun
  };
}

/**
 * Runs the cycle immediately (for testing or manual execution)
 */
export async function runCycleNow(): Promise<void> {
  console.log('🚀 Running cycle immediately...');
  try {
    await runDailyCycle();
    console.log('✅ Manual cycle completed successfully');
  } catch (error) {
    console.error('💥 Manual cycle failed:', error);
    throw error;
  }
}

/**
 * Main function to start the scheduler
 */
export function main(): void {
  try {
    startScheduler();
    
    // Keep the process alive
    console.log('🔄 Scheduler is running. Press Ctrl+C to stop.');
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      stopScheduler();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      stopScheduler();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('💥 Fatal error starting scheduler:', error);
    process.exit(1);
  }
}

// Run the scheduler if this file is executed directly
if (require.main === module) {
  main();
} 