import { Controller, Post, Body, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { ProductResponse } from '../types/product.types';
import { ProductRequestDto } from '../dto/product-request.dto';
import { QueryConfigService } from '../config/queries.config';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Основной endpoint для получения продуктов от бота
   * POST /products/search
   */
  @Post('search')
  async searchProducts(@Body() request: ProductRequestDto): Promise<ProductResponse> {
    try {
      let queries = request.queries;
      let category = request.category;

      if ((!category || category === '') && queries && queries.length === 1) {
        // Определяем категорию по query
        category = QueryConfigService.getCategoryByQuery(queries[0]);
      }

      if (!queries || queries.length === 0) {
        // Если queries не указаны, но есть категория — подставляем все queries для категории
        if (category) {
          queries = QueryConfigService.getQueriesForCategory(category);
        }
      }

      if (!queries || queries.length === 0 || !category) {
        throw new HttpException('Не указаны запросы или категорию невозможно определить', HttpStatus.BAD_REQUEST);
      }

      // Проверяем валидность категории
      const validCategories = ['videocards', 'processors', 'motherboards'];
      if (!validCategories.includes(category)) {
        throw new HttpException(`Неверная категория. Допустимые: ${validCategories.join(', ')}`, HttpStatus.BAD_REQUEST);
      }

      return await this.productsService.getProducts({ ...request, queries, category });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Ошибка поиска продуктов: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Получение статуса сервиса
   * GET /products/health
   */
  @Get('health')
  async getHealth(): Promise<{ status: string; timestamp: string; services: any }> {
    try {
      // Проверяем подключение к Redis
      const redisStatus = await this.checkRedisConnection();
      
      // Проверяем подключение к API
      const apiStatus = await this.checkApiConnections();

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          redis: redisStatus,
          wb_api: apiStatus.wb,
          ozon_api: apiStatus.ozon
        }
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          error: error.message
        }
      };
    }
  }

  /**
   * Получение статистики кэша
   * GET /products/cache/stats
   */
  @Get('cache/stats')
  async getCacheStats(): Promise<{ 
    total_keys: number; 
    categories: { [key: string]: number }; 
    memory_usage?: string; 
  }> {
    try {
      // Здесь можно добавить логику получения статистики Redis
      // Пока возвращаем базовую структуру
      return {
        total_keys: 0,
        categories: {
          videocards: 0,
          processors: 0,
          motherboards: 0
        }
      };
    } catch (error) {
      throw new HttpException(
        `Ошибка получения статистики: ${error.message}`, 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Проверка подключения к Redis
   */
  private async checkRedisConnection(): Promise<{ status: string; error?: string }> {
    try {
      // Здесь должна быть проверка Redis через RedisService
      return { status: 'ok' };
    } catch (error) {
      return { 
        status: 'error', 
        error: error.message 
      };
    }
  }

  /**
   * Проверка подключения к API
   */
  private async checkApiConnections(): Promise<{ 
    wb: { status: string; error?: string }; 
    ozon: { status: string; error?: string }; 
  }> {
    try {
      // Здесь должна быть проверка gRPC подключений
      return {
        wb: { status: 'ok' },
        ozon: { status: 'ok' }
      };
    } catch (error) {
      return {
        wb: { status: 'error', error: error.message },
        ozon: { status: 'error', error: error.message }
      };
    }
  }
} 