import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductRequestDto } from '../dto/product-request.dto';
import { ProductAggregatorService } from './product-aggregator.service';
import { ProductValidationService } from './product-validation.service';
import { ProductGroupingService } from './product-grouping.service';
import { ProductNormalizerService } from './product-normalizer.service';
import { ProductResponse } from '../types/product.types';
import { DbApiClient } from '../grpc-clients/db-api.client';
import { PhotoService } from './photo.service';
import { UnifiedValidatorFactory } from '../validators/unified-validator.factory';
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
      (product) => this.normalizer.getModelKey(product),
      request.category
    );
    this.logger.log(`📊 Сгруппировано в ${groupedProducts.length} уникальных товаров`);

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
        const validatorFactory = new UnifiedValidatorFactory(this.openaiService);
        const allResults = await validatorFactory.validateProducts(aiNeeded, request.category);
        aiResults = allResults.filter((r: any) => r.isValid);
        this.logger.log(`[AI] Запросов к AI: ${aiNeeded.length}, успешно прошли: ${aiResults.length}`);
      } catch (err) {
        aiError = err;
        this.logger.error(`[AI] Ошибка AI-валидации: ${err?.message || err}`);
      }
    }

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

    // 4. Сохраняем продукты и историю цен в db-api (асинхронно)
    this.dbApiClient.batchCreateProducts([...passed, ...aiResults])
      .then(res => this.logger.log(`DB-API: inserted=${res.inserted}`))
      .catch(err => this.logger.error('Ошибка сохранения в db-api', err));

    const processingTimeMs = Date.now() - startTime;
    this.logger.log(`✅ Готово: ${passed.length + aiResults.length} продуктов за ${processingTimeMs}ms`);

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