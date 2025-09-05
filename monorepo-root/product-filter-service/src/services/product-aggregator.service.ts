import { Injectable } from '@nestjs/common';
import { OzonApiClient } from '../grpc-clients/ozon-api.client';
import { WbApiClient } from '../grpc-clients/wb-api.client';
import { ProductRequestDto } from '../dto/product-request.dto';
import { fileLogger } from '../utils/logger';
import { DbConfigService } from './db-config.service';

@Injectable()
export class ProductAggregatorService {
  constructor(
    private readonly ozonApiClient: OzonApiClient,
    private readonly wbApiClient: WbApiClient,
    private readonly dbConfigService: DbConfigService,
  ) {}

  /**
   * Агрегирует товары из WB и Ozon API по запросу пользователя.
   * @param request - DTO с параметрами поиска
   * @returns Promise с массивом всех товаров из обоих источников
   */
  async fetchAllProducts(request: ProductRequestDto): Promise<any[]> {
    fileLogger.log(`Агрегация товаров из WB и Ozon для ${request.queries.length} запросов`);
    
    // Получаем конфигурацию запросов из БД один раз для всей категории
    const queryConfigs = await this.dbConfigService.getQueriesForCategory(request.category);
    fileLogger.log(`📋 Найдено ${queryConfigs.length} конфигураций запросов для категории ${request.category}`);
    
    // Обрабатываем каждый запрос отдельно
    const allProducts = [];
    for (const query of request.queries) {
      const singleRequest = {
        ...request,
        queries: [query]
      };
      
      // Ищем ВСЕ конфигурации для конкретного запроса
      const queryConfigsForQuery = queryConfigs.filter((q: any) => q.query === query);
      fileLogger.log(`🔍 Запрос "${query}": найдено ${queryConfigsForQuery.length} конфигураций`);
      
      const promises = [];
      
      // Обрабатываем каждую конфигурацию
      for (const queryConfig of queryConfigsForQuery) {
        fileLogger.log(`📋 Конфигурация: платформа ${queryConfig.platform}`);
        
        if (queryConfig.platform === 'wb') {
          fileLogger.log(`📱 Парсинг WB для запроса: ${query}`);
          promises.push(this.getProductsFromApi(singleRequest, this.wbApiClient, 'wb', queryConfig));
        }
        
        if (queryConfig.platform === 'ozon') {
          fileLogger.log(`🛒 Парсинг Ozon для запроса: ${query}`);
          promises.push(this.getProductsFromApi(singleRequest, this.ozonApiClient, 'ozon', queryConfig));
        }
      }
      
      // Если нет специфичной конфигурации, парсим обе платформы
      if (promises.length === 0) {
        fileLogger.log(`🔄 Парсинг обеих платформ для запроса: ${query} (конфигурация не найдена)`);
        promises.push(
          this.getProductsFromApi(singleRequest, this.wbApiClient, 'wb', null),
          this.getProductsFromApi(singleRequest, this.ozonApiClient, 'ozon', null)
        );
      }
      
      const results = await Promise.all(promises);
      allProducts.push(...results.flat());
    }
    
    // Логируем общее количество товаров
    fileLogger.log(`📊 Всего получено: ${allProducts.length} товаров`);
    
    return allProducts;
  }

  /**
   * Универсальный метод получения товаров из внешнего API.
   * @param request - DTO с параметрами поиска
   * @param client - gRPC-клиент (WB или Ozon)
   * @param source - строка-идентификатор источника ('wb' или 'ozon')
   * @param queryConfig - конфигурация запроса из БД (может быть null)
   * @returns Promise с массивом товаров с добавленным source
   * @throws Логирует ошибку, если API недоступно или возвращает ошибку
   */
  private async getProductsFromApi(
    request: ProductRequestDto,
    client: { filterProducts: Function },
    source: string,
    queryConfig: any = null
  ): Promise<any[]> {
    const allProducts: any[] = [];
    for (const query of request.queries) {
      let lastError = null;
      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Используем переданную конфигурацию или получаем из БД
          let category = request.category;
          let extra: any = {};
          
          if (queryConfig) {
            // Используем переданную конфигурацию
            if (source === 'wb') {
              const wbCategoryId = await this.dbConfigService.getWbCategoryId(request.category);
              category = wbCategoryId || request.category;
              extra.categoryKey = request.category;
              extra.exactmodels = queryConfig.exactmodels;
            }
            if (source === 'ozon') {
              const ozonCategoryId = await this.dbConfigService.getOzonCategoryId(request.category);
              category = ozonCategoryId || request.category;
              extra.categoryKey = request.category;
              extra.platform_id = queryConfig.platform_id;
              extra.exactmodels = queryConfig.exactmodels;
            }
          } else {
            // Fallback: получаем конфигурацию из БД (для случаев без специфичной конфигурации)
            if (source === 'wb') {
              const wbCategoryId = await this.dbConfigService.getWbCategoryId(request.category);
              category = wbCategoryId || request.category;
              extra.categoryKey = request.category;
              
              const queryExactmodels = await this.dbConfigService.getExactModelsForQuery(request.category, query, 'wb');
              if (queryExactmodels) {
                extra.exactmodels = queryExactmodels;
              }
            }
            if (source === 'ozon') {
              const ozonCategoryId = await this.dbConfigService.getOzonCategoryId(request.category);
              category = ozonCategoryId || request.category;
              extra.categoryKey = request.category;
              
              if (request.platform_id) {
                extra.platform_id = request.platform_id;
              }
              if (request.exactmodels) {
                extra.exactmodels = request.exactmodels;
              }
            }
          }
          
          fileLogger.log(`🔍 ${source.toUpperCase()} - exactmodels: "${extra.exactmodels || 'не указаны'}", platform_id: "${extra.platform_id || 'не указан'}"`);
          
          const response = await client.filterProducts({
            query,
            all_queries: [query],
            category,
            exactmodels: extra.exactmodels,
            platform_id: extra.platform_id,
            exclude_keywords: request.exclude_keywords || []
          });
          if (response.products && Array.isArray(response.products) && response.products.length > 0) {
            const productsWithSource = response.products.map((product: any) => ({
              ...product,
              source
            }));
            allProducts.push(...productsWithSource);
            success = true;
            break; // успех — выходим из retry-цикла
          } else {
            throw new Error('API вернул пустой ответ');
          }
        } catch (error) {
          lastError = error;
          fileLogger.error(`Ошибка ${source.toUpperCase()} API (попытка ${attempt}) для запроса "${query}": ${error}`);
          if (attempt < 3) {
            await new Promise(res => setTimeout(res, 2000)); // задержка между попытками
          }
        }
      }
      if (!success && lastError) {
        fileLogger.error(`❌ Все попытки исчерпаны для ${source.toUpperCase()} API по запросу "${query}": ${lastError}`);
      }
    }
    return allProducts;
  }
} 