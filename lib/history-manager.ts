import fs from 'fs';
import path from 'path';
import { BookMetadata } from './types';

/**
 * Historical data manager for BSR tracking over time
 * Stores daily snapshots and maintains a 14-day rolling window
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

interface DailySnapshot {
  date: string; // ISO date string (YYYY-MM-DD)
  books: Array<{
    url: string;
    title: string;
    author: string;
    bsr: number;
    coverArtUrl: string;
  }>;
}

interface HistoryData {
  dailySnapshots: DailySnapshot[];
  lastUpdated: string;
}

/**
 * Ensures the data directory exists
 */
function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Reads the history data from file
 */
export function readHistory(): HistoryData {
  ensureDataDirectory();
  
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return {
        dailySnapshots: [],
        lastUpdated: new Date().toISOString()
      };
    }
    
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading history:', error);
    return {
      dailySnapshots: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Writes history data to file with atomic operation
 */
export function writeHistory(history: HistoryData): void {
  ensureDataDirectory();
  const tempPath = `${HISTORY_FILE}.tmp`;
  
  try {
    // Write to temporary file first
    fs.writeFileSync(tempPath, JSON.stringify(history, null, 2));
    
    // Atomic move operation
    fs.renameSync(tempPath, HISTORY_FILE);
    
    console.log(`Successfully wrote history data with ${history.dailySnapshots.length} daily snapshots`);
  } catch (error) {
    console.error('Error writing history:', error);
    
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    throw error;
  }
}

/**
 * Adds a new daily snapshot to the history
 */
export function addDailySnapshot(books: BookMetadata[]): void {
  const history = readHistory();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Check if we already have data for today
  const existingIndex = history.dailySnapshots.findIndex(snapshot => snapshot.date === today);
  
  // Create snapshot data (only essential fields for the graph)
  const snapshotData = books.map(book => ({
    url: book.url,
    title: book.title,
    author: book.author,
    bsr: book.bestSellersRank,
    coverArtUrl: book.coverArtUrl
  }));
  
  if (existingIndex >= 0) {
    // Update existing snapshot
    history.dailySnapshots[existingIndex] = {
      date: today,
      books: snapshotData
    };
    console.log(`Updated existing snapshot for ${today}`);
  } else {
    // Add new snapshot
    history.dailySnapshots.push({
      date: today,
      books: snapshotData
    });
    console.log(`Added new snapshot for ${today}`);
  }
  
  // Clean up old data (keep only last 14 days)
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 14);
  const cutoffDateString = cutoffDate.toISOString().split('T')[0];
  
  history.dailySnapshots = history.dailySnapshots.filter(
    snapshot => snapshot.date >= cutoffDateString
  );
  
  // Sort snapshots by date (oldest first)
  history.dailySnapshots.sort((a, b) => a.date.localeCompare(b.date));
  
  // Update last updated timestamp
  history.lastUpdated = new Date().toISOString();
  
  writeHistory(history);
}

/**
 * Gets the last N days of history data
 */
export function getHistoryData(days: number = 14): HistoryData {
  const history = readHistory();
  
  if (days <= 0) {
    return history;
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffDateString = cutoffDate.toISOString().split('T')[0];
  
  const filteredHistory = {
    ...history,
    dailySnapshots: history.dailySnapshots.filter(
      snapshot => snapshot.date >= cutoffDateString
    )
  };
  
  return filteredHistory;
}

/**
 * Gets all unique books that have appeared in the history
 */
export function getAllBooksInHistory(): Array<{ url: string; title: string; author: string; coverArtUrl: string }> {
  const history = readHistory();
  const bookMap = new Map<string, { url: string; title: string; author: string; coverArtUrl: string }>();
  
  history.dailySnapshots.forEach(snapshot => {
    snapshot.books.forEach(book => {
      if (!bookMap.has(book.url)) {
        bookMap.set(book.url, {
          url: book.url,
          title: book.title,
          author: book.author,
          coverArtUrl: book.coverArtUrl
        });
      }
    });
  });
  
  return Array.from(bookMap.values());
}

/**
 * Gets BSR data for a specific book over time
 */
export function getBookBSRHistory(bookUrl: string, days: number = 14): Array<{ date: string; bsr: number | null }> {
  const history = getHistoryData(days);
  const bookData: Array<{ date: string; bsr: number | null }> = [];
  
  history.dailySnapshots.forEach(snapshot => {
    const book = snapshot.books.find(b => b.url === bookUrl);
    bookData.push({
      date: snapshot.date,
      bsr: book ? book.bsr : null
    });
  });
  
  return bookData;
}
