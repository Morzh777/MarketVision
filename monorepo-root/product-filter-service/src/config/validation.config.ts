/**
 * Централизованная конфигурация валидации
 * Позволяет легко настраивать правила без изменения кода
 */

export interface ValidationConfig {
  // Глобальные настройки
  global: {
    enableAI: boolean;
    aiModel: string;
    enablePriceAnomalyDetection: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  
  // Настройки аксессуаров
  accessories: {
    enableHardFilter: boolean;
    enableSoftFilter: boolean;
    commonAccessoryWords: string[];
  };

  // Настройки AI
  ai: {
    maxProductsPerBatch: number;
    timeoutMs: number;
    retryAttempts: number;
    confidenceThreshold: number;
  };

  // Настройки по категориям
  categories: Record<string, CategoryValidationConfig>;
}

export interface CategoryValidationConfig {
  enabled: boolean;
  displayName: string;
  strictMode: boolean; // Если true, больше товаров отправляется в AI
  
  rules: {
    requiredKeywords?: string[];
    brands?: string[];
    series?: string[];
    features?: string[];
    categoryAccessories?: string[];
    minFeatures?: number;
    modelPatterns?: string[]; // Регексы как строки для JSON
    minNameLength?: number;
  };
  
  priceAnomaly: {
    enabled: boolean;
    minPercentageDifference: number;
    maxSuspiciousPrice: number;
    zScoreThreshold: number;
  };
}

// Дефолтная конфигурация
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  global: {
    enableAI: true,
    aiModel: 'gpt-4o-mini',
    enablePriceAnomalyDetection: true,
    logLevel: 'info'
  },
  
  accessories: {
    enableHardFilter: true,
    enableSoftFilter: true,
    commonAccessoryWords: [
      'кабель', 'подставка', 'вентилятор', 'чехол', 'наклейка', 'сумка',
      'cable', 'stand', 'fan', 'case', 'sticker', 'bag', 'adapter', 'mount'
    ]
  },

  ai: {
    maxProductsPerBatch: 20,
    timeoutMs: 30000,
    retryAttempts: 2,
    confidenceThreshold: 0.7
  },

