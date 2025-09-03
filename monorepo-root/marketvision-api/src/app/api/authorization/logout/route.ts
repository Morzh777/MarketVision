import { NextRequest, NextResponse } from 'next/server';

import { API_CONFIG } from '@/config/settings';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    
    // Вызываем logout на DB API
    if (token) {
      try {
        await fetch(`${API_CONFIG.EXTERNAL_API_BASE_URL}/api/admin/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Ошибка вызова logout API:', error);
      }
    }

    // Создаем ответ с перенаправлением на главную
    const nextResponse = NextResponse.redirect(new URL('/', request.url));
    
    // Удаляем cookie с токеном
    nextResponse.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Удаляем cookie
      path: '/'
    });
    
    return nextResponse;
  } catch (error) {
    console.error('Ошибка выхода:', error);
    return NextResponse.json(
      { success: false, message: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
