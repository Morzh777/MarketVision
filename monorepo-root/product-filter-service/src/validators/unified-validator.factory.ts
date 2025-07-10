import { Injectable } from '@nestjs/common';
import { UnifiedHybridValidator } from './unified-hybrid.validator';
import { OpenAiValidationService } from '../services/openai.service';

/**
 * Новая упрощённая фабрика валидаторов
 * Заменяет старую ValidatorFactory на единый гибридный подход
 */
@Injectable()
export class UnifiedValidatorFactory {
  private validator: UnifiedHybridValidator | null = null;

  constructor(private readonly openaiService: OpenAiValidationService) {}

  /**
   * Получение единственного валидатора для всех категорий
   */
  getValidator(): UnifiedHybridValidator {
    if (!this.validator) {
      this.validator = new UnifiedHybridValidator(this.openaiService);
    }
    return this.validator;
  }

  /**
   * Метод для обратной совместимости со старой фабрикой
   */
  getValidatorForCategory(category: string): UnifiedHybridValidator {
    return this.getValidator();
  }

  /**
   * Валидация продуктов по категории
   */
  async validateProducts(products: any[], category: string): Promise<any[]> {
    // Группируем продукты по query
    const byQuery: Record<string, any[]> = {};
    for (const product of products) {
      const q = product.query || '';
      if (!byQuery[q]) byQuery[q] = [];
      byQuery[q].push(product);
    }
    // Для каждого query запускаем асинхронную валидацию батча
    const allResults = await Promise.all(
      Object.entries(byQuery).map(async ([query, items]) => {
        // Для каждого батча — асинхронная валидация
        const validator = this.getValidator();
        return validator.validateBatch(items, category);
      })
    );
    // Объединяем все результаты в один массив
    return allResults.flat();
  }

  /**
   * Простая валидация одного товара
   */
  validateSingleProduct(query: string, productName: string, category: string) {
    const validator = this.getValidator();
    return validator.validate(query, productName, category);
  }
} 