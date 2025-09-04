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
    
    // Обрабатываем каждый запрос отдельно
    const allProducts = [];
    for (const query of request.queries) {
      const singleRequest = {
        ...request,
        queries: [query]
      };
      
      const [wbProducts, ozonProducts] = await Promise.all([
        this.getProductsFromApi(singleRequest, this.wbApiClient, 'wb'),
        this.getProductsFromApi(singleRequest, this.ozonApiClient, 'ozon')
      ]);
      
      allProducts.push(...wbProducts, ...ozonProducts);
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
   * @returns Promise с массивом товаров с добавленным source
   * @throws Логирует ошибку, если API недоступно или возвращает ошибку
   */
  private async getProductsFromApi(
    request: ProductRequestDto,
    client: { filterProducts: Function },
    source: string
  ): Promise<any[]> {
    const allProducts: any[] = [];
    for (const query of request.queries) {
      let lastError = null;
      let success = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Получаем конфигурацию из БД
          let category = request.category;
          let extra: any = {};
          if (source === 'wb') {
            // Для WB API category - это wb_id (число)
            const wbCategoryId = await this.dbConfigService.getWbCategoryId(request.category);
            category = wbCategoryId || request.category;
            extra.categoryKey = request.category;
            
            // Получаем exactmodels для конкретного запроса из БД
            const queryExactmodels = await this.dbConfigService.getExactModelsForQuery(request.category, query, 'wb');
            if (queryExactmodels) {
              extra.exactmodels = queryExactmodels;
            }
          }
          if (source === 'ozon') {
            // Для Ozon API category - это ozon_id (строка, category_slug)
            const ozonCategoryId = await this.dbConfigService.getOzonCategoryId(request.category);
            category = ozonCategoryId || request.category;
            extra.categoryKey = request.category;
            
            // platform_id и exactmodels - дополнительные параметры для Ozon API
            if (request.platform_id) {
              extra.platform_id = request.platform_id;
            }
            if (request.exactmodels) {
              extra.exactmodels = request.exactmodels;
            }
          }
          console.log(`🔍 DEBUG - request.exactmodels: "${request.exactmodels}"`);
          console.log(`🔍 DEBUG - extra.exactmodels: "${extra.exactmodels}"`);
          
          const response = await client.filterProducts({
            query,
            all_queries: [query],
            category,
            exactmodels: request.exactmodels || extra.exactmodels,
            platform_id: request.platform_id || extra.platform_id,
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