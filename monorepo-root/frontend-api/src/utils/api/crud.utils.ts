import { API_ENDPOINTS, API_BASE_URL } from '@/constants/api'

export interface CrudResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface CrudOptions {
  endpoint: string
  authToken: string
}

export interface CrudData {
  [key: string]: string | number | boolean | null | undefined
}

/**
 * Универсальная функция для создания записи
 */
export async function createRecord<T = unknown>(
  data: CrudData,
  options: CrudOptions
): Promise<CrudResponse<T>> {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.ADMIN}${options.endpoint}`
    console.log('🔄 createRecord URL:', url)
    console.log('🔄 createRecord data:', data)
    console.log('🔄 createRecord authToken:', options.authToken ? 'present' : 'missing')
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.authToken}`,
      },
      body: JSON.stringify(data),
    })

    console.log('📡 createRecord response status:', response.status)
    console.log('📡 createRecord response headers:', Object.fromEntries(response.headers.entries()))
    
    const result = await response.json()
    console.log('📡 createRecord response result:', result)

    if (response.ok) {
      return {
        success: true,
        data: result,
        message: 'Запись успешно создана'
      }
    }

    return {
      success: false,
      error: result.error || 'Ошибка создания записи'
    }
  } catch (error) {
    console.error('Ошибка создания записи:', error)
    return {
      success: false,
      error: 'Ошибка подключения к серверу'
    }
  }
}

/**
 * Универсальная функция для обновления записи
 */
export async function updateRecord<T = unknown>(
  id: string,
  data: CrudData,
  options: CrudOptions
): Promise<CrudResponse<T>> {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.ADMIN}${options.endpoint}/${id}`
    console.log('🔄 updateRecord called:', { id, data, url })
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.authToken}`,
      },
      body: JSON.stringify(data),
    })

    console.log('📡 updateRecord response:', { status: response.status, ok: response.ok })
    const result = await response.json()
    console.log('📄 updateRecord result:', result)

    if (response.ok) {
      return {
        success: true,
        data: result,
        message: 'Запись успешно обновлена'
      }
    }

    return {
      success: false,
      error: result.error || 'Ошибка обновления записи'
    }
  } catch (error) {
    console.error('❌ Ошибка обновления записи:', error)
    return {
      success: false,
      error: 'Ошибка подключения к серверу'
    }
  }
}

/**
 * Универсальная функция для удаления записи
 */
export async function deleteRecord<T = unknown>(
  id: string,
  options: CrudOptions
): Promise<CrudResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN}${options.endpoint}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.authToken}`,
      },
    })

    const result = await response.json()

    if (response.ok) {
      return {
        success: true,
        data: result,
        message: 'Запись успешно удалена'
      }
    }

    return {
      success: false,
      error: result.error || 'Ошибка удаления записи'
    }
  } catch (error) {
    console.error('Ошибка удаления записи:', error)
    return {
      success: false,
      error: 'Ошибка подключения к серверу'
    }
  }
}

/**
 * Универсальная функция для получения списка записей
 */
export async function getRecords<T = unknown>(
  options: Omit<CrudOptions, 'authToken'>
): Promise<CrudResponse<T[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.ADMIN}${options.endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (response.ok) {
      return {
        success: true,
        data: result,
        message: 'Записи успешно получены'
      }
    }

    return {
      success: false,
      error: result.error || 'Ошибка получения записей'
    }
  } catch (error) {
    console.error('Ошибка получения записей:', error)
    return {
      success: false,
      error: 'Ошибка подключения к серверу'
    }
  }
}

/**
 * Специализированные функции для категорий
 */
export const categoryApi = {
  create: (data: CrudData, authToken: string) => 
    createRecord(data, { endpoint: '/categories', authToken }),
  
  update: (id: string, data: CrudData, authToken: string) => 
    updateRecord(id, data, { endpoint: '/categories', authToken }),
  
  delete: (id: string, authToken: string) => 
    deleteRecord(id, { endpoint: '/categories', authToken }),
  
  getAll: () => 
    getRecords({ endpoint: '/categories' })
}

/**
 * Специализированные функции для запросов
 */
export const queryApi = {
  create: (data: CrudData, authToken: string) => 
    createRecord(data, { endpoint: '/queries', authToken }),
  
  update: (id: string, data: CrudData, authToken: string) => 
    updateRecord(id, data, { endpoint: '/queries', authToken }),
  
  delete: (id: string, authToken: string) => 
    deleteRecord(id, { endpoint: '/queries', authToken }),
  
  getAll: () => 
    getRecords({ endpoint: '/queries' })
}

// Специализированная функция для получения запросов по категории (клиент)
export async function getQueriesForCategory(categoryKey: string): Promise<unknown[]> {
  try {
    // Используем локальный API роут вместо прямого обращения к nginx
    const url = `/api/queries/category/${categoryKey}`
    console.log('🔍 getQueriesForCategory URL:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    // API роут возвращает массив напрямую, а не объект с полем queries
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Ошибка получения запросов:', error)
    throw error
  }
}

// Функция для получения запросов на сервере (SSR)
export async function getQueriesForCategoryServer(categoryKey: string): Promise<unknown[]> {
  try {
    // На сервере обращаемся напрямую к nginx
    const url = `http://marketvision-nginx-dev/api/admin/queries?categoryKey=${categoryKey}`
    console.log('🔍 getQueriesForCategoryServer URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Добавляем настройки для избежания ошибок с URL схемами
      cache: 'no-store',
      next: { revalidate: 0 }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    // API возвращает массив напрямую, а не объект с полем queries
    return Array.isArray(data) ? data : []
  } catch (error) {
    // Игнорируем ошибки URL схемы, но логируем их
    if (error instanceof Error && error.message.includes('Unknown url scheme')) {
      console.warn('⚠️ URL scheme error (ignored):', error.message)
      return [] // Возвращаем пустой массив вместо ошибки
    }
    console.error('Ошибка получения запросов на сервере:', error)
    throw error
  }
}
