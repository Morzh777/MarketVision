import { Injectable } from '@nestjs/common';
import { OzonApiClient } from '../grpc-clients/ozon-api.client';
import { WbApiClient } from '../grpc-clients/wb-api.client';
import { ProductRequestDto } from '../dto/product-request.dto';
import { fileLogger } from '../utils/logger';
import { CategoryConfigService } from '../config/categories.config';

@Injectable()
export class ProductAggregatorService {
  constructor(
    private readonly ozonApiClient: OzonApiClient,
    private readonly wbApiClient: WbApiClient,
  ) {}

  /**
   * Агрегирует товары из WB и Ozon API по запросу пользователя.
   * @param request - DTO с параметрами поиска
   * @returns Promise с массивом всех товаров из обоих источников
   */
  async fetchAllProducts(request: ProductRequestDto): Promise<any[]> {
    fileLogger.log(`Агрегация товаров из WB и Ozon для ${request.queries.length} запросов`);
    const [wbProducts, ozonProducts] = await Promise.all([
      this.getProductsFromApi(request, this.wbApiClient, 'wb'),
      this.getProductsFromApi(request, this.ozonApiClient, 'ozon')
    ]);
    
    // Логируем количество товаров от каждого API
    fileLogger.log(`📊 WB API: ${wbProducts.length} товаров`);
    fileLogger.log(`📊 Ozon API: ${ozonProducts.length} товаров`);
    
    return [...wbProducts, ...ozonProducts];
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
          // Для WB подставляем правильный xsubject
          let category = request.category;
          let extra: any = {};
          if (source === 'wb') {
            category = CategoryConfigService.getWbCategory(request.category) || request.category;
            extra.categoryKey = request.category; // Теперь передаём categoryKey для WB API
          }
          if (source === 'ozon') {
            category = CategoryConfigService.getOzonCategory(request.category) || request.category;
            extra.categoryKey = request.category;
            const platformId = CategoryConfigService.getPlatformForQuery(query);
            if (platformId) {
              extra.platform_id = platformId;
            }
            const exactmodels = CategoryConfigService.getExactModelsForQuery(query);
            if (exactmodels) {
              extra.exactmodels = exactmodels;
            }
          }
          const response = await client.filterProducts({
            query,
            all_queries: [query],
            category,
            ...extra,
            exclude_keywords: request.exclude_keywords || [],
            ...(request.exactmodels ? { exactmodels: request.exactmodels } : {}) // <-- прокидываем exactmodels
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