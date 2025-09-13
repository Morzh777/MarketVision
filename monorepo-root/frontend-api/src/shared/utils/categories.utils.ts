import type { Product } from '@/shared/types/products.interface'

export interface Category {
  key: string
  display: string
}

/**
 * Извлекает уникальные категории из списка продуктов
 */
export function extractCategoriesFromProducts(products: Product[]): Category[] {
  // Получаем уникальные категории из продуктов
  const uniqueCategories = Array.from(
    new Set(products.map(product => product.category).filter(Boolean))
  )
  
  // Преобразуем в формат Category (display = key)
  return uniqueCategories.map(categoryKey => ({
    key: categoryKey,
    display: categoryKey
  }))
}
