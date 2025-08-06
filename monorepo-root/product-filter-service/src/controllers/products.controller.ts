import { Controller, Post, Body, Get, Query, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { ProductRequestDto } from '../dto/product-request.dto';

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  /**
   * Основной endpoint для поиска продуктов
   * POST /products/search
   * 
   * @param request - DTO с параметрами поиска
   * @returns ProductResponse с найденными товарами
   */
  @Post('search')
  @UsePipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true
  }))
  async searchProducts(@Body() request: ProductRequestDto) {
    this.logger.log(`🔍 Поиск продуктов: ${request.queries?.join(', ')} в категории ${request.category}`);
    
    const startTime = Date.now();
    const result = await this.productsService.getProducts(request);
    const processingTime = Date.now() - startTime;
    
    this.logger.log(`✅ Поиск завершен за ${processingTime}ms, найдено ${result.products.length} товаров`);
    
    return {
      ...result,
      processing_time_ms: processingTime
    };
  }

  /**
   * Получение статистики кэша
   * GET /products/cache/stats
   */
  @Get('cache/stats')
  async getCacheStats() {
    return {
      cache_hits: 0,
      cache_misses: 0,
      cache_size: 0,
      cache_ttl: 300
    };
  }
} 