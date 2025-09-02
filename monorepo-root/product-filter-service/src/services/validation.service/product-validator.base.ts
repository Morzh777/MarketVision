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

    // Анализируем результаты всех проверок
    return this.analyzeValidationChecks(checks);
  }

  /**
   * Валидация одного продукта
   */
  async validateSingleProduct(query: string, productName: string, category: string): Promise<ValidationResult> {
    const rules = this.getCategoryRules(category);
    if (!rules) {
      return this.createResult(false, 'unknown-category', 0.1);
    }
    // Важно: используем категорийную реализацию, а не всегда стандартную
    return this.validateProduct(query, productName, rules);
  }

  /**
   * Группировка и валидация продуктов по запросу
   */
  async groupAndValidateByQuery(products: any[], category: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const product of products) {
      const query = product.query;
      const name = product.name;
      
      if (!query || !name) {
        results.push(this.createResult(false, 'missing-query-or-name', 0.1));
        continue;
      }
      
      const result = await this.validateSingleProduct(query, name, category);
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