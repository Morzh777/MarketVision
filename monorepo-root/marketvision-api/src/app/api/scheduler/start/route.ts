import { NextResponse } from 'next/server';

import parsingScheduler from '../../../services/parsingScheduler';

export async function POST() {
  try {
    parsingScheduler.start();
    
    return NextResponse.json({ 
      message: 'Планировщик запущен',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error starting scheduler:', error);
    return NextResponse.json(
      { error: 'Failed to start scheduler' },
      { status: 500 }
    );
  }
} 