import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export interface QueryConfigResult {
  id: number;
  query: string;
  platform_id?: string | null;
  exactmodels?: string | null;
  platform: string;
  recommended_price?: number | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class QueriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получает запросы для категории
   */
  async getQueriesForCategory(categoryKey: string): Promise<QueryConfigResult[]> {
    const category = await this.prisma.category.findUnique({
      where: { key: categoryKey },
    });
    if (!category) throw new NotFoundException('Category not found');

    const queryConfigs = await this.prisma.queryConfig.findMany({
      where: { categoryId: category.id },
    });

    return queryConfigs.map((config) => ({
      id: config.id,
      query: config.query,
      platform_id: config.platform_id,
      exactmodels: config.exactmodels,
      platform: config.platform,
      recommended_price: config.recommended_price,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    }));
  }

  /**
   * Создает или обновляет конфигурацию запроса
   */
  async upsertQueryConfig(data: {
    id?: number;
    categoryKey: string;
    query: string;
    platform_id?: string | null;
    exactmodels?: string | null;
    platform?: 'ozon' | 'wb' | 'both';
    recommended_price?: number | null;
  }): Promise<QueryConfigResult | QueryConfigResult[]> {
    console.log('upsertQueryConfig called with:', data);

    const cat = await this.prisma.category.findUnique({
      where: { key: data.categoryKey },
    });
    if (!cat) throw new NotFoundException('Category not found');

    const targetPlatforms: Array<'ozon' | 'wb'> =
      !data.platform || data.platform === 'both'
        ? ['ozon', 'wb']
        : [data.platform];

    const results: QueryConfigResult[] = [];

    // Если есть ID, обновляем существующий запрос
    if (data.id) {
      const existingQuery = await this.prisma.queryConfig.findUnique({
        where: { id: data.id },
      });

      if (!existingQuery) {
        throw new NotFoundException('Query not found');
      }

      // Обновляем запрос
      const res = await this.prisma.queryConfig.update({
        where: { id: data.id },
        data: {
          query: data.query,
          platform_id: data.platform_id ?? null,
          exactmodels: data.exactmodels ?? null,
          recommended_price: data.recommended_price ?? null,
        },
      });

      results.push({
        id: res.id,
        query: res.query,
        platform_id: res.platform_id,
        exactmodels: res.exactmodels,
        platform: res.platform,
        recommended_price: res.recommended_price,
        createdAt: res.createdAt.toISOString(),
        updatedAt: res.updatedAt.toISOString(),
      });
    } else {
      // Создаем новые запросы для каждой платформы
      for (const platform of targetPlatforms) {
        // Проверяем, существует ли уже такой запрос для этой платформы
        const existing = await this.prisma.queryConfig.findFirst({
          where: {
            query: data.query,
            categoryId: cat.id,
            platform: platform,
          },
        });

        if (existing) {
          // Обновляем существующий
          const res = await this.prisma.queryConfig.update({
            where: { id: existing.id },
            data: {
              platform_id: data.platform_id ?? null,
              exactmodels: data.exactmodels ?? null,
              recommended_price: data.recommended_price ?? null,
            },
          });

          results.push({
            id: res.id,
            query: res.query,
            platform_id: res.platform_id,
            exactmodels: res.exactmodels,
            platform: res.platform,
            recommended_price: res.recommended_price,
            createdAt: res.createdAt.toISOString(),
            updatedAt: res.updatedAt.toISOString(),
          });
        } else {
          // Создаем новый
          const res = await this.prisma.queryConfig.create({
            data: {
              query: data.query,
              platform_id: data.platform_id ?? null,
              exactmodels: data.exactmodels ?? null,
              platform: platform,
              recommended_price: data.recommended_price ?? null,
              categoryId: cat.id,
            },
          });

          results.push({
            id: res.id,
            query: res.query,
            platform_id: res.platform_id,
            exactmodels: res.exactmodels,
            platform: res.platform,
            recommended_price: res.recommended_price,
            createdAt: res.createdAt.toISOString(),
            updatedAt: res.updatedAt.toISOString(),
          });
        }
      }
    }

    return results.length === 1 ? results[0] : results;
  }


  /**
   * Удаляет конфигурацию запроса
   */
  async removeQueryConfig(categoryKey: string, query: string): Promise<void> {
    console.log('removeQueryConfig called with:', { categoryKey, query });

    const cat = await this.prisma.category.findUnique({
      where: { key: categoryKey },
    });
    if (!cat) throw new NotFoundException('Category not found');

    await this.prisma.queryConfig.deleteMany({
      where: {
        query: query,
        categoryId: cat.id,
      },
    });
  }

  /**
   * Обновляет рекомендуемую цену для запроса
   */
  async updateRecommendedPrice(
    categoryKey: string,
    query: string,
    recommended_price: number | null,
  ): Promise<void> {
    console.log('updateRecommendedPrice called with:', {
      categoryKey,
      query,
      recommended_price,
    });

    const cat = await this.prisma.category.findUnique({
      where: { key: categoryKey },
    });
    if (!cat) throw new NotFoundException('Category not found');

    await this.prisma.queryConfig.updateMany({
      where: {
        query: query,
        categoryId: cat.id,
      },
      data: {
        recommended_price: recommended_price,
      },
    });
  }

  /**
   * Получает список конфигураций запросов
   */
  async listQueryConfigs(categoryKey?: string): Promise<QueryConfigResult[]> {
    const where = categoryKey
      ? {
          category: { key: categoryKey },
        }
      : {};

    const queryConfigs = await this.prisma.queryConfig.findMany({
      where,
      include: { category: true },
    });

    return queryConfigs.map((config) => ({
      id: config.id,
      query: config.query,
      platform_id: config.platform_id,
      exactmodels: config.exactmodels,
      platform: config.platform,
      recommended_price: config.recommended_price,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    }));
  }

  /**
   * Обновляет конфигурацию запроса по ID
   */
  async updateQueryConfigById(data: {
    id: number;
    query: string;
    platform_id?: string | null;
    exactmodels?: string | null;
    platform?: 'ozon' | 'wb' | 'both';
    recommended_price?: number | null;
  }): Promise<QueryConfigResult> {
    console.log('updateQueryConfigById called with:', data);
    
    // Проверяем, что запрос существует
    const existing = await this.prisma.queryConfig.findUnique({ where: { id: data.id } });
    if (!existing) {
      throw new NotFoundException('Query config not found');
    }

    // Обновляем запрос
    const result = await this.prisma.queryConfig.update({
      where: { id: data.id },
      data: {
        query: data.query,
        platform_id: data.platform_id ?? null,
        exactmodels: data.exactmodels ?? null,
        platform: data.platform === 'both' ? 'ozon' : (data.platform ?? 'ozon'),
        recommended_price: data.recommended_price ?? null,
      },
    });
    
    console.log('updateQueryConfigById result:', result);
    return {
      id: result.id,
      query: result.query,
      platform_id: result.platform_id,
      exactmodels: result.exactmodels,
      platform: result.platform,
      recommended_price: result.recommended_price,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  }

  /**
   * Удаляет конфигурацию запроса по ID
   */
  async removeQueryConfigById(id: number): Promise<void> {
    console.log('removeQueryConfigById called with id:', id);
    
    const existing = await this.prisma.queryConfig.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Query config not found');
    }

    await this.prisma.queryConfig.delete({ where: { id } });
    console.log('Query config deleted successfully');
  }

  /**
   * Получает конфигурацию запроса по ID
   */
  async getQueryConfigById(id: number): Promise<QueryConfigResult | null> {
    const config = await this.prisma.queryConfig.findUnique({ where: { id } });
    if (!config) return null;

    return {
      id: config.id,
      query: config.query,
      platform_id: config.platform_id,
      exactmodels: config.exactmodels,
      platform: config.platform,
      recommended_price: config.recommended_price,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }
}
