import { createApiUrl, API_ENDPOINTS, PAGINATION } from '@/constants/api'

interface FilterParams {
  category?: string
  filter?: string
  telegram_id?: string
}

export function buildProductApiUrl(params: FilterParams, limit: number = PAGINATION.DEFAULT_LIMIT, offset: number = PAGINATION.DEFAULT_OFFSET): string {
  // Создаем базовый URL с параметрами
  let endpoint = `${API_ENDPOINTS.POPULAR_QUERIES}?limit=${limit}&offset=${offset}`
  
  // Добавляем фильтр категории если он есть
  if (params.category && params.category !== 'all') {
    endpoint += `&category=${params.category}`
  }
  
  // Если фильтр избранного, добавляем параметры
  if (params.filter === 'favorites' && params.telegram_id) {
    endpoint += `&filter=favorites&telegram_id=${params.telegram_id}`
  }
  
  // Используем универсальную функцию для создания URL
  return createApiUrl(endpoint)
}

export function getFilterParams(searchParams: { [key: string]: string | string[] | undefined }): FilterParams {
  const category = searchParams.category as string | undefined
  const filter = searchParams.filter as string | undefined
  
  return {
    category,
    filter
  }
}
