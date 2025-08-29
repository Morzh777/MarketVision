import { NextRequest, NextResponse } from 'next/server'

import { API_CONFIG } from '@/config/settings'

// Debug роут для тестирования API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const telegram_id = searchParams.get('telegram_id')
    const query = searchParams.get('query')

    if (!action) {
      return NextResponse.json({
        success: false,
        message: 'action обязателен (add, remove, check, list)',
        available_actions: ['add', 'remove', 'check', 'list'],
        example: '/api/debug?action=check&telegram_id=123&query=iPhone'
      })
    }

    const base = API_CONFIG.EXTERNAL_API_BASE_URL
    let response, result

    switch (action) {
      case 'add':
        if (!telegram_id || !query) {
          return NextResponse.json({
            success: false,
            message: 'Для добавления нужны telegram_id и query'
          })
        }
        response = await fetch(`${base}/auth/favorites/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id, query })
        })
        break

      case 'remove':
        if (!telegram_id || !query) {
          return NextResponse.json({
            success: false,
            message: 'Для удаления нужны telegram_id и query'
          })
        }
        response = await fetch(`${base}/auth/favorites/remove`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_id, query })
        })
        break

      case 'check':
        if (!telegram_id || !query) {
          return NextResponse.json({
            success: false,
            message: 'Для проверки нужны telegram_id и query'
          })
        }
        response = await fetch(`${base}/auth/favorites/${telegram_id}/check/${encodeURIComponent(query)}`)
        break

      case 'list':
        if (!telegram_id) {
          return NextResponse.json({
            success: false,
            message: 'Для списка нужен telegram_id'
          })
        }
        response = await fetch(`${base}/auth/favorites/${telegram_id}`)
        break

      default:
        return NextResponse.json({
          success: false,
          message: 'Неизвестное действие',
          available_actions: ['add', 'remove', 'check', 'list']
        })
    }

    result = await response.json()
    
    return NextResponse.json({
      success: true,
      action,
      telegram_id,
      query,
      db_api_response: result,
      db_api_status: response.status,
      db_api_url: response.url
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      success: false,
      message: 'Ошибка debug API',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 