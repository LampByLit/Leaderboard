#!/usr/bin/env node

/**
 * Main scraper script
 * Reads URLs from shared config and processes them to generate metadata.json
 */

import fs from 'fs';
import path from 'path';
import { scrapeBooks } from '../lib/scraper';
import { writeDataWithHistory } from '../lib/data-manager';
import { HARDCODED_URLS } from '../lib/config';

/**
 * Main scraping function
 */
async function main() {
  console.log('🚀 Starting Amazon book scraper...\n');
  
  try {
    // Use URLs from shared config
    const urls = HARDCODED_URLS;
    
    if (urls.length === 0) {
      console.log('❌ No URLs to scrape. Please add URLs to the HARDCODED_URLS array in lib/config.ts.');
      return;
    }
    
    console.log(`📚 Found ${urls.length} URLs to scrape`);
    console.log('⏳ Starting scraping process (this may take a while due to rate limiting)...\n');
    
    // Scrape all books
    const scrapedBooks = await scrapeBooks(urls);
    
    // Write results to metadata.json and historical.json
    writeDataWithHistory(scrapedBooks);
    
    // Summary
    const successful = scrapedBooks.filter(book => !book.error).length;
    const failed = scrapedBooks.filter(book => book.error).length;
    
    console.log('\n📊 Scraping Summary:');
    console.log(`✅ Successfully scraped: ${successful} books`);
    console.log(`❌ Failed to scrape: ${failed} books`);
    console.log(`📁 Results saved to: data/metadata.json and data/historical.json`);
    
    if (failed > 0) {
      console.log('\n⚠️  Failed books:');
      scrapedBooks
        .filter(book => book.error)
        .forEach(book => {
          console.log(`   - ${book.url}: ${book.error}`);
        });
    }
    
  } catch (error) {
    console.error('💥 Fatal error during scraping:', error);
    process.exit(1);
  }
}

// Run the scraper if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main }; 