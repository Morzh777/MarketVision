import type { CategoryFormData } from '@/shared/schemas/category.schema'
import type { QueryFormData as QuerySchemaData } from '@/shared/schemas/query.schema'
import type { QueryConfig, CreateQueryRequest, UpdateQueryRequest } from '@/shared/types/queries.interface'

// Импортируем типы из queries.interface.ts
export type { CreateQueryRequest, UpdateQueryRequest } from '@/shared/types/queries.interface'

// Данные редактируемого запроса
export interface EditingQuery extends QueryConfig {
  categoryKey: string
  isGroup?: boolean // Флаг, что это группа запросов
  groupIds?: number[] // ID всех запросов в группе
}

// Interface for editing category (from API response)
export interface EditingCategory {
  id: number
  key: string
  display: string
  ozon_id?: string | null
  wb_id?: string | null
}

// Props for the AddModal component
export interface AddModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (category: { key: string; display: string; ozon_id?: string; wb_id?: string }) => void
  editingCategory?: EditingCategory | null
  // Для запросов
  mode?: 'category' | 'query'
  categories?: Array<{ key: string; display: string }>
  selectedCategoryKey?: string
  onAddQuery?: (query: CreateQueryRequest) => void
  onUpdateQuery?: (query: UpdateQueryRequest) => void
  editingQuery?: EditingQuery | null
}
