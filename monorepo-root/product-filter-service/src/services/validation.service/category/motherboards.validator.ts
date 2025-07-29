import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';
import { CategoryConfigService, CATEGORY_NAMES } from '../../../config/categories.config';

@Injectable()
export class MotherboardsValidator extends ProductValidatorBase {
  private readonly MOTHERBOARDS_RULES: ValidationRules = {
    accessoryWords: [
      'кабель', 'шлейф', 'термопаста', 'винт', 'шуруп', 'крепление', 'подставка',
      'кулер', 'радиатор', 'вентилятор', 'блок питания', 'память', 'ssd', 'hdd'
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
      'b650', 'b750', 'x670', 'x770',
      'z690', 'z790', 'b660', 'b760',
      'am4', 'am5', 'lga1700', 'lga1200'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 