import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtDecode } from 'jwt-decode'
import { API } from '@/config'

// Константы
const SKIP_ROUTES = ['/api/', '/_next/', '/favicon.ico']
const TELEGRAM_COOKIE_CONFIG = {
  httpOnly: false,
  secure: false, // Для dev режима
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 дней
  path: '/',
}

// Упрощенное решение - без debounce

// Утилиты
const shouldSkipRoute = (pathname: string, routes: string[]) => {
  return routes.some(route => pathname.startsWith(route))
}

const handleTelegramId = (telegramId: string | null, response: NextResponse) => {
  if (!telegramId) return response
  
  response.cookies.delete('telegram_id')
  response.cookies.set('telegram_id', telegramId, TELEGRAM_COOKIE_CONFIG)
  
  return response
}

const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode(token) as { exp?: number }
    if (!decoded.exp) return true
    return decoded.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

const isTokenExpiringSoon = (token: string, minutesBeforeExpiry: number = 3): boolean => {
  try {
    const decoded = jwtDecode(token) as { exp?: number }
    if (!decoded.exp) return true
    
    const expiryTime = decoded.exp * 1000
    const currentTime = Date.now()
    const timeUntilExpiry = expiryTime - currentTime
    const minutesUntilExpiry = timeUntilExpiry / (1000 * 60)
    
    return minutesUntilExpiry <= minutesBeforeExpiry
  } catch {
    return true
  }
}

const performRefresh = async (request: NextRequest): Promise<NextResponse | null> => {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value
    console.log('🔄 performRefresh: refreshToken exists:', !!refreshToken)
    
    if (!refreshToken) {
      console.log('❌ performRefresh: no refresh token')
      return null
    }

    console.log('🔄 performRefresh: calling /api/admin/refresh')
    const response = await fetch(`${request.nextUrl.origin}/api/admin/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    console.log('🔄 performRefresh: response status:', response.status)
    
    if (response.ok) {
      const newCookies = response.headers.get('set-cookie')
      console.log('🔄 performRefresh: set-cookie header:', newCookies)
      
      if (newCookies) {
        const nextResponse = NextResponse.next()
        // Копируем новые куки из ответа refresh
        const cookieHeaders = newCookies.split(',')
        console.log('🔄 performRefresh: parsed cookies:', cookieHeaders.length)
        
        cookieHeaders.forEach(cookie => {
          const [nameValue] = cookie.trim().split(';')
          const [name, value] = nameValue.split('=')
          if (name && value) {
            console.log('🔄 performRefresh: setting cookie:', name.trim())
            nextResponse.cookies.set(name.trim(), value.trim(), {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          }
        })
        console.log('✅ performRefresh: success')
        return nextResponse
      } else {
        console.log('❌ performRefresh: no set-cookie header')
      }
    } else {
      console.log('❌ performRefresh: response not ok:', response.status)
    }
  } catch (error) {
    console.log('❌ performRefresh: error:', error)
  }
  return null
}

const refreshTokens = async (request: NextRequest): Promise<NextResponse | null> => {
  // Упрощенное решение - каждый пользователь обновляет токен самостоятельно
  return await performRefresh(request)
}

const checkAuth = async (pathname: string, request: NextRequest) => {
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const authToken = request.cookies.get('auth')?.value
    const refreshToken = request.cookies.get('refresh_token')?.value
    
    console.log('🔍 Middleware check:', { 
      pathname, 
      hasAuth: !!authToken, 
      hasRefresh: !!refreshToken,
      authExpired: authToken ? isTokenExpired(authToken) : 'no token',
      authExpiringSoon: authToken ? isTokenExpiringSoon(authToken, 3) : 'no token'
    })
    
    // Если нет токенов вообще
    if (!authToken && !refreshToken) {
      console.log('❌ No tokens, redirecting to login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    
    // Если есть auth токен, проверяем его валидность
    if (authToken && !isTokenExpired(authToken)) {
      // Проверяем, не истекает ли токен в ближайшие 3 минуты
      if (isTokenExpiringSoon(authToken, 3) && refreshToken) {
        console.log('🔄 Token expiring soon, refreshing...')
        const refreshResponse = await refreshTokens(request)
        if (refreshResponse) {
          console.log('✅ Token refreshed successfully')
          return refreshResponse // Успешно обновили токены заранее
        }
      }
      console.log('✅ Auth token valid')
      return null // Токен валиден
    }
    
    // Если auth токен истек или отсутствует, но есть refresh токен
    if (refreshToken) {
      console.log('🔄 Auth token expired, refreshing...')
      const refreshResponse = await refreshTokens(request)
      if (refreshResponse) {
        console.log('✅ Token refreshed successfully')
        return refreshResponse // Успешно обновили токены
      }
    }
    
    // Если не удалось обновить токены
    console.log('❌ Failed to refresh tokens, redirecting to login')
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const telegramId = request.nextUrl.searchParams.get('telegram_id')
  
  // Пропускаем служебные роуты
  if (shouldSkipRoute(pathname, SKIP_ROUTES)) {
    return NextResponse.next()
  }
  
  // Обрабатываем telegram_id
  if (telegramId) {
    const response = NextResponse.next()
    return handleTelegramId(telegramId, response)
  }
  
  // Проверяем авторизацию с автоматическим refresh
  const authResponse = await checkAuth(pathname, request)
  if (authResponse) {
    return authResponse
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}