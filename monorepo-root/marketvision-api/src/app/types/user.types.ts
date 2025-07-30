/**
 * Типы для системы аутентификации
 */

export interface User {
  id: string
  username: string
  role: 'admin'
  createdAt: Date
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: string
  message?: string
} 