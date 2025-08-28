import { NextRequest, NextResponse } from 'next/server';
import { runDailyCycle } from '@/lib/cycle';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API: Starting manual cycle...');
    
    // Run the cycle
    await runDailyCycle();
    
    console.log('✅ API: Manual cycle completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cycle completed successfully' 
    });
    
  } catch (error) {
    console.error('❌ API: Manual cycle failed:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Cycle failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 