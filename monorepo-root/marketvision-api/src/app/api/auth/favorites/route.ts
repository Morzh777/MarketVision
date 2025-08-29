import { NextRequest, NextResponse } from 'next/server'

import { API_CONFIG } from '@/config/settings'

// Добавление в избранное
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegram_id, query } = body

    if (!telegram_id || !query) {
      return NextResponse.json(
        { success: false, message: 'telegram_id и query обязательны' },
        { status: 400 }
      )
    }

    // Добавляем в избранное через nginx прокси к db-api
    const base = API_CONFIG.EXTERNAL_API_BASE_URL
    const response = await fetch(`${base}/auth/favorites/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegram_id, query }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Ошибка добавления в избранное:', error)
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// Удаление из избранного
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegram_id, query } = body

    if (!telegram_id || !query) {
      return NextResponse.json(
        { success: false, message: 'telegram_id и query обязательны' },
        { status: 400 }
      )
    }

    // Удаляем из избранного через nginx прокси к db-api
    const base = API_CONFIG.EXTERNAL_API_BASE_URL
    const response = await fetch(`${base}/auth/favorites/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegram_id, query }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Ошибка удаления из избранного:', error)
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
