import type { Category } from '@/shared/types/categories.interface'

export async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch('/api/admin/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Ошибка получения категорий:', error)
    return []
  }
}
