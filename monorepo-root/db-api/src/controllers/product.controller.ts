import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import {
  BatchCreateRequest,
  BatchCreateResponse,
  ProductForService,
  MarketStats,
} from '../types/product.types';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async getProducts(
    @Query('query') query?: string,
    @Query('category') category?: string,
  ) {
    console.log('[ProductController] getProducts called with:', {
      query,
      category,
    });
    const products = await this.productService.findAll({ query, category });
    console.log('[ProductController] Found products:', products.length);

    // Получаем priceChangePercent для каждого продукта
    let priceChangePercent = 0;
    if (products.length > 0 && query) {
      try {
        // Получаем priceChangePercent из популярных запросов - берем больше записей чтобы найти нужный
        const popularQueries = await this.productService.getPopularQueries(
          100,
          0,
          undefined,
          undefined,
        );
        const popularProduct = popularQueries.find((p) => p.query === query);
        priceChangePercent = popularProduct?.priceChangePercent || 0;
        console.log(
          '[ProductController] priceChangePercent for query',
          query,
          ':',
          priceChangePercent,
        );
      } catch (error) {
        console.error(
          '[ProductController] Error getting priceChangePercent:',
          error,
        );
        priceChangePercent = 0;
      }
    }

    // Возвращаем в формате, который ожидает marketvision-api
    const marketStats: MarketStats | null =
      products.length > 0 && query
        ? await this.productService.getMarketStats(query)
        : null;

    return {
      products: products,
      marketStats: marketStats,
      priceChangePercent: priceChangePercent,
    };
  }

  @Post('batch-create')
  async batchCreateProducts(
    @Body() data: BatchCreateRequest,
  ): Promise<
    BatchCreateResponse & { products_count: number; market_stats: string }
  > {
    console.log(
      '[DB-API] batchCreateProducts received data:',
      JSON.stringify(data, null, 2),
    );
    const { products, marketStats, market_stats } = data;
    const stats = marketStats || market_stats;

    // Конвертируем RawProduct в ProductForService
    const productsForService: ProductForService[] = products.map((product) => ({
      ...product,
      image_url: product.image_url || product.imageUrl || '',
      product_url: product.product_url || product.productUrl || '',
    }));

    const inserted = await this.productService.batchCreate(productsForService);

    if (stats) {
      console.log(
        '[DB-API] Saving market stats:',
        JSON.stringify(stats, null, 2),
      );
      await this.productService.saveMarketStats(stats);
    } else {
      console.log('[DB-API] No market stats to save');
    }

    return {
      inserted,
      history: 0,
      products_count: inserted,
      market_stats: stats ? 'saved' : 'none',
    };
  }

  @Get('health')
  health(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('popular-queries')
  async getPopularQueries(
    @Query('limit') limit: string,
    @Query('offset') offset: string,
    @Query('telegram_id') telegram_id?: string,
    @Query('category') category?: string,
    @Query('filter') filter?: string,
  ) {
    console.log('[ProductController] getPopularQueries called with:', {
      telegram_id,
      limit,
      offset,
      category,
      filter,
    });
    try {
      const limitNum = parseInt(limit, 10);
      const offsetNum = parseInt(offset, 10);

      // Получаем все товары
      let result = await this.productService.getPopularQueries(
        limitNum,
        offsetNum,
        telegram_id,
        category,
      );

      // Если filter=favorites - возвращаем только избранные товары
      if (filter === 'favorites' && telegram_id) {
        result = result.filter((item) => item.isFavorite);
      }

      console.log('[ProductController] getPopularQueries result:', result);

      // Возвращаем объект с данными и метаданными пагинации
      return {
        data: result,
        hasMore: result.length === limitNum, // Если получили меньше чем запросили, значит это последняя страница
        total: result.length,
        offset: offsetNum,
        limit: limitNum,
      };
    } catch (error) {
      console.error('[ProductController] getPopularQueries error:', error);
      throw error;
    }
  }

  @Get('products-by-query/:query')
  async getProductsByQuery(@Param('query') query: string) {
    return await this.productService.getProductsByQuery(query);
  }

  @Get('price-history-by-query')
  async getPriceHistoryByQuery(
    @Query('query') query: string,
    @Query('limit') limit: string = '10',
  ) {
    const limitNum = parseInt(limit, 10) || 10;
    return await this.productService.getPriceHistoryByQuery(query, limitNum);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return await this.productService.findOne(id);
  }
}
