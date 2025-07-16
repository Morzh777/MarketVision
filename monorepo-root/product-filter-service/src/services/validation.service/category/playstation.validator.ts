import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class PlaystationValidator extends ProductValidatorBase {
  private readonly PLAYSTATION_RULES: ValidationRules = {
    modelPatterns: [
      /PlayStation\s+(?:5\s+)?(?:Pro\s+)?(\d*)/i,
      /PS5\s+(?:Pro\s+)?(\d*)/i
    ],
    accessoryWords: [
      'контроллер', 'джойстик', 'кабель', 'шнур', 'зарядка', 'подставка', 'чехол',
      'игра', 'диск', 'карта памяти', 'наушники', 'гарнитура', 'микрофон'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    if (category === 'playstation') {
      return this.PLAYSTATION_RULES;
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
    console.log('[PLAYSTATION VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return this.validateModelMatch(query, models);
  }
} 