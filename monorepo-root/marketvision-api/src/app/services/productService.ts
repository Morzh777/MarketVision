import type { Product, PriceHistory } from '../types/market';

import { ApiService } from './apiService';

// Кэш для истории цен
const priceHistoryCache = new Map<string, { data: PriceHistory; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Импортируем тип MarketStats из ApiService
interface MarketStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  iqr: [number, number];
}

export class ProductService {
  static async getProducts(query?: string): Promise<{ products: Product[]; marketStats?: MarketStats }> {
    try {
      const result = await ApiService.getProducts(query);
      return result;
    } catch {
      console.error('Error fetching products');
      return { products: [] };
    }
  }

  static async getDeals(): Promise<Product[]> {
    try {
      return await ApiService.getDeals();
    } catch {
      console.error('Error fetching deals');
      return [];
    }
  }

  static async getPriceHistoryByQuery(query: string, limit: number = 10): Promise<PriceHistory> {
    try {
      const cacheKey = `${query}_${limit}`;
      const now = Date.now();
      
      // Проверяем кэш
      const cached = priceHistoryCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        return cached.data;
      }
      
      const result = await ApiService.getPriceHistoryByQuery(query, limit);
      
      // Сохраняем в кэш
      priceHistoryCache.set(cacheKey, { data: result, timestamp: now });
      
      return result;
    } catch {
      console.error('Error fetching price history by query');
      return [];
    }
  }

  static async findProductByName(name: string): Promise<Product | undefined> {
    try {
      const { products } = await this.getProducts();
      return products.find((item: Product) => item.name === name);
    } catch {
      console.error('Error finding product by name');
      return undefined;
    }
  }

  static async getPopularQueries(): Promise<Array<{ query: string; minPrice: number; id: string; priceChangePercent: number; image_url: string }>> {
    const CACHE_KEY = 'popularQueriesCache';
    const CACHE_TTL_MS = 3 * 60 * 1000; // 3 минуты

    try {
      // Пробуем взять из sessionStorage
      if (typeof window !== 'undefined') {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { updatedAt: number; data: Array<{ query: string; minPrice: number; id: string; priceChangePercent: number; image_url: string }> };
          if (parsed && Array.isArray(parsed.data) && Date.now() - parsed.updatedAt < CACHE_TTL_MS) {
            return parsed.data;
          }
        }
      }

      // Фолбэк: запрос к API и запись в кэш
      const data = await ApiService.getPopularQueries();
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ updatedAt: Date.now(), data }));
        } catch {}
      }
      return data;
    } catch {
      console.error('Error fetching popular queries');
      return [];
    }
  }

  static async getProductsByQuery(query: string): Promise<{ products: Product[]; marketStats?: MarketStats }> {
    try {
      return await ApiService.getProductsByQuery(query);
    } catch {
      console.error('Error fetching products by query');
      return { products: [] };
    }
  }

  static async getProductsWithPagination(page: number = 1, limit: number = 10): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    try {
      return await ApiService.getProductsWithPagination(page, limit);
    } catch {
      console.error('Error fetching products with pagination');
      return { products: [], total: 0, hasMore: false };
    }
  }
} 