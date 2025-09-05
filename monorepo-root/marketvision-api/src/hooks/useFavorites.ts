import { useCallback } from 'react'

import { normalizeQueryForFavorites } from '../app/utils/transliteration'

import { useAuth } from './useAuth'

export function useFavorites() {
  const { user, isAuthenticated } = useAuth()

  // Добавление в избранное
  const addToFavorites = useCallback(async (query: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.telegram_id) {
      return false
    }

    try {
      // Нормализуем query для избранного
      const normalizedQuery = normalizeQueryForFavorites(query)

      const response = await fetch('/api/auth/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegram_id: user.telegram_id, query: normalizedQuery }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.success
      }
      return false
    } catch {
      return false
    }
  }, [isAuthenticated, user?.telegram_id])

  // Удаление из избранного
  const removeFromFavorites = useCallback(async (query: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.telegram_id) {
      return false
    }

    try {
      // Нормализуем query для избранного
      const normalizedQuery = normalizeQueryForFavorites(query)

      const response = await fetch('/api/auth/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegram_id: user.telegram_id, query: normalizedQuery }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.success
      }
      return false
    } catch {
      return false
    }
  }, [isAuthenticated, user?.telegram_id])

  // Проверка статуса избранного
  const checkFavorite = useCallback(async (query: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.telegram_id) {
      return false
    }

    try {
      // Нормализуем query для избранного
      const normalizedQuery = normalizeQueryForFavorites(query)

      // Используем path-параметры согласно маршруту Next API
      const response = await fetch(`/api/auth/favorites/${user.telegram_id}/check/${encodeURIComponent(normalizedQuery)}`)
      
      if (response.ok) {
        const data = await response.json()
        return data.success && data.isFavorite
      }
      return false
    } catch {
      return false
    }
  }, [isAuthenticated, user?.telegram_id])

  // Переключение избранного (добавить/удалить)
  const toggleFavorite = useCallback(async (query: string, currentStatus?: boolean): Promise<boolean> => {
    // Если статус уже известен, используем его, иначе проверяем
    const isFavorite = currentStatus !== undefined ? currentStatus : await checkFavorite(query)
    
    if (isFavorite) {
      return await removeFromFavorites(query)
    } else {
      return await addToFavorites(query)
    }
  }, [checkFavorite, addToFavorites, removeFromFavorites])

  return {
    addToFavorites,
    removeFromFavorites,
    checkFavorite,
    toggleFavorite,
  }
}
