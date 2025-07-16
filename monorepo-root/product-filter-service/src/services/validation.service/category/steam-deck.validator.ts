import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class SteamDeckValidator extends ProductValidatorBase {
  private readonly STEAM_DECK_RULES: ValidationRules = {
    modelPatterns: [
      /Steam\s+Deck\s+(?:OLED\s+)?(\d*)/i,
      /Deck\s+(?:OLED\s+)?(\d*)/i
    ],
    accessoryWords: [
      'чехол', 'сумка', 'кабель', 'шнур', 'зарядка', 'подставка', 'держатель',
      'игра', 'карта памяти', 'наушники', 'гарнитура', 'микрофон', 'экран'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    if (category === 'steam_deck') {
      return this.STEAM_DECK_RULES;
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
    console.log('[STEAM DECK VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return this.validateModelMatch(query, models);
  }
} 