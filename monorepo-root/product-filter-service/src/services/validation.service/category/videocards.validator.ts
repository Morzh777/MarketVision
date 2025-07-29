import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';
import { CategoryConfigService, CATEGORY_NAMES } from '../../../config/categories.config';

@Injectable()
export class VideocardsValidator extends ProductValidatorBase {
  private readonly VIDEOCARDS_RULES: ValidationRules = {
    
    accessoryWords: [
      'кабель', 'шлейф', 'термопаста', 'винт', 'шуруп', 'крепление', 'подставка',
      'кулер', 'радиатор', 'вентилятор', 'блок питания', 'память', 'ssd', 'hdd',
      'кабель питания', 'кабель hdmi', 'кабель displayport', 'кабель dvi'
    ]
  };
  protected getCategoryRules(category: string): ValidationRules {
    return category === CATEGORY_NAMES.VIDEOCARDS ? this.VIDEOCARDS_RULES : null;
  }

  protected getValidatorCategory(): string {
    return CATEGORY_NAMES.VIDEOCARDS;
  }


  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 