import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const telegram_id = request.cookies.get('telegram_id')?.value
    
    if (!telegram_id) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не авторизован' },
        { status: 401 }
      )
    }

    if (!query) {
      return NextResponse.json(
        { success: false, message: 'query обязателен' },
        { status: 400 }
      )
    }

    // Проверяем статус избранного через db-api
    const response = await fetch(`${process.env.DB_API_URL || 'http://marketvision-database-api:3004'}/api/auth/favorites/${telegram_id}/check/${encodeURIComponent(query)}`)
    
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
