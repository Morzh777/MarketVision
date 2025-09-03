import { NextRequest, NextResponse } from 'next/server';

import { API_CONFIG } from '@/config/settings';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API verify: проверяем токен...');
    const token = request.cookies.get('auth-token')?.value;
    console.log('🍪 Токен из cookie:', token ? 'найден' : 'не найден');
    
    if (!token) {
      console.log('❌ Токен не найден в cookie');
      return NextResponse.json(
        { success: false, message: 'Токен не найден' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_CONFIG.EXTERNAL_API_BASE_URL}/api/admin/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      return NextResponse.json(data, { status: response.status });
    } else {
      return NextResponse.json(
        { success: false, message: 'Неверный токен' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
