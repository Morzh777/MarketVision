import { Injectable } from '@nestjs/common';
import { ProductValidatorBase, ValidationResult, ValidationRules } from '../product-validator.base';

@Injectable()
export class VideocardsValidator extends ProductValidatorBase {
  private readonly CATEGORY_KEY = 'videocards';

  private readonly VIDEOCARDS_RULES: ValidationRules = {

    accessoryWords: [
      'кабель', 'шлейф', 'термопаста', 'винт', 'шуруп', 'крепление', 'подставка',
      'кулер', 'радиатор', 'вентилятор', 'блок питания', 'память', 'ssd', 'hdd',
      'кабель питания', 'кабель hdmi', 'кабель displayport', 'кабель dvi'
    ]
  };
  protected getCategoryRules(category: string): ValidationRules {
    return category === this.CATEGORY_KEY ? this.VIDEOCARDS_RULES : null;
  }

  protected getValidatorCategory(): string {
    return this.CATEGORY_KEY;
  }


  protected getOtherModels(): string[] {
    return [
      // RTX серии
      'rtx5090', 'rtx5090ti', 'rtx5080', 'rtx5080ti', 'rtx5070', 'rtx5070ti', 'rtx5060', 'rtx5060ti',
      'rtx4090', 'rtx4090ti', 'rtx4080', 'rtx4080ti', 'rtx4070', 'rtx4070ti', 'rtx4060', 'rtx4060ti',
      'rtx4050', 'rtx3090', 'rtx3080', 'rtx3070', 'rtx3060', 'rtx3050',
      // GTX серии
      'gtx1660', 'gtx1660ti', 'gtx1660super', 'gtx1650', 'gtx1650super', 'gtx1630',
      'gtx1080', 'gtx1080ti', 'gtx1070', 'gtx1070ti', 'gtx1060', 'gtx1050', 'gtx1050ti',
      'gtx980', 'gtx980ti', 'gtx970', 'gtx960', 'gtx950',
      // RX серии
      'rx7900', 'rx7900xt', 'rx7800', 'rx7800xt', 'rx7700', 'rx7700xt', 'rx7600', 'rx7600xt',
      'rx6900', 'rx6900xt', 'rx6800', 'rx6800xt', 'rx6700', 'rx6700xt', 'rx6600', 'rx6600xt',
      'rx6500', 'rx6400', 'rx580', 'rx570', 'rx560', 'rx550'
    ];
  }

  protected validateProduct(query: string, name: string, rules: ValidationRules): ValidationResult {
    const normalizedQuery = this.normalize(query);
    const normalizedName = this.normalize(name);
    
    // Извлекаем полную модель из запроса (rtx5070, gtx1660 и т.д.)
    const queryModelMatch = normalizedQuery.match(/\b(rtx|gtx|rx)\d+\b/gi);
    
    if (queryModelMatch && queryModelMatch.length > 0) {
      const queryModel = queryModelMatch[0].toLowerCase(); // Берем первую найденную модель
      
      // Проверяем есть ли это число в названии
      const hasModelInName = normalizedName.includes(queryModel);
      
      if (!hasModelInName) {
        return {
          isValid: false,
          confidence: 0.9,
          reason: 'no-match'
        };
      }
      
      // Проверяем суффиксы только в основной части названия (до скобок)
      const mainPart = normalizedName.split('(')[0];
      if (this.hasModelSuffixes(mainPart)) {
        return {
          isValid: false,
          confidence: 0.9,
          reason: 'model-suffix-mismatch'
        };
      }
      
      
      // Модель найдена и валидна, используем стандартную валидацию
      return this.validateProductStandard(query, name, rules);
    }
    
    // Если модель не найдена в запросе, используем стандартную валидацию
    return this.validateProductStandard(query, name, rules);
  }

  protected hasModelSuffixes(name: string): boolean {
    const suffixes = [
      'ti', 'super',
    ];

    return suffixes.some(suffix => name.includes(suffix));
  }

  /**
   * Переопределяем метод hasMultipleModels для видеокарт
   * Используем список моделей из getOtherModels()
   */
  protected hasMultipleModels(normalizedName: string): boolean {
    // Проверяем только паттерны сравнений, не множественные модели
    const comparisonPatterns = [
      '≈', '~', 'vs', 'или', 'or', 'vs.', 'сравн', 'comparison',
      'аналог', 'как', 'like', 'подобн', 'similar', 'против', 'against'
    ];
    
    return comparisonPatterns.some(pattern => 
      normalizedName.includes(this.normalize(pattern))
    );
  }
} 