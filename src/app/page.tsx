import { Suspense } from 'react';
import { Leaderboard } from '@/components/leaderboard';
import { HistoricalChart } from '@/components/historical-chart';
import { LoadingSkeleton } from '@/components/loading';
import { OutputDataWithHistory } from '@/lib/types';
import { readOutputWithHistory } from '@/lib/data-manager';

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getLeaderboardData(): Promise<OutputDataWithHistory> {
  try {
    console.log('🔍 Debug: Loading leaderboard data with history...');
    
    // Use the new function that reads historical data
    const data = readOutputWithHistory();
    
    console.log('✅ Debug: Successfully loaded data with', data.books.length, 'books');
    console.log('📊 Debug: Books with history:', data.books.filter(book => book.history.length > 1).length);
    
    return data;
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

export default async function Home() {
  const data = await getLeaderboardData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSkeleton />}>
        <Leaderboard data={data} />
        
        {/* Historical Chart Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HistoricalChart books={data.books} />
        </div>
      </Suspense>
    </div>
  );
}
