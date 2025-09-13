import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/settings';

export interface User {
  id: string;
  username: string;
  role: string;
}

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtService {
  /**
   * Валидирует JWT токен
   * @param token - JWT токен
   * @returns декодированные данные токена или null
   */
  validateToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'marketvision-api',
        audience: 'marketvision-client',
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      console.error(
        '❌ JWT validation error:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    }
  }

  /**
   * Извлекает данные пользователя из токена
   * @param token - JWT токен
   * @returns данные пользователя или null
   */
  getUserFromToken(token: string): User | null {
    const decoded = this.validateToken(token);
    if (!decoded) return null;

    return {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    };
  }

  /**
   * Проверяет, не истек ли токен
   * @param token - JWT токен
   * @returns true если токен валиден и не истек
   */
  isTokenValid(token: string): boolean {
    const decoded = this.validateToken(token);
    return decoded !== null;
  }

  /**
   * Создает JWT токен для пользователя
   * @param user - данные пользователя
   * @param expiresIn - время жизни токена
   * @returns JWT токен
   */
  createToken(user: User, expiresIn: string = '15m'): string {
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn,
      issuer: 'marketvision-api',
      audience: 'marketvision-client',
    } as jwt.SignOptions);
  }

  /**
   * Создает пару токенов (access + refresh)
   * @param user - данные пользователя
   * @returns объект с токенами
   */
  createTokenPair(user: User): { auth: string; refresh_token: string } {
    const auth = this.createToken(user, '15m'); // Возвращено на 15 минут
    const refresh_token = this.createToken(user, '7d');

    return {
      auth,
      refresh_token,
    };
  }
}
