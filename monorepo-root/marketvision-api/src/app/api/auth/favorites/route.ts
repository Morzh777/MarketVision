import { NextRequest, NextResponse } from 'next/server'

// Добавление в избранное
export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()
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

    // Добавляем в избранное через db-api
    const response = await fetch(`${process.env.DB_API_URL || 'http://marketvision-database-api:3004'}/api/auth/favorites/add`, {
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

// Получение избранного
export async function GET(request: NextRequest) {
  try {
    const telegram_id = request.cookies.get('telegram_id')?.value
    
    if (!telegram_id) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не авторизован' },
        { status: 401 }
      )
    }

    // Получаем избранное через db-api
    const response = await fetch(`${process.env.DB_API_URL || 'http://marketvision-database-api:3004'}/api/auth/favorites/${telegram_id}`)
    
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

// Удаление из избранного
export async function DELETE(request: NextRequest) {
  try {
    const { query } = await request.json()
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

    // Удаляем из избранного через db-api
    const response = await fetch(`${process.env.DB_API_URL || 'http://marketvision-database-api:3004'}/api/auth/favorites/remove`, {
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
