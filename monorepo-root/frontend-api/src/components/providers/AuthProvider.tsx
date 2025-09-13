'use client'

import { createContext, useContext, useState } from 'react'
import { API } from '@/config'

interface User {
  id: string
  username: string
  role: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(API.ADMIN.LOGIN(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login: username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setIsAuthenticated(true)
        // Сохраняем токен в localStorage
        if (data.token) {
          localStorage.setItem('authToken', data.token)
        }
        return { success: true }
      } else {
        return { success: false, message: data.error || 'Ошибка авторизации' }
      }
    } catch {
      return { success: false, message: 'Ошибка подключения к серверу' }
    }
  }

  const logout = async () => {
    try {
      // Очищаем куки через API
      await fetch(API.ADMIN.LOGOUT(), { method: 'POST' })
    } catch {
      // Игнорируем ошибки при выходе
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      // Очищаем токен из localStorage
      localStorage.removeItem('authToken')
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
