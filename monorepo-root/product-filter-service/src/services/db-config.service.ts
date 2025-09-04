import { Injectable, Logger } from '@nestjs/common';
import { DbApiHttpClient } from '../http-clients/db-api.client';

export interface CategoryConfig {
  key: string;
  display: string;
  ozon_id?: string | null;
  wb_id?: string | null;
}

export interface QueryConfig {
  query: string;
  platform_id?: string | null;
  exactmodels?: string | null;
  platform: 'ozon' | 'wb';
}

@Injectable()
export class DbConfigService {
  private readonly logger = new Logger(DbConfigService.name);

  constructor(private readonly dbApiClient: DbApiHttpClient) {}

  /**
   * Получить конфигурацию категории из БД
   */
  async getCategoryConfig(categoryKey: string): Promise<CategoryConfig | null> {
    try {
      const response = await this.dbApiClient.getCategoryConfig(categoryKey);
      return response.category ? {
        key: response.category.key,
        display: response.category.display,
        ozon_id: response.category.ozon_id,
        wb_id: response.category.wb_id
      } : null;
    } catch (error) {
      this.logger.error(`Ошибка получения конфигурации категории ${categoryKey}:`, error);
      return null;
    }
  }

  /**
   * Получить запросы для категории из БД
   */
  async getQueriesForCategory(categoryKey: string): Promise<QueryConfig[]> {
    try {
      const response = await this.dbApiClient.getQueriesForCategory(categoryKey);
      return response.queries.map((q: any) => ({
        query: q.query,
        platform_id: q.platform_id,
        exactmodels: q.exactmodels,
        platform: q.platform
      }));
    } catch (error) {
      this.logger.error(`Ошибка получения запросов для категории ${categoryKey}:`, error);
      return [];
    }
  }

  /**
   * Получить Ozon ID для категории
   */
  async getOzonCategoryId(categoryKey: string): Promise<string | null> {
    const config = await this.getCategoryConfig(categoryKey);
    return config?.ozon_id || null;
  }

  /**
   * Получить WB ID для категории
   */
  async getWbCategoryId(categoryKey: string): Promise<string | null> {
    const config = await this.getCategoryConfig(categoryKey);
    return config?.wb_id || null;
  }

  /**
   * Получить platform_id для запроса
   */
  async getPlatformIdForQuery(categoryKey: string, query: string, platform: string): Promise<string | null> {
    const queries = await this.getQueriesForCategory(categoryKey);
    const queryConfig = queries.find(q => q.query === query && q.platform === platform);
    return queryConfig?.platform_id || null;
  }

  /**
   * Получить exactmodels для запроса
   */
  async getExactModelsForQuery(categoryKey: string, query: string, platform: string): Promise<string | null> {
    const queries = await this.getQueriesForCategory(categoryKey);
    console.log(`🔍 DEBUG - Ищем exactmodels для: "${query}" platform: "${platform}"`);
    console.log(`🔍 DEBUG - Доступные queries:`, queries.map(q => ({query: q.query, platform: q.platform, exactmodels: q.exactmodels})));
    const queryConfig = queries.find(q => q.query === query && q.platform === platform);
    console.log(`🔍 DEBUG - Найденный queryConfig:`, queryConfig);
    return queryConfig?.exactmodels || null;
  }
}
