// Утилиты для dev режима
export class DevUtils {
  private static isDevMode = process.env.NODE_ENV === 'development' || process.env.DEV_MODE === 'true';
  
  // Проверка dev режима
  static isDev(): boolean {
    return this.isDevMode;
  }
  
  // Расширенное логирование
  static log(message: string, data?: any): void {
    if (this.isDev()) {
      const timestamp = new Date().toISOString();
      console.log(`🔍 [DEV] ${timestamp} - ${message}`);
      if (data) {
        console.log('📊 Data:', JSON.stringify(data, null, 2));
      }
    }
  }
  
  // Логирование ошибок
  static error(message: string, error?: any): void {
    if (this.isDev()) {
      const timestamp = new Date().toISOString();
      console.error(`❌ [DEV ERROR] ${timestamp} - ${message}`);
      if (error) {
        console.error('🚨 Error details:', error);
      }
    }
  }
  
  // Логирование API запросов
  static logApiRequest(method: string, url: string, data?: any): void {
    if (this.isDev()) {
      console.log(`🌐 [API REQUEST] ${method} ${url}`);
      if (data) {
        console.log('📤 Request data:', JSON.stringify(data, null, 2));
      }
    }
  }
  
  // Логирование API ответов
  static logApiResponse(status: number, data?: any): void {
    if (this.isDev()) {
      const emoji = status >= 200 && status < 300 ? '✅' : '❌';
      console.log(`${emoji} [API RESPONSE] ${status}`);
      if (data) {
        console.log('📥 Response data:', JSON.stringify(data, null, 2));
      }
    }
  }
  
  // Логирование Telegram сообщений
  static logTelegramMessage(chatId: number, message: string): void {
    if (this.isDev()) {
      console.log(`📱 [TELEGRAM] Chat ${chatId}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
    }
  }
  
  // Логирование производительности
  static logPerformance(operation: string, startTime: number): void {
    if (this.isDev()) {
      const duration = Date.now() - startTime;
      console.log(`⚡ [PERF] ${operation}: ${duration}ms`);
    }
  }
  
  // Мок данные для тестирования
  static getMockProducts(category: string): any[] {
    return [
      {
        id: 'mock-1',
        name: `Mock ${category} Product 1`,
        price: 50000,
        brand: 'MockBrand',
        supplier: 'MockSupplier',
        productUrl: 'https://example.com/1'
      },
      {
        id: 'mock-2', 
        name: `Mock ${category} Product 2`,
        price: 75000,
        brand: 'MockBrand',
        supplier: 'MockSupplier',
        productUrl: 'https://example.com/2'
      }
    ];
  }
  
  // Проверка здоровья сервисов
  static async checkServicesHealth(): Promise<void> {
    if (!this.isDev()) return;
    
    console.log('🏥 [HEALTH CHECK] Проверка Product-Filter-Service...');
    
    try {
      // Проверка Product-Filter-Service (проверяем доступность сервиса)
      const response = await fetch('http://localhost:3001', { 
        method: 'HEAD'
      });
      
      if (response.ok || response.status === 404) {
        // 404 тоже нормально - значит сервис отвечает, но нет корневого эндпоинта
        console.log('✅ Product-Filter-Service: OK');
      } else {
        console.log('❌ Product-Filter-Service: DOWN');
      }
    } catch (error) {
      console.log('❌ Product-Filter-Service: ERROR', error);
    }
  }
} 