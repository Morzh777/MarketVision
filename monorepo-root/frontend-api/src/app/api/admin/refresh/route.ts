import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Сначала пробуем получить из тела запроса (для middleware)
    const body = await request.json()
    let refreshToken = body.refresh_token
    
    // Если не найден в теле, пробуем из cookies (для браузера)
    if (!refreshToken) {
      refreshToken = request.cookies.get('refresh_token')?.value
    }
    
    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token not found' }, { status: 401 })
    }
    
    // Отправляем запрос в db-api через nginx
    const response = await fetch('http://marketvision-nginx-dev/api/admin/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    
    const data = await response.json()
    
    if (response.ok) {
      // Успешное обновление - устанавливаем новые cookies
      const nextResponse = NextResponse.json({ success: true })
      
      // Устанавливаем новые токены в httpOnly cookies
      nextResponse.cookies.set('auth', data.auth, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15, // 15 минут
        path: '/',
      })
      
      if (data.refresh_token) {
        nextResponse.cookies.set('refresh_token', data.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 дней
          path: '/',
        })
      }
      
      return nextResponse
    }
    
    return NextResponse.json({ error: data.error }, { status: response.status })
  } catch (error) {
    console.error('Ошибка обновления токена:', error)
    return NextResponse.json({ error: 'Ошибка подключения к серверу' }, { status: 500 })
  }
}
