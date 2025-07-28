import { Injectable } from '@nestjs/common';

import { PrismaService } from './prisma.service';

import type { ProductForService, MarketStats } from './types/product.types';

/**
 * Сервис для работы с продуктами и историей цен через Prisma
 */

// Явный тип Product, соответствующий вашей модели
export type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  category: string;
  source: string;
  query: string;
  created_at: Date;
};

// Тип для истории цен
export type PriceHistoryProduct = {
  id: string;
  query: string;
  source: string;
  price: number;
};



@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создаёт продукт
   */
  async create(data: Omit<Product, 'created_at'>): Promise<Product> {
    return (await this.prisma.product.create({ data })) as unknown as Product;
  }

  /**
   * Возвращает все продукты с фильтрацией
   */
  async findAll(
    params: { query?: string; category?: string } = {},
  ): Promise<Product[]> {
    const where: Record<string, any> = {};

    if (params.query) {
      where.query = params.query;
    }

    if (params.category) {
      where.category = params.category;
    }

    return (await this.prisma.product.findMany({
      where,
      orderBy: { created_at: 'desc' },
    })) as unknown as Product[];
  }

  /**
   * Находит продукт по id
   */
  async findOne(id: string): Promise<Product | null> {
    return (await this.prisma.product.findUnique({
      where: { id },
    })) as unknown as Product | null;
  }

  /**
   * Обновляет продукт
   */
  async update(
    id: string,
    data: Partial<Omit<Product, 'created_at'>>,
  ): Promise<Product> {
    return (await this.prisma.product.update({
      where: { id },
      data,
    })) as unknown as Product;
  }

  /**
   * Удаляет продукт
   */
  async remove(id: string): Promise<Product> {
    return (await this.prisma.product.delete({
      where: { id },
    })) as unknown as Product;
  }

  /**
   * Массовое создание продуктов (skipDuplicates)
   */
  async batchCreate(products: ProductForService[]): Promise<number> {
    if (!products.length) return 0;
    // Группируем по query, оставляем только с минимальной ценой
    const byQuery: Record<string, ProductForService[]> = {};
    for (const p of products) {
      if (!byQuery[p.query]) byQuery[p.query] = [];
      byQuery[p.query].push(p);
    }
    const minProducts = Object.values(byQuery).map((group) =>
      group.reduce((min, p) => (p.price < min.price ? p : min), group[0]),
    );
    let count = 0;
    for (const p of minProducts) {
      const existing = await this.prisma.product.findUnique({
        where: { id: p.id },
      });
      if (!existing) {
        // Новый продукт — создаём
        await this.prisma.product.create({
          data: {
            id: p.id,
            name: p.name,
            price: p.price,
            image_url: p.image_url,
            product_url: p.product_url,
            category: p.category,
            source: p.source,
            query: p.query,
          },
        });
        // Пишем в историю
        await this.prisma.priceHistory.create({
          data: {
            product_id: p.id,
            query: p.query,
            source: p.source,
            price: p.price,
          },
        });
        count++;
      } else if (existing.price !== p.price) {
        // Цена изменилась — обновляем и пишем в историю
        await this.prisma.product.update({
          where: { id: p.id },
          data: { price: p.price },
        });
        await this.prisma.priceHistory.create({
          data: {
            product_id: p.id,
            query: p.query,
            source: p.source,
            price: p.price,
          },
        });
        count++;
      }
      // Если цена не изменилась — ничего не делаем
    }
    return count;
  }

  /**
   * Массовое создание истории цен
   */
  async batchCreatePriceHistory(
    products: PriceHistoryProduct[],
  ): Promise<number> {
    if (!products.length) return 0;
    // Получаем список id реально существующих продуктов
    const existingIds = (
      await this.prisma.product.findMany({
        where: { id: { in: products.map((p) => p.id) } },
        select: { id: true },
      })
    ).map((p) => p.id);

    await this.prisma.priceHistory.createMany({
      data: products.map((p: PriceHistoryProduct) => ({
        product_id: existingIds.includes(p.id) ? p.id : undefined,
        query: p.query,
        source: p.source,
        price: p.price,
      })),
      skipDuplicates: false,
    });
    return products.length;
  }

  /**
   * Сохраняет MarketStats
   */
  async saveMarketStats(stats: MarketStats): Promise<void> {
    // Логируем входящие данные для отладки
    console.log('[DB-API] saveMarketStats', stats);
    try {
      await this.prisma.marketStats.create({
        data: {
          product_id: stats.productId,
          query: stats.query,
          category: stats.category,
          source: stats.source,
          min: stats.min,
          max: stats.max,
          mean: stats.mean,
          median: stats.median,
          iqr: stats.iqr,
          total_count: stats.totalCount,
          created_at: stats.createdAt ? new Date(stats.createdAt) : undefined,
        },
      });
    } catch (error) {
      // Логируем ошибку для отладки
      console.error('[MarketStats][ERROR]', error, stats);
      throw error;
    }
  }

  /**
   * Получает статистику рынка по запросу
   */
  async getMarketStats(query: string): Promise<any> {
    const stats = await this.prisma.marketStats.findFirst({
      where: { query },
      orderBy: { created_at: 'desc' },
    });

    if (!stats) {
      return null;
    }

    return {
      min: stats.min,
      max: stats.max,
      mean: stats.mean,
      median: stats.median,
      iqr: stats.iqr,
      total_count: stats.total_count,
      query: stats.query,
      category: stats.category,
      source: stats.source,
      product_id: stats.product_id,
      created_at: stats.created_at,
    };
  }

  /**
   * Получает историю цен продукта
   */
  async getPriceHistory(
    productId: string,
    timeframe: 'day' | 'week' | 'month' | 'year' = 'day',
  ): Promise<Array<{ price: number | null; created_at: string }>> {
    // Сначала получаем query для этого продукта
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { query: true },
    });

    if (!product) {
      return [];
    }

    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Ищем по query, игнорируя product_id
    const history = await this.prisma.priceHistory.findMany({
      where: {
        query: product.query,
        created_at: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: { created_at: 'asc' },
      select: {
        price: true,
        created_at: true,
      },
    });

    return history.map((item) => ({
      price: item.price,
      created_at: item.created_at.toISOString(),
    }));
  }

  /**
   * Получает историю цен продукта для нескольких timeframes
   */
  async getPriceHistoryMulti(
    productId: string,
    timeframes: ('day' | 'week' | 'month' | 'year')[] = ['month'],
  ): Promise<Record<string, Array<{ price: number | null; created_at: string }>>> {
    const result: Record<string, Array<{ price: number | null; created_at: string }>> = {};
    
    // Получаем историю для каждого timeframe
    for (const timeframe of timeframes) {
      result[timeframe] = await this.getPriceHistory(productId, timeframe);
    }
    
    return result;
  }

  async getPriceHistoryByQuery(
    query: string,
    limit: number = 10,
  ): Promise<Array<{ price: number | null; created_at: string }>> {
    console.log(`[getPriceHistoryByQuery] Searching for query: "${query}" with limit: ${limit}`);
    
    const priceHistory = await this.prisma.priceHistory.findMany({
      where: {
        query: query,
      },
      select: {
        price: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });

    console.log(`[getPriceHistoryByQuery] Found ${priceHistory.length} records for query: "${query}"`);
    
    if (priceHistory.length > 0) {
      console.log(`[getPriceHistoryByQuery] First record:`, priceHistory[0]);
      console.log(`[getPriceHistoryByQuery] Last record:`, priceHistory[priceHistory.length - 1]);
    }

    const result = priceHistory.map((item) => ({
      price: item.price,
      created_at: item.created_at.toISOString(),
    }));

    console.log(`[getPriceHistoryByQuery] Returning ${result.length} records`);
    return result;
  }

  /**
   * Получает популярные запросы с ценой репрезентативного товара и процентом изменения
   */
  async getPopularQueries(): Promise<
    Array<{
      query: string;
      minPrice: number;
      id: string;
      priceChangePercent: number;
    }>
  > {
    // Получаем все уникальные запросы
    const queries = await this.prisma.product.findMany({
      select: {
        query: true,
      },
      where: {
        price: {
          gte: 1000, // Фильтруем продукты с ценой меньше 1000 рублей
        },
        query: {
          not: '', // Исключаем пустые запросы
        },
      },
      distinct: ['query'],
    });

    // Для каждого запроса находим репрезентативный товар и рассчитываем процент изменения
    const result = await Promise.all(
      queries.map(async ({ query }) => {
        const productsForQuery = await this.prisma.product.findMany({
          select: {
            id: true,
            price: true,
          },
          where: {
            query: query,
            price: {
              gte: 1000,
            },
          },
          orderBy: { price: 'asc' },
        });

        if (productsForQuery.length === 0) return null;

        // Берем последний товар по этому query (самый свежий)
        const latestProduct = await this.prisma.product.findFirst({
          where: {
            query: query,
            price: {
              gte: 1000,
            },
          },
          orderBy: {
            created_at: 'desc', // Берем самый свежий
          },
        });

        if (!latestProduct) return null;

        // Получаем историю цен для расчета процента
        const priceHistory = await this.prisma.priceHistory.findMany({
          where: {
            query: query,
          },
          orderBy: {
            created_at: 'desc',
          },
          take: 10, // Берем больше записей
        });

        console.log(`[getPopularQueries] ${query}: found ${priceHistory.length} history records`);
        priceHistory.forEach((record, index) => {
          console.log(`[getPopularQueries] ${query}: history[${index}] = ${record.price} at ${record.created_at.toISOString()}`);
        });

        let priceChangePercent = 0;

        if (priceHistory.length >= 2) {
          // Ищем последнюю и предыдущую РАЗНЫЕ цены
          const currentPrice = priceHistory[0].price;
          let previousPrice = 0;
          
          // Идем по истории, пока не найдем цену, которая отличается от текущей
          for (let i = 1; i < priceHistory.length; i++) {
            if (priceHistory[i].price !== currentPrice) {
              previousPrice = priceHistory[i].price;
              console.log(`[getPopularQueries] ${query}: found different price at index ${i}: ${previousPrice} (current: ${currentPrice})`);
              break;
            }
          }
          
          console.log(`[getPopularQueries] ${query}: currentPrice = ${currentPrice}, previousPrice = ${previousPrice}`);
          
          if (previousPrice > 0) {
            priceChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
            console.log(`[getPopularQueries] ${query}: calculated change = ${priceChangePercent}%`);
          } else {
            console.log(`[getPopularQueries] ${query}: no different price found in history`);
          }
        } else {
          console.log(`[getPopularQueries] ${query}: not enough history records (${priceHistory.length})`);
        }

        return {
          query: query,
          minPrice: latestProduct.price, // Последняя цена из Product
          id: latestProduct.id, // ID последнего продукта
          priceChangePercent: priceChangePercent,
        };
      })
    );

    // Фильтруем null значения и возвращаем отсортированные
    return result
      .filter(
        (
          item,
        ): item is {
          query: string;
          minPrice: number;
          id: string;
          priceChangePercent: number;
        } => item !== null,
      )
      .sort((a, b) => a.minPrice - b.minPrice)
      .slice(0, 20);
  }

  /**
   * Получает продукты по query с рыночной статистикой
   */
  async getProductsByQuery(
    query: string,
  ): Promise<{ products: Product[]; marketStats: any }> {
    // Берем последний продукт по query (как в getPopularQueries)
    const latestProduct = await this.prisma.product.findFirst({
      where: {
        query: query,
        price: {
          gte: 1000,
        },
      },
      orderBy: {
        created_at: 'desc', // Берем самый свежий
      },
    });

    const products = latestProduct ? [latestProduct as Product] : [];
    const marketStats = await this.getMarketStats(query);

    return { products, marketStats };
  }

  /**
   * Получает продукты с пагинацией для выгодных предложений
   */
  async getProductsWithPagination(page: number = 1, limit: number = 10): Promise<{ products: Product[]; total: number; hasMore: boolean }> {
    const skip = (page - 1) * limit;
    
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }) as unknown as Product[],
      this.prisma.product.count()
    ]);
    
    return {
      products,
      total,
      hasMore: skip + limit < total
    };
  }
}
