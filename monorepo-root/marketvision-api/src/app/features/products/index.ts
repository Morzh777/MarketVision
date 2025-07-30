/**
 * Products Feature Module
 * 🛒 Модуль товаров и каталога
 */

// Components
export { default as ProductCard } from './components/ProductCard/ProductCard'
export { default as ProductList } from './components/ProductList/ProductList'
export { default as ProductDetail } from './components/ProductDetail/ProductDetail'
export { default as ProductFilters } from './components/ProductFilters/ProductFilters'

// Hooks
export { useProducts } from './hooks/useProducts'
export { useProductDetail } from './hooks/useProductDetail'

// Services
export { ProductService } from './services/productService'

// Types
export type { Product, ProductFilter, ProductStats } from './types/product.types'
