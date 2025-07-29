import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';
import { CategoryConfigService, CATEGORY_NAMES } from '../../../config/categories.config';

@Injectable()
export class PlaystationValidator extends ProductValidatorBase {
  private readonly PLAYSTATION_RULES: ValidationRules = {
    accessoryWords: [
      'контроллер', 'джойстик', 'dualsense', 'dualshock',
      'кабель', 'шнур', 'адаптер', 'переходник', 'зарядка', 'подставка', 'чехол', 'кейс',
      'карта памяти', 'наушники', 'гарнитура', 'микрофон',
      'накладки', 'скин', 'сумка', 'дисковод', 'vr', 'портативная',
      'станция', 'зарядная станция', 'станция зарядки', 'зарядное устройство',
      'защитный', 'силиконовый', 'кожаный', 'пластиковый', 'металлический', 
      'панель', 'обложка', 'обертка', 'защита', 'portal'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    return category === CATEGORY_NAMES.PLAYSTATION ? this.PLAYSTATION_RULES : null;
  }

  protected getValidatorCategory(): string {
    return CATEGORY_NAMES.PLAYSTATION;
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 