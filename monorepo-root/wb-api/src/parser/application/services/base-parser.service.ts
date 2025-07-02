import { Logger, Inject } from '@nestjs/common';
import { Product, SearchResult, Stats } from '../../domain/interfaces/parser.interfaces';
import { WildberriesApiClient, PhotoService } from '../../domain/interfaces/wb-api.interface';
import { ProductFilterClient } from '../../../grpc-clients/product-filter.client';
import { WB_API_CLIENT, PHOTO_SERVICE } from '../../infrastructure/infrastructure.module';
import * as process from 'process';

export abstract class BaseParserService {
  // 🎯 ОПЦИОНАЛЬНЫЕ ПОЛЯ: Логика переносится в Product-Filter-Service
  protected readonly TEST_QUERIES?: string[] = [];
  protected readonly TEST_XSUBJECT?: number = 0;
  protected readonly EXCLUDE_KEYWORDS?: string[] = [];
  
  // 🎯 ОБЯЗАТЕЛЬНЫЕ ПОЛЯ: Только название категории
  protected abstract readonly category: string; // Название категории
  
  protected readonly logger = new Logger(this.constructor.name);

  private readonly CONFIG = {
    MAX_CONCURRENT_REQUESTS: 5,
    REQUEST_DELAY: 500,
  };

  private requestQueue: any[] = [];
  private runningRequests = 0;

  constructor(
    @Inject(ProductFilterClient) 
    protected readonly filterClient: ProductFilterClient,
    @Inject(WB_API_CLIENT)
    protected readonly wbApiClient: WildberriesApiClient,
    @Inject(PHOTO_SERVICE)
    private readonly photoService: PhotoService
  ) {}

  protected initCaches() {
    // Кэширование отключено - только в Product-Filter-Service
    this.logger.log('🚀 Кэширование отключено в WB-API - только в Product-Filter-Service');
  }

