import { NextResponse } from 'next/server';

import parsingScheduler from '../../../services/parsingScheduler';

export async function POST() {
  try {
    parsingScheduler.stop();
    
    return NextResponse.json({ 
      message: 'Планировщик остановлен',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error stopping scheduler:', error);
    return NextResponse.json(
      { error: 'Failed to stop scheduler' },
      { status: 500 }
    );
  }
} 