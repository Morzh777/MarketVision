import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class IphoneValidator extends ProductValidatorBase {
  private readonly CATEGORY_KEY = 'iphone';

  private readonly IPHONE_RULES: ValidationRules = {
    accessoryWords: [
      'чехол', 'защита', 'стекло', 'кабель', 'шнур', 'зарядка', 'подставка',
      'наушники', 'гарнитура', 'микрофон', 'камера', 'объектив', 'штатив',
      // Доп. аксессуарные и маскирующие фразы для исключения неоригинальных/стилизованных товаров
      'корпус', 'вкорпусе', 'кейс', 'бампер', 'накладка', 'пленка', 'плёнка',
      'реплика', 'встиле', 'стиле', 'стилизован'
    ]
  };

  protected getCategoryRules(category: string): ValidationRules {
    return category === this.CATEGORY_KEY ? this.IPHONE_RULES : null;
  }

  protected getValidatorCategory(): string {
    return this.CATEGORY_KEY;
  }

  protected getOtherModels(): string[] {
    return [
      // Текущее и недавние поколения
      'iphone16', 'iphone15', 'iphone14', 'iphone13', 'iphone12', 'iphone11',
      'iphone16pro', 'iphone15pro', 'iphone14pro', 'iphone13pro', 'iphone12pro', 'iphone11pro',
      'iphone16promax', 'iphone15promax', 'iphone14promax', 'iphone13promax', 'iphone12promax', 'iphone11promax',
      'iphone16plus', 'iphone15plus', 'iphone14plus', 'iphone13mini', 'iphone12mini',
      // Старые модели, часто встречающиеся в описаниях и вводящие в заблуждение
      'iphonexr', 'iphonexs', 'iphonexsmax', 'iphonex',
      'iphone8', 'iphone8plus', 'iphone7', 'iphone7plus',
      'iphone6', 'iphone6s', 'iphone6plus', 'iphone6splus',
      'iphone5', 'iphone5s', 'iphonese', 'iphonese2'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    const normalizedName = this.normalize(name);
    const legacyModels = this.getOtherModels();

    // Специальное правило: отбрасываем товары вида "XR в корпусе/в стиле 15 Pro"
    const stylingIndicators = ['вкорпусе', 'корпус', 'встиле', 'стиле', 'стилизован'];
    const hasStyling = stylingIndicators.some((word) => normalizedName.includes(word));
    const hasLegacyModel = legacyModels.some((model) => normalizedName.includes(model));

    if (hasStyling && hasLegacyModel) {
      return this.createResult(false, 'iphone-styled-legacy-model', 0.95);
    }

    // Отладочная информация для проверки цены (только для скам-товаров)
    if (rules.product?.price && rules.recommendedPrice && rules.product.price < rules.recommendedPrice * 0.5) {
      console.log(`🚨 iPhone скам-товар: "${name}" - цена: ${rules.product.price}₽, рекомендованная: ${rules.recommendedPrice}₽, толерантность: ${rules.dynamicTolerance || 0.3}`);
    }

    // Используем стандартную валидацию, которая включает проверку соответствия запроса
    return this.validateProductStandard(query, name, rules);
  }
} 