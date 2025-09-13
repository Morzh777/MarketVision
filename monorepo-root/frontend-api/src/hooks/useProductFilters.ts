import { useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { API_ENDPOINTS } from '@/constants/api'

export function useProductFilters() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const filter = searchParams.get('filter')

  const getTelegramId = useCallback((): string => {
    // Получаем telegram_id из cookies (устанавливается middleware)
    const telegram_id = document.cookie
      .split('; ')
      .find(row => row.startsWith('telegram_id='))
      ?.split('=')[1] || '171989'
    
    return telegram_id
  }, [])

  const buildApiUrl = useCallback((baseUrl: string, limit: number, offset: number): string => {
    let url = `${baseUrl}?limit=${limit}&offset=${offset}`
    
    // Добавляем фильтр категории если он есть
    if (category && category !== 'all') {
      url += `&category=${category}`
    }
    
    // Если фильтр избранного, добавляем параметры
    if (filter === 'favorites') {
      const telegram_id = getTelegramId()
      url += `&filter=favorites&telegram_id=${telegram_id}`
    }
    
    return url
  }, [category, filter, getTelegramId])

  return {
    category,
    filter,
    getTelegramId,
    buildApiUrl
  }
}
