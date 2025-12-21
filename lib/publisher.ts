import { BookMetadata, OutputData, BookWithHistory, OutputDataWithHistory } from './types';
import { readMetadata, writeOutput, readOutputWithHistory } from './data-manager';

/**
 * Publisher module for processing metadata and creating sorted output
 * Sorts books by Best Sellers Rank (lowest first = best performing)
 */

/**
 * Sorts books by BSR with special handling for missing BSR values
 */
function sortBooksByBSR(books: BookMetadata[]): BookMetadata[] {
  return books.sort((a, b) => {
    // Handle missing BSR (0 or null) - put them at the bottom
    if (a.bestSellersRank === 0 && b.bestSellersRank === 0) {
      return 0; // Both missing, keep original order
    }
    if (a.bestSellersRank === 0) {
      return 1; // A missing, put at bottom
    }
    if (b.bestSellersRank === 0) {
      return -1; // B missing, put at bottom
    }
    
    // Normal sorting: lowest BSR first (best performing)
    return a.bestSellersRank - b.bestSellersRank;
  });
}

/**
 * Calculates statistics from the book metadata
 */
function calculateStatistics(books: BookMetadata[]): {
  totalBooks: number;
  validBooks: number;
  failedBooks: number;
} {
  const totalBooks = books.length;
  
  // Count books with errors
  const failedBooks = books.filter(book => book.error).length;
  
  // Valid books are those without errors (even if partial data)
  const validBooks = totalBooks - failedBooks;
  
  return {
    totalBooks,
    validBooks,
    failedBooks
  };
}

/**
 * Main publisher function that processes metadata and creates sorted output
 */
export async function publishLeaderboard(): Promise<void> {
  console.log('📊 Starting publisher module...\n');
  
  try {
    // Read the metadata
    const metadata = readMetadata();
    
    if (metadata.length === 0) {
      console.log('❌ No metadata found. Run the scraper first.');
      return;
    }
    
    console.log(`📚 Processing ${metadata.length} books...`);
    
    // Sort books by BSR
    const sortedBooks = sortBooksByBSR(metadata);
    
    // Calculate statistics
    const stats = calculateStatistics(metadata);
    
    // Create output data
    const output: OutputData = {
      books: sortedBooks,
      generatedAt: new Date().toISOString(),
      totalBooks: stats.totalBooks,
      validBooks: stats.validBooks,
      failedBooks: stats.failedBooks
    };
    
    // Write to output.json
    writeOutput(output);
    
    // Display results
    console.log('\n📊 Publisher Results:');
    console.log(`📚 Total books processed: ${stats.totalBooks}`);
    console.log(`✅ Valid books: ${stats.validBooks}`);
    console.log(`❌ Failed books: ${stats.failedBooks}`);
    console.log(`📁 Output saved to: data/output.json`);
    
    // Show top 5 books by BSR
    console.log('\n🏆 Top 5 Books by BSR (Best Performing):');
    sortedBooks.slice(0, 5).forEach((book, index) => {
      const rank = index + 1;
      const bsr = book.bestSellersRank === 0 ? 'No BSR' : `#${book.bestSellersRank.toLocaleString()}`;
      const errorFlag = book.error ? ' ⚠️' : '';
      console.log(`${rank}. ${book.title} by ${book.author} - BSR: ${bsr}${errorFlag}`);
    });
    
    // Show books with errors if any
    const booksWithErrors = sortedBooks.filter(book => book.error);
    if (booksWithErrors.length > 0) {
      console.log('\n⚠️ Books with errors:');
      booksWithErrors.forEach(book => {
        console.log(`   - ${book.title}: ${book.error}`);
      });
    }
    
    console.log('\n✅ Publisher module completed successfully!');
    
  } catch (error) {
    console.error('💥 Error in publisher module:', error);
    throw error;
  }
}

/**
 * Publisher function that works with historical data
 */
export async function publishLeaderboardWithHistory(): Promise<void> {
  console.log('📊 Starting publisher module with historical data...\n');
  
  try {
    // Read the historical data
    const outputWithHistory = readOutputWithHistory();
    
    if (outputWithHistory.books.length === 0) {
      console.log('❌ No historical data found. Run the scraper first.');
      return;
    }
    
    console.log(`📚 Processing ${outputWithHistory.books.length} books with historical data...`);
    
    // Display results
    console.log('\n📊 Publisher Results:');
    console.log(`📚 Total books processed: ${outputWithHistory.totalBooks}`);
    console.log(`✅ Valid books: ${outputWithHistory.validBooks}`);
    console.log(`❌ Failed books: ${outputWithHistory.failedBooks}`);
    console.log(`📁 Historical data available for ${outputWithHistory.books.length} books`);
    
    // Show top 5 books by BSR
    console.log('\n🏆 Top 5 Books by BSR (Best Performing):');
    outputWithHistory.books.slice(0, 5).forEach((book, index) => {
      const rank = index + 1;
      const bsr = book.bestSellersRank === 0 ? 'No BSR' : `#${book.bestSellersRank.toLocaleString()}`;
      const historyPoints = book.history.length;
      const errorFlag = book.error ? ' ⚠️' : '';
      console.log(`${rank}. ${book.title} by ${book.author} - BSR: ${bsr} (${historyPoints} data points)${errorFlag}`);
    });
    
    // Show books with errors if any
    const booksWithErrors = outputWithHistory.books.filter(book => book.error);
    if (booksWithErrors.length > 0) {
      console.log('\n⚠️ Books with errors:');
      booksWithErrors.forEach(book => {
        console.log(`   - ${book.title}: ${book.error}`);
      });
    }
    
    console.log('\n✅ Publisher module with historical data completed successfully!');
    
  } catch (error) {
    console.error('💥 Error in publisher module:', error);
    throw error;
  }
}

/**
 * Standalone function to run the publisher
 */
export async function main(): Promise<void> {
  try {
    await publishLeaderboardWithHistory();
  } catch (error) {
    console.error('💥 Fatal error in publisher:', error);
    process.exit(1);
  }
}

// Run the publisher if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 