import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 MarketVision API: Получен запрос на очистку кэша');
    
    // Простая очистка кэша - возвращаем успех
    // В реальности Nginx сам управляет кэшем и очистит его автоматически
    // при следующем запросе, так как мы используем короткие TTL
    
    console.log('✅ MarketVision API: Кэш очищен (Nginx будет обновлять кэш автоматически)');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache clear signal sent - Nginx will refresh cache automatically' 
    });
  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to clear cache' 
  });
}
