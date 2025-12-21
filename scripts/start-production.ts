#!/usr/bin/env node

/**
 * Production start script for Railway
 * Runs both the Next.js app and the scheduler
 */

import { spawn } from 'child_process';
import { startScheduler, runCycleNow } from '../lib/scheduler';

/**
 * Starts the production environment
 */
async function startProduction() {
  console.log('🚀 Starting production environment...');
  
  try {
    // Start the Next.js app first
    console.log('🌐 Starting Next.js application...');
    
    const nextApp = spawn('npm', ['start'], {
      stdio: 'pipe', // Change to pipe so we can listen to output
      shell: true
    });
    
    let appReady = false;
    
    // Listen for Next.js startup messages
    nextApp.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log(output.trim());
      
      // Check if Next.js is ready (listening on port)
      if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
        if (!appReady) {
          appReady = true;
          console.log('✅ Next.js app is ready! Starting scheduler...');
          
          // Start the scheduler only after app is ready
          startScheduler();
          
          // Run an immediate cycle to populate data
          console.log('🚀 Running immediate cycle to populate data...');
          runCycleNow().catch(error => {
            console.error('⚠️ Immediate cycle failed, but scheduler will continue:', error);
          });
        }
      }
    });
    
    nextApp.stderr?.on('data', (data) => {
      console.error(data.toString().trim());
    });
    
    // Fallback: start scheduler after 30 seconds if app doesn't signal ready
    setTimeout(() => {
      if (!appReady) {
        console.log('⏰ Fallback: Starting scheduler after 30s timeout...');
        startScheduler();
        
        // Also run immediate cycle in fallback
        console.log('🚀 Running immediate cycle (fallback)...');
        runCycleNow().catch(error => {
          console.error('⚠️ Immediate cycle failed, but scheduler will continue:', error);
        });
      }
    }, 30000);
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down gracefully...');
      nextApp.kill('SIGINT');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down gracefully...');
      nextApp.kill('SIGTERM');
      process.exit(0);
    });
    
    // Handle Next.js app exit
    nextApp.on('exit', (code) => {
      console.log(`🌐 Next.js app exited with code ${code}`);
      process.exit(code || 0);
    });
    
    // Handle Next.js app errors
    nextApp.on('error', (error) => {
      console.error('💥 Next.js app error:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('💥 Fatal error starting production:', error);
    process.exit(1);
  }
}

// Run production start if this file is executed directly
if (require.main === module) {
  startProduction().catch(console.error);
}

export { startProduction }; 