import { Injectable, Logger } from '@nestjs/common';

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  confidence?: number;
}

export interface ValidationCheck {
  passed: boolean;
  reason: string;
  confidence: number;
}

export interface ValidationRules {
  accessoryWords?: string[];
  minNameLength?: number;
  price?: number;
  product?: any;
  recommendedPrice?: number;
  dynamicTolerance?: number;
}

export interface StrictTokenMatchOptions {
  disallowPrevAlnum?: boolean;
  disallowNextLetter?: boolean;
}

export type ProductCategory = string;

@Injectable()
export abstract class ProductValidatorBase {
  protected readonly logger = new Logger(this.constructor.name);

  constructor() {
    this.logger.log(`🚀 Инициализация валидатора: ${this.constructor.name}`);
  }

  // ===== ОСНОВНЫЕ МЕТОДЫ ВАЛИДАЦИИ =====

  /**
   * Универсальный метод валидации - каждая категория реализует свою логику
   */
  protected abstract validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult;

  /**
   * Стандартная логика валидации - может быть переиспользована в кастомных валидаторах
   */
  protected validateProductStandard(query: string, name: string, rules: ValidationRules): ValidationResult {
    this.logValidation(query, name);

    const normalizedName = this.normalize(name);
    const normalizedQuery = this.normalize(query);

    const checks: ValidationCheck[] = [];

    // Проверка на аксессуары
    if (rules.accessoryWords && this.isAccessory(normalizedName, rules.accessoryWords)) {
      checks.push({ passed: false, reason: 'accessory', confidence: 0.9 });
    } else {
      checks.push({ passed: true, reason: 'not-accessory', confidence: 0.9 });
    }

    // Проверка множественных моделей отключена
    checks.push({ passed: true, reason: 'single-model', confidence: 0.9 });

    // Проверка соответствия запроса
    if (!this.validateNameQueryMatch(normalizedName, normalizedQuery)) {
      checks.push({ passed: false, reason: 'no-match', confidence: 0.7 });
    } else {
      checks.push({ passed: true, reason: 'query-match', confidence: 0.8 });
    }

    // Проверка других моделей от наследников
    const otherModels = this.getOtherModels();
    if (otherModels.length > 0) {
      const categoryName = this.getValidatorCategory();
      const otherModelsChecks = this.checkOtherModels(normalizedQuery, normalizedName, otherModels, categoryName);
      checks.push(...otherModelsChecks);
    }

    // Проверка цены по рекомендованной цене с динамической толерантностью
    if (rules.recommendedPrice && rules.product?.price) {
      const tolerance = rules.dynamicTolerance || 0.3; // используем динамическую толерантность или 30% по умолчанию
      const priceCheck = this.validatePriceByRecommended(rules.product.price, rules.recommendedPrice, tolerance);
      checks.push(priceCheck);
    }

    // Анализируем результаты всех проверок
    return this.analyzeValidationChecks(checks);
  }

  /**
   * Валидация одного продукта
   */
  async validateSingleProduct(query: string, productName: string, category: string, product?: any, adaptedPriceData?: { price: number; tolerance: number }): Promise<ValidationResult> {
    const rules = this.getCategoryRules(category);
    if (!rules) {
      return this.createResult(false, 'unknown-category', 0.1);
    }
    
    // Добавляем адаптированную цену, толерантность и продукт в правила
    const enhancedRules = {
      ...rules,
      recommendedPrice: adaptedPriceData?.price,
      dynamicTolerance: adaptedPriceData?.tolerance,
      product
    };
    
    // Важно: используем категорийную реализацию, а не всегда стандартную
    return this.validateProduct(query, productName, enhancedRules);
  }

