import { NextResponse } from 'next/server'

export interface CacheOptions {
  maxAge?: number // в секундах
  staleWhileRevalidate?: number // в секундах
  tags?: string[]
}

export function addCacheHeaders(response: NextResponse, options: CacheOptions = {}) {
  const { maxAge = 600, staleWhileRevalidate = 300 } = options
  
  response.headers.set(
    'Cache-Control', 
    `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
  )
  
  if (options.tags?.length) {
    response.headers.set('Cache-Tag', options.tags.join(','))
  }
  
  return response
}

export function createCachedResponse(data: unknown, options: CacheOptions = {}) {
  const response = NextResponse.json(data)
  return addCacheHeaders(response, options)
}

// Кеширование для популярных запросов (10 минут)
export const POPULAR_QUERIES_CACHE = { maxAge: 600, staleWhileRevalidate: 300 }

// Кеширование для продуктов (10 минут)
export const PRODUCTS_CACHE = { maxAge: 600, staleWhileRevalidate: 300 }

// Кеширование для истории цен (10 минут)
export const PRICE_HISTORY_CACHE = { maxAge: 600, staleWhileRevalidate: 300 }
