import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/api/scheduler', '/admin']
const authRoutes = ['/api/auth/login', '/api/auth/logout', '/auth']

/**
 * Middleware для защиты роутов и управления аутентификацией
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Проверяем защищенные роуты
  if (isProtectedRoute) {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      return NextResponse.redirect(new URL('/auth', request.url))
    }
  }

  // Перенаправляем авторизованных пользователей с /auth на /admin
  if (isAuthRoute && pathname === '/auth') {
    const token = request.cookies.get('auth-token')?.value
    
    if (token) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/scheduler/:path*', '/auth']
} 