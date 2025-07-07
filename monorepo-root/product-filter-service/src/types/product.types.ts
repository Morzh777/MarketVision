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
  filter_result?: FilterResult;
  processed_at?: number;
  discount_percent?: number;
  is_new?: boolean;
}

export interface FilterResult {
  is_valid: boolean;
  reason: string;
  applied_rules?: string[];
}

export interface ProductResponse {
  products: ProcessedProduct[];
  total_queries: number;
  total_products: number;
  processing_time_ms: number;
  cache_hits: number;
  cache_misses: number;
} 