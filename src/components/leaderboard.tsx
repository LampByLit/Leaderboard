'use client';

import { useState } from 'react';
import { BookCard } from './book-card';
import { OutputDataWithHistory } from '@/lib/types';

interface LeaderboardProps {
  data: OutputDataWithHistory;
}

export function Leaderboard({ data }: LeaderboardProps) {
  const { books, generatedAt, totalBooks, validBooks, failedBooks } = data;
  const [isRunningCycle, setIsRunningCycle] = useState(false);

  const handleRunCycle = async () => {
    if (isRunningCycle) return;
    
    setIsRunningCycle(true);
    try {
      const response = await fetch('/api/cycle', {
        method: 'POST',
      });
      
      if (response.ok) {
        // Reload the page after a short delay to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        console.error('Failed to run cycle');
      }
    } catch (error) {
      console.error('Error running cycle:', error);
    } finally {
      setIsRunningCycle(false);
    }
  };

  // Calculate historical data stats
  const booksWithHistory = books.filter(book => book.history && book.history.length > 1);
  const totalDataPoints = books.reduce((sum, book) => sum + book.history.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-center mb-4">
          <a 
            href="https://lampbylit.com/magazine/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <img 
              src="/logo01.png" 
              alt="Lamp by Lit Magazine" 
              className="h-16 md:h-20"
            />
          </a>
        </div>
        <p className="text-gray-600 text-justify max-w-4xl mx-auto leading-relaxed text-sm">
          This leaderboard uses several exhaustive methods to scrape Amazon paperback links and sort them by Best Sellers Rank. If you want to add your book to the leaderboard,{' '}
          <a 
            href="https://x.com/recapitul8r" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 underline transition-colors duration-200"
          >
            contact me
          </a>
          . This leaderboard will automatically update once daily. A stable version of this tool can be downloaded from{' '}
          <a 
            href="https://github.com/LampByLit/Leaderboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 underline transition-colors duration-200"
          >
            GitHub
          </a>
          .
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="material-card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-sm">📚</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Books</p>
              <p className="text-2xl font-bold text-gray-900">{totalBooks}</p>
            </div>
          </div>
        </div>

        <div className="material-card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Valid Books</p>
              <p className="text-2xl font-bold text-gray-900">{validBooks}</p>
            </div>
          </div>
        </div>

        <div className="material-card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">✗</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Failed Books</p>
              <p className="text-2xl font-bold text-gray-900">{failedBooks}</p>
            </div>
          </div>
        </div>

        <div className="material-card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">📊</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">With History</p>
              <p className="text-2xl font-bold text-gray-900">{booksWithHistory.length}</p>
            </div>
          </div>
        </div>

        <div className="material-card p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">🕒</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(generatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Cycle Button - Hidden for now */}
      {/* 
      <div className="mb-8 text-center">
        <button
          onClick={handleRunCycle}
          disabled={isRunningCycle}
          className="material-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunningCycle ? '🔄 Running Cycle...' : '🔄 Run Manual Cycle'}
        </button>
        <p className="text-sm text-gray-500 mt-2">
          Manually trigger scraping and publishing cycle
        </p>
      </div>
      */}

      {/* Books Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {books.map((book, index) => (
          <BookCard key={book.url} book={book} rank={index + 1} />
        ))}
      </div>

      {/* Empty State */}
      {books.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try running the scraper to collect book data.
          </p>
        </div>
      )}
    </div>
  );
} 