import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Кеширование для API запросов
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
  
  // Кеширование для изображений (10 минут)
  if (request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300')
  }
  
  // Кеширование для CSS/JS файлов (10 минут)
  if (request.nextUrl.pathname.match(/\.(css|js)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=300')
  }
  
  // Кеширование для шрифтов (10 минут)
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
