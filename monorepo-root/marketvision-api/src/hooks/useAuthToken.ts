'use client'

import { useState, useEffect } from 'react'

interface AuthUser {
  id: string
  username: string
  role: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuthToken() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true
  })

  // Загружаем токен из localStorage при инициализации
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('auth_user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false
        })
      } catch (error) {
        console.error('Ошибка парсинга пользователя из localStorage:', error)
        // Очищаем поврежденные данные
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
    } else {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }, [])

  // Функция для входа
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success && data.token) {
        // Сохраняем в localStorage
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_user', JSON.stringify(data.user))
        
        setAuthState({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false
        })
        
        return { success: true, user: data.user }
      } else {
        return { success: false, message: data.message || 'Ошибка входа' }
      }
    } catch (error) {
      console.error('Ошибка входа:', error)
      return { success: false, message: 'Ошибка сети' }
    }
  }

  // Функция для выхода
  const logout = async () => {
    try {
      // Отправляем запрос на сервер для логаута
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        },
      })
    } catch (error) {
      console.error('Ошибка логаута:', error)
    } finally {
      // Очищаем localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }

  // Функция для проверки токена
  const verifyToken = async () => {
    if (!authState.token) {
      return false
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authState.token}`,
        },
      })

      const data = await response.json()

      if (data.success) {
        // Обновляем данные пользователя
        localStorage.setItem('auth_user', JSON.stringify(data.user))
        setAuthState(prev => ({
          ...prev,
          user: data.user
        }))
        return true
      } else {
        // Токен недействителен, выходим
        logout()
        return false
      }
    } catch (error) {
      console.error('Ошибка проверки токена:', error)
      logout()
      return false
    }
  }

  return {
    ...authState,
    login,
    logout,
    verifyToken
  }
}
