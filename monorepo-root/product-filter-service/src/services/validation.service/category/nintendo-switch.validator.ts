import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class NintendoSwitchValidator extends ProductValidatorBase {
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
    return category === 'nintendo_switch' ? this.NINTENDO_SWITCH_RULES : null;
  }

  protected getValidatorCategory(): string {
    return 'nintendo_switch';
  }

  protected getOtherModels(): string[] {
    return [
      'nintendoswitcholed', 'nintendoswitchlite', 'nintendoswitch2',
      'nintendoswitchpro', 'nintendoswitchmini', 'nintendoswitchplus',
      'nintendoswitchv2', 'nintendoswitchv3', 'nintendoswitchv4'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    // Используем стандартную валидацию, которая теперь включает проверку цены
    return this.validateProductStandard(query, name, rules);
  }
} 