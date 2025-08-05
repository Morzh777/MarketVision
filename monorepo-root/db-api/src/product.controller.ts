import { Controller, Get, Query, Param } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { ProductService } from './product.service';
import { PrismaService } from './prisma.service';
import type { Product } from './product.service';
import { RawProductDto } from './dto/raw-product.dto';
import { validateSync } from 'class-validator';

import type {
  BatchCreateRequest,
  BatchCreateResponse,
  ProductForService,
} from './types/product.types';
import type { MarketStats } from './types/product.types';

@Controller('api')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly prisma: PrismaService,
  ) {}

  // Health check endpoint
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'db-api',
    };
  }

  // Statistics endpoint for admin dashboard
  @Get('stats')
  async getStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      // Общее количество продуктов
      const totalProducts = await this.prisma.product.count();

      // Количество продуктов добавленных сегодня
      const productsToday = await this.prisma.product.count({
        where: {
          created_at: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Количество уникальных запросов
      const uniqueQueries = await this.prisma.product.findMany({
        select: { query: true },
        distinct: ['query'],
      });

      // Количество запросов за сегодня (из PriceHistory)
      const queriesToday = await this.prisma.priceHistory.count({
        where: {
          created_at: {
            gte: today,
            lt: tomorrow,
          },
        },
      });

      // Количество пользователей
      const totalUsers = await this.prisma.user.count();

      // Статистика по категориям
      const categoriesStats = await this.prisma.product.groupBy({
        by: ['category'],
        _count: {
          category: true,
        },
        _avg: {
          price: true,
        },
        _min: {
          price: true,
        },
        _max: {
          price: true,
        },
      });

      // Статистика по источникам с детальной информацией
      const sourcesStats = await this.prisma.product.groupBy({
        by: ['source'],
        _count: {
          source: true,
        },
        _avg: {
          price: true,
        },
        _min: {
          price: true,
        },
        _max: {
          price: true,
        },
      });

      // Топ товары по цене в каждой категории
      const topProductsByCategory: Record<string, any[]> = {};

      // Получаем уникальные категории
      const categories = await this.prisma.product.findMany({
        select: { category: true },
        distinct: ['category'],
      });

      // Для каждой категории получаем топ-3 самых дорогих товара
      for (const { category } of categories) {
        const topProducts = await this.prisma.product.findMany({
          where: { category },
          orderBy: { price: 'desc' },
          take: 3,
          select: {
            id: true,
            name: true,
            price: true,
            category: true,
            source: true,
            created_at: true,
          },
        });

        if (topProducts.length > 0) {
          topProductsByCategory[category] = topProducts;
        }
      }

      // Получаем все продукты для расчета распределения цен
      const allProducts = await this.prisma.product.findMany({
        select: { price: true },
      });

      // Распределение по ценам
      const priceDistribution = {
        '0-1000': 0,
        '1000-5000': 0,
        '5000-10000': 0,
        '10000-25000': 0,
        '25000-50000': 0,
        '50000-100000': 0,
        '100000+': 0,
      };

      allProducts.forEach((product) => {
        const price = product.price;
        if (price < 1000) priceDistribution['0-1000']++;
        else if (price < 5000) priceDistribution['1000-5000']++;
        else if (price < 10000) priceDistribution['5000-10000']++;
        else if (price < 25000) priceDistribution['10000-25000']++;
        else if (price < 50000) priceDistribution['25000-50000']++;
        else if (price < 100000) priceDistribution['50000-100000']++;
        else priceDistribution['100000+']++;
      });

      // История парсинга за последние 7 дней
      const parsingHistory = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const dayProducts = await this.prisma.product.count({
          where: {
            created_at: {
              gte: date,
              lt: nextDate,
            },
          },
        });

        parsingHistory.push({
          date: date.toISOString(),
          count: dayProducts,
        });
      }

      // Статистика MarketStats
      const marketStatsCount = await this.prisma.marketStats.count();

      // Преобразуем статистику источников в нужный формат для фронтенда
      const sourcesStatsFormatted = sourcesStats.reduce(
        (acc, item) => {
          const productCount = item._count.source;
          const percentage =
            totalProducts > 0
              ? Math.round((productCount / totalProducts) * 100)
              : 0;

          acc[item.source] = {
            productCount,
            percentage,
            avgPrice: Math.round(item._avg.price || 0),
            priceRange: {
              min: item._min.price || 0,
              max: item._max.price || 0,
            },
            lastParsed: new Date().toISOString(),
          };
          return acc;
        },
        {} as Record<string, any>,
      );

      return {
        totalProducts,
        productsToday,
        totalQueries: uniqueQueries.length,
        queriesToday,
        totalUsers,
        marketStatsCount,
        categories: categoriesStats.reduce(
          (acc, item) => {
            acc[item.category] = item._count.category;
            return acc;
          },
          {} as Record<string, number>,
        ),
        sources: sourcesStats.reduce(
          (acc, item) => {
            acc[item.source] = item._count.source;
            return acc;
          },
          {} as Record<string, number>,
        ),
        // Добавляем детальную статистику источников
        sourcesStats: sourcesStatsFormatted,
        categoriesStats: categoriesStats.reduce(
          (acc, item) => {
            const productCount = item._count.category;
            acc[item.category] = {
              productCount,
              avgPrice: Math.round(item._avg.price || 0),
              priceRange: {
                min: item._min.price || 0,
                max: item._max.price || 0,
              },
              lastParsed: new Date().toISOString(),
            };
            return acc;
          },
          {} as Record<string, any>,
        ),
        topProductsByCategory,
        priceDistribution,
        parsingHistory,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalProducts: 0,
        productsToday: 0,
        totalQueries: 0,
        queriesToday: 0,
        totalUsers: 0,
        marketStatsCount: 0,
        categories: {},
        sources: {},
        recentProducts: [],
        lastUpdate: new Date().toISOString(),
        error: 'Failed to fetch stats from database',
      };
    }
  }

  // REST API endpoints
  @Get('products')
  async getProducts(
    @Query('query') query?: string,
    @Query('category') category?: string,
  ) {
    const products = await this.productService.findAll({ query, category });
    const marketStats: MarketStats | null = query
      ? ((await this.productService.getMarketStats(query)) as MarketStats)
      : null;
    return {
      products,
      marketStats,
    };
  }

  @Get('products/price-history-by-query')
  async getPriceHistoryByQuery(
    @Query('query') query: string,
    @Query('limit') limit: string = '10',
  ) {
    console.log(
      `[Controller] getPriceHistoryByQuery called with query: "${query}", limit: "${limit}"`,
    );
    const limitNum = parseInt(limit, 10);
    console.log(`[Controller] Parsed limit: ${limitNum}`);

    try {
      const result = await this.productService.getPriceHistoryByQuery(
        query,
        limitNum,
      );
      console.log(`[Controller] getPriceHistoryByQuery result:`, result);
      return result;
    } catch (error) {
      console.error(`[Controller] Error in getPriceHistoryByQuery:`, error);
      throw error;
    }
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Get('popular-queries')
  async getPopularQueries() {
    console.log('[Controller] getPopularQueries called');
    const result = await this.productService.getPopularQueries();
    console.log(
      '[Controller] getPopularQueries result:',
      JSON.stringify(result, null, 2),
    );
    return result;
  }

  @Get('products-by-query/:query')
  async getProductsByQuery(@Param('query') query: string) {
    return this.productService.getProductsByQuery(query);
  }

  @Get('products-paginated')
  async getProductsWithPagination(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.productService.getProductsWithPagination(pageNum, limitNum);
  }

  // gRPC methods
  @GrpcMethod('ProductService', 'FindAll')
  async findAll(): Promise<{ products: Product[] }> {
    const products = await this.productService.findAll({});
    return { products };
  }

  @GrpcMethod('raw_product.RawProductService', 'BatchCreateProducts')
  async batchCreateProducts(
    obj: BatchCreateRequest,
  ): Promise<BatchCreateResponse> {
    const { products, marketStats } = obj;

    // DTO-валидация
    const validProducts = products.filter((p) => {
      const dto = Object.assign(new RawProductDto(), {
        ...p,
        image_url: p.image_url ?? p.imageUrl,
        product_url: p.product_url ?? p.productUrl,
      });
      const errors = validateSync(dto);
      return errors.length === 0;
    });

    // После валидации приводим к snake_case для сервиса
    const snakeProducts: ProductForService[] = validProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.image_url ?? p.imageUrl ?? '',
      product_url: p.product_url ?? p.productUrl ?? '',
      category: p.category,
      source: p.source,
      query: p.query,
    }));

    // Сохраняем продукты, историю и статистику
    const inserted = await this.productService.batchCreate(snakeProducts);
    const history =
      await this.productService.batchCreatePriceHistory(snakeProducts);

    if (marketStats) {
      await this.productService.saveMarketStats(marketStats);
    }

    return { inserted, history };
  }
}
