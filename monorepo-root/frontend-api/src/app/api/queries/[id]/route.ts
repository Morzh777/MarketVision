import { NextRequest, NextResponse } from 'next/server'
import type { UpdateQueryRequest } from '@/shared/types/queries.interface'

/**
 * PUT /api/queries/[id] - Обновление запроса
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body: UpdateQueryRequest = await request.json()

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Отсутствует параметр id' 
        },
        { status: 400 }
      )
    }

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
      id: parseInt(id),
      query: body.query.trim(),
      platform: body.platform,
      platform_id: body.platform_id || null,
      exactmodels: body.exactmodels || null,
      wb_platform_id: body.wb_platform_id || null,
      wb_exactmodels: body.wb_exactmodels || null,
      recommended_price: body.recommended_price || null,
      categoryKey: body.categoryKey,
      isGroup: body.isGroup || false,
      groupIds: body.groupIds || []
    }

    // Отправляем запрос в DB API через nginx
    const dbApiUrl = `http://marketvision-nginx-dev/api/admin/queries/${id}`
    console.log('🔄 Обновление запроса в DB API:', { id, url: dbApiUrl, data: queryData })

    const response = await fetch(dbApiUrl, {
      method: 'PUT',
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
          error: result.error || 'Ошибка обновления запроса в DB API' 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Запрос успешно обновлен'
    })

  } catch (error) {
    console.error('❌ Ошибка обновления запроса:', error)
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
 * DELETE /api/queries/[id] - Удаление запроса
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Отсутствует параметр id' 
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

    // Отправляем запрос в DB API через nginx
    const dbApiUrl = `http://marketvision-nginx-dev/api/admin/queries/${id}`
    console.log('🗑️ Удаление запроса в DB API:', { id, url: dbApiUrl })

    const response = await fetch(dbApiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    })

    const result = await response.json()
    console.log('📡 DB API response:', { status: response.status, result })

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Ошибка удаления запроса в DB API' 
        },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Запрос успешно удален'
    })

  } catch (error) {
    console.error('❌ Ошибка удаления запроса:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера' 
      },
      { status: 500 }
    )
  }
}
