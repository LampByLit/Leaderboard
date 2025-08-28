import { NextRequest, NextResponse } from 'next/server';
import { runDailyCycle } from '@/lib/cycle';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 API: Starting test cycle...');
    
    // Run the cycle
    await runDailyCycle();
    
    console.log('✅ API: Test cycle completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test cycle completed successfully. Check data/history.json for historical data.' 
    });
    
  } catch (error) {
    console.error('❌ API: Test cycle failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Test cycle failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
