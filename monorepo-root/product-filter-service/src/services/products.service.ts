import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { PhotoService } from './photo.service';
import { OzonApiClient } from '../grpc-clients/ozon-api.client';
import { WbApiClient } from '../grpc-clients/wb-api.client';
import { fileLogger } from '../utils/logger';

interface ProductResult {
  id: string;
  stableId: string;
  name: string;
  price: number;
  photoUrl?: string;
  productUrl?: string; // 🔗 Ссылка на товар из парсера
  previousPrice?: number;
  discount?: number;
  query: string;
  supplier?: string;
  brand?: string;
  source: 'wb' | 'ozon'; // 🆕 Источник данных
}

export interface ProductRequest {
  queries: string[];
  category: string;
  exclude_keywords?: string[];
}

export interface ProductResponse {
  products: ProcessedProduct[];
  total_queries: number;
  total_products: number;
  processing_time_ms: number;
  cache_hits: number;
  cache_misses: number;
}

export interface ProcessedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  category: string;
  source: string;
  query: string;
  discount_percent?: number;
  is_new?: boolean;
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  // 🎯 ЦЕНТРАЛИЗОВАННЫЕ ЗАПРОСЫ: Перенесено из WB-API для полного контроля
  private readonly VIDEOCARD_QUERIES = [
    // 🎮 Короткие запросы для видеокарт
    'RTX4090',
    'RTX4080', 
    'RTX4070',
    'RX7900XTX',
    'RX7900XT'
  ];

  private readonly PROCESSOR_QUERIES = [
    // 🔧 Короткие запросы для процессоров
    '14900KF',
    '14900K',
    '14700KF', 
    '14700K',
    '7800X3D',
    '7700X',
    '7950X'
  ];

  private readonly MOTHERBOARD_QUERIES = [
    // 🔌 Короткие запросы для материнских плат
    'Z790',
    'B760',
    'X870E',
    'B850'
  ];

  constructor(
    private readonly redisService: RedisService,
    private readonly photoService: PhotoService,
    private readonly ozonApiClient: OzonApiClient,
    private readonly wbApiClient: WbApiClient
  ) {}

  async getVideocards(testMode = false, limit?: number, showAllMode = false): Promise<ProductResult[]> {
    return this.getProductsByCategory('videocards', testMode, limit, showAllMode);
  }

  async getProcessors(testMode = false, limit?: number, showAllMode = false): Promise<ProductResult[]> {
    return this.getProductsByCategory('processors', testMode, limit, showAllMode);
  }

  async getMotherboards(testMode = false, limit?: number, showAllMode = false): Promise<ProductResult[]> {
    return this.getProductsByCategory('motherboards', testMode, limit, showAllMode);
  }

  private async getProductsByCategory(category: string, testMode = false, limit?: number, showAllMode = false): Promise<ProductResult[]> {
    const startTime = Date.now();
    fileLogger.log(`🚀 Запрос ${category} через новую архитектуру с gRPC`);

    try {
      // 🎯 ВЫБИРАЕМ ЗАПРОСЫ ДЛЯ КАТЕГОРИИ
      let queries: string[] = [];
      let xsubject: number = 0;
      
      switch (category) {
        case 'videocards':
          queries = this.VIDEOCARD_QUERIES;
          xsubject = 3274;
          break;
        case 'processors':
          queries = this.PROCESSOR_QUERIES;
          xsubject = 3698;
          break;
        case 'motherboards':
          queries = this.MOTHERBOARD_QUERIES;
          xsubject = 3690;
          break;
        default:
          fileLogger.error(`❌ Неизвестная категория: ${category}`);
          return [];
      }

      fileLogger.log(`🔍 Выполняю ${queries.length} запросов для ${category} через gRPC...`);

      // 🎯 ПАРАЛЛЕЛЬНЫЕ ЗАПРОСЫ К WB API И OZON API
      const allProducts: any[] = [];

      // Создаем запросы для gRPC
      const gRPCRequests = queries.map(query => ({
        products: [], // Пустой массив, так как парсеры сами получают данные
        query: query, // Основной запрос для WB API
        all_queries: [query], // Массив с одним запросом
        exclude_keywords: [],
        config: {},
        source: 'wb',
        category
      }));

      // Параллельные запросы к WB API и Ozon API
      const wbPromises = gRPCRequests.map(async (request) => {
        try {
          fileLogger.debug(`🔍 WB API запрос: ${request.query}`);
          const response = await this.wbApiClient.filterProducts(request);
          
          if (!response.products || !Array.isArray(response.products)) {
            fileLogger.warn(`⚠️ WB API "${request.query}": получен неправильный формат данных`);
            return [];
          }
          
          fileLogger.log(`📦 WB API "${request.query}": найдено ${response.products.length} товаров`);
          
          // Парсеры уже возвращают query, добавляем только source
          return response.products.map((p: any) => ({ 
            ...p, 
            source: 'wb' as const
            // query уже есть в p от парсера
          }));
        } catch (error) {
          fileLogger.error(`❌ Ошибка WB API запроса "${request.query}":`, error);
          return [];
        }
      });

      const ozonPromises = gRPCRequests.map(async (request) => {
        try {
          fileLogger.debug(`🔍 Ozon API запрос: ${request.query}`);
          const response = await this.ozonApiClient.filterProducts(request);
          
          if (!response.products || !Array.isArray(response.products)) {
            fileLogger.warn(`⚠️ Ozon API "${request.query}": получен неправильный формат данных`);
            return [];
          }
          
          fileLogger.log(`📦 Ozon API "${request.query}": найдено ${response.products.length} товаров`);
          
          // Проверяем первые товары чтобы увидеть что возвращает Ozon
          if (response.products.length > 0) {
            const firstProduct = response.products[0];
            fileLogger.debug(`🔍 Ozon API "${request.query}" - первый товар: "${firstProduct.name}" (${firstProduct.price}₽)`);
            
            // Проверяем сколько товаров содержат искомый запрос
            const matchingProducts = response.products.filter((p: any) => 
              p.name?.toLowerCase().includes(request.query.toLowerCase())
            );
            fileLogger.warn(`⚠️ Ozon API "${request.query}": только ${matchingProducts.length} из ${response.products.length} товаров содержат "${request.query}" в названии!`);
          }
          
          // Парсеры уже возвращают query, добавляем только source
          return response.products.map((p: any) => ({ 
            ...p, 
            source: 'ozon' as const
            // query уже есть в p от парсера
          }));
        } catch (error) {
          fileLogger.error(`❌ Ошибка Ozon API запроса "${request.query}":`, error);
          return [];
        }
      });

      // Ждем ответы от обоих API
      const [wbResults, ozonResults] = await Promise.all([
        Promise.all(wbPromises),
        Promise.all(ozonPromises)
      ]);

      // Объединяем результаты
      wbResults.forEach(products => allProducts.push(...products));
      ozonResults.forEach(products => allProducts.push(...products));

      const wbTotal = wbResults.flat().length;
      const ozonTotal = ozonResults.flat().length;
      
      // 🎯 КРАСИВЫЙ ОТЧЕТ ПО API
      fileLogger.log(`\n📊 ОТЧЕТ ПО API ДЛЯ ${category.toUpperCase()}:`);
      fileLogger.log(`📡 WB API: ${wbTotal} товаров`);
      fileLogger.log(`📡 Ozon API: ${ozonTotal} товаров`);
      fileLogger.log(`📦 ВСЕГО: ${allProducts.length} товаров`);
      
      // 🎯 ПРАВИЛЬНЫЙ АЛГОРИТМ: Сначала валидация, потом группировка
      
      // 1. Сначала валидируем и фильтруем товары
      const validProducts: any[] = [];
      let validationFailed = 0;
      let cacheFiltered = 0;
      let priceFiltered = 0;
      let discountFiltered = 0;

      fileLogger.log(`🔍 Валидируем ${allProducts.length} товаров...`);

      for (const product of allProducts) {
        const processed = await this.processProductWithCache(product, category, testMode, showAllMode);
        
        if (processed) {
          // Сохраняем оригинальный объект товара с результатом обработки
          validProducts.push({
            ...product,
            processedResult: processed
          });
        } else {
          // Подсчитываем причины отсева
          const productName = product.name || '';
          const price = product.price || 0;
          
          // Определяем причину отсева
          const validation = this.validateProduct(product, category);
          if (!validation.isValid) {
            validationFailed++;
          } else if (price <= 0 || price > 1000000) {
            priceFiltered++;
          } else {
            // Остальные отсеяны из-за кеша (цена не снизилась)
            cacheFiltered++;
          }
        }
      }

      fileLogger.log(`✅ Прошли валидацию: ${validProducts.length} товаров из ${allProducts.length}`);
      
      // 2. Теперь группируем ТОЛЬКО валидные товары и выбираем самые дешевые
      const cheapestProducts = this.selectCheapestFromSimilarProducts(validProducts);
      fileLogger.log(`🔄 ГРУППИРОВКА: ${cheapestProducts.length} уникальных товаров (было ${validProducts.length})`);
      
      // 3. Извлекаем результаты обработки
      const processedProducts: ProductResult[] = cheapestProducts.map(p => p.processedResult);

              fileLogger.log(`📊 СТАТИСТИКА ОБРАБОТКИ:`);
        fileLogger.log(`   📦 Всего товаров от API: ${allProducts.length}`);
        fileLogger.log(`   ✅ Прошли валидацию: ${validProducts.length}`);
        fileLogger.log(`   🔄 После группировки: ${processedProducts.length}`);
                  fileLogger.log(`   ❌ Отсеяно на валидации: ${allProducts.length - validProducts.length}`);
          fileLogger.log(`     ├─ Валидация не прошла: ${validationFailed}`);
          fileLogger.log(`     ├─ Цена не снизилась (кеш): ${cacheFiltered}`);
          fileLogger.log(`     └─ Недопустимая цена: ${priceFiltered}`);

      if (processedProducts.length === 0) {
        fileLogger.warn(`⚠️ Нет товаров после обработки!`);
        return [];
      }

      const finalProducts = processedProducts;

      // ДОПОЛНИТЕЛЬНАЯ ФИЛЬТРАЦИЯ: Для обычных запросов (не тестовых) ограничиваем количество
      let limitedProducts = finalProducts;
      const maxLimit = limit || (testMode ? 50 : 1000); // Тестовый режим: до 50, обычный: до 1000 (практически без ограничений)
      
      if (finalProducts.length > maxLimit) {
        // Сортируем по цене и берем топ самых дешевых
        limitedProducts = finalProducts
          .sort((a, b) => a.price - b.price)
          .slice(0, maxLimit);
        
        fileLogger.log(`🎯 Ограничение для бота: ${finalProducts.length} → ${limitedProducts.length} самых дешевых (лимит: ${maxLimit})`);
      } else {
        // Если товаров меньше лимита, сортируем по цене для красивого отображения
        limitedProducts = finalProducts.sort((a, b) => a.price - b.price);
        fileLogger.log(`📊 Отображаем все ${limitedProducts.length} товаров (отсортированы по цене)`);
      }

      const totalTime = (Date.now() - startTime) / 1000;
      
      // 🎯 ИТОГОВЫЙ ОТЧЕТ
      fileLogger.log(`\n📊 ИТОГОВЫЙ ОТЧЕТ ${category.toUpperCase()}:`);
      fileLogger.log(`✅ ГОТОВО ДЛЯ БОТА: ${limitedProducts.length} товаров`);
      fileLogger.log(`📦 ОБРАБОТАНО: ${processedProducts.length} товаров`);
      fileLogger.log(`❌ ОТФИЛЬТРОВАНО: ${validationFailed} товаров`);
      fileLogger.log(`⏱️ ВРЕМЯ: ${totalTime.toFixed(1)}с`);
      
      // Показываем итоговые товары
      if (limitedProducts.length > 0) {
        fileLogger.log(`\n🏆 ИТОГОВЫЕ ТОВАРЫ:`);
        limitedProducts.forEach((product, index) => {
          const discountText = product.discount ? ` (-${product.discount}%)` : '';
          const sourceText = product.source === 'wb' ? '🟦' : '🟧';
          fileLogger.log(`  ${index + 1}. ${sourceText} ${product.name} - ${product.price}₽${discountText}`);
        });
      }

      return limitedProducts;
    } catch (error) {
      fileLogger.error(`❌ Ошибка получения ${category}:`, error);
      return [];
    }
  }

  // 🎯 ОСНОВНАЯ ЛОГИКА: Обработка товара с кешем цен (перенесено из WB-API)
  private async processProductWithCache(
    product: any, 
    category: string,
    testMode = false,
    showAllMode = false
  ): Promise<ProductResult | null> {
    const productName = product.name || '';
    const query = product.query || '';
    const price = product.price || 0;
    const source = product.source || 'unknown';

    // 🐛 ДЕБАГ: Логируем каждый товар для анализа
    fileLogger.debug(`🔍 Обработка товара: "${productName}" (${price}₽, query: "${query}", source: ${source})`);

    // 1️⃣ ВАЛИДАЦИЯ: Проверяем что товар соответствует категории
    const validation = this.validateProduct(product, category);
    fileLogger.debug(`🔍 Валидация "${productName}" (query: "${product.query}")`);
    
    if (!validation.isValid) {
      fileLogger.warn(`❌ Валидация не прошла: "${productName}" - ${validation.reason}`);
      if (!testMode) {
        return null;
      } else {
        fileLogger.warn(`🧪 Тестовый режим: игнорируем неудачную валидацию`);
      }
    } else {
      fileLogger.debug(`✅ Валидация прошла: "${productName}"`);
    }

    // 2️⃣ ФИЛЬТРАЦИЯ ПО ЦЕНЕ: Проверяем что цена разумная
    if (price <= 0 || price > 1000000) {
      fileLogger.debug(`💰 Недопустимая цена: "${productName}" - ${price}₽`);
      return null;
    }

    // 3️⃣ СРАВНЕНИЕ С КЕШЕМ: Проверяем цену с кешированной версией
    let shouldUpdate = true;
    let priceDifference = 0;
    
    if (!testMode && !showAllMode) {
      const cacheKey = `product:${category}:${query}`;
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        try {
          const cachedProduct = JSON.parse(cachedData);
          const cachedPrice = cachedProduct.price || 0;
          
          if (cachedPrice > 0) {
            priceDifference = ((cachedPrice - price) / cachedPrice) * 100;
            
            if (price >= cachedPrice) {
              fileLogger.debug(`📈 Цена не уменьшилась: "${productName}" - ${price}₽ (в кеше: ${cachedPrice}₽)`);
              shouldUpdate = false;
            } else {
              fileLogger.debug(`💰 Цена снизилась: "${productName}" - ${price}₽ (было: ${cachedPrice}₽, -${priceDifference.toFixed(1)}%)`);
            }
          }
        } catch (e) {
          fileLogger.warn(`⚠️ Ошибка парсинга кеша для "${productName}"`);
        }
      } else {
        fileLogger.debug(`🆕 Новый товар для query "${query}": "${productName}"`);
      }
    } else {
      fileLogger.debug(`🧪 Тестовый режим: пропускаем проверку кеша для "${productName}"`);
    }
    
    if (!shouldUpdate && !testMode && !showAllMode) {
      return null;
    }

    // 5️⃣ СОЗДАНИЕ РЕЗУЛЬТАТА
    const result: ProductResult = {
      id: product.id || this.generateStableId(productName),
      stableId: product.stableId || this.generateStableId(productName),
      name: productName,
      price: price,
      photoUrl: product.photoUrl || product.image || '',
      productUrl: product.productUrl || product.url || '',
      previousPrice: product.previousPrice || product.oldPrice || 0,
      discount: product.discount || 0,
      query: query,
      supplier: product.supplier || product.brand || '',
      brand: product.brand || '',
      source: source as 'wb' | 'ozon'
    };

    // 4️⃣ КЕШИРОВАНИЕ: Сохраняем в кеш по query
    if (!testMode) {
      const cacheKey = `product:${category}:${query}`;
      await this.redisService.set(cacheKey, JSON.stringify(result));
      fileLogger.debug(`💾 Сохранен в кеш по query "${query}": "${productName}" - ${price}₽`);
    }

    fileLogger.debug(`✅ Товар прошел все фильтры: "${productName}" (${price}₽)`);
    return result;
  }

  // 🎯 ГРУППИРОВКА ПО МОДЕЛИ: Выбираем самый дешевый товар каждой модели
  private selectCheapestFromSimilarProducts(products: any[]): any[] {
    // Группируем товары по модели (используем нормализованное название)
    const groups = new Map<string, any[]>();
    
    fileLogger.log(`🔍 Начинаю группировку ${products.length} товаров...`);
    
    for (const product of products) {
      if (!product.name || !product.price || product.price <= 0) {
        fileLogger.debug(`⛔️ Пропущен товар "${product.name}" - нет названия или цены`);
        continue;
      }
      
      // Универсальная логика для всех категорий
      const modelKey = this.getModelKey(product);
      
      // ⛔️ Пропускаем товары с пустым ключом (слишком общие или нераспознанные)
      if (!modelKey) {
        fileLogger.debug(`⛔️ Пропущен товар "${product.name}" - не удалось нормализовать название`);
        continue;
      }
      

      
      if (!groups.has(modelKey)) {
        groups.set(modelKey, []);
      }
      groups.get(modelKey)!.push(product);
    }
    
    // Отладочная информация о группах
    fileLogger.log(`🔍 Создано ${groups.size} групп товаров:`);
    for (const [modelKey, groupProducts] of groups) {
      fileLogger.log(`  ${modelKey}: ${groupProducts.length} товаров`);
      

      
      if (groupProducts.length > 1) {
        groupProducts.forEach(p => {
          fileLogger.debug(`    - "${p.name}" (${p.price}₽, query: "${p.query}", source: ${p.source})`);
        });
      }
    }
    
    const selectedProducts: any[] = [];
    let deduplicatedCount = 0;
    
    // Из каждой модели выбираем товар с минимальной ценой
    for (const [modelKey, groupProducts] of groups) {
      
      if (groupProducts.length === 0) {
        fileLogger.warn(`⚠️ ГРУППА ${modelKey}: ПУСТАЯ! Нет товаров после фильтрации`);
        continue;
      }
      
      // Показываем первые 3 товара в группе для анализа
      const sampleProducts = groupProducts.slice(0, 3);
      sampleProducts.forEach((p, index) => {
        fileLogger.debug(`   ${index + 1}. "${p.name}" (${p.price}₽, query: "${p.query}", source: ${p.source})`);
      });
      
      if (groupProducts.length > 3) {
        fileLogger.debug(`   ... и еще ${groupProducts.length - 3} товаров`);
      }
      
      if (groupProducts.length === 1) {
        selectedProducts.push(groupProducts[0]);
        fileLogger.log(`✅ Выбран единственный товар из группы ${modelKey}: "${groupProducts[0].name}" (${groupProducts[0].price}₽)`);
        

      } else {
        // Несколько товаров одной модели - выбираем самый дешевый
        const cheapest = groupProducts.reduce((min, product) => {
          return product.price < min.price ? product : min;
        });
        
        // 🎯 ВАЖНО: Проверяем что query соответствует модели
        // Если query не соответствует модели, ищем товар с правильным query
        const matchingQueryProduct = groupProducts.find(product => {
          const productQuery = product.query?.toLowerCase() || '';
          const modelKeyLower = modelKey.toLowerCase();
          
          // Проверяем точное соответствие модели в query
          // Например, для modelKey "rtx5090" ищем "rtx 5090" в query
          const modelNumber = modelKeyLower.replace(/^(rtx|gtx|rx)/, '');
          const prefix = modelKeyLower.replace(modelNumber, '');
          const expectedQuery = `${prefix} ${modelNumber}`;
          
          const matches = productQuery.includes(expectedQuery);
          
          // Отладочная информация
          if (groupProducts.length > 1) {
            fileLogger.debug(`🔍 Группа ${modelKey}: "${product.name}" (query: "${product.query}") - ожидаем "${expectedQuery}" - совпадение: ${matches}`);
          }
          
          return matches;
        });
        
        // Используем товар с правильным query, если найден, иначе самый дешевый
        const selectedProduct = matchingQueryProduct || cheapest;
        
        // Отладочная информация о выборе
        if (groupProducts.length > 1) {
          fileLogger.debug(`✅ Выбран товар: "${selectedProduct.name}" с query: "${selectedProduct.query}" для модели ${modelKey}`);
        }
        

        
        selectedProducts.push(selectedProduct);
        deduplicatedCount += groupProducts.length - 1;
      }
    }
    
    if (deduplicatedCount > 0) {
      fileLogger.log(`🔄 Дедупликация: удалено ${deduplicatedCount} дублей, осталось ${selectedProducts.length} товаров`);
    }
    

    
    return selectedProducts;
  }

  // 🔍 ВАЛИДАЦИЯ: Простая проверка соответствия запросу
  private validateProduct(product: any, category: string): { isValid: boolean; reason?: string } {
    const productName = product.name || '';
    const query = product.query || '';

    // 🎯 ПРОСТАЯ ВАЛИДАЦИЯ: проверяем что товар соответствует запросу
    const productUpper = productName.toUpperCase();
    const queryUpper = query.toUpperCase();
    
    // Ищем запрос в названии товара
    if (productUpper.includes(queryUpper)) {
      this.logger.log(`[VALIDATION] ✅ Соответствует запросу "${query}": "${productName}"`);
      return { isValid: true, reason: 'Соответствует запросу' };
    }
    
    this.logger.log(`[VALIDATION] ❌ НЕ соответствует запросу "${query}": "${productName}"`);
    return { isValid: false, reason: 'Не соответствует запросу' };
  }

  // Генерация стабильного ID (fallback если WB-API не предоставил)
  private generateStableId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '');
  }

  /**
   * Основной метод для получения продуктов от бота
   * 1. Получает данные от WB API и Ozon API
   * 2. Валидирует и группирует по запросам
   * 3. Выбирает самый дешевый товар для каждого запроса
   * 4. Сравнивает с кэшем и обновляет если цена лучше
   * 5. Возвращает отсортированный результат
   */
  async getProducts(request: ProductRequest): Promise<ProductResponse> {
    const startTime = Date.now();
    this.logger.log(`🔍 Запрос продуктов: ${request.queries.length} запросов для категории ${request.category}`);

    let cacheHits = 0;
    let cacheMisses = 0;
    const allProducts: ProcessedProduct[] = [];

    // Получаем данные от всех API параллельно
    const [wbProducts, ozonProducts] = await Promise.all([
      this.getProductsFromWbApi(request),
      this.getProductsFromOzonApi(request)
    ]);

    // Объединяем все продукты
    allProducts.push(...wbProducts, ...ozonProducts);
    this.logger.log(`📦 Получено ${allProducts.length} продуктов (WB: ${wbProducts.length}, Ozon: ${ozonProducts.length})`);

    // Валидируем продукты
    const validProducts = await this.validateProducts(allProducts, request);
    this.logger.log(`✅ Прошло валидацию: ${validProducts.length}/${allProducts.length} продуктов`);

    // Группируем по запросам и выбираем самый дешевый
    const groupedProducts = this.groupByQueryAndSelectCheapest(validProducts);
    this.logger.log(`📊 Сгруппировано в ${groupedProducts.length} уникальных товаров`);

    // Обрабатываем кэш для каждого продукта
    const finalProducts: ProcessedProduct[] = [];
    
    for (const product of groupedProducts) {
      const cacheResult = await this.processCacheForProduct(product);
      
      if (cacheResult.shouldReturn) {
        finalProducts.push(cacheResult.product);
        if (cacheResult.fromCache) {
          cacheHits++;
        } else {
          cacheMisses++;
        }
      }
    }

    const processingTimeMs = Date.now() - startTime;
    
    this.logger.log(`✅ Готово: ${finalProducts.length} продуктов за ${processingTimeMs}ms (кэш: ${cacheHits} hits, ${cacheMisses} misses)`);

    return {
      products: finalProducts,
      total_queries: request.queries.length,
      total_products: finalProducts.length,
      processing_time_ms: processingTimeMs,
      cache_hits: cacheHits,
      cache_misses: cacheMisses
    };
  }

  /**
   * Получает продукты от WB API
   */
  private async getProductsFromWbApi(request: ProductRequest): Promise<ProcessedProduct[]> {
    try {
      // Отправляем каждый запрос отдельно к WB API
      const allProducts: ProcessedProduct[] = [];
      
      for (const query of request.queries) {
        try {
          const response = await this.wbApiClient.filterProducts({
            query: query, // Основной запрос
            all_queries: [query], // Массив с одним запросом
            category: request.category,
            exclude_keywords: request.exclude_keywords || []
          });

          if (response.products && Array.isArray(response.products)) {
            // Парсеры уже возвращают query, добавляем только source
            const productsWithSource = response.products.map((product: any) => ({
              ...product,
              source: 'wb'
              // query уже есть в product от парсера
            }));
            allProducts.push(...productsWithSource);
          }
        } catch (error) {
          this.logger.error(`❌ Ошибка запроса "${query}" к WB API:`, error);
        }
      }

      this.logger.log(`📦 WB API вернул ${allProducts.length} продуктов`);
      return allProducts;
    } catch (error) {
      this.logger.error('❌ Ошибка получения данных от WB API:', error);
      return [];
    }
  }

  /**
   * Получает продукты от Ozon API
   */
  private async getProductsFromOzonApi(request: ProductRequest): Promise<ProcessedProduct[]> {
    try {
      // Отправляем каждый запрос отдельно к Ozon API
      const allProducts: ProcessedProduct[] = [];
      
      for (const query of request.queries) {
        try {
          const response = await this.ozonApiClient.filterProducts({
            query: query, // Основной запрос
            all_queries: [query], // Массив с одним запросом
            category: request.category,
            exclude_keywords: request.exclude_keywords || []
          });

          if (response.products && Array.isArray(response.products)) {
            // Парсеры уже возвращают query, добавляем только source
            const productsWithSource = response.products.map((product: any) => ({
              ...product,
              source: 'ozon'
              // query уже есть в product от парсера
            }));
            allProducts.push(...productsWithSource);
          }
        } catch (error) {
          this.logger.error(`❌ Ошибка запроса "${query}" к Ozon API:`, error);
        }
      }

      this.logger.log(`📦 Ozon API вернул ${allProducts.length} продуктов`);
      return allProducts;
    } catch (error) {
      this.logger.error('❌ Ошибка получения данных от Ozon API:', error);
      return [];
    }
  }

  /**
   * Валидирует продукты через наши валидаторы
   */
  private async validateProducts(products: ProcessedProduct[], request: ProductRequest): Promise<ProcessedProduct[]> {
    if (products.length === 0) return [];

    this.logger.log(`🔍 Валидация ${products.length} продуктов для категории ${request.category}`);

    const validProducts: ProcessedProduct[] = [];

    for (const product of products) {
      // 🎯 ИСПОЛЬЗУЕМ СПЕЦИАЛИЗИРОВАННЫЕ ВАЛИДАТОРЫ
      const validation = this.validateProduct(product, request.category);
      
      if (validation.isValid) {
        validProducts.push(product);
        this.logger.log(`✅ Прошел валидацию: ${product.name} (${product.source})`);
      } else {
        this.logger.log(`❌ Не прошел валидацию: ${product.name} - ${validation.reason} (${product.source})`);
      }
    }

    this.logger.log(`📊 Результат валидации: ${validProducts.length}/${products.length} продуктов прошли`);
    return validProducts;
  }

  /**
   * Группирует продукты по query и выбирает самый дешевый
   * 🎯 ГРУППИРОВКА ТОЛЬКО ПО QUERY: каждый запрос = одна группа
   */
  private groupByQueryAndSelectCheapest(products: ProcessedProduct[]): ProcessedProduct[] {
    if (products.length === 0) return [];

    this.logger.log(`🔍 Умная группировка ${products.length} продуктов...`);

    // Группируем по modelKey (нормализованное название)
    const groups = new Map<string, ProcessedProduct[]>();
    
    for (const product of products) {
      if (!product.name || !product.price || product.price <= 0) {
        this.logger.debug(`⛔️ Пропущен товар "${product.name}" - нет названия или цены`);
        continue;
      }
      
      // 🎯 ГРУППИРОВКА ТОЛЬКО ПО QUERY
      const modelKey = this.getModelKey(product);
      
      if (!modelKey) {
        this.logger.warn(`⛔️ Пропущен товар "${product.name}" - нет query для группировки`);
        continue;
      }
      
      if (!groups.has(modelKey)) {
        groups.set(modelKey, []);
      }
      groups.get(modelKey)!.push(product);
    }
    
    // Отладочная информация о группах
    this.logger.log(`🔍 Создано ${groups.size} групп товаров:`);
    
    // Статистика по источникам
    const sourceStats = new Map<string, number>();
    
    for (const [modelKey, groupProducts] of groups) {
      this.logger.log(`  ${modelKey}: ${groupProducts.length} товаров`);
      
      // Подсчитываем статистику по источникам
      groupProducts.forEach(p => {
        const source = p.source || 'unknown';
        sourceStats.set(source, (sourceStats.get(source) || 0) + 1);
      });
      
      if (groupProducts.length > 1) {
        groupProducts.forEach(p => {
          this.logger.debug(`    - "${p.name}" (${p.price}₽, query: "${p.query}", source: ${p.source})`);
        });
      }
    }
    
    // Выводим статистику по источникам
    this.logger.log(`📊 Статистика по источникам:`);
    for (const [source, count] of sourceStats) {
      this.logger.log(`  ${source}: ${count} товаров`);
    }
    
    const selectedProducts: ProcessedProduct[] = [];
    
    // Из каждой группы выбираем самый дешевый товар
    for (const [modelKey, groupProducts] of groups) {
      if (groupProducts.length === 0) {
        this.logger.warn(`⚠️ ГРУППА ${modelKey}: ПУСТАЯ!`);
        continue;
      }
      
      if (groupProducts.length === 1) {
        selectedProducts.push(groupProducts[0]);
        this.logger.log(`✅ Выбран единственный товар из группы ${modelKey}: "${groupProducts[0].name}" (${groupProducts[0].price}₽)`);
      } else {
        // Несколько товаров одной модели - выбираем самый дешевый
        const cheapest = groupProducts.reduce((min, product) => {
          return product.price < min.price ? product : min;
        });
        
        // Дополнительная информация о выборе
        const allPrices = groupProducts.map(p => `${p.price}₽ (${p.source})`).join(', ');
        this.logger.log(`💰 Выбран самый дешевый из группы ${modelKey}: "${cheapest.name}" за ${cheapest.price}₽ (${cheapest.source})`);
        this.logger.debug(`   Все варианты: ${allPrices}`);
        selectedProducts.push(cheapest);
      }
    }

    this.logger.log(`📊 Группировка завершена: ${selectedProducts.length} уникальных товаров`);
    return selectedProducts;
  }

  /**
   * 🎯 ГРУППИРОВКА ТОЛЬКО ПО QUERY: получаем modelKey для группировки
   */
  private getModelKey(product: ProcessedProduct): string {
    // Группируем ТОЛЬКО по query - каждый запрос уникален
    const query = product.query || '';
    if (query) {
      // Нормализуем query для лучшей группировки
      const normalizedQuery = this.normalizeQuery(query);
      this.logger.debug(`🔍 Группировка по query: "${query}" → "${normalizedQuery}"`);
      return normalizedQuery;
    }
    
    // Если query нет - товар не может быть сгруппирован
    this.logger.warn(`⚠️ Товар без query не может быть сгруппирован: "${product.name}" (${product.source})`);
    return null;
  }

  /**
   * Нормализация query для лучшей группировки
   */
  private normalizeQuery(query: string): string {
    let norm = query.toLowerCase().trim();
    
    // Убираем лишние пробелы и символы
    norm = norm.replace(/\s+/g, ' ').trim();
    
    // Нормализуем RTX модели
    norm = norm.replace(/rtx\s*(\d+)/i, 'rtx$1');
    
    // Нормализуем процессоры
    norm = norm.replace(/(\d+)\s*k\s*f?/i, '$1k');
    norm = norm.replace(/(\d+)\s*x\s*(\d+)/i, '$1x$2');
    
    // Нормализуем материнские платы
    norm = norm.replace(/([a-z])\s*(\d+)/i, '$1$2');
    
    return norm;
  }



  /**
   * Обрабатывает кэш для одного продукта
   * Возвращает true если продукт нужно отдать боту
   */
  private async processCacheForProduct(product: ProcessedProduct): Promise<{
    shouldReturn: boolean;
    product: ProcessedProduct;
    fromCache: boolean;
  }> {
    const cacheKey = `product:${product.category}:${product.query}:${product.id}`;
    
    // Если это WB API товар - обрабатываем фото
    if (product.source === 'wb' && product.image_url) {
      try {
        this.logger.log(`🖼️ Обрабатываем фото для WB товара: ${product.name}`);
        const processedImageUrl = await this.photoService.processImageUrl(product.image_url);
        product.image_url = processedImageUrl;
        this.logger.log(`✅ Фото обработано: ${processedImageUrl}`);
      } catch (error) {
        this.logger.error(`❌ Ошибка обработки фото: ${error.message}`);
      }
    }
    
    try {
      // Получаем кэшированную цену
      const cachedData = await this.redisService.get(cacheKey);
      
      if (!cachedData) {
        // Новый товар - кэшируем и отдаем
        await this.redisService.set(cacheKey, product.price.toString());
        this.logger.debug(`🆕 Новый товар: ${product.name} за ${product.price}₽`);
        
        return {
          shouldReturn: true,
          product: { ...product, is_new: true },
          fromCache: false
        };
      }

      const cachedPrice = parseInt(cachedData);
      
      if (product.price < cachedPrice) {
        // Цена стала лучше - обновляем кэш и отдаем
        await this.redisService.set(cacheKey, product.price.toString());
        const discountPercent = ((cachedPrice - product.price) / cachedPrice) * 100;
        
        this.logger.log(`📉 Цена упала: ${product.name} с ${cachedPrice}₽ до ${product.price}₽ (скидка ${discountPercent.toFixed(1)}%)`);
        
        return {
          shouldReturn: true,
          product: { ...product, discount_percent: discountPercent },
          fromCache: false
        };
      } else if (product.price === cachedPrice) {
        // Цена не изменилась - не отдаем
        this.logger.debug(`➡️ Цена не изменилась: ${product.name} - ${product.price}₽`);
        
        return {
          shouldReturn: false,
          product,
          fromCache: true
        };
      } else {
        // Цена выросла - не отдаем
        this.logger.debug(`📈 Цена выросла: ${product.name} с ${cachedPrice}₽ до ${product.price}₽`);
        
        return {
          shouldReturn: false,
          product,
          fromCache: true
        };
      }
      
    } catch (error) {
      this.logger.error(`❌ Ошибка обработки кэша для ${product.id}:`, error);
      
      // В случае ошибки кэша - отдаем продукт
      return {
        shouldReturn: true,
        product,
        fromCache: false
      };
    }
  }

  /**
   * Получает статистику по query и источникам
   */
  async getQueryStatistics(request: ProductRequest): Promise<{
    total_queries: number;
    total_products: number;
    queries_stats: Array<{
      query: string;
      total_products: number;
      wb_products: number;
      ozon_products: number;
      cheapest_price?: number;
      cheapest_source?: string;
    }>;
  }> {
    this.logger.log(`📊 Получение статистики для ${request.queries.length} запросов`);

    // Получаем данные от всех API параллельно
    const [wbProducts, ozonProducts] = await Promise.all([
      this.getProductsFromWbApi(request),
      this.getProductsFromOzonApi(request)
    ]);

    // Объединяем все продукты
    const allProducts = [...wbProducts, ...ozonProducts];

    // Группируем по query
    const queryGroups = new Map<string, ProcessedProduct[]>();
    
    for (const product of allProducts) {
      const query = product.query || 'unknown';
      if (!queryGroups.has(query)) {
        queryGroups.set(query, []);
      }
      queryGroups.get(query)!.push(product);
    }

    // Формируем статистику
    const queriesStats = [];
    
    for (const [query, products] of queryGroups) {
      const wbProducts = products.filter(p => p.source === 'wb');
      const ozonProducts = products.filter(p => p.source === 'ozon');
      
      let cheapestPrice: number | undefined;
      let cheapestSource: string | undefined;
      
      if (products.length > 0) {
        const cheapest = products.reduce((min, p) => p.price < min.price ? p : min);
        cheapestPrice = cheapest.price;
        cheapestSource = cheapest.source;
      }

      queriesStats.push({
        query,
        total_products: products.length,
        wb_products: wbProducts.length,
        ozon_products: ozonProducts.length,
        cheapest_price: cheapestPrice,
        cheapest_source: cheapestSource
      });
    }

    return {
      total_queries: request.queries.length,
      total_products: allProducts.length,
      queries_stats: queriesStats
    };
  }

  /**
   * Очищает кэш для категории
   */
  async clearCacheForCategory(category: string): Promise<number> {
    try {
      const pattern = `product:${category}:*`;
      const deletedKeys = await this.redisService.deleteByPattern(pattern);
      this.logger.log(`🗑️ Очищен кэш для категории ${category}: ${deletedKeys} ключей`);
      return deletedKeys;
    } catch (error) {
      this.logger.error(`❌ Ошибка очистки кэша для категории ${category}:`, error);
      return 0;
    }
  }
} 