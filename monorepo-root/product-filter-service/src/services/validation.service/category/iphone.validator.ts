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

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 