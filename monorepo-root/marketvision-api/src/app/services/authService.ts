import jwt from 'jsonwebtoken'

import { LoginRequest, AuthResponse } from '../types/user.types'

const JWT_SECRET = process.env.JWT_SECRET || 'marketvision-secret-key'
const DB_API_URL = process.env.DB_API_URL || 'http://localhost:3003'

/**
 * Сервис для работы с аутентификацией
 */
export class AuthService {
  private static instance: AuthService

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Авторизация пользователя
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${DB_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (!data.success) {
        return {
          success: false,
          message: data.message || 'Неверный логин или пароль'
        }
      }

      const token = jwt.sign(
        { 
          userId: data.user.id, 
          username: data.user.username, 
          role: data.user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      )

      return {
        success: true,
        user: data.user,
        token
      }
    } catch {
      return {
        success: false,
        message: 'Ошибка соединения с сервером'
      }
    }
  }

  /**
   * Валидация JWT токена
   */
  validateToken(token: string): { userId: string; username: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string; role: string }
      return decoded
    } catch {
      return null
    }
  }
} 