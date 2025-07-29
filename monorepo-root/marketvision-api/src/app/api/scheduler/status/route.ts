import { NextResponse } from 'next/server';

import parsingScheduler from '../../../services/parsingScheduler';

export async function GET() {
  try {
    const status = parsingScheduler.getStatus();
    
    return NextResponse.json(status, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching scheduler status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduler status' },
      { status: 500 }
    );
  }
} 