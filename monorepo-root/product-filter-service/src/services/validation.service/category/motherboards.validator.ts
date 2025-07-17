import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class MotherboardsValidator extends ProductValidatorBase {
  private readonly MOTHERBOARDS_RULES: ValidationRules = {
    chipsets: [
      'z990', 'z890', 'z790', 'b860', 'b850', 'b760', 'h810', 'w880', 'b760m', 'b760m-k',
      'b760m-k d4', 'b760m-k ddr4', 'b760m-k ddr5', 'b760m-k matx', 'b760m-k microatx',
      'x950', 'x870e', 'x870', 'a820', 'b850mt2-e', 'b850mt2-a', 'b850mt2-d', 'b850mt2-c', 'b850mt2-b', 'B850M-X', 'B850M'
    ],
    accessoryWords: [
      'кабель', 'шлейф', 'термопаста', 'винт', 'шуруп', 'крепление', 'подставка',
      'кулер', 'радиатор', 'вентилятор', 'блок питания', 'память', 'ssd', 'hdd'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    const cases = [
      {
        when: () => category === 'motherboards',
        result: this.MOTHERBOARDS_RULES
      }
    ];

    return cases.find(c => c.when())?.result ?? null;
  }

  protected customValidation(query: string, name: string, rules: ValidationRules): ValidationResult {
    const n = this.normalizeToLower(name);
    const q = this.normalizeForQuery(query.trim());

    // Нормализуем чипсеты для сравнения
    const normalizedChipsets = rules.chipsets.map(chipset => this.normalizeForQuery(chipset));
    
    // Извлекаем все чипсеты из названия
    const foundChipsets = this.extractChipsetsFromName(n, normalizedChipsets);
    const uniqueChipsets = [...new Set(foundChipsets)];

    const cases = [
      {
        when: () => !rules.chipsets || !Array.isArray(rules.chipsets) || rules.chipsets.length === 0,
        result: { isValid: false, reason: 'no-chipsets-in-rules', confidence: 0.0 }
      },
      {
        when: () => rules.accessoryWords && this.isAccessory(name, rules.accessoryWords),
        result: { isValid: false, reason: 'accessory', confidence: 0.0 }
      },
      {
        when: () => !normalizedChipsets.includes(q),
        result: { isValid: false, reason: 'query-not-in-chipsets', confidence: 0.0 }
      },
      {
        when: () => uniqueChipsets.length > 1 && !foundChipsets.includes(q),
        result: { isValid: false, reason: 'conflicting-chipsets', confidence: 0.0 }
      },
      {
        when: () => foundChipsets.includes(q),
        result: { isValid: true, reason: 'chipset-match', confidence: 1.0 }
      }
    ];

    // Для отладки
    console.log({
      name,
      n,
      q,
      found: foundChipsets.includes(q),
      foundChipsets,
      uniqueChipsets,
      hasConflictingChipsets: uniqueChipsets.length > 1 && !foundChipsets.includes(q),
      price: rules?.price
    });

    return cases.find(c => c.when())?.result ?? { 
      isValid: false, 
      reason: 'no-query-chipset-in-name', 
      confidence: 0.1 
    };
  }

  /**
   * Извлекает чипсеты из названия товара (только точные совпадения)
   */
  private extractChipsetsFromName(name: string, availableChipsets: string[]): string[] {
    const foundChipsets: string[] = [];
    
    for (const chipset of availableChipsets) {
      // Ищем только точное совпадение с границами слова
      const exactRegex = new RegExp(`\\b${chipset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (exactRegex.test(name)) {
        foundChipsets.push(chipset);
      }
    }
    
    return foundChipsets;
  }
} 