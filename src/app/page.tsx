import { Suspense } from 'react';
import { Leaderboard } from '@/components/leaderboard';
import { LoadingSkeleton } from '@/components/loading';
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

export default async function Home() {
  const data = await getLeaderboardData();

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<LoadingSkeleton />}>
        <Leaderboard data={data} />
      </Suspense>
    </div>
  );
}
