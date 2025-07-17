import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class VideocardsValidator extends ProductValidatorBase {
  private readonly VIDEOCARDS_RULES: ValidationRules = {
    modelPatterns: [
      /(?:NVIDIA\s+)?GeForce\s+(?:RTX\s+)?(\d{4}[Tt][Ii]?)/i,
      /(?:AMD\s+)?Radeon\s+(?:RX\s+)?(\d{4}[Xx]?[Tt]?)/
    ],
    accessoryWords: [
      'кабель', 'шлейф', 'термопаста', 'винт', 'шуруп', 'крепление', 'подставка',
      'кулер', 'радиатор', 'вентилятор', 'блок питания', 'память', 'ssd', 'hdd'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    const cases = [
      {
        when: () => category === 'videocards',
        result: this.VIDEOCARDS_RULES
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
    console.log('[VIDEOCARD VALIDATOR DEBUG]', {
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
} 