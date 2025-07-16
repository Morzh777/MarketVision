import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class ProcessorsValidator extends ProductValidatorBase {
  private readonly PROCESSORS_RULES: ValidationRules = {
    modelPatterns: [
      /(?:AMD\s+)?Ryzen\s+(?:7\s+)?(\d{4}[Xx]?\d*)/i,
      /(?:Intel\s+)?Core\s+(?:i\d\s+)?(\d{4}[Kk]?[Ff]?)/i
    ],
    accessoryWords: [
      'кулер', 'радиатор', 'вентилятор', 'термопаста', 'подставка', 'крепление',
      'материнская плата', 'память', 'ssd', 'hdd', 'видеокарта'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    if (category === 'processors') {
      return this.PROCESSORS_RULES;
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
    console.log('[PROCESSOR VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return this.validateModelMatch(query, models);
  }
} 