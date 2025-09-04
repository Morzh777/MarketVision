import { Injectable } from '@nestjs/common';

@Injectable()
export class DbApiHttpClient {
  private baseURL = 'http://marketvision-database-api:3004';

  async getCategoryConfig(categoryKey: string): Promise<any> {
    console.log('[TO DB-API] getCategoryConfig categoryKey:', categoryKey);
    try {
      const response = await fetch(`${this.baseURL}/categories/${categoryKey}/config`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('[FROM DB-API] Success:', data);
      console.log('[FROM DB-API] Response category:', data.category);
      console.log('[FROM DB-API] Response category ozon_id:', data.category?.ozon_id);
      console.log('[FROM DB-API] Response category wb_id:', data.category?.wb_id);
      console.log('[FROM DB-API] Response keys:', Object.keys(data));
      console.log('[FROM DB-API] Response category keys:', data.category ? Object.keys(data.category) : 'no category');
      return data;
    } catch (error) {
      console.error('[FROM DB-API] Error:', error.message);
      throw error;
    }
  }

  async getQueriesForCategory(categoryKey: string): Promise<any> {
    console.log('[TO DB-API] getQueriesForCategory categoryKey:', categoryKey);
    try {
      const response = await fetch(`${this.baseURL}/categories/${categoryKey}/queries`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('[FROM DB-API] Success:', data);
      console.log('[FROM DB-API] Queries response:', data.queries);
      console.log('[FROM DB-API] First query platform_id:', data.queries?.[0]?.platform_id);
      return data;
    } catch (error) {
      console.error('[FROM DB-API] Error:', error.message);
      throw error;
    }
  }

  async batchCreateProducts(payload: { products: any[], market_stats?: any }): Promise<{ inserted: number }> {
    console.log('[TO DB-API] batchCreateProducts payload:', JSON.stringify(payload, null, 2));
    try {
      const response = await fetch(`${this.baseURL}/products/batch-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('[FROM DB-API] Success:', {
        inserted: data.inserted,
        history: data.history,
        products_count: payload.products.length,
        market_stats: payload.market_stats ? 'saved' : 'none'
      });
      return data;
    } catch (error) {
      console.error('[FROM DB-API] Error:', error.message);
      throw error;
    }
  }

  async getAllCategories(): Promise<any> {
    console.log('[TO DB-API] getAllCategories');
    try {
      const response = await fetch(`${this.baseURL}/categories`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('[FROM DB-API] Success:', data);
      return data;
    } catch (error) {
      console.error('[FROM DB-API] Error:', error.message);
      throw error;
    }
  }

  async getRecommendedPricesForQueries(queries: string[], categoryKey: string): Promise<Map<string, number>> {
    console.log('[TO DB-API] getRecommendedPricesForQueries queries:', queries, 'categoryKey:', categoryKey);
    try {
      const response = await fetch(`${this.baseURL}/categories/${categoryKey}/queries`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('[FROM DB-API] Queries response:', data);
      
      // Создаем Map с рекомендованными ценами для каждого запроса
      const recommendedPrices = new Map<string, number>();
      
      if (data.queries && Array.isArray(data.queries)) {
        data.queries.forEach((queryConfig: any) => {
          if (queryConfig.recommended_price && queryConfig.recommended_price > 0) {
            recommendedPrices.set(queryConfig.query, queryConfig.recommended_price);
          }
        });
      }
      
      console.log('[FROM DB-API] Recommended prices map:', Object.fromEntries(recommendedPrices));
      return recommendedPrices;
    } catch (error) {
      console.error('[FROM DB-API] Error:', error.message);
      throw error;
    }
  }

  async getPriceHistory(query: string, limit: number = 50): Promise<Array<{ price: number; created_at: string }>> {
    console.log('[TO DB-API] getPriceHistory query:', query, 'limit:', limit);
    try {
      const response = await fetch(`${this.baseURL}/products/price-history-by-query?query=${encodeURIComponent(query)}&limit=${limit}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('[FROM DB-API] Price history response:', data);
      return data || [];
    } catch (error) {
      console.error('[FROM DB-API] Error:', error.message);
      throw error;
    }
  }

  async getMarketStats(query: string): Promise<{
    min: number;
    max: number;
    mean: number;
    median: number;
    total_count: number;
    created_at: string;
  } | null> {
    console.log('[TO DB-API] getMarketStats query:', query);
    try {
      const response = await fetch(`${this.baseURL}/products/products-by-query/${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('[FROM DB-API] Market stats response:', data);
      return data.marketStats || null;
    } catch (error) {
      console.error('[FROM DB-API] Error:', error.message);
      throw error;
    }
  }
}