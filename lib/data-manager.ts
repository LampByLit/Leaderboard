import fs from 'fs';
import path from 'path';
import { BookMetadata, OutputData } from './types';

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