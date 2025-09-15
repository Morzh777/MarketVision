import { INTERNAL_API_URL } from '@/constants/api'
import { NextRequest, NextResponse } from 'next/server'
import { API } from '@/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categoryKey } = body

    if (!categoryKey) {
      return NextResponse.json(
        { success: false, message: 'categoryKey is required' },
        { status: 400 }
      )
    }

    console.log(`🚀 Frontend API: Отправляем указание на парсинг категории ${categoryKey}`)

    // Отправляем указание на парсинг в Product-Filter сервис через nginx
    const response = await fetch(`${INTERNAL_API_URL}/api/parsing/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryKey }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error(`❌ Ошибка от Product-Filter:`, result)
      return NextResponse.json(
        { success: false, message: 'Ошибка при запуске парсинга', error: result },
        { status: response.status }
      )
    }

    console.log(`✅ Парсинг запущен успешно для категории ${categoryKey}`)
    
    return NextResponse.json({
      success: true,
      message: 'Указание на парсинг отправлено успешно',
      data: result.data
    })

  } catch (error) {
    console.error('❌ Ошибка в Frontend API:', error)
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера', error: error instanceof Error ? error.message : 'Неизвестная ошибка' },
      { status: 500 }
    )
  }
}
