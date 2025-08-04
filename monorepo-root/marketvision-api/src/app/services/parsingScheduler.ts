// Планировщик парсинга для отправки запросов на product-filter-service
// Запускается каждые 30 минут

const PRODUCT_FILTER_URL = process.env.PRODUCT_FILTER_SERVICE_URL || 'http://localhost:3001';

// Конфигурация парсинга (точно как в тесте)
const PARSING_CONFIG = {
  videocards: [
    'rtx 5070',
    'rtx 5070 ti',
    'rtx 5080',
    'rtx 5090'
  ],
  processors: [
    '7800x3d',
    '9800x3d',
    '9950x3d'
  ],
  motherboards: [
    'Z790',
    'B760',
    'X870E',
    'B850',
    'B760M-K'
  ],
  playstation: [
    'playstation 5',
    'playstation 5 pro'
  ],
  nintendo_switch: [
    'nintendo switch 2',
  ],
  steam_deck: [
    'steam deck oled'
  ],
  iphone: [
    'iphone 16 pro',
  ]
};

class ParsingScheduler {
  private isRunning = false;
  private schedulerInterval: NodeJS.Timeout | null = null;
  private isParsing = false;
  private isImmediateParsing = false; // Отдельный флаг для немедленного парсинга
  private activeCategories: Record<string, boolean> = {
    videocards: true,    // раскомментируй для включения
    processors: true,    // раскомментируй для включения
    motherboards: true,  // раскомментируй для включения
    playstation: true,      // включена
    nintendo_switch: true, // раскомментируй для включения
    steam_deck: true,    // раскомментируй для включения
    iphone: true,        // раскомментируй для включения
  };

  constructor() {
    console.log('🗓️ Планировщик парсинга инициализирован');
  }

  /**
   * Запускает планировщик
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Планировщик уже запущен');
      return;
    }

    try {
      // Проверяем доступность product-filter-service
      console.log('🔍 Проверка доступности product-filter-service...');
      const healthResponse = await fetch(`${PRODUCT_FILTER_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 секунд таймаут
      });

      if (!healthResponse.ok) {
        throw new Error(`Product-filter-service недоступен: ${healthResponse.status}`);
      }

      console.log('✅ Product-filter-service доступен');

      this.isRunning = true;
      console.log('🚀 Запуск планировщика парсинга');

      // Запускаем первый парсинг через 1 минуту после старта
      setTimeout(() => {
        try {
          console.log('⏰ Запуск первого парсинга через 1 минуту...');
          this.runScheduledParsing();
        } catch (error) {
          console.error('❌ Ошибка в первом запуске парсинга:', error);
        }
      }, 60000);

      // Затем каждые 30 минут
      this.schedulerInterval = setInterval(() => {
        try {
          console.log('⏰ Запуск запланированного парсинга...');
          this.runScheduledParsing();
        } catch (error) {
          console.error('❌ Ошибка в запланированном парсинге:', error);
        }
      }, 30 * 60 * 1000); // 30 минут

      console.log('⏰ Планировщик запущен: парсинг каждые 30 минут');
    } catch (error) {
      console.error('❌ Ошибка запуска планировщика:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Останавливает планировщик
   */
  stop() {
    console.log('🛑 Попытка остановки планировщика...');
    console.log('📊 Текущий статус:', { isRunning: this.isRunning, isParsing: this.isParsing });
    
    if (!this.isRunning) {
      console.log('⚠️ Планировщик не запущен');
      return;
    }

    this.isRunning = false;
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    console.log('⏹️ Планировщик остановлен');
  }

