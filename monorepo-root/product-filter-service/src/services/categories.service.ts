import { Injectable } from '@nestjs/common';
import { DbApiHttpClient } from '../http-clients/db-api.client';

@Injectable()
export class CategoriesService {
  constructor(private readonly dbApiClient: DbApiHttpClient) {}

  /**
   * Получить все доступные категории из DB API
   */
  async getAllCategories(): Promise<string[]> {
    try {
      const categoriesResponse = await this.dbApiClient.getAllCategories();
      return Array.isArray(categoriesResponse) 
        ? categoriesResponse.map(cat => cat.key) 
        : categoriesResponse.categories?.map(cat => cat.key) || [];
    } catch (error) {
      console.error('Ошибка получения категорий из DB API:', error);
      // Fallback к статическому списку
      return [
        'videocards',
        'processors', 
        'motherboards',
        'playstation',
        'nintendo_switch',
        'steam_deck',
        'iphone'
      ];
    }
  }

  /**
   * Проверить, существует ли категория
   */
  async hasCategory(category: string): Promise<boolean> {
    const categories = await this.getAllCategories();
    return categories.includes(category);
  }

  /**
   * Получить все запросы для категории из DB API
   */
  async getQueriesForCategory(category: string): Promise<string[]> {
    try {
      const queriesResponse = await this.dbApiClient.getRecommendedPricesForQueries([], category);
      return Array.from(queriesResponse.keys());
    } catch (error) {
      console.error(`Ошибка получения запросов для категории ${category}:`, error);
      return [];
    }
  }
}
