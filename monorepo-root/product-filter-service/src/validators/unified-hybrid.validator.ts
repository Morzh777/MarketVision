/**
 * UnifiedHybridValidator
 * ----------------------
 * Универсальный валидатор товаров для агрегатора (материнские платы, видеокарты и др.).
 * Использует каскадную стратегию: prefilter → code validation → AI validation.
 * - Строго типизирован.
 * - Логика feature extraction и accessory detection вынесена в отдельные методы.
 * - Использует best practices TypeScript/NestJS.
 * - Легко расширяем для новых категорий.
 *
 * @see VALIDATION_ARCHITECTURE_V2.md
 */

import { Injectable, Logger } from '@nestjs/common';
import { OpenAiValidationService, OpenAiProduct, OpenAiValidationResult } from '../services/openai.service';

/**
 * Причины (reasons) для статуса валидации товара.
 */
export enum ValidationReason {
  PrefilterPassed = 'prefilter-passed',
  PriceAnomaly = 'price-anomaly',
  AccessoryWords = 'accessory-words',
  SoftAccessory = 'soft-accessory',
  CodeValidated = 'code-validated',
  TooShort = 'too-short-for-auto-validation',
  SoftInsufficientFeatures = 'soft-insufficient-features',
  InsufficientFeatures = 'insufficient-features',
  ConflictingChipsets = 'conflicting-chipsets',
  NoQueryChipsetInName = 'no-query-chipset-in-name',
  AiValidated = 'ai-validated',
  ValidationFailed = 'validation-failed',
}

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  aiReason?: string;
  confidence?: number;
}

export interface CategoryRule {
  readonly requiredKeywords?: readonly string[];
  readonly brands?: readonly string[];
  readonly series?: readonly string[];
  readonly features?: readonly string[];
  readonly categoryAccessories?: readonly string[];
  readonly minFeatures?: number;
  readonly modelPatterns?: readonly RegExp[];
  readonly minNameLength?: number;
  readonly customValidator?: (query: string, productName: string) => { isValid: boolean; reason: string; confidence: number };
  readonly name?: readonly string[];
}

/**
 * Категорийные правила для валидации товаров.
 * Используйте `as const` для автокомплита и иммутабельности.
 */
export const CATEGORY_RULES = {
  videocards: {
    name: ['видеокарта', 'graphics card', 'gpu'],
    brands: ['msi', 'palit', 'gigabyte', 'zotac', 'inno3d', 'asus', 'colorful', 'galax', 'maxsun', 'aorus', 'igame'],
    series: ['gaming', 'eagle', 'aorus', 'ventus', 'strix', 'tuf', 'phantom', 'x', 'xt', 'xtx', 'super', 'ultra', 'oc', 'plus'],
    features: ['rtx', 'gtx', 'rx', 'geforce', 'radeon'],
    modelPatterns: [
      /(rtx|gtx|rx)[-\s]*(\d{4})(\s*(ti|super|ultra|xt|xtx|x|g|oc|plus))?/i
    ],
    minFeatures: 1
  },
  processors: {
    name: ['процессор', 'cpu', 'processor'],
    brands: ['amd', 'intel', 'ryzen', 'xeon', 'core', 'pentium', 'celeron'],
    series: ['ryzen', 'core', 'i3', 'i5', 'i7', 'i9', 'x3d', 'hx'],
    features: ['am5', 'am4', 'lga1700', 'lga1200', 'ddr5', 'ddr4', 'cache', 'boost', 'threads', 'cores'],
    modelPatterns: [
      /9(950|900|800|700|600)X3D?/gi,
      /9(950|900|800|700|600)X/gi,
      /9(950|900|800|700|600)HX3D?/gi,
      /7[5689]00x3d|7950x3d|7600x3d/gi,
      /(i[3579])-?\d{4,5}[a-z]*/i,
      /ryzen\s*([3579])\s*(\d{4})[a-z]*/i
    ],
    minFeatures: 1
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
    features: ['ddr5', 'ddr4', 'pcie', 'wifi', 'bluetooth', 'usb3', 'sata', 'nvme', 'm.2']
  },
  playstation: {
    name: ['playstation', 'ps5', 'sony'],
    brands: ['sony', 'playstation'],
    series: ['standard', 'digital', 'slim', 'pro', 'edition'],
    features: ['825gb', '1tb', '4k', 'ray tracing', 'консоль'],
    minFeatures: 1,
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
    minFeatures: 1
  }
} as const;

/**
 * Список настоящих чипсетов для motherboards (только для проверки конфликтов).
 */
