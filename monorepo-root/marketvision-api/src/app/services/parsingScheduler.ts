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
  start() {
    if (this.isRunning) {
      console.log('⚠️ Планировщик уже запущен');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Запуск планировщика парсинга');

    // Запускаем первый парсинг через 1 минуту после старта
    setTimeout(() => {
      this.runScheduledParsing();
    }, 60000);

    // Затем каждые 30 минут
    this.schedulerInterval = setInterval(() => {
      this.runScheduledParsing();
    }, 30 * 60 * 1000); // 30 минут

    console.log('⏰ Планировщик запущен: парсинг каждые 30 минут');
  }

  /**
   * Останавливает планировщик
   */
  stop() {
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
          
          // Небольшая пауза между категориями
          await this.delay(2000);
          
        } catch (error) {
          console.error(`❌ Ошибка парсинга категории ${categoryKey}:`, error instanceof Error ? error.message : String(error));
        }
      }

      const duration = Date.now() - startTime;
      console.log(`🎉 Парсинг завершен: ${totalProducts} товаров из ${totalCategories} категорий за ${duration}ms`);

    } catch (error) {
      console.error('❌ Критическая ошибка парсинга:', error instanceof Error ? error.message : String(error));
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
      const response = await fetch(`${PRODUCT_FILTER_URL}/products/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries,
          category: categoryKey
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as { products?: unknown[] };
      console.log(`✅ ${categoryKey}: получено ${result.products?.length || 0} товаров через REST API`);

      return result.products || [];
    } catch (error) {
      console.error(`❌ Ошибка парсинга ${categoryKey}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Запускает парсинг немедленно (для тестирования)
   */
  async runParsingNow() {
    console.log('⚡ Запуск немедленного парсинга');
    await this.runScheduledParsing();
  }

  /**
   * Получает статус планировщика
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      isParsing: this.isParsing,
      nextRun: this.getNextRunTime(),
      config: PARSING_CONFIG,
      activeCategories: this.activeCategories
    };
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
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Создаем единственный экземпляр планировщика
const parsingScheduler = new ParsingScheduler();

// Запускаем планировщик при инициализации модуля (только в production)
if (process.env.NODE_ENV === 'production') {
  parsingScheduler.start();
}

export default parsingScheduler; 