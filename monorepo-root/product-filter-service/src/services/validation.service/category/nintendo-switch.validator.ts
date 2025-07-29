import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';
import { CategoryConfigService, CATEGORY_NAMES } from '../../../config/categories.config';

@Injectable()
export class NintendoSwitchValidator extends ProductValidatorBase {
  private readonly NINTENDO_SWITCH_RULES: ValidationRules = {
    accessoryWords: [
      'контроллер', 'джойстик', 'кабель', 'шнур', 'зарядка', 'подставка', 'чехол',
      'картридж', 'карта памяти', 'наушники', 'гарнитура', 'микрофон',
      'панель', 'накладки', 'стики', 'лапки', 'защитный', 'силиконовый', 'кожаный',
      'пластиковый', 'металлический', 'аксессуар', 'адаптер',
      'переходник', 'кнопки', 'кнопка', 'стик', 'стики', 'джойстики'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    return category === CATEGORY_NAMES.NINTENDO_SWITCH ? this.NINTENDO_SWITCH_RULES : null;
  }

  protected getValidatorCategory(): string {
    return CATEGORY_NAMES.NINTENDO_SWITCH;
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 