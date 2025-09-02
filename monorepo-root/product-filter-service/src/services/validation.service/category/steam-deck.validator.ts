import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';


@Injectable()
export class SteamDeckValidator extends ProductValidatorBase {
  private readonly CATEGORY_KEY = 'steam_deck';

  private readonly STEAM_DECK_RULES: ValidationRules = {

    accessoryWords: [
      'чехол', 'сумка', 'кабель', 'шнур', 'зарядка', 'подставка', 'держатель',
      'игра', 'карта памяти', 'наушники', 'гарнитура', 'микрофон', 'экран',
      'накладки', 'стики', 'лапки', 'защитный', 'силиконовый', 'кожаный',
      'пластиковый', 'металлический', 'аксессуар', 'комплект', 'набор',
      'док-станция', 'докстанция', 'док', 'станция', 'адаптер', 'переходник',
      'кнопки', 'кнопка', 'стик', 'стики', 'джойстик', 'джойстики',
      'контроллер', 'джойстик', 'панель', 'кулер', 'радиатор', 'вентилятор', 
      'блок питания', 'память', 'ssd', 'hdd', 'крышка', 'декоративная', 'прозрачный',
      'защита', 'стекло', 'пленка', 'наклейка', 'стикер', 'обложка', 'обертка',
      'ручка', 'ремень', 'шнурок', 'брелок', 'подвеска', 'магнит', 'липучка',
      'крепление', 'винт', 'шуруп', 'болт', 'гайка', 'шайба', 'прокладка',
      'термопаста', 'смазка', 'очиститель', 'салфетка', 'тряпочка', 'щетка'
    ]
  };
  protected getCategoryRules(category: string): ValidationRules {
    return category === this.CATEGORY_KEY ? this.STEAM_DECK_RULES : null;
  }

  protected getValidatorCategory(): string {
    return this.CATEGORY_KEY;
  }

  protected getOtherModels(): string[] {
    return [
      'steamdeckoled', 'steamdecklcd', 'steamdeck2', 'steamdeckpro',
      'steamdeckmini', 'steamdeckplus', 'steamdeckultra', 'oled'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    return this.validateProductStandard(query, name, rules);
  }
} 