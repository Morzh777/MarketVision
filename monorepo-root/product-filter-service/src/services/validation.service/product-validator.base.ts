import { Injectable, Logger } from '@nestjs/common';
import { CategoryConfigService } from '../../config/categories.config';

export interface ValidationResult {
  isValid: boolean;
  reason: string;
  confidence?: number;
}

export interface ValidationRules {
  accessoryWords?: string[];
  minNameLength?: number;
  price?: number;
  product?: any;
}

export type ProductCategory = string; // Динамически берется из CategoryConfigService.getAllCategories()

@Injectable()
export abstract class ProductValidatorBase {
  protected readonly logger = new Logger(this.constructor.name);

  constructor() {
    this.logger.log(`🚀 Инициализация валидатора: ${this.constructor.name}`);
  }

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

    if (rules.accessoryWords && this.isAccessory(normalizedName, rules.accessoryWords)) {
      return this.createResult(false, 'accessory', 0.9);
    }

    if (!this.validateNameQueryMatch(normalizedName, normalizedQuery)) {
      return this.createResult(false, 'no-match', 0.7);
    }

    return this.createResult(true, 'all-checks-passed', 0.95);
  }

  /**
   * Получение правил категории - каждая категория определяет свои правила
   */
  protected abstract getCategoryRules(category: string): ValidationRules;

  /**
   * Получить категорию, которую обрабатывает этот валидатор
   */
  protected abstract getValidatorCategory(): string;

  // ===== УНИВЕРСАЛЬНЫЕ МЕТОДЫ-УТИЛИТЫ =====

  /**
   * Универсальная нормализация строки - убирает пробелы и приводит к нижнему регистру
   */
  protected normalize(str: string): string {
    return str.toLowerCase().replace(/\s+/g, '');
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
   * Создание результата валидации
   */
  protected createResult(isValid: boolean, reason: string, confidence: number = 0.5): ValidationResult {
    return { isValid, reason, confidence };
  }

  /**
   * Логирование для отладки
   */
  protected logValidation(query: string, name: string): void {
    console.log(`[${this.constructor.name} DEBUG]`, {
      query,
      name,
      normalizedQuery: this.normalize(query),
      normalizedName: this.normalize(name)
    });
  }

  /**
   * Валидация одного продукта
   */
  async validateSingleProduct(query: string, productName: string, category: string): Promise<ValidationResult> {
    const rules = this.getCategoryRules(category);
    if (!rules) {
      return this.createResult(false, 'unknown-category', 0.1);
    }
    return this.validateProductStandard(query, productName, rules);
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

} 