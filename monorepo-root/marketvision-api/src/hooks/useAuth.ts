import { useState, useEffect } from 'react'

interface User {
  telegram_id: string
  username?: string
  first_name?: string
  last_name?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // Авторизация через telegram_id
  const login = async (telegram_id: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegram_id }),
      })

      if (!response.ok) {
        throw new Error('Ошибка авторизации')
      }

      const data = await response.json()
      
      if (data.success) {
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
        })
        return true
      } else {
        throw new Error(data.message || 'Ошибка авторизации')
      }
    } catch (error) {
      console.error('Ошибка входа:', error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
      return false
    }
  }

  // Выход
  const logout = async (): Promise<void> => {
    try {
      // Удаляем cookie через API
      await fetch('/api/auth/telegram', { method: 'DELETE' })
    } catch (error) {
      console.error('Ошибка выхода:', error)
    } finally {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  // Проверка авторизации при загрузке
  const checkAuth = async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }))
      
      const response = await fetch('/api/auth/telegram')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAuthState({
            user: data.user,
            isLoading: false,
            isAuthenticated: true,
          })
          return
        }
      }
      
      // Не авторизован
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error)
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })
    }
  }

  // Проверяем авторизацию при загрузке компонента
  useEffect(() => {
    checkAuth()
  }, [])

  return {
    ...authState,
    login,
    logout,
    checkAuth,
  }
}
