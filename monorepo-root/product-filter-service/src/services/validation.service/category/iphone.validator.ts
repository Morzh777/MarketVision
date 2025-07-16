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
} 