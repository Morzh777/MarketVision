import { INTERNAL_API_URL } from '@/constants/api'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ query: string }> }
) {
  try {
    const { query } = await params
    const { searchParams } = new URL(request.url)
    const categoryKey = searchParams.get('categoryKey')
    
    console.log('🔍 DELETE /api/admin/queries/path/[query] - query:', query, 'categoryKey:', categoryKey)
    
    if (!categoryKey) {
      console.log('❌ categoryKey не найден')
      return NextResponse.json({ error: 'categoryKey обязателен' }, { status: 400 })
    }
    
    // Получаем токен из cookies
    const authToken = request.cookies.get('auth')?.value
    if (!authToken) {
      console.log('❌ Токен авторизации не найден')
      return NextResponse.json({ error: 'Токен авторизации не найден' }, { status: 401 })
    }

    console.log('🔍 Отправляем запрос в db-api:', `${INTERNAL_API_URL}/api/admin/queries/path/${encodeURIComponent(query)}?categoryKey=${categoryKey}`)

    // Отправляем запрос в db-api через nginx
    const response = await fetch(`${INTERNAL_API_URL}/api/admin/queries/path/${encodeURIComponent(query)}?categoryKey=${categoryKey}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    })

    const data = await response.json()
    console.log('🔍 Ответ от db-api:', { status: response.status, data })

    if (response.ok) {
      console.log('✅ Все записи запроса успешно удалены в db-api')
      return NextResponse.json(data)
    }

    console.log('❌ Ошибка от db-api:', data.error)
    return NextResponse.json({ error: data.error }, { status: response.status })
  } catch (error) {
    console.error('Ошибка удаления запроса:', error)
    return NextResponse.json({ error: 'Ошибка подключения к серверу' }, { status: 500 })
  }
}
