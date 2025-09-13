// Интерфейсы для категорий по стандарту DB API

// Основной интерфейс категории
export interface Category {
  id: number
  key: string
  display: string
  ozon_id?: string | null
  wb_id?: string | null
  created_at?: string
  updated_at?: string
}

// Форма для создания/редактирования категории
export interface CategoryForm {
  key: string
  display: string
  ozon_id: string
  wb_id: string
}

// Пропсы для серверного компонента Categories
export interface CategoriesProps {
  onCategorySelect?: (category: Category) => void
  selectedCategoryKey?: string
}

// Пропсы для клиентского компонента CategoriesClient
export interface CategoriesClientProps {
  initialCategories: Category[]
  error: string | null
  onCategorySelect?: (category: Category) => void
  selectedCategoryKey?: string
}

// Ответ API для создания/обновления категории
export interface CategoryResponse {
  success: boolean
  message?: string
  category?: Category
}

// Ответ API для удаления категории
export interface CategoryDeleteResponse {
  success: boolean
  message?: string
}

// Ошибка API
export interface CategoryError {
  message: string
  code?: string
  details?: unknown
}
