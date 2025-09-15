import { INTERNAL_API_URL } from '@/constants/api'
/**
 * Конфигурация переменных окружения
 */

export const config = {
  // API
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || `${INTERNAL_API_URL}/api`,
  API_URL: process.env.NEXT_PUBLIC_API_URL || INTERNAL_API_URL,
  
  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  
  // App
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'MarketVision',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010',
  
  // Features
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Cache
  CACHE_TTL: 300, // 5 minutes
  REVALIDATE_TTL: 60, // 1 minute
} as const

export type Config = typeof config
