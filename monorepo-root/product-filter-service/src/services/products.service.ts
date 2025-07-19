import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductRequestDto } from '../dto/product-request.dto';
import { ProductAggregatorService } from './product-aggregator.service';
import { ValidationFactoryService } from './validation.service/validation-factory.service';
import { ProductGroupingService } from './product-grouping.service';
import { ProductNormalizerService } from './product-normalizer.service';
import { ProductResponse } from '../types/product.types';
import { DbApiClient } from '../grpc-clients/db-api.client';
import { PhotoService } from './photo.service';
import { MLService } from './ml/ml.service';

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
    private readonly mlService: MLService,
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
    this.logger.log(`🔍 Запрос продуктов: "${queriesStr}" для категории "${request.category}"`);
    let t = Date.now();

    // 1. Агрегация
    const allProducts = await this.aggregator.fetchAllProducts(request);
    this.logger.log(`📦 Получено ${allProducts.length} продуктов из всех источников (+${Date.now() - t}ms)`);
    t = Date.now();

    // 2. ML Валидация
    const mlValidationResults = await this.mlService.validateProducts(allProducts);
    // Пробрасываем результат валидации в каждый продукт
    allProducts.forEach((product, i) => {
      if (mlValidationResults[i]) {
        Object.assign(product, {
          isValid: mlValidationResults[i].isValid,
          reason: mlValidationResults[i].reason,
          confidence: mlValidationResults[i].confidence
        });
        if (!mlValidationResults[i].isValid) {
          this.logger.warn(`[ML-VALIDATION][FAIL] id:${product.id} name:"${product.name}" price:${product.price} query:"${product.query}" reason:"${mlValidationResults[i].reason}" confidence:${mlValidationResults[i].confidence}`);
        } else {
          this.logger.log(`[ML-VALIDATION][OK] id:${product.id} name:"${product.name}" price:${product.price} query:"${product.query}" reason:"${mlValidationResults[i].reason}" confidence:${mlValidationResults[i].confidence}`);
        }
      }
    });
    this.logger.log(`⏱️ ML Валидация заняла ${Date.now() - t}ms`);
    const validProducts = allProducts.filter((_, i) => mlValidationResults[i]?.isValid);
    this.logger.log(`✅ Прошло ML валидацию: ${validProducts.length}/${allProducts.length} продуктов`);
    t = Date.now();

    // 3. Группировка (по нормализованному ключу)
    const groupedProducts = this.grouper.groupAndSelectCheapest(
      validProducts,
      (product) => this.normalizer.getModelKey(product),
      request.category
    );
    this.logger.log(`⏱️ Группировка заняла ${Date.now() - t}ms`);
    this.logger.log(`📊 Сгруппировано в ${groupedProducts.length} уникальных товаров`);
    t = Date.now();

    // Подменяем category на человекочитаемое название перед сохранением
    for (const product of groupedProducts) {
      product.category = request.category;
      if (product.source === 'wb') {
        product.image_url = await this.photoService.findProductPhoto(product.id) || product.image_url;
      }
    }
    this.logger.log(`⏱️ Получение фото заняло ${Date.now() - t}ms`);
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
      this.logger.log('market_stats for query:', query, market_stats);
      await this.dbApiClient.batchCreateProducts({
        products: [cheapest],
        market_stats
      });
      this.logger.log(`DB-API: inserted cheapest product for query="${query}"`);
    }

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