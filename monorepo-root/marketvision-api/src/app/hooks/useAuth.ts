'use client'

import { useState, useEffect } from 'react'

import { User } from '../types/user.types'

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

/**
 * Хук для работы с аутентификацией
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)

      // Проверяем токен в localStorage
      const token = localStorage.getItem('auth-token')
      
      if (token) {
        // В реальном приложении здесь можно декодировать JWT
        setUser({
          id: 'admin',
          username: 'pavlishev',
          role: 'admin',
          createdAt: new Date()
        })
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setError(null)
      setIsLoading(true)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('auth-token', data.token)
        localStorage.setItem('marketvision_username', username)
        setUser(data.user)
        return true
      } else {
        setError(data.message || 'Ошибка входа')
        return false
      }
    } catch {
      setError('Ошибка сети. Попробуйте еще раз.')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Игнорируем ошибки при выходе
    } finally {
      // Очищаем данные
      localStorage.removeItem('auth-token')
      localStorage.removeItem('marketvision_username')
      document.cookie = 'auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
      
      setUser(null)
      window.location.href = '/auth'
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return {
    user,
    isLoading,
    error,
    login,
    logout
  }
} 