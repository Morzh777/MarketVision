import { INTERNAL_API_URL } from '@/constants/api'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Получаем категории из db-api через nginx
    const response = await fetch(`${INTERNAL_API_URL}/api/categories`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: data.error }, { status: response.status })
  } catch (error) {
    console.error('Ошибка получения категорий:', error)
    return NextResponse.json({ error: 'Ошибка подключения к серверу' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Получаем токен из cookies
    const authToken = request.cookies.get('auth')?.value
    if (!authToken) {
      return NextResponse.json({ error: 'Токен авторизации не найден' }, { status: 401 })
    }

    // Отправляем запрос в db-api через nginx
    const response = await fetch(`${INTERNAL_API_URL}/api/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: data.error }, { status: response.status })
  } catch (error) {
    console.error('Ошибка создания категории:', error)
    return NextResponse.json({ error: 'Ошибка подключения к серверу' }, { status: 500 })
  }
}
