import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json()
    
    // Отправляем запрос в db-api через nginx
    const response = await fetch('http://marketvision-nginx-dev/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login, password }),
    })
    
    const data = await response.json()
    
    if (response.ok) {
      // Успешная авторизация - устанавливаем cookies
      const nextResponse = NextResponse.json({ success: true })
      
      // Устанавливаем токены в httpOnly cookies
      nextResponse.cookies.set('auth', data.auth, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15, // 15 минут
        path: '/',
      })
      
      nextResponse.cookies.set('refresh_token', data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/',
      })
      
      return nextResponse
    }
    
    return NextResponse.json({ error: data.error }, { status: response.status })
  } catch (error) {
    console.error('Ошибка авторизации:', error)
    return NextResponse.json({ error: 'Ошибка подключения к серверу' }, { status: 500 })
  }
}
