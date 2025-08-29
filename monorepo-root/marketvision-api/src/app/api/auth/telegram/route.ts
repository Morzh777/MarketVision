import { NextRequest, NextResponse } from 'next/server'

import { API_CONFIG } from '@/config/settings'

// Сохранение Telegram пользователя
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Сохраняем Telegram пользователя через nginx прокси к db-api
    const base = API_CONFIG.EXTERNAL_API_BASE_URL
    const response = await fetch(`${base}/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Ошибка сохранения Telegram пользователя:', error)
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Проверка Telegram аутентификации
export async function GET(request: NextRequest) {
  try {
    // Проверяем Telegram аутентификацию через nginx прокси к db-api
    const base = API_CONFIG.EXTERNAL_API_BASE_URL
    const response = await fetch(`${base}/auth/telegram`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Ошибка проверки Telegram аутентификации:', error)
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
