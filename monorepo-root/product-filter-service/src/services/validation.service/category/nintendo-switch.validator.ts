import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';


@Injectable()
export class NintendoSwitchValidator extends ProductValidatorBase {
  private readonly CATEGORY_KEY = 'nintendo_switch';

  private readonly NINTENDO_SWITCH_RULES: ValidationRules = {
    accessoryWords: [
      'контроллер', 'джойстик', 'кабель', 'шнур', 'зарядка', 'подставка', 'чехол',
      'картридж', 'карта памяти', 'наушники', 'гарнитура', 'микрофон',
      'панель', 'накладки', 'стики', 'лапки', 'защитный', 'силиконовый', 'кожаный',
      'пластиковый', 'металлический', 'аксессуар', 'адаптер',
      'переходник', 'кнопки', 'кнопка', 'стик', 'стики', 'джойстики',
      'joy-con', 'joycon', 'кулер', 'радиатор', 'вентилятор', 'блок питания', 'память', 'ssd', 'hdd'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    return category === this.CATEGORY_KEY ? this.NINTENDO_SWITCH_RULES : null;
  }

  protected getValidatorCategory(): string {
    return this.CATEGORY_KEY;
  }

  protected getOtherModels(): string[] {
    return [
      'nintendoswitcholed', 'nintendoswitchlite', 'nintendoswitch2',
      'nintendoswitchpro', 'nintendoswitchmini', 'nintendoswitchplus',
      'nintendoswitchv2', 'nintendoswitchv3', 'nintendoswitchv4'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 