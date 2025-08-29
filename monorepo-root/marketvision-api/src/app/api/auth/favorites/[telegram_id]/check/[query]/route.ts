import { NextRequest, NextResponse } from 'next/server'

import { API_CONFIG } from '@/config/settings'

// Проверка статуса избранного по telegram_id и query
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ telegram_id: string; query: string }> }
) {
  try {
    const { telegram_id, query } = await params
    
    if (!telegram_id) {
      return NextResponse.json(
        { success: false, message: 'telegram_id обязателен' },
        { status: 400 }
      )
    }

    if (!query) {
      return NextResponse.json(
        { success: false, message: 'query обязателен' },
        { status: 400 }
      )
    }

    // Проверяем статус избранного через nginx прокси к db-api
    const base = API_CONFIG.EXTERNAL_API_BASE_URL
    const response = await fetch(`${base}/auth/favorites/${telegram_id}/check/${encodeURIComponent(query)}`)
    
    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Ошибка проверки избранного:', error)
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
