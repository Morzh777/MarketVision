import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '16'
    const offset = searchParams.get('offset') || '0'
    const telegram_id = searchParams.get('telegram_id')

    // Проксируем запрос на Nginx
    const nginxUrl = `http://marketvision-nginx-dev:80/api/products/popular-queries?limit=${limit}&offset=${offset}${telegram_id ? `&telegram_id=${telegram_id}` : ''}`
    
    const response = await fetch(nginxUrl)
    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying to nginx:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}
