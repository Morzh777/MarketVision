import { useState, useEffect } from 'react'

interface Favorite {
  id: number
  query: string
  created_at: string
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Получение избранного
  const getFavorites = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/favorites')
      
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
    try {
      const response = await fetch('/api/auth/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
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
    try {
      const response = await fetch('/api/auth/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
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
    try {
      const response = await fetch(`/api/auth/favorites/check?query=${encodeURIComponent(query)}`)
      
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

  // Загружаем избранное при инициализации
  useEffect(() => {
    getFavorites()
  }, [])

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
