import { getQueriesForCategoryServer } from '@/utils/api/crud.utils'
import { QueryConfig, Category } from '@/shared/types/queries.interface'
import QueriesClient from './QueriesClient'

interface QueriesServerProps {
  categories: Category[]
  searchParams: { category?: string }
  authToken: string
}

export default async function QueriesServer({ 
  categories,
  searchParams,
  authToken
}: QueriesServerProps) {
  // Загружаем запросы для всех категорий на сервере
  const queriesByCategory: Record<string, QueryConfig[]> = {}
  
  for (const category of categories) {
    try {
      const data = await getQueriesForCategoryServer(category.key)
      queriesByCategory[category.key] = Array.isArray(data) ? data as QueryConfig[] : []
    } catch (error) {
      console.error(`Ошибка загрузки запросов для категории ${category.key}:`, error)
      queriesByCategory[category.key] = []
    }
  }

  // Определяем выбранную категорию из URL параметров
  const selectedCategoryKey = searchParams.category || categories[0]?.key || ''
  const selectedQueries = queriesByCategory[selectedCategoryKey] || []
  
  console.log('🔍 QueriesServer - selectedCategoryKey:', selectedCategoryKey)
  console.log('🔍 QueriesServer - selectedQueries count:', selectedQueries.length)
  console.log('🔍 QueriesServer - queriesByCategory keys:', Object.keys(queriesByCategory))

  return (
    <QueriesClient
      queriesByCategory={queriesByCategory}
      categories={categories}
      selectedCategoryKey={selectedCategoryKey}
      initialQueries={selectedQueries}
      authToken={authToken}
    />
  )
}
