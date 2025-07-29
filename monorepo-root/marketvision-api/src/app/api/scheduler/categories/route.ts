import { NextResponse } from 'next/server';

import parsingScheduler from '../../../services/parsingScheduler';

export async function GET() {
  try {
    const status = parsingScheduler.getStatus();
    
    return NextResponse.json({
      activeCategories: status.activeCategories || {},
      allCategories: status.config,
      message: 'Активные категории получены'
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activeCategories } = body;
    
    if (!activeCategories || typeof activeCategories !== 'object') {
      return NextResponse.json(
        { error: 'Invalid activeCategories format' },
        { status: 400 }
      );
    }
    
    // Обновляем активные категории в планировщике
    parsingScheduler.updateActiveCategories(activeCategories);
    
    return NextResponse.json({ 
      message: 'Активные категории обновлены',
      activeCategories,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Error updating categories:', error);
    return NextResponse.json(
      { error: 'Failed to update categories' },
      { status: 500 }
    );
  }
} 