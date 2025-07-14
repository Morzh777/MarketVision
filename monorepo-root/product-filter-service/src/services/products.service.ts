import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductRequestDto } from '../dto/product-request.dto';
import { ProductAggregatorService } from './product-aggregator.service';
import { ProductValidationService } from './product-validation.service';
import { ProductGroupingService } from './product-grouping.service';
import { ProductNormalizerService } from './product-normalizer.service';
import { ProductResponse } from '../types/product.types';
import { DbApiClient } from '../grpc-clients/db-api.client';
import { PhotoService } from './photo.service';
import { OpenAiValidationService } from './openai.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly aggregator: ProductAggregatorService,
    private readonly validator: ProductValidationService,
    private readonly grouper: ProductGroupingService,
    private readonly normalizer: ProductNormalizerService,
    private readonly dbApiClient: DbApiClient,
    private readonly photoService: PhotoService,
    private readonly openaiService: OpenAiValidationService,
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

    // 2. Валидация
    const validationResults = await this.validator.validateProducts(allProducts, request.category as import('../validation.product/utils/validation-utils').ProductCategory);
    // Пробрасываем результат валидации в каждый продукт
    allProducts.forEach((product, i) => {
      if (validationResults[i]) {
        Object.assign(product, validationResults[i]);
        if (!validationResults[i].isValid) {
          this.logger.warn(`[VALIDATION][FAIL] id:${product.id} name:"${product.name}" price:${product.price} query:"${product.query}" reason:"${validationResults[i].reason}"`);
        } else {
          this.logger.log(`[VALIDATION][OK] id:${product.id} name:"${product.name}" price:${product.price} query:"${product.query}" reason:"${validationResults[i].reason}"`);
        }
      }
    });
    this.logger.log(`⏱️ Валидация заняла ${Date.now() - t}ms`);
    const validProducts = allProducts.filter((_, i) => validationResults[i]?.isValid);
    this.logger.log(`✅ Прошло валидацию: ${validProducts.length}/${allProducts.length} продуктов`);
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

    // 3.1. Разделяем на обычные и требующие AI
    const aiNeeded = groupedProducts.filter(
      p => p.toAI === true || p.reason === 'to-ai' || p.reason === 'price-anomaly'
    );
    const passed = groupedProducts.filter(p => !aiNeeded.includes(p));

    // 3.2. Если есть товары для AI — валидируем их через новый унифицированный валидатор
    let aiResults: any[] = [];
    let aiError: any = null;
    if (aiNeeded.length > 0) {
      try {
        // Используем тот же сервис валидации, что и для обычных продуктов
        const allResults = await this.validator.validateProducts(aiNeeded, request.category as import('../validation.product/utils/validation-utils').ProductCategory);
        aiResults = allResults.filter((r: any) => r.isValid);
        this.logger.log(`[AI] Запросов к AI: ${aiNeeded.length}, успешно прошли: ${aiResults.length}`);
      } catch (err) {
        aiError = err;
        this.logger.error(`[AI] Ошибка AI-валидации: ${err?.message || err}`);
      }
    }
    this.logger.log(`⏱️ AI/доп.валидация заняла ${Date.now() - t}ms`);
    t = Date.now();

    // Подменяем category на человекочитаемое название перед сохранением
    for (const product of passed) {
      product.category = request.category;
      if (product.source === 'wb') {
        product.image_url = await this.photoService.findProductPhoto(product.id) || product.image_url;
      }
    }
    for (const product of aiResults) {
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
    this.logger.log(`✅ Готово: ${validProducts.length} продуктов за ${processingTimeMs}ms`);

    // Финальный лог по AI (всегда)
    if (aiNeeded.length === 0) {
      this.logger.log(`[AI][FINAL] Запросов к AI: 0, успешно прошли: 0`);
    } else if (aiError) {
      this.logger.error(`[AI][FINAL] Ошибка AI-валидации: ${aiError?.message || aiError}`);
    } else {
      this.logger.log(`[AI][FINAL] Запросов к AI: ${aiNeeded.length}, успешно прошли: ${aiResults.length}`);
    }

    return {
      products: [...passed, ...aiResults],
      total_queries: request.queries.length,
      total_products: passed.length + aiResults.length,
      processing_time_ms: processingTimeMs,
      cache_hits: 0,
      cache_misses: 0
    };
  }
}