  /**
   * Группировка и валидация продуктов по запросу
   */
  async groupAndValidateByQuery(products: any[], category: string, adaptedPrices?: Map<string, { price: number; tolerance: number }>): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const product of products) {
      const query = product.query;
      const name = product.name;
      
      if (!query || !name) {
        results.push(this.createResult(false, 'missing-query-or-name', 0.1));
        continue;
      }
      
      // Получаем адаптированную цену и толерантность для этого запроса
      const adaptedPriceData = adaptedPrices?.get(query);
      
      const result = await this.validateSingleProduct(query, name, category, product, adaptedPriceData);
      results.push(result);
    }
    
    return results;
  }

  // ===== АБСТРАКТНЫЕ МЕТОДЫ ДЛЯ НАСЛЕДНИКОВ =====

  /**
   * Получение правил категории - каждая категория определяет свои правила
   */
  protected abstract getCategoryRules(category: string): ValidationRules;

  /**
   * Получить категорию, которую обрабатывает этот валидатор
   */
  protected abstract getValidatorCategory(): string;

  /**
   * Получить список других моделей для проверки - переопределяется в наследниках
   * @returns массив других моделей или пустой массив
   */
  protected getOtherModels(): string[] {
    return [];
  }

  // ===== УТИЛИТЫ ДЛЯ ВАЛИДАЦИИ =====

  /**
   * Универсальная нормализация строки - убирает пробелы и приводит к нижнему регистру
   */
  protected normalize(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '');
  }

  /**
   * Строгая проверка наличия токена в названии.
   * Условия по умолчанию:
   *  - перед токеном не должно быть буквы/цифры
   *  - сразу после токена не должно быть буквы ("B760M" не пройдёт для запроса "B760")
   */
  protected isStrictTokenMatch(
    productName: string,
    token: string,
    options: StrictTokenMatchOptions = { disallowPrevAlnum: true, disallowNextLetter: true }
  ): boolean {
    const nameLower = productName.toLowerCase();
    const queryToken = token.toLowerCase().trim();

    const idx = nameLower.indexOf(queryToken);
    if (idx === -1) return false;

    const prevChar = idx > 0 ? nameLower[idx - 1] : '';
    const nextChar = idx + queryToken.length < nameLower.length ? nameLower[idx + queryToken.length] : '';

    if (options.disallowPrevAlnum && /[a-z0-9]/.test(prevChar)) {
      return false;
    }

    if (options.disallowNextLetter && /[a-z]/.test(nextChar)) {
      return false;
    }

    return true;
  }

  /**
   * Проверка соответствия названия и запроса - точное совпадение
   */
  protected validateNameQueryMatch(normalizedName: string, normalizedQuery: string): boolean {
    return normalizedName.includes(normalizedQuery);
  }

  /**
   * Проверка на товары с несколькими моделями или сравнениями
   * Исключает товары с символами: ≈, ~, vs, или, or
   * НЕ исключает повторения одной модели (5070 5070) или описательные слова
   */
  protected hasMultipleModels(normalizedName: string): boolean {
    const comparisonPatterns = [
      '≈', '~', 'vs', 'или', 'or', 'vs.', 'сравн', 'comparison',
      'аналог', 'как', 'like', 'подобн', 'similar', 'против', 'against'
    ];
    
    return comparisonPatterns.some(pattern => 
      normalizedName.includes(this.normalize(pattern))
    );
  }

  /**
   * Проверка на аксессуары - входные данные: нормализованная строка названия и массив слов аксессуаров
   */
  protected isAccessory(normalizedName: string, accessoryWords: string[]): boolean {
    return accessoryWords.some(word => normalizedName.includes(this.normalize(word)));
  }

  /**
   * Универсальная проверка на другие модели продукта
   * @param normalizedQuery - нормализованный запрос
   * @param normalizedName - нормализованное название
   * @param otherModels - список других моделей для проверки
   * @returns true если найдена другая модель
   */
  protected hasOtherModel(normalizedQuery: string, normalizedName: string, otherModels: string[]): boolean {
    return otherModels.some(model => 
      model !== normalizedQuery && 
      !normalizedQuery.includes(model) && 
      normalizedName.includes(model)
    );
  }


  /**
   * Универсальная проверка других моделей с автоматическим созданием ValidationCheck
   * @param normalizedQuery - нормализованный запрос
   * @param normalizedName - нормализованное название
   * @param otherModels - список других моделей для проверки
   * @param categoryName - название категории для reason
   * @returns ValidationCheck массив
   */
  protected checkOtherModels(
    normalizedQuery: string, 
    normalizedName: string, 
    otherModels: string[], 
    categoryName: string
  ): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    if (this.hasOtherModel(normalizedQuery, normalizedName, otherModels)) {
      checks.push({ 
        passed: false, 
        reason: `other-${categoryName}-model`, 
        confidence: 0.9 
      });
    } else {
      checks.push({ 
        passed: true, 
        reason: `no-other-${categoryName}-models`, 
        confidence: 0.9 
      });
    }

    return checks;
  }

  /**
   * Валидация цены по рекомендованной цене с динамическим допуском
   * @param productPrice - цена продукта
   * @param recommendedPrice - рекомендованная цена
   * @param tolerance - допуск в процентах (0.3 = 30%)
   * @returns ValidationCheck результат проверки
   */
  protected validatePriceByRecommended(productPrice: number, recommendedPrice: number, tolerance: number = 0.3): ValidationCheck {
    const minPrice = recommendedPrice * (1 - tolerance);
    const maxPrice = recommendedPrice * (1 + tolerance);

    const isWithinRange = productPrice >= minPrice && productPrice <= maxPrice;
    
    if (isWithinRange) {
      return {
        passed: true,
        reason: 'price-within-recommended-range',
        confidence: 0.8
      };
    } else {
      const deviation = Math.abs(productPrice - recommendedPrice) / recommendedPrice;
      const reason = productPrice < minPrice ? 'price-below-recommended' : 'price-above-recommended';
      
      return {
        passed: false,
        reason: reason,
        confidence: 0.9
      };
    }
  }

  // ===== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ =====

  /**
   * Анализ результатов всех проверок
   */
  private analyzeValidationChecks(checks: ValidationCheck[]): ValidationResult {
    // Если есть хотя бы одна неудачная проверка - товар невалиден
    const failedChecks = checks.filter(check => !check.passed);
    if (failedChecks.length > 0) {
      // Возвращаем первую неудачную проверку с наивысшей уверенностью
      const mostConfidentFailed = failedChecks.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      );
      return this.createResult(false, mostConfidentFailed.reason, mostConfidentFailed.confidence);
    }

    // Все проверки прошли успешно
    const avgConfidence = checks.reduce((sum, check) => sum + check.confidence, 0) / checks.length;
    return this.createResult(true, 'all-checks-passed', avgConfidence);
  }

  /**
   * Создание результата валидации
   */
  protected createResult(isValid: boolean, reason: string, confidence: number = 0.5): ValidationResult {
    return { isValid, reason, confidence };
  }

  /**
   * Проверка точного соответствия модели (без суффиксов)
   * @param query - поисковый запрос
   * @param name - название товара
   * @param modelPatterns - массив паттернов моделей для поиска
   * @param hasSuffixes - функция проверки наличия суффиксов
   * @returns true если есть точное соответствие модели
   */
  protected hasExactModelMatch(
    query: string,
    name: string,
    modelPatterns: string[],
    hasSuffixes: (name: string) => boolean
  ): boolean {
    // Ищем точную модель в запросе
    const queryModel = modelPatterns.find(pattern => query.includes(pattern));
    if (!queryModel) return true; // Если не модель - пропускаем
    
    // Проверяем есть ли в названии точная модель без суффиксов
    // Улучшенный поиск: ищем модель в любом месте названия
    const hasModel = name.includes(queryModel);
    const hasInvalidSuffixes = hasSuffixes(name);
    
    return hasModel && !hasInvalidSuffixes;
  }

  /**
   * Извлекает модель из запроса по паттернам
   * @param normalizedQuery - нормализованный запрос
   * @param modelPatterns - массив паттернов для поиска моделей
   * @returns найденная модель или null
   */
  protected extractModelFromQuery(normalizedQuery: string, modelPatterns: RegExp[]): string | null {
    for (const pattern of modelPatterns) {
      const matches = normalizedQuery.match(pattern);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
    return null;
  }

  /**
   * Проверяет есть ли в тексте длинные списки моделей в скобках
   * @param normalizedName - нормализованное название
   * @param modelPattern - паттерн для поиска моделей
   * @param maxModels - максимальное количество моделей в скобках
   * @returns true если найдено слишком много моделей
   */
  protected hasTooManyModelsInParentheses(
    normalizedName: string, 
    modelPattern: RegExp, 
    maxModels: number = 3
  ): boolean {
    const parenthesesContent = normalizedName.match(/\(([^)]+)\)/g);
    if (parenthesesContent) {
      for (const content of parenthesesContent) {
        const modelCount = (content.match(modelPattern) || []).length;
        if (modelCount > maxModels) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Проверяет есть ли в тексте множественные модели или сравнения
   * @param normalizedName - нормализованное название
   * @param modelPattern - паттерн для поиска моделей
   * @returns true если найдены множественные модели или сравнения
   */
  protected hasMultipleModelsInParentheses(
    normalizedName: string, 
    modelPattern: RegExp
  ): boolean {
    const parenthesesContent = normalizedName.match(/\(([^)]+)\)/g);
    if (parenthesesContent) {
      for (const content of parenthesesContent) {
        // Ищем паттерны сравнений в скобках
        const comparisonPatterns = [
          '≈', '~', 'vs', 'или', 'or', 'vs.', 'сравн', 'comparison',
          'аналог', 'как', 'like', 'подобн', 'similar', 'против', 'against'
        ];
        
        if (comparisonPatterns.some(pattern => 
          content.toLowerCase().includes(this.normalize(pattern))
        )) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Универсальная проверка моделей в названии продукта
   * @param normalizedQuery - нормализованный запрос
   * @param normalizedName - нормализованное название
   * @param modelPatterns - массив паттернов для поиска моделей
   * @param hasSuffixes - функция проверки наличия суффиксов
   * @returns ValidationResult результат проверки
   */
  protected validateModelMatch(
    normalizedQuery: string,
    normalizedName: string,
    modelPatterns: RegExp[],
    hasSuffixes: (name: string) => boolean
  ): ValidationResult {
    // Извлекаем модель из запроса
    const queryModel = this.extractModelFromQuery(normalizedQuery, modelPatterns);
    
    if (!queryModel) {
      // Если модель не найдена в запросе, используем стандартную валидацию
      return { isValid: true, reason: 'no-model-in-query', confidence: 0.5 };
    }
    
    // Извлекаем только цифры из модели (5070 из rtx5070)
    const modelNumbers = queryModel.match(/\d{4}/);
    const modelDigits = modelNumbers ? modelNumbers[0] : null;
    
    // Проверяем есть ли только цифры модели в названии (5070)
    const hasModelDigits = modelDigits && normalizedName.includes(modelDigits);
    
    if (!hasModelDigits) {
      return {
        isValid: false,
        confidence: 0.9,
        reason: 'no-match'
      };
    }
    
    // Проверяем суффиксы только в основной части названия (до скобок)
    const mainPart = normalizedName.split('(')[0];
    if (hasSuffixes(mainPart)) {
      return {
        isValid: false,
        confidence: 0.9,
        reason: 'model-suffix-mismatch'
      };
    }
    
    // Проверяем множественные модели
    const multipleModelsResult = this.checkMultipleModels(normalizedName, modelPatterns);
    if (!multipleModelsResult.isValid) {
      return multipleModelsResult;
    }
    
    return { isValid: true, reason: 'model-match', confidence: 0.9 };
  }

  /**
   * Проверка множественных моделей в названии
   * @param normalizedName - нормализованное название
   * @param modelPatterns - массив паттернов для поиска моделей
   * @returns ValidationResult результат проверки
   */
  protected checkMultipleModels(normalizedName: string, modelPatterns: RegExp[]): ValidationResult {
    // Ищем все модели в названии, но только полные модели (RTX, GTX, RX)
    const fullModelMatches: string[] = [];
    for (const pattern of modelPatterns) {
      // Пропускаем паттерн с простыми цифрами, так как он может давать ложные срабатывания
      if (pattern.source === '\\b\\d{4}\\b') {
        continue;
      }
      const matches = normalizedName.match(pattern);
      if (matches) {
        fullModelMatches.push(...matches);
      }
    }
    
    if (fullModelMatches.length > 1) {
      // Нормализуем модели (убираем пробелы, приводим к нижнему регистру)
      const normalizedModels = fullModelMatches.map(m => m.toLowerCase().replace(/\s+/g, ''));
      const uniqueModels = [...new Set(normalizedModels)];
      
      // Проверяем, что это действительно разные модели, а не одна модель с разными префиксами
      // Например, "geforce" и "rtx5070" - это одна модель, а не разные
      const hasDifferentModels = uniqueModels.some(model => {
        const otherModels = uniqueModels.filter(m => m !== model);
        return otherModels.some(other => {
          // Проверяем, что модели не содержат друг друга
          return !model.includes(other) && !other.includes(model);
        });
      });
      
      if (hasDifferentModels) {
        return {
          isValid: false,
          confidence: 0.9,
          reason: 'multiple-models'
        };
      }
    }
    
    return { isValid: true, reason: 'single-model', confidence: 0.9 };
  }

  /**
   * Проверка наличия суффиксов модели (переопределяется в наследниках)
   * @param name - название для проверки
   * @returns true если найдены недопустимые суффиксы
   */
  protected hasModelSuffixes(name: string): boolean {
    return false; // По умолчанию суффиксы разрешены
  }

  /**
   * Логирование для отладки
   */
  protected logValidation(query: string, name: string): void {
    // Отключаем подробные логи валидации
    // console.log(`[${this.constructor.name} DEBUG]`, {
    //   query,
    //   name,
    //   normalizedQuery: this.normalize(query),
    //   normalizedName: this.normalize(name)
    // });
  }
} 