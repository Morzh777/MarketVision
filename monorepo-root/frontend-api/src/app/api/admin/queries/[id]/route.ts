import { INTERNAL_API_URL } from '@/constants/api'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/queries/[id] - получение информации о запросе по ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/admin/queries/[id] - ID:', id)
    
    // Получаем токен из cookies
    const authToken = request.cookies.get('auth')?.value
    if (!authToken) {
      console.log('❌ Токен авторизации не найден')
      return NextResponse.json({ error: 'Токен авторизации не найден' }, { status: 401 })
    }

    console.log('🔍 Отправляем запрос в db-api:', `${INTERNAL_API_URL}/api/admin/queries/${id}`)

    // Отправляем запрос в db-api через nginx
    const response = await fetch(`${INTERNAL_API_URL}/api/admin/queries/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    })

    const data = await response.json()
    console.log('🔍 Ответ от db-api:', { status: response.status, data })

    if (response.ok) {
      console.log('✅ Информация о запросе успешно получена из db-api')
      return NextResponse.json(data)
    }

    console.log('❌ Ошибка от db-api:', data.error)
    return NextResponse.json({ error: data.error }, { status: response.status })
  } catch (error) {
    console.error('Ошибка получения информации о запросе:', error)
    return NextResponse.json({ error: 'Ошибка подключения к серверу' }, { status: 500 })
  }
}