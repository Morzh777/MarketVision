import { Injectable } from '@nestjs/common';
import { OpenAiValidationService, OpenAiProduct, OpenAiValidationResult } from '../services/openai.service';
import { isAccessory } from '../utils/is-accessory';

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  aiReason?: string;
  confidence?: number;
}

export interface CategoryRule {
  // Обязательные ключевые слова (должно быть хотя бы одно)
  requiredKeywords?: string[];
  // Бренды категории
  brands?: string[];
  // Серии/модели
  series?: string[];
  // Технические характеристики
  features?: string[];
  // Специфические аксессуары для категории
  categoryAccessories?: string[];
  // Минимальное количество признаков для автоматического одобрения
  minFeatures?: number;
  // Регексы для извлечения моделей
  modelPatterns?: RegExp[];
  // Минимальная длина названия
  minNameLength?: number;
  // Функция для кастомной проверки
  customValidator?: (query: string, productName: string) => { isValid: boolean; reason: string; confidence: number };
  // Синонимы категории
  name?: string[];
}

// Конфигурация правил для каждой категории
const CATEGORY_RULES: Record<string, CategoryRule> = {
  videocards: {
    name: ['видеокарта', 'graphics card', 'gpu'],
    brands: ['msi', 'palit', 'gigabyte', 'zotac', 'inno3d', 'asus', 'colorful', 'galax', 'maxsun', 'aorus', 'igame'],
    series: ['gaming', 'eagle', 'aorus', 'ventus', 'strix', 'tuf', 'phantom', 'x', 'xt', 'xtx', 'super', 'ultra', 'oc', 'plus'],
    features: ['rtx', 'gtx', 'rx', 'geforce', 'radeon'],
    modelPatterns: [
      /(rtx|gtx|rx)[-\s]*(\d{4})(\s*(ti|super|ultra|xt|xtx|x|g|oc|plus))?/i
    ],
    minFeatures: 2
  },
  processors: {
    name: ['процессор', 'cpu', 'processor'],
    brands: ['amd', 'intel', 'ryzen', 'xeon', 'core', 'pentium', 'celeron'],
    series: ['ryzen', 'core', 'i3', 'i5', 'i7', 'i9', 'x3d', 'hx'],
    features: ['am5', 'am4', 'lga1700', 'lga1200', 'ddr5', 'ddr4', 'cache', 'boost', 'threads', 'cores'],
    modelPatterns: [
      /9(950|900|800|700|600)X3D?/gi, // 9950X3D, 9900X3D, 9800X3D, 9700X3D, 9600X3D
      /9(950|900|800|700|600)X/gi,    // 9950X, 9900X, 9800X, 9700X, 9600X
      /9(950|900|800|700|600)HX3D?/gi, // 9955HX3D, 9955HX
      /7[5689]00x3d|7950x3d|7600x3d/gi,
      /(i[3579])-?\d{4,5}[a-z]*/i,
      /ryzen\s*([3579])\s*(\d{4})[a-z]*/i
    ],
    minFeatures: 2
  },
  motherboards: {
    name: ['материнская плата', 'motherboard'],
    brands: [
      'asus', 'msi', 'gigabyte', 'asrock', 'biostar', 'aorus', 'evga',
      'maxsun', 'ms', 'colorful', 'supermicro', 'foxconn', 'jetway', 'ecs', 'dfi', 'zotac',
      'материнская плата'
    ],
    series: [
      'gaming x', 'aorus', 'pro rs', 'steel legend', 'tomahawk', 'phantom', 'unify', 'creator',
      'tuf', 'prime', 'eagle', 'carbon', 'lightning', 'terminator', 'pro', 'ds3h', 'd3hp', 'force', 'nitro', 'riptide', 'ayw', 'battle-ax', 'plus', 'legend', 'rs', 'elite', 'frozen', 'wifi', 'ice'
    ],
    features: ['b760', 'b850', 'x870', 'z790', 'am5', 'am4', 'lga1700', 'ddr5', 'ddr4', 'pcie', 'wifi', 'bluetooth', 'usb3', 'sata', 'nvme', 'm.2']
  },
  playstation: {
    name: ['playstation', 'ps5', 'sony'],
    brands: ['sony', 'playstation'],
    series: ['standard', 'digital', 'slim', 'pro', 'edition'],
    features: ['825gb', '1tb', '4k', 'ray tracing', 'консоль'],
    minFeatures: 2,
    customValidator: (query: string, productName: string) => {
      const name = productName.toLowerCase();
      const hasPS5 = /ps\s*5|playstation\s*5/i.test(name);
      const isAccessory = /геймпад|джойстик|зарядная|кабель|чехол|сумка|наклейка|диск|игра/i.test(name);
      if (isAccessory) {
        return { isValid: false, reason: 'аксессуар', confidence: 0.9 };
      }
      if (hasPS5) {
        return { isValid: true, reason: 'консоль PS5', confidence: 0.9 };
      }
      return { isValid: false, reason: 'не консоль', confidence: 0.7 };
    }
  },
  nintendo_switch: {
    name: ['nintendo switch', 'switch', 'oled'],
    brands: ['nintendo'],
    series: ['oled', 'lite', 'standard', 'neon', 'gray'],
    features: ['консоль', '32gb', '64gb', 'игровая', 'портативная'],
    minFeatures: 2
  }
};

