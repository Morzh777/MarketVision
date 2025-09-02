import { NextRequest, NextResponse } from 'next/server';
import { API_CONFIG } from '@/config/settings';

const PRODUCT_FILTER_URL = API_CONFIG.PRODUCT_FILTER_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryKey } = body;

    if (!categoryKey) {
      return NextResponse.json(
        { success: false, message: 'categoryKey is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 MarketVision API: Отправляем указание на парсинг категории ${categoryKey}`);

    // Отправляем указание на парсинг в Product-Filter сервис через nginx
    const response = await fetch(`${PRODUCT_FILTER_URL}/parsing/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryKey }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`❌ Ошибка от Product-Filter:`, result);
      return NextResponse.json(
        { success: false, message: 'Ошибка при запуске парсинга', error: result },
        { status: response.status }
      );
    }

    console.log(`✅ Парсинг запущен успешно для категории ${categoryKey}`);
    
    return NextResponse.json({
      success: true,
      message: 'Указание на парсинг отправлено успешно',
      data: result.data
    });

  } catch (error) {
    console.error('❌ Ошибка в MarketVision API:', error);
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера', error: error.message },
      { status: 500 }
    );
  }
}