const MOTHERBOARD_CHIPSETS = [
  // Intel (LGA 1851, Arrow Lake, Panther Lake)
  'z990', // возможный преемник Z890 для Panther Lake
  'z890', // флагманский чипсет для Arrow Lake-S (15-го поколения)
  'z790', // актуальный флагман Intel
  'b860', // средний уровень
  'b850', // средний уровень (добавлен для совместимости с AMD B850)
  'b760', // актуальный средний Intel
  'h810', // бюджетный вариант
  'w880', // рабочие станции
  'b760m',
  'b760m-k',
  // AMD (AM5, Ryzen 9000/10000)
  'x950',  // возможный новый чипсет для Ryzen "Zen 6"
  'x870e', // топовый чипсет для Ryzen 9000 (Zen 5)
  'x870',  // топовый чипсет для Ryzen 9000 (Zen 5)
  'a820',  // бюджетный вариант
] as const;

/**
 * Список платформ/сокетов (не участвуют в конфликте чипсетов).
 */
const MOTHERBOARD_PLATFORMS = [
  'am5', 'am4', 'lga1700', 'lga1200', 'lga1151', 'lga1150', 'lga1155', 'lga2011', 'lga2066', 'lga1366', 'lga775',
  'socket 1700', 'socket 1200', 'socket 1151', 'socket 1150', 'socket 1155', 'socket 2011', 'socket 2066', 'socket 1366', 'socket 775'
] as const;

@Injectable()
export class UnifiedHybridValidator {
  private readonly logger = new Logger(UnifiedHybridValidator.name);

  constructor(private readonly openaiService: OpenAiValidationService) {}

  /**
   * Валидация батча товаров.
   * @param products - Список товаров для валидации.
   * @param category - Категория товаров.
   * @returns Promise<ReadonlyArray<ValidationResult>>
   */
  async validateBatch(
    products: ReadonlyArray<OpenAiProduct>,
    category: keyof typeof CATEGORY_RULES
  ): Promise<ReadonlyArray<ValidationResult>> {
    this.logger.debug(`🔍 [UnifiedHybrid] Валидация ${products.length} товаров категории ${category}`);
    const prefiltered = this.prefilterProducts(products, category);
    const codeValidated = this.codeValidation(prefiltered, category, products);
    const toAI = this.collectForAI(codeValidated, products);
    let aiResults: OpenAiValidationResult[] = [];
    if (toAI.length > 0) {
      this.logger.debug(`🤖 [UnifiedHybrid] Отправляем ${toAI.length} товаров в AI`);
      aiResults = await this.openaiService.validateProducts(toAI, category);
    }
    return this.assembleResults(products, prefiltered, codeValidated, aiResults);
  }

  /**
   * Фаза 1: Предварительная фильтрация (accessory-words, price-anomaly)
   */
  private prefilterProducts(products: ReadonlyArray<OpenAiProduct>, category: string): ValidationResult[] {
    return products.map(product => {
      if (product.reason) {
        return { isValid: true, reason: product.reason, confidence: 1.0 };
      }
      if ((product as any).toAI === true || product.reason === ValidationReason.PriceAnomaly) {
        return { isValid: true, reason: ValidationReason.PriceAnomaly, confidence: 0.5 };
      }
      if (this.isAccessory(product.name)) {
        return { isValid: false, reason: ValidationReason.AccessoryWords, confidence: 1.0 };
      }
      if (this.isSoftAccessory(product.name, category)) {
        return { isValid: true, reason: ValidationReason.SoftAccessory, confidence: 0.3 };
      }
      return { isValid: true, reason: ValidationReason.PrefilterPassed, confidence: 0.5 };
    });
  }

  /**
   * Фаза 2: Детерминированная валидация по правилам категории
   */
  private codeValidation(prefiltered: ValidationResult[], category: string, products: ReadonlyArray<OpenAiProduct>): (ValidationResult | null)[] {
    const rules = CATEGORY_RULES[category as keyof typeof CATEGORY_RULES];
    if (!rules) {
      this.logger.warn(`⚠️ [UnifiedHybrid] Нет правил для категории ${category}`);
      return prefiltered.map(() => null);
    }
    return prefiltered.map((preResult, index) => {
      if (!preResult.isValid || preResult.reason !== ValidationReason.PrefilterPassed) {
        return null;
      }
      const product = products[index];
      const result = this.validateByRules(product.query, product.name, category, rules);
      return result.isValid ? result : null;
    });
  }

