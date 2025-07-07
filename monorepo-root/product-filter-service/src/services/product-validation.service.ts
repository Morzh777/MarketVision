import { Injectable } from '@nestjs/common';
import { ValidatorFactory } from '../validators/validator.factory';
import { fileLogger } from '../utils/logger';

@Injectable()
export class ProductValidationService {
  filterValid(products: any[], category: string): any[] {
    if (!products.length) return [];
    fileLogger.log(`Валидация ${products.length} продуктов для категории ${category}`);
    const validProducts: any[] = [];
    for (const product of products) {
      const validator = ValidatorFactory.getValidator(category);
      let isValid = false;
      let reason = '';
      if (validator) {
        const result = validator.validate(product.query, product.name);
        isValid = result.isValid;
        reason = result.reason;
      } else {
        // Fallback: простая проверка
        isValid = (product.name || '').toUpperCase().includes((product.query || '').toUpperCase());
        reason = isValid ? 'Простая проверка: соответствует' : 'Простая проверка: не соответствует';
      }
      if (isValid) {
        validProducts.push(product);
        fileLogger.log(`✅ Прошел валидацию: ${product.name} (${product.source})`);
      } else {
        fileLogger.log(`❌ Не прошел валидацию: ${product.name} - ${reason} (${product.source})`);
      }
    }
    fileLogger.log(`Результат валидации: ${validProducts.length}/${products.length} продуктов прошли`);
    return validProducts;
  }
} 