import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class NintendoSwitchValidator extends ProductValidatorBase {
  private readonly NINTENDO_SWITCH_RULES: ValidationRules = {
    modelPatterns: [
      /Nintendo\s+Switch\s+(?:OLED\s+)?(\d*)/i,
      /Switch\s+(?:OLED\s+)?(\d*)/i
    ],
    accessoryWords: [
      'контроллер', 'джойстик', 'кабель', 'шнур', 'зарядка', 'подставка', 'чехол',
      'игра', 'картридж', 'карта памяти', 'наушники', 'гарнитура', 'микрофон'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    if (category === 'nintendo_switch') {
      return this.NINTENDO_SWITCH_RULES;
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
    console.log('[NINTENDO SWITCH VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return this.validateModelMatch(query, models);
  }
} 