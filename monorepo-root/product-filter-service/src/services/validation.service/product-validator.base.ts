import { Injectable, Logger } from '@nestjs/common';

export enum ValidationReason {
  PrefilterPassed = 'prefilter-passed',
  AccessoryWords = 'accessory-words',
  Accessory = 'accessory',
  SoftAccessory = 'soft-accessory',
  CodeValidated = 'code-validated',
  SoftInsufficientFeatures = 'soft-insufficient-features',
  InsufficientFeatures = 'insufficient-features',
  ConflictingChipsets = 'conflicting-chipsets',
  NoQueryChipsetInName = 'no-query-chipset-in-name',
  ValidationFailed = 'validation-failed',
}

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  confidence?: number;
}

export interface ValidationRules {
  chipsets?: string[];
  modelPatterns?: RegExp[];
  accessoryWords?: string[];
  minNameLength?: number;
  price?: number;
  product?: any;
  customValidator?: (query: string, name: string, rules: any) => ValidationResult;
}

export type ProductCategory = 'motherboards' | 'processors' | 'videocards' | 'playstation' | 'nintendo_switch' | 'steam_deck' | 'iphone';

@Injectable()
export abstract class ProductValidatorBase {
  protected readonly logger = new Logger(this.constructor.name);

  constructor() {
    this.logger.log(`🚀 Инициализация валидатора: ${this.constructor.name}`);
  }

  /**
   * Нормализатор строки - приводит к нижнему регистру
   */
  protected normalizeToLower(str: string): string {
    return str.toLowerCase();
  }

  /**
   * Нормализатор убирания пробелов - приводит к нижнему регистру и убирает все пробелы
   */
  protected normalizeForQuery(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Функция проверки аксессуаров
   */
  protected isAccessory(name: string, accessoryWords: string[]): boolean {
    const normalizedName = this.normalizeToLower(name);
    return accessoryWords.some(word => normalizedName.includes(word.toLowerCase()));
  }

  /**
   * Извлечение моделей из названия продукта по паттернам
   */
  protected extractModels(name: string, patterns: RegExp[]): string[] {
    const models = patterns
      .flatMap((pattern: RegExp) => {
        const found: string[] = [];
        const regex = new RegExp(pattern, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
        let match;
        while ((match = regex.exec(name)) !== null) {
          if (match.length > 1 && match[match.length - 1]) {
            found.push(match[match.length - 1]);
          } else if (match[0]) {
            found.push(match[0]);
          }
        }
        return found;
      })
      .map(m => this.normalizeForQuery(m));
    
    return Array.from(new Set(models)).filter(Boolean);
  }

  /**
   * Проверка соответствия модели
   */
  protected validateModelMatch(query: string, models: string[]): ValidationResult {
    const normQuery = this.normalizeForQuery(query.replace(/[-\s]+/g, ''));
    
    if (
      !models.includes(normQuery) ||
      models.some(m => typeof m === 'string' && m !== normQuery && !normQuery.startsWith(m))
    ) {
      return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
    }
    
    return { isValid: true, reason: 'model-match', confidence: 0.95 };
  }

  /**
   * Абстрактный метод для получения правил категории
   */
  protected abstract getCategoryRules(category: string): ValidationRules;

  /**
   * Абстрактный метод для кастомной валидации
   */
  protected abstract customValidation(query: string, name: string, rules: ValidationRules): ValidationResult;

  /**
   * Основной метод валидации батча продуктов
   */
  async validateBatch(products: any[], category: string): Promise<ValidationResult[]> {
    const prefiltered = this.prefilterProducts(products, category);
    const rules = this.getCategoryRules(category);
    
    if (!rules) {
      this.logger.warn(`⚠️ Нет правил для категории ${category}`);
      return prefiltered.map(() => ({ isValid: false, reason: 'no-rules', confidence: 0 }));
    }

    return prefiltered.map((preResult, index) => {
      const product = products[index];
      
      // Если префильтрация уже определила результат, возвращаем его
      if (preResult.reason !== ValidationReason.PrefilterPassed) {
        return preResult;
      }
      
      // Иначе выполняем кастомную валидацию
      return this.customValidation(product.query, product.name, { ...rules, price: product.price, product });
    });
  }

  /**
   * Валидация одиночного продукта
   */
  async validateSingleProduct(query: string, productName: string, category: string): Promise<ValidationResult> {
    const [result] = await this.validateBatch([
      { query, name: productName, price: 0 }
    ], category);
    return result;
  }

  /**
   * Группирует продукты по query и валидирует каждый батч
   */
  async groupAndValidateByQuery(products: any[], category: ProductCategory): Promise<ValidationResult[]> {
    const byQuery: Record<string, any[]> = {};
    
    for (const product of products) {
      const q = product.query || '';
      if (!byQuery[q]) byQuery[q] = [];
      byQuery[q].push(product);
    }
    
    const allResults = await Promise.all(
      Object.entries(byQuery).map(async ([query, items]) => {
        return this.validateBatch(items, category);
      })
    );
    
    return allResults.flat();
  }

  /**
   * Префильтрация продуктов
   */
  protected prefilterProducts(products: any[], category: string): ValidationResult[] {
    return products.map(product => {
      // Если у продукта уже есть причина, возвращаем её
      if (product.reason) {
        return { isValid: true, reason: product.reason, confidence: 1.0 };
      }
      
      return { isValid: true, reason: ValidationReason.PrefilterPassed, confidence: 0.5 };
    });
  }
} 