  /**
   * Валидация по правилам категории
   * @param query - поисковый запрос
   * @param productName - название товара
   * @param category - категория
   * @param rules - правила категории
   */
  private validateByRules(query: string, productName: string, category: string, rules: CategoryRule): ValidationResult {
    const name = productName.toLowerCase();
    const normalizedQuery = query.toLowerCase().trim();

    // name (синонимы категории)
    if (rules.name) {
      const hasName = rules.name.some(n => name.includes(n.toLowerCase()));
      if (hasName) {
        // featureCount++; // Removed
        // foundFeatures.push('name'); // Removed
      }
    }
    // Исключение: если название полностью совпадает с query, считаем валидным
    if (name === normalizedQuery) {
      return {
        isValid: true,
        reason: `${ValidationReason.CodeValidated} (exact-query-match)`,
        confidence: 0.95
      };
    }
    if (rules.requiredKeywords) {
      const hasCategory = rules.requiredKeywords.some(keyword => name.includes(keyword.toLowerCase()));
      if (hasCategory) {
        // featureCount++; // Removed
        // foundFeatures.push('category'); // Removed
      }
    }
    const categoryStart = `[${category.replace('_', ' ')}]`;
    if (name.startsWith(categoryStart)) {
      // featureCount++; // Removed
      // foundFeatures.push('category-start'); // Removed
    }
    if (normalizedQuery && name.includes(normalizedQuery)) {
      // featureCount++; // Removed
      // foundFeatures.push('query'); // Removed
    }
    if (rules.brands) {
      const foundBrand = rules.brands.find(brand => name.includes(brand.toLowerCase()));
      if (foundBrand) {
        // featureCount++; // Removed
        // foundFeatures.push('brand'); // Removed
      }
    }
    if (rules.series) {
      const foundSeries = rules.series.find(series => name.includes(series.toLowerCase()));
      if (foundSeries) {
        // featureCount++; // Removed
        // foundFeatures.push('series'); // Removed
      }
    }
    if (rules.features) {
      const foundFeature = rules.features.find(feature => name.includes(feature.toLowerCase()));
      if (foundFeature) {
        // featureCount++; // Removed
        // foundFeatures.push('feature'); // Removed
      }
    }
    if (rules.modelPatterns) {
      const hasModel = rules.modelPatterns.some(pattern => pattern.test(name));
      if (hasModel) {
        // featureCount++; // Removed
        // foundFeatures.push('model'); // Removed
      }
    }
    // --- ГЛОБАЛЬНАЯ ВАЛИДАЦИЯ ДЛЯ ВСЕХ КАТЕГОРИЙ ---
    const nameLower = name.toLowerCase();
    // Простая нормализация: убираем пробелы и дефисы, приводим к нижнему регистру
    function normalizeForQuery(str: string): string {
      return str.toLowerCase().replace(/\s+/g, '');
    }
    const normQuery = normalizeForQuery(query);
    const normName = normalizeForQuery(productName);
    if (!normName.includes(normQuery)) {
      return {
        isValid: false,
        reason: 'no-query-match',
        confidence: 0.1
      };
    }
    // Проверка duplicate-chipset-in-name только для motherboards
    if (category === 'motherboards') {
      const allChipsetMatches = [];
      const regexAll = new RegExp(normQuery, 'gi');
      let match;
      while ((match = regexAll.exec(normName)) !== null) {
        allChipsetMatches.push(match[0]);
      }
      if (allChipsetMatches.length > 1) {
        return {
          isValid: false,
          reason: `duplicate-chipset-in-name (${query})`,
          confidence: 1.0
        };
      }
    }
    // 2. Проверка на конфликт чипсетов только для motherboards
    if (category === 'motherboards') {
      const sortedChipsets = [...(MOTHERBOARD_CHIPSETS as readonly string[])].sort((a, b) => b.length - a.length);
      const foundChipsets: string[] = [];
      let nameForChipset = nameLower;
      for (const cs of sortedChipsets) {
        const regex = new RegExp(`\\b${cs}\\b`, 'i');
        if (regex.test(nameForChipset)) {
          foundChipsets.push(cs);
          nameForChipset = nameForChipset.replace(regex, ' '.repeat(cs.length));
        }
      }
      const presentChipsets = Array.from(new Set(foundChipsets));
      if (presentChipsets.length > 1) {
        return {
          isValid: false,
          reason: `${ValidationReason.ConflictingChipsets} (${presentChipsets.join(', ')})`,
          confidence: 1.0
        };
      }
    }
    // 3. Если query найден (и нет конфликта для motherboards) — валиден
    return {
      isValid: true,
      reason: `${ValidationReason.CodeValidated} (query)`,
      confidence: 0.95
    };
  }

  /**
   * Проверка на soft-accessory
   */
  private isSoftAccessory(productName: string, category: string): boolean {
    const rules = CATEGORY_RULES[category as keyof typeof CATEGORY_RULES];
    if (!rules || !('categoryAccessories' in rules) || !rules.categoryAccessories) return false;
    const name = productName.toLowerCase();
    return (rules.categoryAccessories as readonly string[]).some(word => name.includes(word.toLowerCase()));
  }

