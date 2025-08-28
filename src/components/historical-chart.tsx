'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BookWithHistory, HistoricalDataPoint } from '@/lib/types';

interface HistoricalChartProps {
  books: BookWithHistory[];
}

interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export function HistoricalChart({ books }: HistoricalChartProps) {
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('7d');

  // Generate colors for different books
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Filter books that have historical data
  const booksWithHistory = useMemo(() => {
    return books.filter(book => book.history && book.history.length > 1);
  }, [books]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (booksWithHistory.length === 0) return [];

    // Get all unique dates from all books
    const allDates = new Set<string>();
    booksWithHistory.forEach(book => {
      book.history.forEach(point => {
        allDates.add(point.date.split('T')[0]); // Just the date part
      });
    });

    // Sort dates
    const sortedDates = Array.from(allDates).sort();

    // Filter by time range
    const now = new Date();
    const daysAgo = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
    
    const filteredDates = sortedDates.filter(date => 
      new Date(date) >= cutoffDate
    );

    // Create data points for each date
    return filteredDates.map(date => {
      const dataPoint: ChartDataPoint = { date };
      
      booksWithHistory.forEach((book, index) => {
        const historyPoint = book.history.find(point => 
          point.date.startsWith(date)
        );
        
                 if (historyPoint && historyPoint.bsr > 0) {
           // Transform BSR to performance score: lower BSR = higher performance score
           // Use a large number to invert the scale so better performance appears higher
           const maxBSR = 10000000; // 10 million as baseline
           dataPoint[book.title] = maxBSR - historyPoint.bsr;
         }
      });
      
      return dataPoint;
    });
  }, [booksWithHistory, timeRange]);

  // Auto-select top 5 books if none selected
  const displayBooks = useMemo(() => {
    if (selectedBooks.length === 0) {
      return booksWithHistory.slice(0, 5);
    }
    return booksWithHistory.filter(book => selectedBooks.includes(book.title));
  }, [booksWithHistory, selectedBooks]);

  const handleBookToggle = (bookTitle: string) => {
    setSelectedBooks(prev => 
      prev.includes(bookTitle)
        ? prev.filter(title => title !== bookTitle)
        : [...prev, bookTitle]
    );
  };

  const formatBSR = (value: number) => {
    // Convert performance score back to BSR for display
    const maxBSR = 10000000;
    const actualBSR = maxBSR - value;
    return actualBSR.toLocaleString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (booksWithHistory.length === 0) {
    return (
      <div className="material-card p-8 text-center">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Historical Data Available</h3>
        <p className="text-gray-500">
          Historical tracking will begin after the next scraping cycle.
        </p>
      </div>
    );
  }

  return (
    <div className="material-card p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">BSR Performance Trends</h2>
        
        {/* Time Range Selector */}
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <div className="flex space-x-2">
            {(['7d', '14d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Book Selection */}
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700 block mb-2">Select Books to Display:</span>
          <div className="flex flex-wrap gap-2">
            {booksWithHistory.map((book, index) => (
                             <button
                 key={book.title}
                 onClick={() => handleBookToggle(book.title)}
                 className={`px-3 py-1 text-sm rounded-md transition-colors ${
                   displayBooks.some(b => b.title === book.title)
                     ? 'bg-primary-600 text-white'
                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                 }`}
               >
                 <span className="truncate max-w-32">{book.title}</span>
               </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke="#6B7280"
              fontSize={12}
            />
                         <YAxis 
               stroke="#6B7280"
               fontSize={12}
               tickFormatter={formatBSR}
               domain={['dataMin', 'dataMax']}
               label={{ value: 'BSR', angle: -90, position: 'insideLeft' }}
             />
            <Tooltip 
              formatter={(value: number) => [formatBSR(value), 'BSR']}
              labelFormatter={formatDate}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Legend />
            {displayBooks.map((book, index) => (
              <Line
                key={book.title}
                type="monotone"
                dataKey={book.title}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

             {/* Chart Info */}
       <div className="mt-4 text-sm text-gray-500 text-center">
         <p>
           <strong>Higher lines = Better performance (lower BSR)</strong>. 
           Lines going up over time indicate improving book performance.
         </p>
       </div>
    </div>
  );
}
