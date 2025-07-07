import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductRequestDto } from '../dto/product-request.dto';
import { ProductAggregatorService } from './product-aggregator.service';
import { ProductValidationService } from './product-validation.service';
import { ProductGroupingService } from './product-grouping.service';
import { ProductNormalizerService } from './product-normalizer.service';
import { ProductResponse } from '../types/product.types';
import { DbApiClient } from '../grpc-clients/db-api.client';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly aggregator: ProductAggregatorService,
    private readonly validator: ProductValidationService,
    private readonly grouper: ProductGroupingService,
    private readonly normalizer: ProductNormalizerService,
    private readonly dbApiClient: DbApiClient,
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
    this.logger.log(`🔍 Запрос продуктов: ${request.queries.length} запросов для категории ${request.category}`);

    // 1. Агрегация
    const allProducts = await this.aggregator.fetchAllProducts(request);
    this.logger.log(`📦 Получено ${allProducts.length} продуктов из всех источников`);

    // 2. Валидация
    const validProducts = this.validator.filterValid(allProducts, request.category);
    this.logger.log(`✅ Прошло валидацию: ${validProducts.length}/${allProducts.length} продуктов`);

    // 3. Группировка (по нормализованному ключу)
    const groupedProducts = this.grouper.groupAndSelectCheapest(
      validProducts,
      (product) => this.normalizer.getModelKey(product)
    );
    this.logger.log(`📊 Сгруппировано в ${groupedProducts.length} уникальных товаров`);

    // 4. Сохраняем продукты и историю цен в db-api (асинхронно)
    this.dbApiClient.batchCreateProducts(groupedProducts)
      .then(res => this.logger.log(`DB-API: inserted=${res.inserted}`))
      .catch(err => this.logger.error('Ошибка сохранения в db-api', err));

    const processingTimeMs = Date.now() - startTime;
    this.logger.log(`✅ Готово: ${groupedProducts.length} продуктов за ${processingTimeMs}ms`);

    return {
      products: groupedProducts,
      total_queries: request.queries.length,
      total_products: groupedProducts.length,
      processing_time_ms: processingTimeMs,
      cache_hits: 0,
      cache_misses: 0
    };
  }
}