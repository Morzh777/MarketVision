/**
 * Конфигурация API роутов
 */

class ApiConfig {
  // Базовый URL API
  private get baseUrl() {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://marketvision-nginx-dev/api'
  }

  // Product Filter Service URL
  private get productFilterUrl() {
    return process.env.PRODUCT_FILTER_URL || 'http://marketvision-product-filter-dev:3001'
  }

  // Публичные API
  PRODUCTS = {
    POPULAR_QUERIES: () => `${this.baseUrl}/products/popular-queries`,
    SEARCH: () => `${this.baseUrl}/products/search`,
    DETAILS: (id: string) => `${this.baseUrl}/products/${id}`,
  }

  CATEGORIES = {
    LIST: () => `${this.baseUrl}/categories`,
    PRODUCTS: (category: string) => `${this.baseUrl}/categories/${category}/products`,
  }

  // Админские API
  ADMIN = {
    LOGIN: () => '/api/admin/login',
    LOGOUT: () => '/api/admin/logout',
    REFRESH: () => '/api/admin/refresh',
    USERS: () => `${this.baseUrl}/admin/users`,
    STATS: () => `${this.baseUrl}/admin/stats`,
  }

  // Системные API
  SYSTEM = {
    HEALTH: () => `${this.baseUrl}/health`,
    STATUS: () => `${this.baseUrl}/status`,
  }

  // Парсинг API
  PARSING = {
    TRIGGER: () => `${this.productFilterUrl}/parsing/trigger`,
  }

  // Утилиты для построения URL с параметрами
  buildUrl(endpoint: string, params?: Record<string, string | number>) {
    const url = new URL(endpoint)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value))
      })
    }
    return url.toString()
  }
}

export const API = new ApiConfig()