// Общий список чипсетов для motherboards
const ALL_MOTHERBOARD_CHIPSETS = [
  'b760', 'b850', 'z790', 'z690', 'z590', 'z490', 'z390', 'z370',
  'h610', 'h670', 'h770', 'h570', 'h470', 'h410',
  'x870', 'x670', 'x570', 'x470', 'x370',
  'b550', 'b450', 'b350', 'a520', 'a320',
  'q670', 'q570', 'q470', 'q370',
  'c621', 'c622', 'c232', 'c236', 'c246', 'c256',
  'h310', 'h110', 'h81', 'h61', 'p67', 'p55', 'g41', 'g31',
  'am5', 'am4', 'lga1700', 'lga1200', 'lga1151', 'lga1150', 'lga1155', 'lga2011', 'lga2066', 'lga1366', 'lga775',
  'socket 1700', 'socket 1200', 'socket 1151', 'socket 1150', 'socket 1155', 'socket 2011', 'socket 2066', 'socket 1366', 'socket 775'
];

@Injectable()
export class UnifiedHybridValidator {
  constructor(private readonly openaiService: OpenAiValidationService) {}

  /**
   * Единая точка входа для валидации батча товаров
   */
  async validateBatch(products: OpenAiProduct[], category: string): Promise<ValidationResult[]> {
    console.log(`🔍 [UnifiedHybrid] Валидация ${products.length} товаров категории ${category}`);
    
    // 1. Фаза предварительной фильтрации
    const prefiltered = this.prefilterProducts(products, category);
    
    // 2. Фаза детерминированной валидации
    const codeValidated = this.codeValidation(prefiltered, category, products);
    
    // 3. Сбор товаров для AI
    const toAI = this.collectForAI(codeValidated, products);
    
    // 4. AI валидация (если нужна)
    let aiResults: OpenAiValidationResult[] = [];
    if (toAI.length > 0) {
      console.log(`🤖 [UnifiedHybrid] Отправляем ${toAI.length} товаров в AI`);
      aiResults = await this.openaiService.validateProducts(toAI, category);
    }
    
    // 5. Сборка финального результата
    return this.assembleResults(products, prefiltered, codeValidated, aiResults);
  }

  /**
   * Фаза 1: Предварительная фильтрация (accessory-words, price-anomaly)
   */
  private prefilterProducts(products: OpenAiProduct[], category: string): ValidationResult[] {
    return products.map(product => {
      // Товары с уже установленным reason пропускаем
      if (product.reason) {
        return { isValid: true, reason: product.reason, confidence: 1.0 };
      }
      
      // Price anomaly товары направляем в AI
      if ((product as any).toAI === true || product.reason === 'price-anomaly') {
        return { isValid: true, reason: 'price-anomaly', confidence: 0.5 };
      }
      
      // Жёсткая фильтрация аксессуаров
      if (isAccessory(product.name)) {
        return { isValid: false, reason: 'accessory-words', confidence: 1.0 };
      }
      
      // Soft-accessory фильтрация (направляем в AI)
      if (this.isSoftAccessory(product.name, category)) {
        return { isValid: true, reason: 'soft-accessory', confidence: 0.3 };
      }
      
      return { isValid: true, reason: 'prefilter-passed', confidence: 0.5 };
    });
  }

