import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

interface User {
  telegram_id: string
  username?: string
  first_name?: string
  last_name?: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export function useAuth(initialTelegramId?: string) {
  const searchParams = useSearchParams()
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  const setClientCookie = (name: string, value: string, days = 7): void => {
    try {
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax` 
    } catch {}
  }

  const getClientCookie = (name: string): string | null => {
    try {
      const cookies = document.cookie?.split(';') ?? []
      for (const cookie of cookies) {
        const [k, v] = cookie.trim().split('=')
        if (k === name) return decodeURIComponent(v || '')
      }
      return null
    } catch {
      return null
    }
  }

  const checkAuth = useCallback(async (): Promise<void> => {
    // 1) URL параметр
    const telegramIdFromUrl = searchParams.get('telegram_id')
    if (telegramIdFromUrl) {
      setClientCookie('telegram_id', telegramIdFromUrl)
      setAuthState({
        user: { telegram_id: telegramIdFromUrl },
        isAuthenticated: true,
        isLoading: false
      })
      return
    }

    // 2) Проверяем все возможные URL параметры для Telegram мини-приложения
    const possibleParams = ['tgWebAppData', 'tgWebAppStartParam', 'user', 'id', 'user_id']
    for (const param of possibleParams) {
      const value = searchParams.get(param)
      if (value) {
        // Пытаемся извлечь ID из различных форматов
        let telegramId = value
        
        // Если это JSON строка, пытаемся распарсить
        try {
          const parsed = JSON.parse(value)
          if (parsed.id || parsed.user_id || parsed.telegram_id) {
            telegramId = parsed.id || parsed.user_id || parsed.telegram_id
          }
        } catch {
          // Если не JSON, проверяем на числовой ID
          if (/^\d+$/.test(value)) {
            telegramId = value
          }
        }
        
        if (telegramId && telegramId !== value) {
          setClientCookie('telegram_id', telegramId)
          setAuthState({
            user: { telegram_id: telegramId },
            isAuthenticated: true,
            isLoading: false
          })
          return
        }
      }
    }

    // 3) Проверяем клиентское cookie
    const telegramIdFromClientCookie = getClientCookie('telegram_id')
    if (telegramIdFromClientCookie) {
      setAuthState({
        user: { telegram_id: telegramIdFromClientCookie },
        isAuthenticated: true,
        isLoading: false
      })
      return
    }

    // 4) Если ничего не найдено - не авторизован
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })

    // 5) Проверяем window.location для Telegram мини-приложения
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(url.hash.substring(1))
      const tgWebAppData = hashParams.get('tgWebAppData')
      
      if (tgWebAppData) {
        try {
          // Парсим tgWebAppData
          const decodedData = decodeURIComponent(tgWebAppData)
          
          // Ищем user параметр
          const userMatch = decodedData.match(/user=([^&]+)/)
          if (userMatch) {
            const userData = decodeURIComponent(userMatch[1])
            
            try {
              const user = JSON.parse(userData)
              if (user.id) {
                const telegramId = user.id.toString()
                
                localStorage.setItem('telegram_id', telegramId)
                setClientCookie('telegram_id', telegramId)
                
                setAuthState({
                  user: { telegram_id: telegramId },
                  isAuthenticated: true,
                  isLoading: false
                })
                return
              }
            } catch {
              // Игнорируем ошибки парсинга
            }
          }
        } catch {
          // Игнорируем ошибки декодирования
        }
      }
      
      // Fallback - проверяем обычные hash параметры
      const telegramIdFromHash = hashParams.get('telegram_id') || hashParams.get('user_id') || hashParams.get('id')
      
      if (telegramIdFromHash) {
        localStorage.setItem('telegram_id', telegramIdFromHash)
        setClientCookie('telegram_id', telegramIdFromHash)
        setAuthState({
          user: { telegram_id: telegramIdFromHash },
          isAuthenticated: true,
          isLoading: false
        })
        return
      }
    }

    // Нет идентификатора — считаем неавторизованным
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }, [searchParams])

  // Если передан initialTelegramId, используем его
  useEffect(() => {
    if (initialTelegramId) {
      setClientCookie('telegram_id', initialTelegramId)
      setAuthState({
        user: { telegram_id: initialTelegramId },
        isAuthenticated: true,
        isLoading: false
      })
      return
    }
  }, [initialTelegramId])

  useEffect(() => {
    // Проверяем аутентификацию при загрузке
    checkAuth()
  }, [searchParams, checkAuth])

  const login = async (telegram_id: string): Promise<boolean> => {
    try {
      setClientCookie('telegram_id', telegram_id)
      setAuthState({
        user: { telegram_id },
        isAuthenticated: true,
        isLoading: false
      })
      return true
    } catch {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
      return false
    }
  }

  const logout = (): void => {
    try {
      setClientCookie('telegram_id', '', -1)
    } finally {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }

  return {
    ...authState,
    login,
    logout
  }
}
