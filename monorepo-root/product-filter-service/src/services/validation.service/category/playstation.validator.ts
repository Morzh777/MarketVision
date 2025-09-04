import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';


@Injectable()
export class PlaystationValidator extends ProductValidatorBase {
  private readonly CATEGORY_KEY = 'playstation';

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
    return category === this.CATEGORY_KEY ? this.PLAYSTATION_RULES : null;
  }

  protected getValidatorCategory(): string {
    return this.CATEGORY_KEY;
  }

  protected getOtherModels(): string[] {
    return [
      'ps5', 'ps4', 'ps3', 'ps2', 'ps1',
      'playstation5', 'playstation4', 'playstation3', 'playstation2', 'playstation1',
      'ps5slim', 'ps5pro', 'ps4slim', 'ps4pro'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    // Используем стандартную валидацию, которая теперь включает проверку цены
    return this.validateProductStandard(query, name, rules);
  }
} 