  /**
   * Фаза 2: Детерминированная валидация по правилам категории
   */
  private codeValidation(prefiltered: ValidationResult[], category: string, products: OpenAiProduct[]): (ValidationResult | null)[] {
    const rules = CATEGORY_RULES[category];
    if (!rules) {
      console.warn(`⚠️ [UnifiedHybrid] Нет правил для категории ${category}`);
      return prefiltered.map(() => null);
    }

    return prefiltered.map((preResult, index) => {
      // Пропускаем уже обработанные
      if (!preResult.isValid || preResult.reason !== 'prefilter-passed') {
        return null;
      }

      const product = products[index];
      const result = this.validateByRules(product.query, product.name, category, rules);
      
      return result.isValid ? result : null;
    });
  }

  /**
   * Валидация по правилам категории
   */
  private validateByRules(query: string, productName: string, category: string, rules: CategoryRule): ValidationResult {
    const name = productName.toLowerCase();
    const normalizedQuery = query.toLowerCase().trim();
    let featureCount = 0;
    const foundFeatures: string[] = [];

    // name (синонимы категории)
    if (rules.name) {
      const hasName = rules.name.some(n => name.includes(n.toLowerCase()));
      if (hasName) {
        featureCount++;
        foundFeatures.push('name');
      }
    }

    // Категория (requiredKeywords) — просто один из признаков
    if (rules.requiredKeywords) {
      const hasCategory = rules.requiredKeywords.some(keyword => name.includes(keyword.toLowerCase()));
      if (hasCategory) {
        featureCount++;
        foundFeatures.push('category');
      }
    }

    // Признак: name начинается с [категория]
    const categoryStart = `[${category.replace('_', ' ')}]`;
    if (name.startsWith(categoryStart)) {
      featureCount++;
      foundFeatures.push('category-start');
    }

    // Query — отдельный признак
    if (normalizedQuery && name.includes(normalizedQuery)) {
      featureCount++;
      foundFeatures.push('query');
    }

    // Brand
    if (rules.brands) {
      const foundBrand = rules.brands.find(brand => name.includes(brand.toLowerCase()));
      if (foundBrand) {
        featureCount++;
        foundFeatures.push('brand');
      }
    }

    // Series
    if (rules.series) {
      const foundSeries = rules.series.find(series => name.includes(series.toLowerCase()));
      if (foundSeries) {
        featureCount++;
        foundFeatures.push('series');
      }
    }

    // Features
    if (rules.features) {
      const foundFeature = rules.features.find(feature => name.includes(feature.toLowerCase()));
      if (foundFeature) {
        featureCount++;
        foundFeatures.push('feature');
      }
    }

    // Model patterns
    if (rules.modelPatterns) {
      const hasModel = rules.modelPatterns.some(pattern => pattern.test(name));
      if (hasModel) {
        featureCount++;
        foundFeatures.push('model');
      }
    }

    // --- ПРОВЕРКА НА КОНФЛИКТУЮЩИЕ ЧИПСЕТЫ ДО ВСЕГО ОСТАЛЬНОГО ---
    if (category === 'motherboards') {
      const nameLower = name.toLowerCase();
      const presentChipsets = ALL_MOTHERBOARD_CHIPSETS.filter(cs => nameLower.includes(cs));
      if (presentChipsets.length > 1) {
        return {
          isValid: false,
          reason: `conflicting-chipsets (${presentChipsets.join(', ')})`,
          confidence: 1.0
        };
      }
      // --- Проверка: чипсет из query должен быть в названии ---
      const queryChipset = ALL_MOTHERBOARD_CHIPSETS.find(cs => normalizedQuery.includes(cs));
      if (queryChipset && !nameLower.includes(queryChipset)) {
        return {
          isValid: false,
          reason: `no-query-chipset-in-name (${queryChipset})`,
          confidence: 1.0
        };
      }
    }

    // Минимальное количество совпадений для валидности (по умолчанию 2)
    const minFeatures = rules.minFeatures ?? 2;
    if (featureCount >= minFeatures) {
      return {
        isValid: true,
        reason: `code-validated (${foundFeatures.join(', ')})`,
        confidence: Math.min(0.95, 0.5 + featureCount * 0.1)
      };
    }
    // Если мало признаков и короткое название — всегда отправлять в AI
    if (featureCount < minFeatures && name.length < 10) {
      console.log(`[NOT VALID] name: '${productName}', featureCount: ${featureCount}, found: [${foundFeatures.join(', ')}], reason: too-short-for-auto-validation`);
      return {
        isValid: false,
        reason: `too-short-for-auto-validation (${foundFeatures.join(', ')})`,
        confidence: 0.2
      };
    }
    if (featureCount === 1) {
      console.log(`[NOT VALID] name: '${productName}', featureCount: ${featureCount}, found: [${foundFeatures.join(', ')}], reason: soft-insufficient-features`);
      return {
        isValid: false,
        reason: `soft-insufficient-features (${foundFeatures.join(', ')})`,
        confidence: 0.5
      };
    }
    console.log(`[NOT VALID] name: '${productName}', featureCount: ${featureCount}, found: [${foundFeatures.join(', ')}], reason: insufficient-features`);
    return {
      isValid: false,
      reason: 'insufficient-features',
      confidence: 0.3
    };
  }

