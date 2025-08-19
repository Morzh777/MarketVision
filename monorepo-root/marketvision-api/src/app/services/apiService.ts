import type { Product, PriceHistory } from '../types/market';
import { API_CONFIG } from '@/config/settings';

interface DbProduct {
  id: string;
  created_at: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  source: string;
  category: string;
  query: string;
}

interface MarketStats {
  min: number;
  max: number;
  mean: number;
  median: number;
  iqr: [number, number];
}

// Используем локальные API роуты Next.js
const API_URL = API_CONFIG.LOCAL_API_BASE_URL;

export class ApiService {
    static async getProducts(query?: string): Promise<{
    products: Product[];
    marketStats?: MarketStats;
  }> {
    try {
      // Сначала получаем все продукты
      const allProductsResponse = await fetch(`${API_URL}/products`);
      if (!allProductsResponse.ok) {
        throw new Error('Failed to fetch all products');
      }
      const allProductsData: { products: DbProduct[] } = await allProductsResponse.json();

      // Если передан query, получаем marketStats для этого запроса
      let marketStats: MarketStats | undefined;
      if (query) {
        const statsResponse = await fetch(`${API_URL}/products?query=${encodeURIComponent(query)}`);
        if (statsResponse.ok) {
          const statsData: { products: DbProduct[]; marketStats?: MarketStats } = await statsResponse.json();
          marketStats = statsData.marketStats;
        }
      }

      console.log('API Response:', { products: allProductsData.products, marketStats });

      return {
        products: allProductsData.products.map((product: DbProduct) => ({
          ...product,
          min: marketStats?.min,
          max: marketStats?.max,
          mean: marketStats?.mean,
          median: marketStats?.median,
          iqr: marketStats?.iqr
        })),
        marketStats
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { products: [] };
    }
  }

  static async getDeals(): Promise<Product[]> {
    try {
      // Deals - это просто все продукты из базы данных
      const response = await fetch(`${API_URL}/products`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch deals');
      }

      const data: { products: DbProduct[] } = await response.json();
      
      return data.products.map((product: DbProduct) => ({
        ...product
      }));
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  }



  static async getPriceHistoryByQuery(query: string, limit: number = 10): Promise<PriceHistory> {
    try {
      const response = await fetch(
        `${API_URL}/products/price-history-by-query?query=${encodeURIComponent(query)}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch price history by query: ${response.status} ${response.statusText}`);
      }

      // Проверяем, что ответ не пустой
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.warn('Empty response from price history API');
        return [];
      }

      let data: Array<{ price: number; created_at: string }>;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', responseText, parseError);
        return [];
      }
      
      if (!Array.isArray(data)) {
        console.warn('Response is not an array:', data);
        return [];
      }
      
      return data.map(item => ({
        price: item.price,
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching price history by query:', error);
      return [];
    }
  }

  static async getProduct(id: string): Promise<Product | null> {
    try {
      const response = await fetch(`${API_URL}/products/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const product: DbProduct = await response.json();
      
      return {
        ...product
      };
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  static async getPopularQueries(): Promise<Array<{ query: string; minPrice: number; id: string; priceChangePercent: number; image_url: string }>> {
    try {
      const response = await fetch(`${API_URL}/popular-queries`);
      if (!response.ok) {
        throw new Error('Failed to fetch popular queries');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching popular queries:', error);
      return [];
    }
  }

  static async getProductsByQuery(query: string): Promise<{
    products: Product[];
    marketStats?: MarketStats;
  }> {
    try {
      const response = await fetch(`${API_URL}/products-by-query/${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products by query');
      }
      const data = await response.json();
      console.log('Products by query response:', data);
      return data;
    } catch (error) {
      console.error('Error fetching products by query:', error);
      return { products: [] };
    }
  }

  static async getProductsWithPagination(page: number = 1, limit: number = 10): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    try {
      const response = await fetch(`${API_URL}/products-paginated?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products with pagination');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products with pagination:', error);
      return { products: [], total: 0, hasMore: false };
    }
  }
} 