import { createApiUrl, API_ENDPOINTS } from '@/constants/api'
import CategoryMenuClient from './CategoryMenuClient'

interface Category {
  key: string
  display: string
}

export default async function CategoryMenu() {
  // Загружаем категории на сервере
  let categories: Category[] = []
  
  try {
    const response = await fetch(createApiUrl(API_ENDPOINTS.CATEGORIES), {
      next: { revalidate: 300 } // Кэшируем на 5 минут
    })
    
    if (response.ok) {
      categories = await response.json()
    } else {
      console.error('Failed to fetch categories')
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
  }

  return (
    <CategoryMenuClient 
      categories={categories}
    />
  )
}