import { NextRequest, NextResponse } from 'next/server'
import { createInternalApiUrl } from '@/constants/api'

export async function GET() {
  try {
    // Получаем запросы из db-api через nginx
    const response = await fetch(createInternalApiUrl('/api/admin/queries'), {
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
    console.error('Ошибка получения запросов:', error)
    return NextResponse.json({ error: 'Ошибка подключения к серверу' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 POST /api/admin/queries - полученные данные:', body)
    
    // Получаем токен из cookies
    const authToken = request.cookies.get('auth')?.value
    if (!authToken) {
      console.log('❌ Токен авторизации не найден')
      return NextResponse.json({ error: 'Токен авторизации не найден' }, { status: 401 })
    }

    console.log('🔍 Отправляем запрос в db-api:', createInternalApiUrl('/api/admin/queries'))

    // Отправляем запрос в db-api через nginx
    const response = await fetch(createInternalApiUrl('/api/admin/queries'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    console.log('🔍 Ответ от db-api:', { status: response.status, data })

    if (response.ok) {
      console.log('✅ Запрос успешно создан в db-api')
      return NextResponse.json(data)
    }

    console.log('❌ Ошибка от db-api:', data.error)
    return NextResponse.json({ error: data.error }, { status: response.status })
  } catch (error) {
    console.error('Ошибка создания запроса:', error)
    return NextResponse.json({ error: 'Ошибка подключения к серверу' }, { status: 500 })
  }
}