  /**
   * Запускает парсинг всех категорий
   */
  async runScheduledParsing() {
    if (this.isParsing) {
      console.log('⚠️ Парсинг уже выполняется, пропускаем...');
      return;
    }

    this.isParsing = true;
    console.log('🚀 Запуск запланированного парсинга всех категорий');

    try {
      const startTime = Date.now();
      let totalProducts = 0;
      let totalCategories = 0;

      // Парсим каждую категорию (можно включать/выключать)
      for (const [categoryKey, queries] of Object.entries(PARSING_CONFIG)) {
        // Пропускаем неактивные категории
        if (!this.activeCategories[categoryKey]) {
          console.log(`⏭️ Пропускаем категорию: ${categoryKey} (отключена)`);
          continue;
        }

        try {
          console.log(`📦 Парсинг категории: ${categoryKey}`);
          
          const products = await this.parseCategory(categoryKey, queries);
          totalProducts += products.length;
          totalCategories++;

          console.log(`✅ ${categoryKey}: найдено ${products.length} товаров`);
          
          // Небольшая пауза между категориями (с защитой от ошибок)
          try {
            await this.delay(2000);
          } catch (delayError) {
            console.warn(`⚠️ Ошибка задержки после ${categoryKey}:`, delayError);
            // Продолжаем парсинг даже если задержка не сработала
          }
          
        } catch (error) {
          console.error(`❌ Ошибка парсинга категории ${categoryKey}:`, error instanceof Error ? error.message : String(error));
          // Продолжаем с следующей категорией
        }
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 Парсинг завершен: ${totalProducts} товаров из ${totalCategories} категорий за ${duration}ms`);

    } catch (error) {
      console.error('❌ Критическая ошибка парсинга:', error instanceof Error ? error.message : String(error));
      // НЕ выбрасываем ошибку дальше
    } finally {
      this.isParsing = false;
    }
  }

  /**
   * Парсит конкретную категорию через REST API
   */
  private async parseCategory(categoryKey: string, queries: string[]) {
    console.log(`🔍 Парсинг ${categoryKey}: ${queries.join(', ')}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      const response = await fetch(`${PRODUCT_FILTER_URL}/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries,
          category: categoryKey
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as { products?: unknown[] };
      console.log(`✅ ${categoryKey}: получено ${result.products?.length || 0} товаров через REST API`);

      return result.products || [];
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`⏰ Таймаут парсинга ${categoryKey} (30 секунд)`);
      } else {
        console.error(`❌ Ошибка парсинга ${categoryKey}:`, error instanceof Error ? error.message : String(error));
      }
      return [];
    }
  }

  /**
   * Запускает парсинг немедленно (для тестирования)
   */
  async runParsingNow() {
    console.log('⚡ Запуск немедленного парсинга');
    
    // Проверяем, не выполняется ли уже парсинг
    if (this.isParsing || this.isImmediateParsing) {
      console.log('⚠️ Парсинг уже выполняется, пропускаем немедленный запуск...');
      return;
    }

    this.isImmediateParsing = true;
    console.log('🚀 Запуск немедленного парсинга всех категорий');

    try {
      const startTime = Date.now();
      let totalProducts = 0;
      let totalCategories = 0;

      // Парсим каждую категорию
      for (const [categoryKey, queries] of Object.entries(PARSING_CONFIG)) {
        // Пропускаем неактивные категории
        if (!this.activeCategories[categoryKey]) {
          console.log(`⏭️ Пропускаем категорию: ${categoryKey} (отключена)`);
          continue;
        }

        try {
          console.log(`📦 Парсинг категории: ${categoryKey}`);
          
          const products = await this.parseCategory(categoryKey, queries);
          totalProducts += products.length;
          totalCategories++;

          console.log(`✅ ${categoryKey}: найдено ${products.length} товаров`);
          
          // Небольшая пауза между категориями (с защитой от ошибок)
          try {
            await this.delay(2000);
          } catch (delayError) {
            console.warn(`⚠️ Ошибка задержки после ${categoryKey}:`, delayError);
          }
          
        } catch (error) {
          console.error(`❌ Ошибка парсинга категории ${categoryKey}:`, error instanceof Error ? error.message : String(error));
        }
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 Немедленный парсинг завершен: ${totalProducts} товаров из ${totalCategories} категорий за ${duration}ms`);

    } catch (error) {
      console.error('❌ Критическая ошибка немедленного парсинга:', error instanceof Error ? error.message : String(error));
    } finally {
      this.isImmediateParsing = false;
      console.log('✅ Немедленный парсинг завершен, планировщик остается активным');
    }
  }

  /**
   * Получает статус планировщика
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      isParsing: this.isParsing || this.isImmediateParsing, // Показываем любой активный парсинг
      nextRun: this.getNextRunTime(),
      config: PARSING_CONFIG,
      activeCategories: this.activeCategories
    };
    
    console.log('📊 Запрос статуса планировщика:', status);
    return status;
  }

  /**
   * Обновляет активные категории
   */
  updateActiveCategories(categories: Record<string, boolean>) {
    this.activeCategories = { ...categories };
    console.log('🔄 Активные категории обновлены:', this.activeCategories);
  }

  /**
   * Вычисляет время следующего запуска
   */
  private getNextRunTime(): Date {
    const now = new Date();
    const nextRun = new Date(now);
    
    // Следующий запуск через 30 минут от текущего времени
    nextRun.setMinutes(nextRun.getMinutes() + 30);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
    
    return nextRun;
  }

  /**
   * Утилита для задержки
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const timeoutId = setTimeout(() => {
          resolve();
        }, ms);
        
        // Защита от слишком долгих задержек
        const maxTimeout = setTimeout(() => {
          clearTimeout(timeoutId);
          reject(new Error('Delay timeout exceeded'));
        }, Math.min(ms * 2, 60000)); // Максимум 60 секунд
        
        // Очищаем maxTimeout при успешном resolve
        const originalResolve = resolve;
        resolve = () => {
          clearTimeout(maxTimeout);
          originalResolve();
        };
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Создаем единственный экземпляр планировщика
const parsingScheduler = new ParsingScheduler();

// Планировщик будет запускаться только по требованию через API
console.log('⏸️ Планировщик создан, ожидает запуска через админку...');

export default parsingScheduler;
export { PARSING_CONFIG }; 