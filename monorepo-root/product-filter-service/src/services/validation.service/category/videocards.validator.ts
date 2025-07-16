import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class VideocardsValidator extends ProductValidatorBase {
  private readonly VIDEOCARDS_RULES: ValidationRules = {
    modelPatterns: [
      /(?:NVIDIA\s+)?GeForce\s+(?:RTX\s+)?(\d{4}[Tt][Ii]?)/i,
      /(?:AMD\s+)?Radeon\s+(?:RX\s+)?(\d{4}[Xx]?[Tt]?)/i
    ],
    accessoryWords: [
      'кабель', 'шлейф', 'термопаста', 'винт', 'шуруп', 'крепление', 'подставка',
      'кулер', 'радиатор', 'вентилятор', 'блок питания', 'память', 'ssd', 'hdd'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    if (category === 'videocards') {
      return this.VIDEOCARDS_RULES;
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
    console.log('[VIDEOCARD VALIDATOR DEBUG]', {
      query,
      name,
      models
    });

    return this.validateModelMatch(query, models);
  }
} 