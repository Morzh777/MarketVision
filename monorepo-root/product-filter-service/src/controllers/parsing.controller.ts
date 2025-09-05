import { Controller, Post, Body, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { DbApiHttpClient } from '../http-clients/db-api.client';
import { DbConfigService } from '../services/db-config.service';

interface ParsingTriggerDto {
  categoryKey: string;
  queryText?: string; // Опционально - для парсинга конкретного запроса
}

@Controller('parsing')
export class ParsingController {
  private readonly logger = new Logger(ParsingController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly dbApiClient: DbApiHttpClient,
    private readonly dbConfigService: DbConfigService
  ) {}

  /**
   * Очистка кэша после парсинга
   */
  private async clearCache(): Promise<void> {
    try {
      // Очищаем кэш через MarketVision API
      const response = await fetch('http://marketvision-frontend-dev:3006/api/cache/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Cache clear failed');
      }
    } catch (error) {
      this.logger.error(`❌ Ошибка очистки кэша: ${error.message}`);
      throw error;
    }
  }

  /**
   * Запуск парсинга для категории
   * POST /parsing/trigger
   * 
   * @param request - DTO с указанием категории для парсинга
   * @returns Результат запуска парсинга
   */
  @Post('trigger')
  @UsePipes(new ValidationPipe({ 
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true
  }))
  async triggerParsing(@Body() request: ParsingTriggerDto) {
    this.logger.log(`🚀 Получено указание на парсинг категории: ${request.categoryKey}`);
    
    const startTime = Date.now();
    
    try {
      // 1. Забираем все запросы для категории из DB API
      this.logger.log(`📥 Забираем запросы для категории ${request.categoryKey} из DB API`);
      const queriesResponse = await this.dbApiClient.getQueriesForCategory(request.categoryKey);
      const queries = queriesResponse.queries || [];
      
      if (!queries || queries.length === 0) {
        this.logger.warn(`⚠️ Нет запросов для категории ${request.categoryKey}`);
        return {
          success: false,
          message: `Нет запросов для категории ${request.categoryKey}`,
          data: { queries_found: 0 }
        };
      }

      this.logger.log(`📋 Найдено ${queries.length} запросов для парсинга`);

      // 2. Получаем конфигурацию категории для правильных ID
      const categoryConfig = await this.dbConfigService.getCategoryConfig(request.categoryKey);
      if (!categoryConfig) {
        this.logger.error(`❌ Не найдена конфигурация для категории ${request.categoryKey}`);
        return {
          success: false,
          message: `Не найдена конфигурация для категории ${request.categoryKey}`,
          data: { queries_found: 0 }
        };
      }

      this.logger.log(`📋 Конфигурация категории: WB ID=${categoryConfig.wb_id}, Ozon ID=${categoryConfig.ozon_id}`);

      // 3. Группируем запросы по уникальным query и запускаем парсинг
      const uniqueQueries = new Map();
      for (const query of queries) {
        if (!uniqueQueries.has(query.query)) {
          uniqueQueries.set(query.query, []);
        }
        uniqueQueries.get(query.query).push(query);
      }
      
      this.logger.log(`📋 Найдено ${uniqueQueries.size} уникальных запросов для парсинга`);
      
      const results = [];
      for (const [queryText, queryConfigs] of uniqueQueries) {
        this.logger.log(`🔍 Парсинг запроса: "${queryText}" (${queryConfigs.length} конфигураций)`);
        
        const queryRequest = {
          queries: [queryText],
          category: request.categoryKey, // Используем ключ категории для валидации
          platform_id: undefined, // Будет определено в ProductAggregatorService
          exactmodels: undefined // Будет определено в ProductAggregatorService
        };
        
        const result = await this.productsService.getProducts(queryRequest);
        results.push({
          query: queryText,
          platforms: queryConfigs.map(q => q.platform).join(', '),
          products_found: result.products.length
        });
      }

      const processingTime = Date.now() - startTime;
      const totalProducts = results.reduce((sum, r) => sum + r.products_found, 0);
      
      this.logger.log(`✅ Парсинг завершен за ${processingTime}ms, обработано ${queries.length} запросов, найдено ${totalProducts} товаров`);
      
      // 4. Очищаем кэш после успешного парсинга
      try {
        this.logger.log(`🧹 Очищаем кэш после парсинга...`);
        await this.clearCache();
        this.logger.log(`✅ Кэш успешно очищен`);
      } catch (cacheError) {
        this.logger.warn(`⚠️ Не удалось очистить кэш: ${cacheError.message}`);
      }
      
      return {
        success: true,
        message: 'Парсинг успешно запущен и завершен',
        data: {
          category: request.categoryKey,
          queries_processed: queries.length,
          total_products_found: totalProducts,
          processing_time_ms: processingTime,
          results
        }
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка при запуске парсинга: ${error.message}`, error.stack);
      
      return {
        success: false,
        message: 'Ошибка при запуске парсинга',
        error: error.message
      };
    }
  }
}