  categories: {
    videocards: {
      enabled: true,
      displayName: 'Видеокарты',
      strictMode: false,
      rules: {
        requiredKeywords: ['rtx', 'gtx', 'rx', 'geforce', 'radeon'],
        brands: ['msi', 'palit', 'gigabyte', 'zotac', 'inno3d', 'asus', 'colorful', 'galax'],
        series: ['gaming', 'oc', 'ventus', 'windforce', 'prime', 'tuf'],
        features: ['16gb', '24gb', '8gb', '12gb', 'gddr6', 'pcie'],
        modelPatterns: ['(rtx|gtx|rx)[-\\s]*(\\d{4})(\\s*(ti|super|ultra|xt))?'],
        minFeatures: 2,
        minNameLength: 8
      },
      priceAnomaly: {
        enabled: true,
        minPercentageDifference: 0.4,
        maxSuspiciousPrice: 5000,
        zScoreThreshold: 2.5
      }
    },

    processors: {
      enabled: true,
      displayName: 'Процессоры',
      strictMode: false,
      rules: {
        requiredKeywords: ['amd', 'intel', 'ryzen', 'core', 'i3', 'i5', 'i7', 'i9'],
        brands: ['amd', 'intel', 'ryzen', 'xeon', 'core'],
        series: ['7800x3d', '9800x3d', '13900k', '14700k', '12400f'],
        features: ['cpu', 'процессор', 'ядер', 'ghz', 'ddr5', 'am5'],
        minFeatures: 2,
        minNameLength: 12
      },
      priceAnomaly: {
        enabled: true,
        minPercentageDifference: 0.35,
        maxSuspiciousPrice: 3000,
        zScoreThreshold: 2.0
      }
    },

    motherboards: {
      enabled: true,
      displayName: 'Материнские платы',
      strictMode: false,
      rules: {
        requiredKeywords: ['b760', 'b850', 'x870', 'z790', 'am5', 'am4', 'материнская'],
        brands: ['asus', 'msi', 'gigabyte', 'asrock', 'biostar'],
        series: ['prime', 'tuf', 'rog', 'gaming', 'aorus', 'tomahawk'],
        features: ['ddr5', 'ddr4', 'pcie', 'wifi', 'usb3', 'm.2'],
        minFeatures: 2,
        minNameLength: 10
      },
      priceAnomaly: {
        enabled: true,
        minPercentageDifference: 0.3,
        maxSuspiciousPrice: 2000,
        zScoreThreshold: 2.0
      }
    },

    playstation: {
      enabled: true,
      displayName: 'PlayStation',
      strictMode: true, // Больше товаров в AI из-за сложности определения
      rules: {
        requiredKeywords: ['ps5', 'playstation', 'sony'],
        brands: ['sony', 'playstation'],
        series: ['standard', 'digital', 'slim', 'pro'],
        features: ['825gb', '1tb', '4k', 'консоль'],
        minFeatures: 1,
        minNameLength: 5
      },
      priceAnomaly: {
        enabled: true,
        minPercentageDifference: 0.25,
        maxSuspiciousPrice: 10000,
        zScoreThreshold: 1.8
      }
    },

    nintendo_switch: {
      enabled: true,
      displayName: 'Nintendo Switch',
      strictMode: true,
      rules: {
        requiredKeywords: ['nintendo', 'switch', 'oled'],
        brands: ['nintendo'],
        series: ['oled', 'lite', 'standard', 'neon'],
        features: ['консоль', '32gb', '64gb', 'портативная'],
        minFeatures: 1,
        minNameLength: 8
      },
      priceAnomaly: {
        enabled: true,
        minPercentageDifference: 0.25,
        maxSuspiciousPrice: 8000,
        zScoreThreshold: 1.8
      }
    }
  }
};

/**
 * Сервис для работы с конфигурацией валидации
 */
export class ValidationConfigService {
  private config: ValidationConfig = DEFAULT_VALIDATION_CONFIG;

  /**
   * Загрузка конфигурации из файла или переменных окружения
   */
  loadConfig(configPath?: string): void {
    // Здесь можно добавить загрузку из JSON файла
    // const fs = require('fs');
    // if (configPath && fs.existsSync(configPath)) {
    //   this.config = { ...DEFAULT_VALIDATION_CONFIG, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
    // }
    
    // Переопределяем из переменных окружения
    this.loadFromEnvironment();
  }

  /**
   * Загрузка настроек из переменных окружения
   */
  private loadFromEnvironment(): void {
    if (process.env.VALIDATION_ENABLE_AI === 'false') {
      this.config.global.enableAI = false;
    }
    
    if (process.env.VALIDATION_AI_MODEL) {
      this.config.global.aiModel = process.env.VALIDATION_AI_MODEL;
    }
    
    if (process.env.VALIDATION_LOG_LEVEL) {
      this.config.global.logLevel = process.env.VALIDATION_LOG_LEVEL as any;
    }
  }

  /**
   * Получение полной конфигурации
   */
  getConfig(): ValidationConfig {
    return this.config;
  }

  /**
   * Получение конфигурации категории
   */
  getCategoryConfig(category: string): CategoryValidationConfig | null {
    return this.config.categories[category] || null;
  }

  /**
   * Проверка, включена ли категория
   */
  isCategoryEnabled(category: string): boolean {
    const categoryConfig = this.getCategoryConfig(category);
    return categoryConfig?.enabled ?? false;
  }

  /**
   * Обновление конфигурации категории
   */
  updateCategoryConfig(category: string, updates: Partial<CategoryValidationConfig>): void {
    if (this.config.categories[category]) {
      this.config.categories[category] = { ...this.config.categories[category], ...updates };
    }
  }

  /**
   * Добавление новой категории
   */
  addCategory(category: string, config: CategoryValidationConfig): void {
    this.config.categories[category] = config;
  }
} 