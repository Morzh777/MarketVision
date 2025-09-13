import { NextRequest, NextResponse } from 'next/server'
import type { CreateQueryRequest } from '@/shared/types/queries.interface'

/**
 * POST /api/queries - Создание нового запроса
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateQueryRequest = await request.json()
    
    // Валидация обязательных полей
    if (!body.query || !body.platform || !body.categoryKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Отсутствуют обязательные поля: query, platform, categoryKey' 
        },
        { status: 400 }
      )
    }

    // Валидация платформы
    if (!['ozon', 'wb', 'both'].includes(body.platform)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Недопустимое значение platform. Допустимые значения: ozon, wb, both' 
        },
        { status: 400 }
      )
    }

    // Получаем токен авторизации из заголовков
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Требуется авторизация' 
        },
        { status: 401 }
      )
    }

    const authToken = authHeader.replace('Bearer ', '')

    // Подготавливаем данные для отправки в DB API
    const queryData = {
      query: body.query.trim(),
      platform: body.platform,
      platform_id: body.platform_id || null,
      exactmodels: body.exactmodels || null,
      wb_platform_id: body.wb_platform_id || null,
      wb_exactmodels: body.wb_exactmodels || null,
      recommended_price: body.recommended_price || null,
      categoryKey: body.categoryKey
    }

    // Отправляем запрос в DB API через nginx
    const dbApiUrl = 'http://marketvision-nginx-dev/api/admin/queries'
    console.log('🔄 Создание запроса в DB API:', { url: dbApiUrl, data: queryData })

    const response = await fetch(dbApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(queryData),
    })

    const result = await response.json()
    console.log('📡 DB API response:', { status: response.status, result })

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Ошибка создания запроса в DB API' 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Запрос успешно создан'
    })

  } catch (error) {
    console.error('❌ Ошибка создания запроса:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/queries - Получение всех запросов (для админки)
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем токен авторизации из заголовков
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Требуется авторизация' 
        },
        { status: 401 }
      )
    }

    const authToken = authHeader.replace('Bearer ', '')

    // Отправляем запрос в DB API через nginx
    const dbApiUrl = 'http://marketvision-nginx-dev/api/admin/queries'
    console.log('🔍 Получение запросов из DB API:', dbApiUrl)

    const response = await fetch(dbApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    })

    const result = await response.json()
    console.log('📡 DB API response:', { status: response.status, count: Array.isArray(result) ? result.length : 'not array' })

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Ошибка получения запросов из DB API' 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Запросы успешно получены'
    })

  } catch (error) {
    console.error('❌ Ошибка получения запросов:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    )
  }
}
