import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import {
  BatchCreateRequest,
  BatchCreateResponse,
  ProductForService,
} from './types/product.types';
import { ProductQueryDto } from './dto/product-query.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('batch-create')
  async batchCreateProducts(
    @Body() data: BatchCreateRequest,
  ): Promise<
    BatchCreateResponse & { products_count: number; market_stats: string }
  > {
    const { products, marketStats } = data;

    // Конвертируем RawProduct в ProductForService
    const productsForService: ProductForService[] = products.map((product) => ({
      ...product,
      image_url: product.image_url || product.imageUrl || '',
      product_url: product.product_url || product.productUrl || '',
    }));

    const inserted = await this.productService.batchCreate(productsForService);

    if (marketStats) {
      await this.productService.saveMarketStats(marketStats);
    }

    return {
      inserted,
      history: 0,
      products_count: inserted,
      market_stats: 'saved',
    };
  }

  @Get('health')
  health(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('popular-queries')
  async getPopularQueries() {
    console.log('[ProductController] getPopularQueries called');
    try {
      const result = await this.productService.getPopularQueries();
      console.log('[ProductController] getPopularQueries result:', result);
      return result;
    } catch (error) {
      console.error('[ProductController] getPopularQueries error:', error);
      throw error;
    }
  }

  @Get('products-by-query/:query')
  async getProductsByQuery(@Param('query') query: string) {
    return await this.productService.getProductsByQuery(query);
  }

  @Get()
  async getProducts(@Query() query: ProductQueryDto) {
    return await this.productService.findAll(query);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return await this.productService.findOne(id);
  }
}
