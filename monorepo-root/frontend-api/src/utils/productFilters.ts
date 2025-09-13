import { API_BASE_URL, API_ENDPOINTS, PAGINATION } from '@/constants/api'

interface FilterParams {
  category?: string
  filter?: string
  telegram_id?: string
}

export function buildProductApiUrl(params: FilterParams, limit: number = PAGINATION.DEFAULT_LIMIT, offset: number = PAGINATION.DEFAULT_OFFSET): string {
  let url = `${API_BASE_URL}${API_ENDPOINTS.POPULAR_QUERIES}?limit=${limit}&offset=${offset}`
  
  // Добавляем фильтр категории если он есть
  if (params.category && params.category !== 'all') {
    url += `&category=${params.category}`
  }
  
  // Если фильтр избранного, добавляем параметры
  if (params.filter === 'favorites' && params.telegram_id) {
    url += `&filter=favorites&telegram_id=${params.telegram_id}`
  }
  
  return url
}

export function getFilterParams(searchParams: { [key: string]: string | string[] | undefined }): FilterParams {
  const category = searchParams.category as string | undefined
  const filter = searchParams.filter as string | undefined
  
  return {
    category,
    filter
  }
}
