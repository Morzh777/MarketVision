import type { Product, PriceHistory, Timeframe } from '../types/market';
import { ApiService } from './apiService';

export class ProductService {
  static async getProducts(query?: string): Promise<{ products: Product[]; marketStats?: any }> {
    try {
      const result = await ApiService.getProducts(query);
      return result;
    } catch (error) {
      console.error('Error fetching products:', error);
      return { products: [] };
    }
  }

  static async getDeals(): Promise<Product[]> {
    try {
      return await ApiService.getDeals();
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  }

  static async getPriceHistory(productId: string, timeframe: Timeframe): Promise<PriceHistory> {
    try {
      console.log('ProductService.getPriceHistory called with:', { productId, timeframe });
      const result = await ApiService.getPriceHistory(productId, timeframe);
      console.log('ProductService.getPriceHistory result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching price history:', error);
      return [];
    }
  }

  static async getPriceHistoryMulti(productId: string, timeframes: Timeframe[]): Promise<Record<string, PriceHistory>> {
    try {
      console.log('ProductService.getPriceHistoryMulti called with:', { productId, timeframes });
      const result = await ApiService.getPriceHistoryMulti(productId, timeframes);
      console.log('ProductService.getPriceHistoryMulti result:', result);
      return result;
    } catch (error) {
      console.error('Error fetching price history multi:', error);
      return {};
    }
  }

  static async findProductByName(name: string): Promise<Product | undefined> {
    try {
      const { products } = await this.getProducts();
      return products.find((item: Product) => item.name === name);
    } catch (error) {
      console.error('Error finding product by name:', error);
      return undefined;
    }
  }

  static async getPopularQueries(): Promise<Array<{ query: string; minPrice: number; id: string; priceChangePercent: number }>> {
    try {
      return await ApiService.getPopularQueries();
    } catch (error) {
      console.error('Error fetching popular queries:', error);
      return [];
    }
  }

  static async getProductsByQuery(query: string): Promise<{ products: Product[]; marketStats?: any }> {
    try {
      return await ApiService.getProductsByQuery(query);
    } catch (error) {
      console.error('Error fetching products by query:', error);
      return { products: [] };
    }
  }

  static async getProductsWithPagination(page: number = 1, limit: number = 10): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    try {
      return await ApiService.getProductsWithPagination(page, limit);
    } catch (error) {
      console.error('Error fetching products with pagination:', error);
      return { products: [], total: 0, hasMore: false };
    }
  }
} 