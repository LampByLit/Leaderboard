import { Suspense } from 'react';
import { Leaderboard } from '@/components/leaderboard';
import { LoadingSkeleton } from '@/components/loading';
import { BSRHistoryChart } from '@/components/bsr-history-chart';
import { OutputData } from '@/lib/types';
import fs from 'fs';
import path from 'path';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getLeaderboardData(): Promise<OutputData> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'output.json');
    console.log('🔍 Debug: Looking for data file at:', dataPath);
    
    // Check if file exists
    if (!fs.existsSync(dataPath)) {
      console.log('❌ Debug: Data file does not exist');
      return {
        books: [],
        generatedAt: new Date().toISOString(),
        totalBooks: 0,
        validBooks: 0,
        failedBooks: 0,
      };
    }
    
    const data = fs.readFileSync(dataPath, 'utf-8');
    const parsedData = JSON.parse(data);
    console.log('✅ Debug: Successfully loaded data with', parsedData.books.length, 'books');
    return parsedData;
  } catch (error) {
    console.error('❌ Error loading leaderboard data:', error);
    return {
      books: [],
      generatedAt: new Date().toISOString(),
      totalBooks: 0,
      validBooks: 0,
      failedBooks: 0,
    };
  }
}

async function getHistoryData() {
  try {
    const historyPath = path.join(process.cwd(), 'data', 'history.json');
    console.log('🔍 Debug: Looking for history file at:', historyPath);
    
    // Check if file exists
    if (!fs.existsSync(historyPath)) {
      console.log('❌ Debug: History file does not exist');
      return {
        dailySnapshots: [],
        lastUpdated: new Date().toISOString()
      };
    }
    
    const data = fs.readFileSync(historyPath, 'utf-8');
    const parsedData = JSON.parse(data);
    console.log('✅ Debug: Successfully loaded history with', parsedData.dailySnapshots.length, 'snapshots');
    return parsedData;
  } catch (error) {
    console.error('❌ Error loading history data:', error);
    return {
      dailySnapshots: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

export default async function Home() {
  const data = await getLeaderboardData();
  const historyData = await getHistoryData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSkeleton />}>
        <Leaderboard data={data} />
      </Suspense>
      
      {/* Historical BSR Chart */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<LoadingSkeleton />}>
          <BSRHistoryChart historyData={historyData} />
        </Suspense>
      </div>
    </div>
  );
}
