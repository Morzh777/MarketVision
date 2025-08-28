import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { telegram_id } = await request.json()
    
    if (!telegram_id) {
      return NextResponse.json(
        { success: false, message: 'telegram_id обязателен' },
        { status: 400 }
      )
    }

    // Проверяем существование пользователя в базе через db-api
    const userResponse = await fetch(`${process.env.DB_API_URL || 'http://marketvision-database-api:3004'}/api/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegram_id }),
    })

    if (!userResponse.ok) {
      return NextResponse.json(
        { success: false, message: 'Ошибка проверки пользователя' },
        { status: 500 }
      )
    }

    const userData = await userResponse.json()
    
    if (!userData.success) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не найден' },
        { status: 404 }
      )
    }

    // Создаем сессию пользователя
    const response = NextResponse.json({
      success: true,
      message: 'Пользователь авторизован',
      user: {
        telegram_id: userData.user.telegram_id,
        username: userData.user.username,
        first_name: userData.user.first_name,
        last_name: userData.user.last_name,
      }
    })

    // Устанавливаем cookie для авторизации
    response.cookies.set('telegram_id', telegram_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    })

    return response

  } catch (error) {
    console.error('Ошибка авторизации:', error)
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Получаем telegram_id из cookie
    const telegram_id = request.cookies.get('telegram_id')?.value
    
    if (!telegram_id) {
      return NextResponse.json(
        { success: false, message: 'Пользователь не авторизован' },
        { status: 401 }
      )
    }

    // Проверяем существование пользователя
    const userResponse = await fetch(`${process.env.DB_API_URL || 'http://marketvision-database-api:3004'}/api/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegram_id }),
    })

    if (!userResponse.ok) {
      // Удаляем невалидный cookie
      const response = NextResponse.json(
        { success: false, message: 'Пользователь не найден' },
        { status: 404 }
      )
      response.cookies.delete('telegram_id')
      return response
    }

    const userData = await userResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'Пользователь авторизован',
      user: {
        telegram_id: userData.user.telegram_id,
        username: userData.user.username,
        first_name: userData.user.first_name,
        last_name: userData.user.last_name,
      }
    })

  } catch (error) {
    console.error('Ошибка проверки авторизации:', error)
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
