import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('batch-create')
  async batchCreateProducts(@Body() data: { products: any[]; marketStats?: any }) {
    const { products, marketStats } = data;
    const inserted = await this.productService.batchCreate(products);
    if (marketStats) {
      await this.productService.saveMarketStats(marketStats);
    }
    return {
      inserted,
      history: undefined,
      products_count: inserted,
      market_stats: 'saved',
    };
  }

  @Get('health')
  async health() {
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

  @Get()
  async getProducts(@Query() query: any) {
    return await this.productService.findAll(query);
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return await this.productService.findOne(id);
  }
}
