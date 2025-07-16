import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class MotherboardsValidator extends ProductValidatorBase {
  private readonly MOTHERBOARDS_RULES: ValidationRules = {
    chipsets: [
      'z990', 'z890', 'z790', 'b860', 'b850', 'b760', 'h810', 'w880', 'b760m', 'b760m-k',
      'x950', 'x870e', 'x870', 'a820', 'b850mt2-e', 'b850mt2-a', 'b850mt2-d', 'b850mt2-c', 'b850mt2-b', 'B850M-X', 'B850M'
    ],
    accessoryWords: [
      'кабель', 'шлейф', 'термопаста', 'винт', 'шуруп', 'крепление', 'подставка',
      'кулер', 'радиатор', 'вентилятор', 'блок питания', 'память', 'ssd', 'hdd'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    if (category === 'motherboards') {
      return this.MOTHERBOARDS_RULES;
    }
    return null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    const n = this.normalizeToLower(name);
    const q = this.normalizeToLower(query.trim());

    // Проверка на аксессуары
    if (rules.accessoryWords && this.isAccessory(name, rules.accessoryWords)) {
      return { isValid: false, reason: 'accessory', confidence: 0.0 };
    }

    const cases = [
      {
        when: () => !rules.chipsets || !Array.isArray(rules.chipsets) || rules.chipsets.length === 0,
        result: { isValid: false, reason: 'no-chipsets-in-rules', confidence: 0.0 }
      },
      {
        when: () => !rules.chipsets.includes(q),
        result: { isValid: false, reason: 'query-not-in-chipsets', confidence: 0.0 }
      },
      {
        when: () => {
          const foundChipsets = rules.chipsets.filter((chipset: string) => {
            const regex = new RegExp(`\\b${chipset}\\b`, 'i');
            return regex.test(n);
          });
          return foundChipsets.length > 1;
        },
        result: { isValid: false, reason: 'conflicting-chipsets', confidence: 0.0 }
      },
      {
        when: () => {
          const regex = new RegExp(`\\b${q}\\b`, 'i');
          return regex.test(n);
        },
        result: { isValid: true, reason: 'chipset-match', confidence: 1.0 }
      }
    ];

    // Для отладки
    console.log({
      name,
      n,
      q,
      found: cases[3].when(),
      price: rules?.price
    });

    return cases.find(c => c.when())?.result ?? { 
      isValid: false, 
      reason: 'no-query-chipset-in-name', 
      confidence: 0.1 
    };
  }
} 