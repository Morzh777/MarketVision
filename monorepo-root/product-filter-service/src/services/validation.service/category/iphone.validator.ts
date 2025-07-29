import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';
import { CategoryConfigService, CATEGORY_NAMES } from '../../../config/categories.config';

@Injectable()
export class IphoneValidator extends ProductValidatorBase {
  private readonly IPHONE_RULES: ValidationRules = {
    accessoryWords: [
      'чехол', 'защита', 'стекло', 'кабель', 'шнур', 'зарядка', 'подставка',
      'наушники', 'гарнитура', 'микрофон', 'камера', 'объектив', 'штатив'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    return category === CATEGORY_NAMES.IPHONE ? this.IPHONE_RULES : null;
  }

  protected getValidatorCategory(): string {
    return CATEGORY_NAMES.IPHONE;
  }

  protected getOtherModels(): string[] {
    return [
      'iphone15', 'iphone14', 'iphone13', 'iphone12', 'iphone11',
      'iphone15pro', 'iphone14pro', 'iphone13pro', 'iphone12pro',
      'iphone15promax', 'iphone14promax', 'iphone13promax', 'iphone12promax',
      'iphone15plus', 'iphone14plus', 'iphone13mini', 'iphone12mini'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 