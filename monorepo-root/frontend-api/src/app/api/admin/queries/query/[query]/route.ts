import { INTERNAL_API_URL } from '@/constants/api'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/admin/queries/query/[query] - обновление всех запросов с одинаковым названием
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const { query } = await params
    const { searchParams } = new URL(request.url)
    const categoryKey = searchParams.get('categoryKey')
    
    if (!categoryKey) {
      return NextResponse.json({ error: 'Параметр categoryKey обязателен' }, { status: 400 })
    }

    const body = await request.json()
    console.log('🔍 PUT /api/admin/queries/query/[query] - query:', query, 'categoryKey:', categoryKey, 'body:', body)
    
    // Получаем токен из cookies
    const authToken = request.cookies.get('auth')?.value
    if (!authToken) {
      console.log('❌ Токен авторизации не найден')
      return NextResponse.json({ error: 'Токен авторизации не найден' }, { status: 401 })
    }

    console.log('🔍 Отправляем запрос в db-api:', `${INTERNAL_API_URL}/api/admin/queries/query/${encodeURIComponent(query)}?categoryKey=${categoryKey}`)

    // Отправляем запрос в db-api через nginx
    const response = await fetch(`${INTERNAL_API_URL}/api/admin/queries/query/${encodeURIComponent(query)}?categoryKey=${categoryKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    console.log('🔍 Ответ от db-api:', { status: response.status, data })

    if (response.ok) {
      console.log('✅ Запросы успешно обновлены в db-api')
      return NextResponse.json(data)
    }

    console.log('❌ Ошибка от db-api:', data.error)
    return NextResponse.json({ error: data.error || 'Ошибка обновления запросов' }, { status: response.status })
  } catch (error) {
    console.error('Ошибка обновления запросов:', error)
    return NextResponse.json({ error: 'Ошибка подключения к серверу' }, { status: 500 })
  }
}
