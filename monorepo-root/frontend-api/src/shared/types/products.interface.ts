// Интерфейс продукта по стандарту DB API
export interface Product {
  id: string
  name: string
  price: number
  image_url: string
  product_url: string
  category?: string
  source: string
  query: string
  created_at: string
  priceChangePercent: number
  marketStats?: {
    min: number
    max: number
    mean: number
    median: number
    iqr: [number, number]
  }
}

// Интерфейс для популярных запросов (эндпоинт /products/popular-queries)
export interface Products {
  query: string
  minPrice: number
  id: string
  priceChangePercent: number
  image_url: string
  category?: string
  isFavorite: boolean
}

// Интерфейс для рыночной статистики
export interface MarketStats {
  min: number
  max: number
  mean: number
  median: number
  iqr: number
  total_count: number
  query: string
  category: string
  source: string
  product_id: string
  created_at: string
}

// Интерфейс для истории цен
export interface PriceHistoryItem {
  price: number | null
  created_at: string
}

// Интерфейс ответа для эндпоинта /products/products-by-query/:query
export interface ProductsByQueryResponse {
  products: Product[]
  marketStats: MarketStats | null
  priceHistory: PriceHistoryItem[]
}
