// API константы

// Функция для определения правильного базового URL
export const getApiBaseUrl = (): string => {
  // В браузере используем относительные URL
  if (typeof window !== 'undefined') {
    return ''
  }
  
  // На сервере (SSR) используем полный URL
  return 'http://marketvision-nginx-dev'
}

// Универсальная функция для создания API URL
export const createApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl()
  return `${baseUrl}${endpoint}`
}

// URL для внутренних API роутов (всегда полный URL)
export const INTERNAL_API_URL = 'http://marketvision-nginx-dev'

// Функция для создания URL в API роутах
export const createInternalApiUrl = (endpoint: string): string => {
  return `${INTERNAL_API_URL}${endpoint}`
}

export const API_BASE_URL = getApiBaseUrl()

export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  POPULAR_QUERIES: '/api/products/popular-queries',
  CATEGORIES: '/api/categories',
  AUTH: '/api/auth',
  ADMIN: '/api/admin',
  STATS: '/api/stats'
} as const

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
} as const

export const API_TIMEOUT = 10000 // 10 секунд

// Пагинация
export const PAGINATION = {
  DEFAULT_LIMIT: 16,
  DEFAULT_OFFSET: 0,
  LOAD_MORE_LIMIT: 16
} as const