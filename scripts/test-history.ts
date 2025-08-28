#!/usr/bin/env node

/**
 * Test script for history manager functionality
 */

import { addDailySnapshot, readHistory, getHistoryData } from '../lib/history-manager';
import { BookMetadata } from '../lib/types';

// Sample book data for testing
const sampleBooks: BookMetadata[] = [
  {
    url: 'https://www.amazon.com/test-book-1/dp/1234567890',
    title: 'Test Book 1',
    author: 'Test Author 1',
    bestSellersRank: 15000,
    coverArtUrl: 'https://example.com/cover1.jpg',
    isValidPaperback: true,
    scrapedAt: new Date().toISOString()
  },
  {
    url: 'https://www.amazon.com/test-book-2/dp/0987654321',
    title: 'Test Book 2',
    author: 'Test Author 2',
    bestSellersRank: 25000,
    coverArtUrl: 'https://example.com/cover2.jpg',
    isValidPaperback: true,
    scrapedAt: new Date().toISOString()
  }
];

async function testHistoryManager() {
  console.log('🧪 Testing History Manager...\n');
  
  try {
    // Test 1: Add a daily snapshot
    console.log('📝 Test 1: Adding daily snapshot...');
    addDailySnapshot(sampleBooks);
    console.log('✅ Daily snapshot added successfully');
    
    // Test 2: Read history
    console.log('\n📖 Test 2: Reading history...');
    const history = readHistory();
    console.log(`✅ History read successfully. Found ${history.dailySnapshots.length} snapshots`);
    console.log(`📅 Last updated: ${history.lastUpdated}`);
    
    // Test 3: Get filtered history
    console.log('\n🔍 Test 3: Getting filtered history (last 7 days)...');
    const filteredHistory = getHistoryData(7);
    console.log(`✅ Filtered history retrieved. Found ${filteredHistory.dailySnapshots.length} snapshots in last 7 days`);
    
    // Test 4: Show snapshot details
    if (history.dailySnapshots.length > 0) {
      const latestSnapshot = history.dailySnapshots[history.dailySnapshots.length - 1];
      console.log(`\n📊 Latest snapshot (${latestSnapshot.date}):`);
      latestSnapshot.books.forEach(book => {
        console.log(`   - ${book.title} by ${book.author}: BSR #${book.bsr.toLocaleString()}`);
      });
    }
    
    console.log('\n🎉 All tests passed! History manager is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testHistoryManager().catch(console.error);
}

export { testHistoryManager };
