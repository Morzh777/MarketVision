import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1) Сохраняем telegram_id из URL в cookie на первом заходе
  const telegramId = request.nextUrl.searchParams.get('telegram_id')
  if (telegramId) {
    console.log('🔧 Middleware: Найден telegram_id в URL:', telegramId)
    
    const response = NextResponse.next() // Не перенаправляем, оставляем URL как есть
    
    // httpOnly для бекенда
    response.cookies.set('telegram_id', telegramId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: '/',
    })
    // Клиентское cookie для чтения на фронте (дублируем)
    response.cookies.set('telegram_id_client', telegramId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    
    console.log('✅ Middleware: Установлены cookies для telegram_id:', telegramId)
    return response
  }

  const response = NextResponse.next()
  
  // 2) Кеширование для API запросов
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Кешируем популярные запросы на 10 минут
    if (request.nextUrl.pathname === '/api/popular-queries') {
      response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300')
    }
    
    // Кешируем продукты на 10 минут
    if (request.nextUrl.pathname.startsWith('/api/products')) {
      response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=300')
    }
  }
  
  // 3) Кеширование для изображений (10 минут)
  if (request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300')
  }
  
  // 4) Кеширование для CSS/JS файлов (10 минут)
  if (request.nextUrl.pathname.match(/\.(css|js)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300')
  }
  
  // 5) Кеширование для шрифтов (10 минут)
  if (request.nextUrl.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300')
  }
  
  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
