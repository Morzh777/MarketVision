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


  protected getOtherModels(): string[] {
    return [
      'rtx4090', 'rtx4080', 'rtx4070', 'rtx4060',
      'rtx3090', 'rtx3080', 'rtx3070', 'rtx3060',
      'rx7900', 'rx7800', 'rx7700', 'rx7600',
      'rx6900', 'rx6800', 'rx6700', 'rx6600'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 