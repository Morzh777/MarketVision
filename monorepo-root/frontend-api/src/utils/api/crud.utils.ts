import { API_ENDPOINTS, createApiUrl } from '@/constants/api'

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
    const url = createApiUrl(`${API_ENDPOINTS.ADMIN}${options.endpoint}`)
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
    const url = createApiUrl(`${API_ENDPOINTS.ADMIN}${options.endpoint}/${id}`)
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
    const response = await fetch(createApiUrl(`${API_ENDPOINTS.ADMIN}${options.endpoint}/${id}`), {
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
    const response = await fetch(createApiUrl(`${API_ENDPOINTS.ADMIN}${options.endpoint}`), {
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

// Функция для получения запросов на сервере (SSR)
export async function getQueriesForCategoryServer(categoryKey: string): Promise<unknown[]> {
  try {
    // На сервере обращаемся напрямую к nginx
    const url = createApiUrl(`/api/admin/queries?categoryKey=${categoryKey}`)
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

// Функция для создания запроса (клиент)
export async function createQuery(data: CrudData): Promise<CrudResponse> {
  try {
    console.log('🔍 createQuery - исходные данные:', data)
    
    // Преобразуем данные в формат, ожидаемый DB API
    const queryData = {
      categoryKey: data.category, // DB API ожидает categoryKey, а не category
      query: data.query,
      platform: data.platform || 'both', // DB API ожидает 'both' для создания обеих платформ
      recommended_price: data.recommended_price || null,
      // Отдельные данные для каждой платформы
      ozon_platform: data.ozon_platform || null,
      ozon_exact: data.ozon_exact || null,
      wb_platform: data.wb_platform || null,
      wb_exact: data.wb_exact || null,
    }
    
    console.log('🔍 createQuery - преобразованные данные:', queryData)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    const response = await fetch('/api/admin/queries', {
      method: 'POST',
      headers,
      credentials: 'include', // Передаем cookies
      body: JSON.stringify(queryData),
    })

    const result = await response.json()
    console.log('🔍 createQuery - ответ от API:', { status: response.status, result })

    if (response.ok) {
      return {
        success: true,
        data: result,
        message: 'Запрос успешно создан'
      }
    }

    return {
      success: false,
      error: result.error || 'Ошибка создания запроса'
    }
  } catch (error) {
    console.error('Ошибка создания запроса:', error)
    return {
      success: false,
      error: 'Ошибка подключения к серверу'
    }
  }
}

// Функция для обновления запроса (клиент)
export async function updateQuery(id: string, data: CrudData): Promise<CrudResponse> {
  try {
    console.log('🔍 updateQuery - ID:', id, 'данные:', data)
    
    // Используем групповое обновление по названию запроса и категории
    const query = data.query
    const oldQuery = data.oldQuery || data.query // Если есть старое название, используем его для поиска
    const categoryKey = data.categoryKey || data.category
    
    // Преобразуем данные в формат, ожидаемый DB API
    const queryData = {
      query: query, // Новое название запроса
      ozon_platform: data.ozon_platform || null,
      ozon_exact: data.ozon_exact || null,
      wb_platform: data.wb_platform || null,
      wb_exact: data.wb_exact || null,
      recommended_price: data.recommended_price || null,
    }
    
    console.log('🔍 updateQuery - преобразованные данные:', queryData)
    
    if (!query || !categoryKey) {
      return {
        success: false,
        error: 'Недостаточно данных для обновления (query и categoryKey обязательны)'
      }
    }
    
    // Используем старое название для поиска записей, если оно есть
    const searchQuery = oldQuery || query
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    const response = await fetch(`/api/admin/queries/query/${encodeURIComponent(searchQuery)}?categoryKey=${categoryKey}`, {
      method: 'PUT',
      headers,
      credentials: 'include', // Передаем cookies
      body: JSON.stringify(queryData),
    })

    const result = await response.json()
    console.log('🔍 updateQuery - ответ от API:', { status: response.status, result })

    if (response.ok) {
      return {
        success: true,
        data: result,
        message: 'Запрос успешно обновлен'
      }
    }

    return {
      success: false,
      error: result.error || 'Ошибка обновления запроса'
    }
  } catch (error) {
    console.error('Ошибка обновления запроса:', error)
    return {
      success: false,
      error: 'Ошибка подключения к серверу'
    }
  }
}

// Функция для удаления запроса (клиент)
export async function deleteQuery(id: string, queryName?: string, categoryKey?: string): Promise<CrudResponse> {
  try {
    console.log('🔍 deleteQuery - ID:', id, 'queryName:', queryName, 'categoryKey:', categoryKey)
    
    let query = queryName
    let category = categoryKey
    
    // Если не переданы название и категория, пытаемся получить их по ID
    if (!query || !category) {
      console.log('🔍 Получаем информацию о запросе по ID')
      const getResponse = await fetch(`/api/admin/queries/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!getResponse.ok) {
        console.log('❌ Не удалось получить информацию о запросе по ID')
        return {
          success: false,
          error: 'Не удалось получить информацию о запросе'
        }
      }

      const queryInfo = await getResponse.json()
      console.log('🔍 Информация о запросе для удаления:', queryInfo)
      query = queryInfo.query
      category = queryInfo.category.key
    }

    if (!query || !category) {
      console.log('❌ Недостаточно данных для удаления')
      return {
        success: false,
        error: 'Недостаточно данных для удаления'
      }
    }

    // Удаляем все записи с этим названием запроса в категории
    const response = await fetch(`/api/admin/queries/path/${encodeURIComponent(query)}?categoryKey=${category}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()
    console.log('🔍 deleteQuery - ответ от API:', { status: response.status, result })

    if (response.ok) {
      return {
        success: true,
        data: result,
        message: 'Запрос успешно удален'
      }
    }

    return {
      success: false,
      error: result.error || 'Ошибка удаления запроса'
    }
  } catch (error) {
    console.error('Ошибка удаления запроса:', error)
    return {
      success: false,
      error: 'Ошибка подключения к серверу'
    }
  }
}

