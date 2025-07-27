import { Controller, Get, Query, Param } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

import { ProductService } from './product.service';
import type { Product } from './product.service';
import { RawProductDto } from './dto/raw-product.dto';
import { validateSync } from 'class-validator';

import type {
  BatchCreateRequest,
  BatchCreateResponse,
  ProductForService,
} from './types/product.types';

@Controller('api')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // REST API endpoints
  @Get('products')
  async getProducts(
    @Query('query') query?: string,
    @Query('category') category?: string,
  ) {
    const products = await this.productService.findAll({ query, category });
    const marketStats: any = query
      ? await this.productService.getMarketStats(query)
      : null;
    return {
      products,
      marketStats,
    } as { products: any[]; marketStats: any };
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Get('products/:id/price-history')
  async getPriceHistory(
    @Param('id') id: string,
    @Query('timeframe') timeframe: 'day' | 'week' | 'month' | 'year' = 'day',
  ) {
    return this.productService.getPriceHistory(id, timeframe);
  }

  @Get('products/:id/price-history-multi')
  async getPriceHistoryMulti(
    @Param('id') id: string,
    @Query('timeframes') timeframes: string = 'month',
  ) {
    const timeframeArray = timeframes.split(',') as ('day' | 'week' | 'month' | 'year')[];
    return this.productService.getPriceHistoryMulti(id, timeframeArray);
  }



  @Get('popular-queries')
  async getPopularQueries() {
    return this.productService.getPopularQueries();
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
    const history = await this.productService.batchCreatePriceHistory(snakeProducts);

    if (marketStats) {
      await this.productService.saveMarketStats(marketStats);
    }

    return { inserted, history };
  }
}
