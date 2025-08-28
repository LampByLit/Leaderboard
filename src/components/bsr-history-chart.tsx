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
import Image from 'next/image';

interface BookData {
  url: string;
  title: string;
  author: string;
  coverArtUrl: string;
}

interface HistoryData {
  dailySnapshots: Array<{
    date: string;
    books: Array<{
      url: string;
      title: string;
      author: string;
      bsr: number;
      coverArtUrl: string;
    }>;
  }>;
  lastUpdated: string;
}

interface BSRHistoryChartProps {
  historyData: HistoryData;
}

// Color palette for the chart lines (25 distinct colors)
const CHART_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
  '#a6cee3', '#fb9a99', '#fdbf6f', '#cab2d6', '#ff9896',
  '#f0027f', '#386cb0', '#fdc086', '#beaed4', '#7fc97f',
  '#bf5b17', '#666666', '#fb8072', '#80b1d3', '#fdb462'
];

export function BSRHistoryChart({ historyData }: BSRHistoryChartProps) {
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [showAllBooks, setShowAllBooks] = useState(true);

  // Transform data for Recharts
  const chartData = useMemo(() => {
    if (!historyData.dailySnapshots.length) return [];

    return historyData.dailySnapshots.map(snapshot => {
      const dataPoint: any = {
        date: new Date(snapshot.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        fullDate: snapshot.date
      };

      // Add BSR data for each book
      snapshot.books.forEach(book => {
        dataPoint[book.url] = book.bsr;
      });

      return dataPoint;
    });
  }, [historyData]);

  // Get all unique books from history
  const allBooks = useMemo(() => {
    const bookMap = new Map<string, BookData>();
    
    historyData.dailySnapshots.forEach(snapshot => {
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
  }, [historyData]);

  // Initialize selected books with all books if none selected
  useMemo(() => {
    if (selectedBooks.size === 0 && allBooks.length > 0) {
      setSelectedBooks(new Set(allBooks.map(book => book.url)));
    }
  }, [allBooks, selectedBooks.size]);

  const handleBookToggle = (bookUrl: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(bookUrl)) {
      newSelected.delete(bookUrl);
    } else {
      newSelected.add(bookUrl);
    }
    setSelectedBooks(newSelected);
  };

  const handleShowAllToggle = () => {
    if (showAllBooks) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(allBooks.map(book => book.url)));
    }
    setShowAllBooks(!showAllBooks);
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {entry.name}
                </span>
                <span className="text-sm text-gray-600">
                  BSR: {entry.value?.toLocaleString() || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = () => (
    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">Books in Chart</h3>
        <button
          onClick={handleShowAllToggle}
          className="text-sm text-primary-600 hover:text-primary-700 underline"
        >
          {showAllBooks ? 'Hide All' : 'Show All'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
        {allBooks.map((book, index) => (
          <div
            key={book.url}
            className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors ${
              selectedBooks.has(book.url) 
                ? 'bg-primary-50 border border-primary-200' 
                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => handleBookToggle(book.url)}
          >
            <div className="flex-shrink-0">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
              />
            </div>
            <div className="flex-shrink-0 w-8 h-10 relative">
              <Image
                src={book.coverArtUrl}
                alt={book.title}
                fill
                className="object-cover rounded"
                sizes="32px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {book.title}
              </p>
              <p className="text-xs text-gray-600 truncate">
                by {book.author}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (!historyData.dailySnapshots.length) {
    return (
      <div className="material-card p-8 text-center">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Historical Data</h3>
        <p className="text-gray-600">
          Historical BSR data will appear here after the first daily cycle runs.
        </p>
      </div>
    );
  }

  return (
    <div className="material-card p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          BSR History (Last 14 Days)
        </h2>
        <p className="text-gray-600">
          Track how each book's Best Sellers Rank has changed over time. Lower numbers indicate better performance.
        </p>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => value.toLocaleString()}
              domain={['dataMin', 'dataMax']}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Render lines for selected books */}
            {allBooks.map((book, index) => {
              if (!selectedBooks.has(book.url)) return null;
              
              return (
                <Line
                  key={book.url}
                  type="monotone"
                  dataKey={book.url}
                  name={book.title}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <CustomLegend />
    </div>
  );
}
