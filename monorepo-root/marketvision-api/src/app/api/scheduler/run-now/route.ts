import { NextResponse } from 'next/server';

import parsingScheduler from '../../../services/parsingScheduler';

export async function POST() {
  try {
    await parsingScheduler.runParsingNow();
    
    return NextResponse.json({ 
      message: 'Парсинг запущен',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error running parsing now:', error);
    return NextResponse.json(
      { error: 'Failed to run parsing' },
      { status: 500 }
    );
  }
} 