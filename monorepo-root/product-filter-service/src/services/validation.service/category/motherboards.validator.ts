import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';
import { CategoryConfigService, CATEGORY_NAMES } from '../../../config/categories.config';

@Injectable()
export class MotherboardsValidator extends ProductValidatorBase {
  private readonly MOTHERBOARDS_RULES: ValidationRules = {
    accessoryWords: [
      'кабель', 'шлейф', 'термопаста', 'винт', 'шуруп', 'крепление', 'подставка',
      'кулер', 'радиатор', 'вентилятор', 'блок питания', 'память', 'ssd', 'hdd',
      // Частые аксессуары/детали, попадающие в выборку как «материнка»
      'наклейка', 'стикер', 'бэкплейт', 'бекплейт', 'backplate', 'панель', 'крышка', 'рамка',
      'заглушка', 'щиток', 'io shield', 'i/o shield', 'щиток ввода-вывода'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    return category === CATEGORY_NAMES.MOTHERBOARDS ? this.MOTHERBOARDS_RULES : null;
  }

  protected getValidatorCategory(): string {
    return CATEGORY_NAMES.MOTHERBOARDS;
  }

  protected getOtherModels(): string[] {
    return [
      'b650', 'b660', 'b750', 'b760', 'b850',
      'x670', 'x770', 'x870e',
      'z690', 'z790',
      'am4', 'am5', 'lga1700', 'lga1200'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    const nameLower = name.toLowerCase();
    const normalizedQuery = query.toLowerCase().trim();

    // Строгая проверка для чипсетов: B760 не должен матчить B760M-K и т.п.
    const chipsetTokens = this.getOtherModels();
    const isChipsetQuery = chipsetTokens.includes(normalizedQuery);
    if (isChipsetQuery) {
      if (!this.isStrictTokenMatch(name, normalizedQuery)) {
        return this.createResult(false, 'chipset-strict-mismatch', 0.95);
      }
    }

    return this.validateProductStandard(query, name, rules);
  }
} 