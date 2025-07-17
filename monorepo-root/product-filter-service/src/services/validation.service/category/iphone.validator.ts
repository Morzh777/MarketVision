import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class IphoneValidator extends ProductValidatorBase {
  private readonly IPHONE_RULES: ValidationRules = {
    modelPatterns: [
      /iPhone\s*(?:(\d{1,2})\s*)?(?:Pro\s*)?(?:Max\s*)?(\d*)/i,
      /iPhone\s*(?:SE\s*)?(\d*)/
    ],
    accessoryWords: [
      'чехол', 'защита', 'стекло', 'кабель', 'шнур', 'зарядка', 'подставка',
      'наушники', 'гарнитура', 'микрофон', 'камера', 'объектив', 'штатив'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    const cases = [
      {
        when: () => category === 'iphone',
        result: this.IPHONE_RULES
      }
    ];

    return cases.find(c => c.when())?.result ?? null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    const models = this.extractModels(name, rules.modelPatterns || []);

    const cases = [
      {
        when: () => rules.accessoryWords && this.isAccessory(name, rules.accessoryWords),
        result: { isValid: false, reason: 'accessory', confidence: 0.0 }
      },
      {
        when: () => this.validateModelMatch(query, models).isValid,
        result: { isValid: true, reason: 'model-match', confidence: 0.95 }
      }
    ];

    // DEBUG LOG
    console.log('[IPHONE VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return cases.find(c => c.when())?.result ?? { 
      isValid: false, 
      reason: 'no-model-match', 
      confidence: 0.1 
    };
  }

  /**
   * Переопределяем метод валидации для iPhone с улучшенной логикой
   */
  protected validateModelMatch(query: string, models: string[]): ValidationResult {
    // Используем метод нормализации из базового класса
    const normQuery = this.normalizeForQuery(query);
    
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
    
    // Извлекаем номер модели (например, 16) - с пробелом или без
    const modelMatch = name.match(/iPhone\s*(\d{1,2})/i);
    const modelCases = [
      {
        when: () => modelMatch !== null,
        result: () => models.push(modelMatch[1])
      }
    ];
    modelCases.find(c => c.when())?.result();
    
    // Извлекаем емкость (например, 128, 256)
    const capacityMatch = name.match(/(\d{3,4})\s*(?:GB|ГБ)/i);
    const capacityCases = [
      {
        when: () => capacityMatch !== null,
        result: () => models.push(capacityMatch[1])
      }
    ];
    capacityCases.find(c => c.when())?.result();
    
    // Извлекаем полную модель (например, iphone16pro) - с пробелом или без
    const fullModelMatch = name.match(/iPhone\s*(\d{1,2})\s*(Pro|Max)?/i);
    const fullModelCases = [
      {
        when: () => fullModelMatch !== null && fullModelMatch[2] !== undefined,
        result: () => {
          const model = fullModelMatch[1];
          const variant = fullModelMatch[2];
          models.push(this.normalizeForQuery(`iphone${model}${variant}`));
        }
      },
      {
        when: () => fullModelMatch !== null && fullModelMatch[2] === undefined,
        result: () => {
          const model = fullModelMatch[1];
          models.push(this.normalizeForQuery(`iphone${model}`));
        }
      }
    ];
    fullModelCases.find(c => c.when())?.result();
    
    return Array.from(new Set(models)).filter(Boolean);
  }
} 