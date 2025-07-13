export interface RawProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  category: string;
  source: string;
  query: string; // запрос, на который получен ответ
}

export interface ProcessedProduct extends RawProduct {
  filter_result: FilterResult;
  processed_at: number;
}

export interface FilterResult {
  is_valid: boolean;
  reason: string;
  applied_rules: string[];
}

export interface FilterConfig {
  // Убираем неиспользуемые правила
}

export interface FilterProductsRequest {
  products: RawProduct[];
  query: string;
  all_queries: string[];
  exclude_keywords: string[];
  config: FilterConfig;
  source: string;
  category: string;
  exactmodels?: string; // <-- добавлено поле для фильтрации по модели
}

export interface FilterProductsResponse {
  products: ProcessedProduct[];
  total_input: number;
  total_filtered: number;
  processing_time_ms: number;
}

export interface CacheProductsRequest {
  cache_key: string;
  products: ProcessedProduct[];
  ttl_seconds: number;
}

export interface CacheProductsResponse {
  success: boolean;
  message: string;
}

export interface GetCachedProductsRequest {
  cache_key: string;
}

export interface GetCachedProductsResponse {
  products: ProcessedProduct[];
  found: boolean;
  ttl_remaining: number;
}

export interface ClearCacheRequest {
  pattern: string;
}

export interface ClearCacheResponse {
  deleted_keys: number;
  success: boolean;
} 