  /**
   * Проверка на accessory по ключевым словам (универсальная, для всех категорий)
   */
  private isAccessory(name: string): boolean {
    const norm = name.toLowerCase();
    // Универсальный список accessory-слов (можно расширять)
    const ACCESSORY_WORDS = [
      'кабель', 'переходник', 'адаптер', 'заглушка', 'радиатор', 'брелок', 'наклейка', 'чехол', 'сумка', 'подставка',
      'заглушка', 'заглушки', 'заглушек', 'заглушку', 'заглушкой', 'заглушками',
      'провод', 'разветвитель', 'удлинитель', 'плата расширения', 'контроллер', 'держатель', 'крепление',
      'пылевой фильтр', 'фильтр', 'заглушка', 'заглушки', 'заглушек', 'заглушку', 'заглушкой', 'заглушками',
      'наклейка', 'наклейки', 'наклеек', 'наклейку', 'наклейкой', 'наклейками',
      'радиатор', 'радиаторы', 'радиаторов', 'радиатору', 'радиатором', 'радиаторами',
      'переходник', 'переходники', 'переходников', 'переходнику', 'переходником', 'переходниками',
      'адаптер', 'адаптеры', 'адаптеров', 'адаптеру', 'адаптером', 'адаптерами',
      'кабель', 'кабели', 'кабелей', 'кабелю', 'кабелем', 'кабелями',
      'провод', 'провода', 'проводов', 'проводу', 'проводом', 'проводами',
      'контроллер', 'контроллеры', 'контроллеров', 'контроллеру', 'контроллером', 'контроллерами',
      'держатель', 'держатели', 'держателей', 'держателю', 'держателем', 'держателями',
      'крепление', 'крепления', 'креплений', 'креплению', 'креплением', 'креплениями',
      'пылевой фильтр', 'фильтр', 'фильтры', 'фильтров', 'фильтру', 'фильтром', 'фильтрами',
      'брелок', 'брелоки', 'брелоков', 'брелоку', 'брелоком', 'брелоками',
      'чехол', 'чехлы', 'чехлов', 'чехлу', 'чехлом', 'чехлами',
      'сумка', 'сумки', 'сумок', 'сумке', 'сумкой', 'сумками',
      'подставка', 'подставки', 'подставок', 'подставке', 'подставкой', 'подставками',
      'заглушка', 'заглушки', 'заглушек', 'заглушку', 'заглушкой', 'заглушками',
      'геймпад', 'джойстик', 'зарядная', 'диск', 'игра', 'наклейка', 'наклейки', 'наклеек', 'наклейку', 'наклейкой', 'наклейками'
    ];
    return ACCESSORY_WORDS.some(word => norm.includes(word));
  }

  /**
   * Сбор товаров для AI валидации
   */
  private collectForAI(codeValidated: (ValidationResult | null)[], products: ReadonlyArray<OpenAiProduct>): OpenAiProduct[] {
    const toAI: OpenAiProduct[] = [];
    codeValidated.forEach((result, index) => {
      const product = products[index];
      if (
        product.reason === ValidationReason.PriceAnomaly ||
        result === null ||
        (result && [ValidationReason.PriceAnomaly, ValidationReason.SoftAccessory, ValidationReason.InsufficientFeatures].includes(result.reason as ValidationReason))
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
    products: ReadonlyArray<OpenAiProduct>,
    prefiltered: ValidationResult[],
    codeValidated: (ValidationResult | null)[],
    aiResults: OpenAiValidationResult[]
  ): any[] {
    let aiIndex = 0;
    return products.map((product, index) => {
      const preResult = prefiltered[index];
      const codeResult = codeValidated[index];
      if (!preResult.isValid) {
        return { ...product, ...preResult };
      }
      if (codeResult && codeResult.isValid) {
        return { ...product, ...codeResult };
      }
      if (
        preResult.reason === ValidationReason.PriceAnomaly ||
        preResult.reason === ValidationReason.SoftAccessory ||
        !codeResult
      ) {
        const aiResult = aiResults[aiIndex++];
        return {
          ...product,
          isValid: aiResult.isValid,
          reason: ValidationReason.AiValidated,
          aiReason: aiResult.reason || '',
          confidence: 0.8
        };
      }
      return { ...product, isValid: false, reason: ValidationReason.ValidationFailed, confidence: 0.3 };
    });
  }

  /**
   * Простая валидация одного товара (для обратной совместимости)
   */
  validate(query: string, productName: string, category: string): ValidationResult {
    const rules = CATEGORY_RULES[category as keyof typeof CATEGORY_RULES];
    if (!rules) {
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