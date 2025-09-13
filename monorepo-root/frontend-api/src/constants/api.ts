// API константы

// Функция для определения правильного базового URL
export const getApiBaseUrl = (): string => {
  // Если выполняется на сервере (SSR/SSG)
  if (typeof window === 'undefined') {
    return 'http://marketvision-nginx-dev'
  }
  // Если выполняется в браузере - используем относительные URL
  return ''
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
