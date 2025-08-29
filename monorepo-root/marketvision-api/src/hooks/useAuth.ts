import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

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

  // Если передан initialTelegramId, используем его
  useEffect(() => {
    if (initialTelegramId) {
      console.log('🔧 useAuth: Используем переданный telegram_id:', initialTelegramId)
      localStorage.setItem('telegram_id', initialTelegramId)
      setClientCookie('telegram_id_client', initialTelegramId)
      setAuthState({
        user: { telegram_id: initialTelegramId },
        isAuthenticated: true,
        isLoading: false
      })
      return
    }
  }, [initialTelegramId])

  useEffect(() => {
    console.log('🔄 useAuth: useEffect сработал', {
      searchParams: Object.fromEntries(searchParams.entries()),
      searchParamsSize: searchParams.size,
      hasTelegramId: searchParams.has('telegram_id'),
      telegramIdValue: searchParams.get('telegram_id'),
      timestamp: new Date().toISOString()
    })
    
    // Дополнительная диагностика для Telegram мини-приложения
    if (typeof window !== 'undefined') {
      console.log('🔍 useAuth: Дополнительная диагностика:', {
        location: window.location.href,
        hash: window.location.hash,
        search: window.location.search,
        userAgent: navigator.userAgent,
        referrer: document.referrer
      })
      
      // Проверяем все возможные источники Telegram ID
      const allParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      
      console.log('🔍 useAuth: Все URL параметры:', Object.fromEntries(allParams.entries()))
      console.log('🔍 useAuth: Hash параметры:', Object.fromEntries(hashParams.entries()))
    }
    
    // Проверяем localStorage при загрузке
    const telegramIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('telegram_id') : null
    if (telegramIdFromStorage) {
      console.log('✅ useAuth: Найден telegram_id в localStorage при загрузке:', telegramIdFromStorage)
      setClientCookie('telegram_id_client', telegramIdFromStorage)
      setAuthState({
        user: { telegram_id: telegramIdFromStorage },
        isAuthenticated: true,
        isLoading: false
      })
      return
    }
    
    // Если нет в localStorage - проверяем URL и cookie
    checkAuth()
  }, [searchParams])

  // Дополнительный useEffect для проверки localStorage при первой загрузке
  useEffect(() => {
    console.log('🔄 useAuth: Первая загрузка - проверяем localStorage')
    const telegramIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('telegram_id') : null
    if (telegramIdFromStorage) {
      console.log('✅ useAuth: Найден telegram_id в localStorage при первой загрузке:', telegramIdFromStorage)
      setClientCookie('telegram_id_client', telegramIdFromStorage)
      setAuthState({
        user: { telegram_id: telegramIdFromStorage },
        isAuthenticated: true,
        isLoading: false
      })
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }, [])

  const checkAuth = async (): Promise<void> => {
    console.log('🚀 useAuth: checkAuth вызван')
    
    // 1) URL параметр
    const telegramIdFromUrl = searchParams.get('telegram_id')
    if (telegramIdFromUrl) {
      console.log('✅ useAuth: Найден telegram_id в URL:', telegramIdFromUrl)
      localStorage.setItem('telegram_id', telegramIdFromUrl)
      setClientCookie('telegram_id_client', telegramIdFromUrl)
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
        console.log(`🔍 useAuth: Найден параметр ${param}:`, value)
        // Пытаемся извлечь ID из различных форматов
        let telegramId = value
        
        // Если это JSON строка, пытаемся распарсить
        try {
          const parsed = JSON.parse(value)
          if (parsed.id || parsed.user_id || parsed.telegram_id) {
            telegramId = parsed.id || parsed.user_id || parsed.telegram_id
            console.log('✅ useAuth: Извлечен telegram_id из JSON:', telegramId)
          }
        } catch {
          // Если не JSON, проверяем на числовой ID
          if (/^\d+$/.test(value)) {
            telegramId = value
            console.log('✅ useAuth: Найден числовой telegram_id:', telegramId)
          }
        }
        
        if (telegramId && telegramId !== value) {
          localStorage.setItem('telegram_id', telegramId)
          setClientCookie('telegram_id_client', telegramId)
          setAuthState({
            user: { telegram_id: telegramId },
            isAuthenticated: true,
            isLoading: false
          })
          return
        }
      }
    }

    // 3) localStorage (повторная проверка на случай первой загрузки без URL)
    const telegramIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('telegram_id') : null
    if (telegramIdFromStorage) {
      console.log('✅ useAuth: Найден telegram_id в localStorage:', telegramIdFromStorage)
      setClientCookie('telegram_id_client', telegramIdFromStorage)
      
      // Обновляем URL чтобы сервер мог получить telegram_id
      if (typeof window !== 'undefined' && window.location.search !== `?telegram_id=${telegramIdFromStorage}`) {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('telegram_id', telegramIdFromStorage)
        window.history.replaceState({}, '', newUrl.toString())
        console.log('🔧 useAuth: Обновлен URL с telegram_id из localStorage:', newUrl.toString())
      }
      
      setAuthState({
        user: { telegram_id: telegramIdFromStorage },
        isAuthenticated: true,
        isLoading: false
      })
      return
    }

    // 4) Клиентский cookie (устанавливается edge middleware)
    const telegramIdFromCookie = getClientCookie('telegram_id_client')
    if (telegramIdFromCookie) {
      console.log('✅ useAuth: Найден telegram_id в cookie:', telegramIdFromCookie)
      localStorage.setItem('telegram_id', telegramIdFromCookie)
      
      // Обновляем URL чтобы сервер мог получить telegram_id
      if (typeof window !== 'undefined' && window.location.search !== `?telegram_id=${telegramIdFromCookie}`) {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('telegram_id', telegramIdFromCookie)
        window.history.replaceState({}, '', newUrl.toString())
        console.log('🔧 useAuth: Обновлен URL с telegram_id из cookie:', newUrl.toString())
      }
      
      setAuthState({
        user: { telegram_id: telegramIdFromCookie },
        isAuthenticated: true,
        isLoading: false
      })
      return
    }

    // 5) Проверяем window.location для Telegram мини-приложения
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      const hashParams = new URLSearchParams(url.hash.substring(1))
      const tgWebAppData = hashParams.get('tgWebAppData')
      
      if (tgWebAppData) {
        console.log('🔍 useAuth: Найден tgWebAppData в hash:', tgWebAppData)
        
        try {
          // Парсим tgWebAppData
          const decodedData = decodeURIComponent(tgWebAppData)
          console.log('🔍 useAuth: Декодированный tgWebAppData:', decodedData)
          
          // Ищем user параметр
          const userMatch = decodedData.match(/user=([^&]+)/)
          if (userMatch) {
            const userData = decodeURIComponent(userMatch[1])
            console.log('🔍 useAuth: Найден user параметр:', userData)
            
            try {
              const user = JSON.parse(userData)
              if (user.id) {
                const telegramId = user.id.toString()
                console.log('✅ useAuth: Извлечен telegram_id из tgWebAppData:', telegramId)
                
                localStorage.setItem('telegram_id', telegramId)
                setClientCookie('telegram_id_client', telegramId)
                
                // Обновляем URL чтобы сервер мог получить telegram_id
                if (typeof window !== 'undefined' && window.location.search !== `?telegram_id=${telegramId}`) {
                  const newUrl = new URL(window.location.href)
                  newUrl.searchParams.set('telegram_id', telegramId)
                  window.history.replaceState({}, '', newUrl.toString())
                  console.log('🔧 useAuth: Обновлен URL с telegram_id:', newUrl.toString())
                }
                
                setAuthState({
                  user: { telegram_id: telegramId },
                  isAuthenticated: true,
                  isLoading: false
                })
                return
              }
            } catch (parseError) {
              console.log('⚠️ useAuth: Ошибка парсинга user JSON:', parseError)
            }
          }
        } catch (decodeError) {
          console.log('⚠️ useAuth: Ошибка декодирования tgWebAppData:', decodeError)
        }
      }
      
      // Fallback - проверяем обычные hash параметры
      const telegramIdFromHash = hashParams.get('telegram_id') || hashParams.get('user_id') || hashParams.get('id')
      
      if (telegramIdFromHash) {
        console.log('✅ useAuth: Найден telegram_id в hash:', telegramIdFromHash)
        localStorage.setItem('telegram_id', telegramIdFromHash)
        setClientCookie('telegram_id_client', telegramIdFromHash)
        setAuthState({
          user: { telegram_id: telegramIdFromHash },
          isAuthenticated: true,
          isLoading: false
        })
        return
      }
    }

    // Нет идентификатора — считаем неавторизованным
    console.log('❌ useAuth: Пользователь не авторизован')
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }

  const login = async (telegram_id: string): Promise<boolean> => {
    try {
      console.log('🔐 useAuth: Локальная авторизация для telegram_id:', telegram_id)
      localStorage.setItem('telegram_id', telegram_id)
      setClientCookie('telegram_id_client', telegram_id)
      setAuthState({
        user: { telegram_id },
        isAuthenticated: true,
        isLoading: false
      })
      return true
    } catch (error) {
      console.error('❌ useAuth: Ошибка локальной авторизации:', error)
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
      localStorage.removeItem('telegram_id')
      setClientCookie('telegram_id_client', '', -1)
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
