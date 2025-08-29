import { useState, useEffect } from 'react'

import { normalizeQueryForFavorites } from '../app/utils/transliteration'

import { useAuth } from './useAuth'

interface Favorite {
  id: number
  query: string
  created_at: string
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  // Получение избранного
  const getFavorites = async (): Promise<void> => {
    if (!isAuthenticated || !user?.telegram_id) {
      console.log('❌ Пользователь не авторизован для получения избранного')
      return
    }

    try {
      setIsLoading(true)
      // Используем правильный роут с telegram_id
      const response = await fetch(`/api/auth/favorites/${user.telegram_id}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFavorites(data.favorites)
        }
      }
    } catch (error) {
      console.error('Ошибка получения избранного:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Добавление в избранное
  const addToFavorites = async (query: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.telegram_id) {
      console.log('❌ useFavorites: Пользователь не авторизован для добавления в избранное', {
        isAuthenticated,
        user,
        telegram_id: user?.telegram_id
      })
      return false
    }

    try {
      // Нормализуем query для избранного
      const normalizedQuery = normalizeQueryForFavorites(query)
      console.log('🔍 useFavorites: Нормализация query:', { 
        original: query, 
        normalized: normalizedQuery,
        telegram_id: user.telegram_id
      })

      const response = await fetch('/api/auth/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegram_id: user.telegram_id, query: normalizedQuery }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Обновляем список избранного
          await getFavorites()
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Ошибка добавления в избранное:', error)
      return false
    }
  }

  // Удаление из избранного
  const removeFromFavorites = async (query: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.telegram_id) {
      console.log('❌ Пользователь не авторизован для удаления из избранного')
      return false
    }

    try {
      // Нормализуем query для избранного
      const normalizedQuery = normalizeQueryForFavorites(query)
      console.log('🔍 useFavorites: Нормализация query для удаления:', { original: query, normalized: normalizedQuery })

      const response = await fetch('/api/auth/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegram_id: user.telegram_id, query: normalizedQuery }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Обновляем список избранного
          await getFavorites()
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Ошибка удаления из избранного:', error)
      return false
    }
  }

  // Проверка статуса избранного
  const checkFavorite = async (query: string): Promise<boolean> => {
    if (!isAuthenticated || !user?.telegram_id) {
      console.log('❌ useFavorites: Пользователь не авторизован для проверки избранного', {
        isAuthenticated,
        user,
        telegram_id: user?.telegram_id
      })
      return false
    }

    try {
      // Нормализуем query для избранного
      const normalizedQuery = normalizeQueryForFavorites(query)
      console.log('🔍 useFavorites: Нормализация query для проверки:', { 
        original: query, 
        normalized: normalizedQuery,
        telegram_id: user.telegram_id
      })

      // Используем path-параметры согласно маршруту Next API
      const response = await fetch(`/api/auth/favorites/${user.telegram_id}/check/${encodeURIComponent(normalizedQuery)}`)
      
      if (response.ok) {
        const data = await response.json()
        return data.success && data.isFavorite
      }
      return false
    } catch (error) {
      console.error('Ошибка проверки избранного:', error)
      return false
    }
  }

  // Переключение избранного (добавить/удалить)
  const toggleFavorite = async (query: string): Promise<boolean> => {
    const isFavorite = await checkFavorite(query)
    
    if (isFavorite) {
      return await removeFromFavorites(query)
    } else {
      return await addToFavorites(query)
    }
  }

  // Загружаем избранное при инициализации и изменении авторизации
  useEffect(() => {
    if (isAuthenticated && user?.telegram_id) {
      getFavorites()
    }
  }, [isAuthenticated, user?.telegram_id])

  return {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    checkFavorite,
    toggleFavorite,
    getFavorites,
  }
}
