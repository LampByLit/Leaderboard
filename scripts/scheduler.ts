#!/usr/bin/env node

/**
 * Scheduler script
 * Starts the daily scheduler that runs scraper + publisher at 00:00 UTC
 */

import { main as startScheduler } from '../lib/scheduler';

/**
 * Main function to start the scheduler
 */
async function main() {
  console.log('🚀 Starting Amazon book leaderboard scheduler...\n');
  
  try {
    startScheduler();
  } catch (error) {
    console.error('💥 Fatal error starting scheduler:', error);
    process.exit(1);
  }
}

// Run the scheduler if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main }; 