  /**
   * Проверка на soft-accessory
   */
  private isSoftAccessory(productName: string, category: string): boolean {
    const rules = CATEGORY_RULES[category];
    if (!rules?.categoryAccessories) return false;
    
    const name = productName.toLowerCase();
    return rules.categoryAccessories.some(word => name.includes(word.toLowerCase()));
  }

  /**
   * Сбор товаров для AI валидации
   */
  private collectForAI(codeValidated: (ValidationResult | null)[], products: OpenAiProduct[]): OpenAiProduct[] {
    const toAI: OpenAiProduct[] = [];
    
    codeValidated.forEach((result, index) => {
      const product = products[index];
      
      // Направляем в AI если:
      // 1. Price anomaly
      // 2. Soft accessory
      // 3. Недостаточно признаков для code validation
      if (
        (product as any).toAI === true ||
        product.reason === 'price-anomaly' ||
        result === null || // code validation не прошла
        (result && ['price-anomaly', 'soft-accessory', 'insufficient-features'].includes(result.reason))
      ) {
        toAI.push(product);
      }
    });
    
    return toAI;
  }

  /**
   * Сборка финального результата
   */
  private assembleResults(
    products: OpenAiProduct[],
    prefiltered: ValidationResult[],
    codeValidated: (ValidationResult | null)[],
    aiResults: OpenAiValidationResult[]
  ): any[] {
    let aiIndex = 0;
    
    return products.map((product, index) => {
      const preResult = prefiltered[index];
      const codeResult = codeValidated[index];
      
      // Если товар забракован на предфильтрации
      if (!preResult.isValid) {
        return { ...product, ...preResult };
      }
      
      // Если товар прошёл code validation
      if (codeResult && codeResult.isValid) {
        return { ...product, ...codeResult };
      }
      
      // Если товар должен пройти AI валидацию
      if (
        preResult.reason === 'price-anomaly' ||
        preResult.reason === 'soft-accessory' ||
        !codeResult
      ) {
        const aiResult = aiResults[aiIndex++];
        return {
          ...product,
          isValid: aiResult.isValid,
          reason: 'ai-validated',
          aiReason: aiResult.reason || '',
          confidence: 0.8
        };
      }
      
      // Fallback - не прошёл валидацию
      return { ...product, isValid: false, reason: 'validation-failed', confidence: 0.3 };
    });
  }

  /**
   * Простая валидация одного товара (для обратной совместимости)
   */
  validate(query: string, productName: string, category: string): ValidationResult {
    const rules = CATEGORY_RULES[category];
    if (!rules) {
      // Fallback к простой проверке
      const isValid = productName.toLowerCase().includes(query.toLowerCase());
      return {
        isValid,
        reason: isValid ? 'простая проверка' : 'не содержит запрос',
        confidence: 0.5
      };
    }
    
    return this.validateByRules(query, productName, category, rules);
  }
} 