import { NextRequest, NextResponse } from 'next/server'

import { AuthService } from '../../../services/authService'
import { LoginRequest } from '../../../types/user.types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authService = AuthService.getInstance()

    const loginData: LoginRequest = {
      username: body.username,
      password: body.password
    }

    const authResponse = await authService.login(loginData)

    if (!authResponse.success) {
      return NextResponse.json(authResponse, { status: 401 })
    }

    const response = NextResponse.json(authResponse, { status: 200 })
    
    // Устанавливаем cookie с токеном для middleware
    response.cookies.set('auth-token', authResponse.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 часа
      path: '/'
    })
    
    return response
  } catch {
    return NextResponse.json({
      success: false,
      message: 'Ошибка обработки запроса'
    }, { status: 500 })
  }
} 