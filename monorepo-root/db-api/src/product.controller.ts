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

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return await this.productService.findOne(id);
  }

  @Get()
  async getProducts(@Query() query: any) {
    return await this.productService.findAll(query);
  }
}
