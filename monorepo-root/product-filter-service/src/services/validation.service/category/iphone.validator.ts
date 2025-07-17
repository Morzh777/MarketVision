import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class IphoneValidator extends ProductValidatorBase {
  private readonly IPHONE_RULES: ValidationRules = {
    modelPatterns: [
      /iPhone\s+(?:(\d{1,2})\s+)?(?:Pro\s+)?(?:Max\s+)?(\d*)/i,
      /iPhone\s+(?:SE\s+)?(\d*)/i
    ],
    accessoryWords: [
      'чехол', 'защита', 'стекло', 'кабель', 'шнур', 'зарядка', 'подставка',
      'наушники', 'гарнитура', 'микрофон', 'камера', 'объектив', 'штатив'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    if (category === 'iphone') {
      return this.IPHONE_RULES;
    }
    return null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    // Проверка на аксессуары
    if (rules.accessoryWords && this.isAccessory(name, rules.accessoryWords)) {
      return { isValid: false, reason: 'accessory', confidence: 0.0 };
    }

    // Извлечение моделей
    const models = this.extractModels(name, rules.modelPatterns || []);
    
    // DEBUG LOG
    console.log('[IPHONE VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return this.validateModelMatch(query, models);
  }

  /**
   * Переопределяем метод валидации для iPhone с улучшенной логикой
   */
  protected validateModelMatch(query: string, models: string[]): ValidationResult {
    const normQuery = this.normalizeForQuery(query.replace(/[-\s]+/g, ''));
    
    // Проверяем, есть ли точное совпадение
    if (models.includes(normQuery)) {
      return { isValid: true, reason: 'model-match', confidence: 0.95 };
    }
    
    // Проверяем частичные совпадения для iPhone
    const queryParts = normQuery.split(/(\d+)/).filter(Boolean);
    const hasMatchingParts = queryParts.some(part => 
      models.some(model => model.includes(part) || part.includes(model))
    );
    
    if (hasMatchingParts) {
      return { isValid: true, reason: 'model-match', confidence: 0.8 };
    }
    
    return { isValid: false, reason: 'no-model-match', confidence: 0.1 };
  }

  /**
   * Переопределяем извлечение моделей для лучшей обработки iPhone
   */
  protected extractModels(name: string, patterns: RegExp[]): string[] {
    const models: string[] = [];
    
    // Извлекаем номер модели (например, 16)
    const modelMatch = name.match(/iPhone\s+(\d{1,2})/i);
    if (modelMatch) {
      models.push(modelMatch[1]);
    }
    
    // Извлекаем емкость (например, 128, 256)
    const capacityMatch = name.match(/(\d{3,4})\s*(?:GB|ГБ)/i);
    if (capacityMatch) {
      models.push(capacityMatch[1]);
    }
    
    // Извлекаем полную модель (например, iphone16pro)
    const fullModelMatch = name.match(/iPhone\s+(\d{1,2})\s*(Pro|Max)?/i);
    if (fullModelMatch) {
      const model = fullModelMatch[1];
      const variant = fullModelMatch[2];
      if (variant) {
        models.push(`iphone${model}${variant.toLowerCase()}`);
      } else {
        models.push(`iphone${model}`);
      }
    }
    
    return Array.from(new Set(models)).filter(Boolean);
  }
} 