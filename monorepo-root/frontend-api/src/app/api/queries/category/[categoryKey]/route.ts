import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/queries/category/[categoryKey] - Получение запросов по категории
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryKey: string } }
) {
  try {
    const { categoryKey } = params

    if (!categoryKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Отсутствует параметр categoryKey' 
        },
        { status: 400 }
      )
    }

    // Отправляем запрос в DB API через nginx
    const dbApiUrl = `http://marketvision-nginx-dev/api/admin/queries?categoryKey=${encodeURIComponent(categoryKey)}`
    console.log('🔍 Получение запросов по категории:', { categoryKey, url: dbApiUrl })

    const response = await fetch(dbApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Добавляем настройки для избежания ошибок с URL схемами
      cache: 'no-store',
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      console.error('❌ DB API error:', { status: response.status, statusText: response.statusText })
      return NextResponse.json(
        { 
          success: false, 
          error: `Ошибка получения запросов: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('📡 DB API response:', { 
      status: response.status, 
      count: Array.isArray(result) ? result.length : 'not array',
      categoryKey 
    })

    // Возвращаем массив запросов напрямую
    return NextResponse.json(Array.isArray(result) ? result : [])

  } catch (error) {
    console.error('❌ Ошибка получения запросов по категории:', error)
    
    // Игнорируем ошибки URL схемы, но логируем их
    if (error instanceof Error && error.message.includes('Unknown url scheme')) {
      console.warn('⚠️ URL scheme error (ignored):', error.message)
      return NextResponse.json([]) // Возвращаем пустой массив вместо ошибки
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    )
  }
}