  private async executeRequest<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ fn, resolve, reject });
      this.processRequestQueue();
    });
  }

  private async processRequestQueue() {
    if (this.runningRequests >= this.CONFIG.MAX_CONCURRENT_REQUESTS || this.requestQueue.length === 0) {
      return;
    }
    this.runningRequests++;
    const { fn, resolve, reject } = this.requestQueue.shift();
    try {
      const result = await fn();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.runningRequests--;
      this.processRequestQueue();
    }
  }

  protected getProductPrice(p: Product): number | null {
    if (!Array.isArray(p.sizes) || !p.sizes.length) return null;
    return Math.min(...p.sizes.map(s => s.price?.product / 100).filter(Boolean));
  }

  protected formatPrice(price: number): string {
    return price ? price.toLocaleString('ru-RU') + ' ₽' : '—';
  }

  protected generateStableId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '');
  }

  private async processSingleQuery(query: string): Promise<SearchResult | null> {
    try {
      const products = await this.wbApiClient.searchProducts(query, this.TEST_XSUBJECT || 0);
      const candidates = products.filter(p => this.isRealProduct(p.name, query));
      if (!candidates.length) return null;
      
      const product = candidates.reduce((min, p) => {
        const price = this.getProductPrice(p);
        const minPrice = this.getProductPrice(min);
        return (price !== null && (minPrice === null || price < minPrice)) ? p : min;
      });

      const currentPrice = this.getProductPrice(product);
      if (!currentPrice) return null;

      const stableId = this.generateStableId(product.name);

      // 🎯 Возвращаем обогащенный товар БЕЗ кэширования (только сырые данные)
      return {
        query,
        product,
        stableId,
        photoFound: false,
        photoUrl: null, // Фото будет искаться в product-filter-service
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка при парсинге запроса "${query}":`, error);
      return null;
    }
  }

  async findAllProducts(): Promise<{ results: SearchResult[], stats: Stats }> {
    const start = Date.now();
    const results: SearchResult[] = [];
    let errorCount = 0;
    let foundPhotos = 0;
    const queries = this.TEST_QUERIES || [];
    const total = queries.length;
    const barLength = 20;
    
    this.logger.log('▶️ Запущен парсинг категории...');
    
    for (let i = 0; i < total; i++) {
      const query = queries[i];
      try {
        const result = await this.processSingleQuery(query);
        if (result) {
          results.push(result);
          if (result.photoFound) foundPhotos++;
        }
      } catch {
        errorCount++;
      }
      // Прогресс-бар
      const progress = Math.round(((i + 1) / total) * barLength);
      const bar = '[' + '#'.repeat(progress) + '-'.repeat(barLength - progress) + `] ${i + 1}/${total}`;
      process.stdout.write(`\r${bar}`);
      await new Promise(res => setTimeout(res, this.CONFIG.REQUEST_DELAY));
    }
    process.stdout.write('\n');
    
    const executionTime = (Date.now() - start) / 1000;
    
    // Фильтрация дублей по stableId
    const uniqueResultsMap = new Map<string, SearchResult>();
    for (const r of results) {
      uniqueResultsMap.set(r.stableId, r);
    }
    const uniqueResults = Array.from(uniqueResultsMap.values());
    
    const stats: Stats = {
      executionTime,
      totalProducts: uniqueResults.length,
      foundPhotos,
      errorCount,
      photoSuccessRate: uniqueResults.length ? foundPhotos / uniqueResults.length : 0,
      avgSpeed: uniqueResults.length ? executionTime / uniqueResults.length : 0,
    };
    
    this.logger.log(`✅ Парсинг завершён: найдено ${uniqueResults.length}, фото: ${foundPhotos}, ошибок: ${errorCount}, время: ${executionTime}s`);
    return { results: uniqueResults, stats };
  }

  protected isRealProduct(title: string, query: string): boolean {
    // 🎯 УБИРАЕМ ФИЛЬТРАЦИЮ - она будет в Product-Filter-Service
    // Простая проверка на соответствие запросу
    const queryWords = query.toLowerCase().split(' ');
    const titleLower = title.toLowerCase();
    return queryWords.some(word => titleLower.includes(word));
  }

  // Новый метод с полной gRPC интеграцией БЕЗ кэша цен
  async findAllProductsViaGrpc(): Promise<any[]> {
    const startTime = Date.now();
    const categoryIcon = this.getCategoryIcon();
    
    this.logger.log(`📡 Получен запрос на парсинг ${this.getCategoryName()}`);
    this.logger.log(`🚀 Начинаю парсинг ${this.TEST_QUERIES?.length || 0} запросов через gRPC...`);
    
    // Фильтруем через gRPC микросервис - каждый запрос получает свои данные
    const filterResults = await Promise.all(
      this.TEST_QUERIES?.map(async (query) => {
        try {
          // Получаем сырые данные для каждого запроса отдельно
          const rawProducts = await this.fetchRawProductsForQuery(query);
          
          // Удаляю все обращения к this.grpcClient, так как клиент удалён
          // const result = await this.grpcClient.filterProducts(
          //   rawProducts,
          //   query,
          //   this.getGrpcFilterConfig(),
          //   {
          //     excludeKeywords: this.EXCLUDE_KEYWORDS,
          //     source: 'wb',
          //     category: this.category
          //   }
          // );

          // 🎯 НОВАЯ ЛОГИКА: обрабатываем каждый отфильтрованный товар через кэш цен
          const processedProducts = await Promise.all(
            rawProducts.map(async (product) => {
              try {
                return await this.processProductWithPriceCache(product, query);
              } catch (error) {
                this.logger.error(`❌ Ошибка обработки товара ${product.name}:`, error);
                return null;
              }
            })
          );

          // Убираем null товары (не прошедшие проверку цен)
          const validProducts = processedProducts.filter(p => p !== null);
          
          return {
            query,
            products: validProducts,
            stats: {
              totalInput: rawProducts.length,
              totalFiltered: validProducts.length, // Обновляем счетчик
              processingTimeMs: 0
            }
          };
        } catch (error) {
          this.logger.error(`❌ Ошибка gRPC фильтрации для "${query}":`, error);
          return { query, products: [], stats: { totalInput: 0, totalFiltered: 0, processingTimeMs: 0 } };
        }
      }) || []
    );

    // 📊 Агрегированная статистика
    const totalTime = (Date.now() - startTime) / 1000;
    const totalProducts = filterResults.reduce((sum, result) => sum + result.products.length, 0);
    const totalWithPhotos = filterResults.reduce((sum, result) => {
      return sum + result.products.filter(p => p.photoUrl && p.photoUrl !== '').length;
    }, 0);
    const successfulQueries = filterResults.filter(r => r.products.length > 0).length;
    
    this.logger.log(`${categoryIcon} ${this.getCategoryName()}: ${totalProducts} товаров, ${totalWithPhotos} с фото за ${totalTime.toFixed(1)}с`);
    this.logger.log(`📈 Успешных запросов: ${successfulQueries}/${this.TEST_QUERIES?.length || 0}`);

    return filterResults;
  }

  // 🎯 Новый метод: обрабатывает товар БЕЗ кэша цен (только сырые данные)
  private async processProductWithPriceCache(product: any, query: string): Promise<any | null> {
    const currentPrice = product.price;
    if (!currentPrice) return null;

    // 🖼️ Логируем URL изображения для отладки
    if (product.image_url) {
      this.logger.log(`📷 URL изображения для ${product.name}: ${product.image_url}`);
    }

    // 🎯 Возвращаем обогащенный товар БЕЗ кэширования (только сырые данные)
    return {
      ...product,
      stableId: this.generateStableId(product.name),
      photoUrl: null, // Фото будет искаться в product-filter-service
      query
    };
  }

  // Утилита для извлечения pics из image_url
  private extractPicsFromImageUrl(imageUrl: string): number | undefined {
    if (!imageUrl) return undefined;
    const match = imageUrl.match(/\/c\d+x\d+\/(\d+)\.jpg/);
    return match ? parseInt(match[1]) : undefined;
  }

  private getCategoryIcon(): string {
    switch (this.category) {
      case 'videocards': return '🎮';
      case 'processors': return '🔧';
      case 'motherboards': return '🔌';
      default: return '📦';
    }
  }

  private getCategoryName(): string {
    switch (this.category) {
      case 'videocards': return 'видеокарт';
      case 'processors': return 'процессоров';
      case 'motherboards': return 'материнских плат';
      default: return this.category;
    }
  }

  private async fetchRawProductsForQuery(query: string): Promise<any[]> {
    const products = await this.wbApiClient.searchProducts(query, this.TEST_XSUBJECT || 0);
    
    // 🏗️ ПРАВИЛЬНАЯ АРХИТЕКТУРА: отправляем ВСЕ товары в Product-Filter-Service
    // Пусть он сам фильтрует И выбирает минимальную цену
    return (products || []).map(product => ({
      id: product.id.toString(),
      name: product.name,
      price: this.getProductPrice(product) || 0,
      description: product.promoTextCard || product.promoTextCat || '',
      image_url: product.pics ? `https://images.wbstatic.net/c516x688/${product.pics}.jpg` : '',
      product_url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
      images: product.pics ? [`https://images.wbstatic.net/c516x688/${product.pics}.jpg`] : [],
      characteristics: {},
      category: this.category,
      availability: product.totalQuantity && product.totalQuantity > 0 ? 'available' : 'out_of_stock',
      supplier: product.supplier || 'Unknown',
      brand: product.brand || 'Unknown'
    }));
  }

  // Cleanup gRPC соединения
  onModuleDestroy() {
    // this.grpcClient.close();
  }

  // 🚀 НОВЫЙ МЕТОД: ТОЛЬКО СЫРОЙ ПАРСИНГ без кэширования и постинга
  async findAllRawProducts(testMode = false): Promise<any[]> {
    const startTime = Date.now();
    const categoryIcon = this.getCategoryIcon();
    
    this.logger.log(`🔍 СЫРОЙ парсинг ${this.getCategoryName()} для Product-Filter-Service${testMode ? ' (TEST MODE)' : ''}`);
    
    // 🧪 TEST MODE: Возвращаем синтетические данные
    if (testMode) {
      return this.generateTestData();
    }
    
    const rawResults = await Promise.all(
      this.TEST_QUERIES?.map(async (query) => {
        try {
          // Получаем сырые данные для каждого запроса
          const rawProducts = await this.fetchRawProductsForQuery(query);
          
          // НИКАКОЙ фильтрации - только сырые данные!
          const validProducts = rawProducts.map(product => ({
            ...product,
            query,
            stableId: this.generateStableId(product.name)
          }));
          
          return {
            query,
            products: validProducts,
            stats: {
              totalInput: rawProducts.length,
              totalFiltered: validProducts.length,
              processingTimeMs: 0
            }
          };
        } catch (error) {
          this.logger.error(`❌ Ошибка парсинга "${query}":`, error);
          return { query, products: [], stats: { totalInput: 0, totalFiltered: 0, processingTimeMs: 0 } };
        }
      }) || []
    );

    // 📊 Статистика
    const totalTime = (Date.now() - startTime) / 1000;
    const totalProducts = rawResults.reduce((sum, result) => sum + result.products.length, 0);
    const successfulQueries = rawResults.filter(r => r.products.length > 0).length;
    
    this.logger.log(`${categoryIcon} СЫРЫХ данных: ${totalProducts} товаров за ${totalTime.toFixed(1)}с`);
    this.logger.log(`📈 Успешных запросов: ${successfulQueries}/${this.TEST_QUERIES?.length || 0}`);

    return rawResults;
  }

  // 🧪 Генерация синтетических тестовых данных
  private generateTestData(): any[] {
    this.logger.log(`🧪 Генерируем синтетические данные для ${this.category}`);
    
    return this.TEST_QUERIES?.map((query, index) => {
      const basePrice = 10000 + (index * 5000); // Разные цены
      
      // Создаем синтетический товар для каждого запроса
      const product = {
        id: `test_${this.category}_${index + 1}`,
        name: query,
        price: basePrice,
        description: `Тестовый товар: ${query}`,
        image_url: '',
        product_url: `https://test.wildberries.ru/catalog/test_${index + 1}/detail.aspx`,
        images: [],
        characteristics: {},
        category: this.category,
        availability: 'available',
        query,
        stableId: this.generateStableId(query)
      };
      
      return {
        query,
        products: [product], // Один товар на запрос
        stats: {
          totalInput: 1,
          totalFiltered: 1,
          processingTimeMs: 50
        }
      };
    }) || [];
  }

  // 🆕 НОВЫЙ МЕТОД: для обработки отдельного запроса с внешним xsubject (от Product-Filter-Service)
  async searchProductsByQuery(query: string, xsubject: number): Promise<any[]> {
    try {
      this.logger.log(`🔍 Поиск "${query}" в категории ${xsubject}`);
      
      // Получаем сырые данные от WB API
      const products = await this.wbApiClient.searchProducts(query, xsubject);
      
      if (!products || products.length === 0) {
        this.logger.log(`⚠️ "${query}": товары не найдены`);
        return [];
      }
      
      // 🏗️ Преобразуем в стандартный формат и возвращаем ВСЕ товары
      // Product-Filter-Service сам решит что с ними делать
      const formattedProducts = products.map(product => ({
        id: product.id.toString(),
        name: product.name,
        price: this.getProductPrice(product) || 0,
        image_url: product.pics ? `https://images.wbstatic.net/c516x688/${product.pics}.jpg` : '',
        product_url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
        brand: product.brand || 'Unknown',
        supplier: product.supplier || 'Unknown',
        description: product.promoTextCard || product.promoTextCat || '',
        availability: product.totalQuantity && product.totalQuantity > 0 ? 'available' : 'out_of_stock'
      }));
      
      this.logger.log(`📦 "${query}": найдено ${formattedProducts.length} товаров`);
      return formattedProducts;
      
    } catch (error) {
      this.logger.error(`❌ Ошибка поиска "${query}":`, error);
      return [];
    }
  }
} 