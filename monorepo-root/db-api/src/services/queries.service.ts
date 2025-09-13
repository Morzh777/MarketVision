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
  category?: {
    id: number;
    key: string;
    display: string;
    ozon_id?: string | null;
    wb_id?: string | null;
    groupId?: number | null;
    createdAt: string;
    updatedAt: string;
  };
}

@Injectable()
export class QueriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получает запросы для категории
   */
  async getQueriesForCategory(
    categoryKey: string,
  ): Promise<QueryConfigResult[]> {
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
    platform?: 'ozon' | 'wb' | 'both';
    recommended_price?: number | null;
    // Отдельные данные для каждой платформы
    ozon_platform?: string | null;
    ozon_exact?: string | null;
    wb_platform?: string | null;
    wb_exact?: string | null;
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

      // Определяем данные для обновления в зависимости от платформы
      const updateData: any = {
        query: data.query,
        recommended_price: data.recommended_price ?? null,
      };

      if (existingQuery.platform === 'ozon') {
        updateData.platform_id = data.ozon_platform ?? null;
        updateData.exactmodels = data.ozon_exact ?? null;
      } else if (existingQuery.platform === 'wb') {
        updateData.platform_id = data.wb_platform ?? null;
        updateData.exactmodels = data.wb_exact ?? null;
      }

      // Обновляем запрос
      const res = await this.prisma.queryConfig.update({
        where: { id: data.id },
        data: updateData,
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
          // Обновляем существующий с правильными данными для платформы
          const updateData: any = {
            recommended_price: data.recommended_price ?? null,
          };

          if (platform === 'ozon') {
            updateData.platform_id = data.ozon_platform ?? null;
            updateData.exactmodels = data.ozon_exact ?? null;
          } else if (platform === 'wb') {
            updateData.platform_id = data.wb_platform ?? null;
            updateData.exactmodels = data.wb_exact ?? null;
          }

          const res = await this.prisma.queryConfig.update({
            where: { id: existing.id },
            data: updateData,
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
          // Создаем новый с правильными данными для платформы
          const createData: any = {
            query: data.query,
            platform: platform,
            recommended_price: data.recommended_price ?? null,
            categoryId: cat.id,
          };

          if (platform === 'ozon') {
            createData.platform_id = data.ozon_platform ?? null;
            createData.exactmodels = data.ozon_exact ?? null;
          } else if (platform === 'wb') {
            createData.platform_id = data.wb_platform ?? null;
            createData.exactmodels = data.wb_exact ?? null;
          }

          const res = await this.prisma.queryConfig.create({
            data: createData,
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
   * Получает конфигурацию запроса по ID
   */
  async getQueryConfigById(id: number): Promise<QueryConfigResult> {
    console.log('getQueryConfigById called with:', { id });

    const config = await this.prisma.queryConfig.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!config) {
      throw new NotFoundException('Query config not found');
    }

    return {
      id: config.id,
      query: config.query,
      platform: config.platform,
      platform_id: config.platform_id,
      exactmodels: config.exactmodels,
      recommended_price: config.recommended_price,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
      category: {
        id: config.category.id,
        key: config.category.key,
        display: config.category.display,
        ozon_id: config.category.ozon_id,
        wb_id: config.category.wb_id,
        groupId: config.category.groupId,
        createdAt: config.category.createdAt.toISOString(),
        updatedAt: config.category.updatedAt.toISOString(),
      },
    };
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
   * Обновляет все конфигурации запроса по названию и категории
   */
  async updateQueryConfigsByQuery(data: {
    categoryKey: string;
    query: string;
    oldQuery?: string; // Старое название для поиска записей
    ozon_platform?: string | null;
    ozon_exact?: string | null;
    wb_platform?: string | null;
    wb_exact?: string | null;
    recommended_price?: number | null;
  }): Promise<QueryConfigResult[]> {
    console.log('updateQueryConfigsByQuery called with:', data);

    // Находим категорию
    const cat = await this.prisma.category.findUnique({
      where: { key: data.categoryKey },
    });
    if (!cat) {
      throw new NotFoundException('Category not found');
    }

    // Находим все записи с этим названием запроса в категории
    // Используем старое название для поиска, если оно есть
    const searchQuery = data.oldQuery || data.query;
    const existingConfigs = await this.prisma.queryConfig.findMany({
      where: {
        query: searchQuery,
        categoryId: cat.id,
      },
    });

    if (existingConfigs.length === 0) {
      throw new NotFoundException('Query configs not found');
    }

    const results: QueryConfigResult[] = [];

    // Обновляем каждую запись в зависимости от платформы
    for (const config of existingConfigs) {
      const updateData: {
        query?: string;
        recommended_price: number | null;
        platform_id?: string | null;
        exactmodels?: string | null;
      } = {
        query: data.query, // Обновляем название запроса
        recommended_price: data.recommended_price ?? null,
      };

      if (config.platform === 'ozon') {
        updateData.platform_id = data.ozon_platform ?? null;
        updateData.exactmodels = data.ozon_exact ?? null;
      } else if (config.platform === 'wb') {
        updateData.platform_id = data.wb_platform ?? null;
        updateData.exactmodels = data.wb_exact ?? null;
      }

      const result = await this.prisma.queryConfig.update({
        where: { id: config.id },
        data: updateData,
      });

      results.push({
        id: result.id,
        query: result.query,
        platform_id: result.platform_id,
        exactmodels: result.exactmodels,
        platform: result.platform,
        recommended_price: result.recommended_price,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      });
    }

    console.log('updateQueryConfigsByQuery results:', results);
    return results;
  }
}
