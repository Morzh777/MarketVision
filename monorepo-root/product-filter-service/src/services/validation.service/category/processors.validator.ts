import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';
import { CategoryConfigService, CATEGORY_NAMES } from '../../../config/categories.config';

@Injectable()
export class ProcessorsValidator extends ProductValidatorBase {
  private readonly PROCESSORS_RULES: ValidationRules = {
    accessoryWords: [
      'кулер', 'радиатор', 'вентилятор', 'термопаста', 'подставка', 'крепление',
      'материнская плата', 'память', 'ssd', 'hdd', 'видеокарта'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    return category === CATEGORY_NAMES.PROCESSORS ? this.PROCESSORS_RULES : null;
  }

  protected getValidatorCategory(): string {
    return CATEGORY_NAMES.PROCESSORS;
  }

  protected getOtherModels(): string[] {
    return [
      '7800x3d', '9800x3d', '7900x3d', '7950x3d', '9950x',
      '14900k', '14700k', '14600k', '13900k', '13700k', '13600k'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 