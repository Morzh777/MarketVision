/**
 * Dashboard Feature Module
 * 📊 Модуль дашборда и популярных запросов
 */

// Components
export { default as Sidebar } from './components/Sidebar/Sidebar'
export { default as PopularQueries } from './components/PopularQueries/PopularQueries'
export { default as QueryFilters } from './components/QueryFilters/QueryFilters'

// Hooks
export { useQuerySorting } from './hooks/useQuerySorting'
export { usePopularQueries } from './hooks/usePopularQueries'

// Services
export { DashboardService } from './services/dashboardService'

// Types
export type { PopularQuery, QueryFilter } from './types/dashboard.types'
