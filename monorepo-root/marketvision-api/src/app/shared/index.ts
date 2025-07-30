/**
 * Shared Module
 * 🔄 Общие компоненты, хуки и утилиты
 */

// UI Components
export { ErrorBoundary } from './components/UI/ErrorBoundary'
export { LoadingSpinner } from './components/UI/LoadingSpinner'
export { Button } from './components/UI/Button'

// Layout Components
export { Header } from './components/Layout/Header'
export { Footer } from './components/Layout/Footer'

// Modal Components
export { Modal } from './components/Modals/Modal'
export { ImageModal } from './components/Modals/ImageModal'

// Hooks
export { useLocalStorage } from './hooks/useLocalStorage'
export { useDebounce } from './hooks/useDebounce'

// Services
export { ApiService } from './services/apiService'

// Utils
export { formatPrice } from './utils/formatPrice'
export { createSearchVariants } from './utils/transliteration'

// Types
export type { ApiResponse, PaginatedResponse } from './types/api.types'
