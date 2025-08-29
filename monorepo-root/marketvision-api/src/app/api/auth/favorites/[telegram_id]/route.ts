import { NextRequest, NextResponse } from 'next/server'

import { API_CONFIG } from '@/config/settings'

// Получение списка избранного по telegram_id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ telegram_id: string }> }
) {
  try {
    const { telegram_id } = await params
    
    if (!telegram_id) {
      return NextResponse.json(
        { success: false, message: 'telegram_id обязателен' },
        { status: 400 }
      )
    }

    // Получаем список избранного через nginx прокси к db-api
    const base = API_CONFIG.EXTERNAL_API_BASE_URL
    const response = await fetch(`${base}/auth/favorites/${telegram_id}`)
    
    const result = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Ошибка получения избранного:', error)
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
