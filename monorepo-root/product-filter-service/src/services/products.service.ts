import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductRequestDto } from '../dto/product-request.dto';
import { ProductAggregatorService } from './product-aggregator.service';
import { ValidationFactoryService } from './validation.service/validation-factory.service';
import { ProductGroupingService } from './product-grouping.service';
import { ProductNormalizerService } from './product-normalizer.service';
import { ProductResponse } from '../types/product.types';
import { DbApiClient } from '../grpc-clients/db-api.client';
import { PhotoService } from './photo.service';


@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly aggregator: ProductAggregatorService,
    private readonly validationFactory: ValidationFactoryService,
    private readonly grouper: ProductGroupingService,
    private readonly normalizer: ProductNormalizerService,
    private readonly dbApiClient: DbApiClient,
    private readonly photoService: PhotoService,
  ) {}

  /**
   * Основной orchestration-метод: агрегирует, валидирует, группирует продукты.
   * @param request - параметры поиска (массив query, категория и т.д.)
   * @returns ProductResponse с итоговым списком товаров и метаданными
   * @throws BadRequestException если не указаны обязательные параметры
   */
  async getProducts(request: ProductRequestDto): Promise<ProductResponse> {
    if (!request.queries || !Array.isArray(request.queries) || request.queries.length === 0) {
      throw new BadRequestException('Не указаны запросы для поиска');
    }
    if (!request.category) {
      throw new BadRequestException('Не указана категория');
    }
    const startTime = Date.now();
    const queries = Array.isArray(request.queries) ? request.queries : [];
    const queriesStr = queries.length === 1
      ? queries[0]
      : queries.join(', ');
    this.logger.log(`🔍 Запрос: "${queriesStr}" (${request.category})`);
    let t = Date.now();

    // 1. Агрегация
    const allProducts = await this.aggregator.fetchAllProducts(request);
    this.logger.log(`📦 Получено ${allProducts.length} продуктов`);
    t = Date.now();

    // 2. Валидация через ValidationFactoryService
    const validationResults = await this.validationFactory.validateProducts(allProducts, request.category as any);
    const validProducts = allProducts.filter((product, index) => {
      const result = validationResults[index];
      if (!result.isValid) {
        this.logger.debug(`❌ Продукт не прошел валидацию: ${product.name} - ${result.reason}`);
      } else {
        this.logger.debug(`✅ Продукт прошел валидацию: ${product.name} - ${result.reason} (confidence: ${result.confidence})`);
      }
      return result.isValid;
    });
    this.logger.log(`✅ Валидация: ${validProducts.length}/${allProducts.length}`);
    t = Date.now();

    // 3. Группировка (по нормализованному ключу)
    const groupedProducts = this.grouper.groupAndSelectCheapest(
      validProducts,
      (product) => this.normalizer.getModelKey(product),
      request.category
    );
    this.logger.log(`📊 Сгруппировано в ${groupedProducts.length} товаров`);
    
    // Логируем информацию о последнем товаре в результате
    if (groupedProducts.length > 0) {
      const lastProduct = groupedProducts[groupedProducts.length - 1];
      this.logger.log(`🎯 Последний товар в результате: "${lastProduct.name}" (цена: ${lastProduct.price}₽, источник: ${lastProduct.source})`);
    }
    t = Date.now();

    // Подменяем category на человекочитаемое название перед сохранением
    for (const product of groupedProducts) {
      product.category = request.category;
      if (product.source === 'wb') {
        product.image_url = await this.photoService.findProductPhoto(product.id) || product.image_url;
      }
    }
    this.logger.log(`📷 Фото получены`);
    t = Date.now();

    // Группируем валидные продукты по query
    const productsByQuery: Record<string, any[]> = {};
    validProducts.forEach(product => {
      if (!productsByQuery[product.query]) productsByQuery[product.query] = [];
      productsByQuery[product.query].push(product);
    });

    // Для каждого query считаем marketStats и сохраняем
    for (const [query, products] of Object.entries(productsByQuery)) {
      if (!products.length) continue;
      // Находим самый дешевый продукт для этого query
      const cheapest = products.reduce((min, p) => (p.price < min.price ? p : min), products[0]);
      const stats = cheapest.marketStats;
      const market_stats = stats ? {
        min: stats.min,
        max: stats.max,
        mean: stats.mean,
        median: stats.median,
        iqr: stats.iqr,
        query: cheapest.query,
        category: cheapest.category,
        source: cheapest.source,
        total_count: products.length,
        product_id: cheapest.id,
        created_at: new Date().toISOString()
      } : undefined;
      await this.dbApiClient.batchCreateProducts({
        products: [cheapest],
        market_stats
      });
      this.logger.log(`💾 Сохранен товар: "${cheapest.name}"`);
    }

    const processingTimeMs = Date.now() - startTime;
    this.logger.log(`✅ Готово: ${groupedProducts.length} товаров за ${processingTimeMs}ms`);

    return {
      products: groupedProducts,
      total_queries: request.queries.length,
      total_products: groupedProducts.length,
      total_validated: validProducts.length,
      total_raw: allProducts.length,
      processing_time_ms: processingTimeMs,
      cache_hits: 0,
      cache_misses: 0
    };
  }
}