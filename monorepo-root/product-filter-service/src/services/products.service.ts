import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductRequestDto } from '../dto/product-request.dto';
import { ProductAggregatorService } from './product-aggregator.service';
import { ValidationFactoryService } from './validation.service/validation-factory.service';
import { ProductGroupingService } from './product-grouping.service';
import { ProductNormalizerService } from './product-normalizer.service';
import { ProductResponse } from '../types/product.types';
import { DbApiClient } from '../grpc-clients/db-api.client';
import { PhotoService } from './photo.service';
import { CategoryConfigService } from '../config/categories.config';


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
  async getProducts(request: ProductRequestDto, skipSave: boolean = false): Promise<ProductResponse> {
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
    
    // Подсчитываем статистику валидации
    const invalidProducts = validationResults.filter((result, index) => !result.isValid);
    const validProducts = allProducts.filter((product, index) => validationResults[index].isValid);
    
    // Логируем только невалидные товары и причину
    if (invalidProducts.length > 0) {
      invalidProducts.forEach((result, index) => {
        const product = allProducts[validationResults.indexOf(result)];
        this.logger.log(`❌ Невалидный: ${product.name} - ${result.reason}`);
      });
    }
    
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
      this.logger.log(`🎯 Финальный результат: "${lastProduct.name}" (${lastProduct.price}₽, ${lastProduct.source})`);
    }
    t = Date.now();

    // Подменяем category на агрегированное человеко‑читаемое название (не ломаем валидаторы: они работают по исходному ключу)
    for (const product of groupedProducts) {
      const aggregated = CategoryConfigService.getSuperCategoryDisplay(request.category);
      product.category = aggregated || CategoryConfigService.getCategoryDisplay(request.category) || request.category;
      if (product.source === 'wb') {
        product.image_url = await this.photoService.findProductPhoto(product.id) || product.image_url;
      }
    }
    // this.logger.log(`📷 Фото получены`);
    t = Date.now();

    // Группируем валидные продукты по query
    const productsByQuery: Record<string, any[]> = {};
    validProducts.forEach(product => {
      if (!productsByQuery[product.query]) productsByQuery[product.query] = [];
      productsByQuery[product.query].push(product);
    });

    // Для каждого query считаем marketStats и сохраняем (если не отключено)
    if (!skipSave) {
      for (const [query, products] of Object.entries(productsByQuery)) {
        if (!products.length) continue;
        // Находим самый дешевый продукт для этого query
        const cheapest = products.reduce((min, p) => (p.price < min.price ? p : min), products[0]);
        const stats = cheapest.marketStats;
        const aggregatedCheapest = CategoryConfigService.getSuperCategoryDisplay(cheapest.category)
          || CategoryConfigService.getCategoryDisplay(cheapest.category)
          || cheapest.category;
        const market_stats = stats ? {
          min: stats.min,
          max: stats.max,
          mean: stats.mean,
          median: stats.median,
          iqr: stats.iqr,
          query: cheapest.query,
          // Сохраняем агрегированное RU-имя категории (Игровые приставки/Смартфоны/и т.п.)
          category: aggregatedCheapest,
          source: cheapest.source,
          total_count: products.length,
          product_id: cheapest.id,
          created_at: new Date().toISOString(),
          // Новое поле: агрегированная категория для хранения (например, "Игровые приставки")
          super_category: CategoryConfigService.getSuperCategoryDisplay(cheapest.category)
        } : undefined;
        const cheapestForSave = {
          ...cheapest,
          category: aggregatedCheapest,
        };
        const dbResult = await this.dbApiClient.batchCreateProducts({
          products: [cheapestForSave],
          market_stats
        });
        this.logger.log(`💾 Сохранено в БД: ${dbResult.inserted} товаров`);
      }
    } else {
      this.logger.log(`⏭️ Сохранение в базу данных отключено`);
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