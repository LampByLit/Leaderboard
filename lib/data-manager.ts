import fs from 'fs';
import path from 'path';
import { BookMetadata, OutputData, BookWithHistory, OutputDataWithHistory, HistoricalDataPoint } from './types';

/**
 * Data manager for handling JSON file operations
 * Implements atomic file operations to prevent data corruption
 */

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Ensures the data directory exists
 */
function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Reads metadata from the metadata.json file
 */
export function readMetadata(): BookMetadata[] {
  ensureDataDirectory();
  const metadataPath = path.join(DATA_DIR, 'metadata.json');
  
  try {
    if (!fs.existsSync(metadataPath)) {
      return [];
    }
    
    const data = fs.readFileSync(metadataPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return [];
  }
}

/**
 * Reads historical data from the historical.json file
 */
export function readHistoricalData(): BookWithHistory[] {
  ensureDataDirectory();
  const historicalPath = path.join(DATA_DIR, 'historical.json');
  
  try {
    if (!fs.existsSync(historicalPath)) {
      return [];
    }
    
    const data = fs.readFileSync(historicalPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading historical data:', error);
    return [];
  }
}

/**
 * Merges new book data with existing historical data
 */
function mergeWithHistory(newBooks: BookMetadata[]): BookWithHistory[] {
  const existingHistory = readHistoricalData();
  const mergedBooks: BookWithHistory[] = [];
  
  for (const newBook of newBooks) {
    // Find existing book in history
    const existingBook = existingHistory.find(book => book.url === newBook.url);
    
    if (existingBook) {
      // Add new data point to existing history
      const newDataPoint: HistoricalDataPoint = {
        date: newBook.scrapedAt,
        bsr: newBook.bestSellersRank
      };
      
      const updatedHistory = [...existingBook.history, newDataPoint];
      
      // Keep only last 30 days of data to prevent file bloat
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredHistory = updatedHistory.filter(point => 
        new Date(point.date) >= thirtyDaysAgo
      );
      
      mergedBooks.push({
        ...newBook,
        history: filteredHistory
      });
    } else {
      // New book, create initial history
      const initialDataPoint: HistoricalDataPoint = {
        date: newBook.scrapedAt,
        bsr: newBook.bestSellersRank
      };
      
      mergedBooks.push({
        ...newBook,
        history: [initialDataPoint]
      });
    }
  }
  
  return mergedBooks;
}

/**
 * Writes metadata to the metadata.json file with atomic operation
 */
export function writeMetadata(metadata: BookMetadata[]): void {
  ensureDataDirectory();
  const metadataPath = path.join(DATA_DIR, 'metadata.json');
  const tempPath = `${metadataPath}.tmp`;
  
  try {
    // Write to temporary file first
    fs.writeFileSync(tempPath, JSON.stringify(metadata, null, 2));
    
    // Atomic move operation
    fs.renameSync(tempPath, metadataPath);
    
    console.log(`Successfully wrote ${metadata.length} book records to metadata.json`);
  } catch (error) {
    console.error('Error writing metadata:', error);
    
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    throw error;
  }
}

/**
 * Writes historical data to the historical.json file with atomic operation
 */
export function writeHistoricalData(booksWithHistory: BookWithHistory[]): void {
  ensureDataDirectory();
  const historicalPath = path.join(DATA_DIR, 'historical.json');
  const tempPath = `${historicalPath}.tmp`;
  
  try {
    // Write to temporary file first
    fs.writeFileSync(tempPath, JSON.stringify(booksWithHistory, null, 2));
    
    // Atomic move operation
    fs.renameSync(tempPath, historicalPath);
    
    console.log(`Successfully wrote historical data for ${booksWithHistory.length} books`);
  } catch (error) {
    console.error('Error writing historical data:', error);
    
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    throw error;
  }
}

/**
 * Writes both metadata and historical data atomically
 */
export function writeDataWithHistory(metadata: BookMetadata[]): void {
  const booksWithHistory = mergeWithHistory(metadata);
  writeMetadata(metadata);
  writeHistoricalData(booksWithHistory);
}

/**
 * Reads output data from the output.json file
 */
export function readOutput(): OutputData {
  ensureDataDirectory();
  const outputPath = path.join(DATA_DIR, 'output.json');
  
  try {
    if (!fs.existsSync(outputPath)) {
      return {
        books: [],
        generatedAt: '',
        totalBooks: 0,
        validBooks: 0,
        failedBooks: 0
      };
    }
    
    const data = fs.readFileSync(outputPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading output:', error);
    return {
      books: [],
      generatedAt: '',
      totalBooks: 0,
      validBooks: 0,
      failedBooks: 0
    };
  }
}

/**
 * Reads output data with history from the historical.json file
 */
export function readOutputWithHistory(): OutputDataWithHistory {
  const booksWithHistory = readHistoricalData();
  
  // Sort books by current BSR
  const sortedBooks = booksWithHistory.sort((a, b) => {
    if (a.bestSellersRank === 0 && b.bestSellersRank === 0) return 0;
    if (a.bestSellersRank === 0) return 1;
    if (b.bestSellersRank === 0) return -1;
    return a.bestSellersRank - b.bestSellersRank;
  });
  
  const totalBooks = sortedBooks.length;
  const failedBooks = sortedBooks.filter(book => book.error).length;
  const validBooks = totalBooks - failedBooks;
  
  return {
    books: sortedBooks,
    generatedAt: new Date().toISOString(),
    totalBooks,
    validBooks,
    failedBooks
  };
}

/**
 * Writes output data to the output.json file with atomic operation
 */
export function writeOutput(output: OutputData): void {
  ensureDataDirectory();
  const outputPath = path.join(DATA_DIR, 'output.json');
  const tempPath = `${outputPath}.tmp`;
  
  try {
    // Write to temporary file first
    fs.writeFileSync(tempPath, JSON.stringify(output, null, 2));
    
    // Atomic move operation
    fs.renameSync(tempPath, outputPath);
    
    console.log(`Successfully wrote output data with ${output.books.length} books`);
  } catch (error) {
    console.error('Error writing output:', error);
    
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    throw error;
  }
}

/**
 * Appends a new book record to the metadata file
 */
export function appendBookMetadata(book: BookMetadata): void {
  const existingMetadata = readMetadata();
  
  // Check if this URL already exists and update it, otherwise append
  const existingIndex = existingMetadata.findIndex(b => b.url === book.url);
  
  if (existingIndex >= 0) {
    existingMetadata[existingIndex] = book;
    console.log(`Updated existing record for: ${book.title}`);
  } else {
    existingMetadata.push(book);
    console.log(`Added new record for: ${book.title}`);
  }
  
  writeMetadata(existingMetadata);
} 