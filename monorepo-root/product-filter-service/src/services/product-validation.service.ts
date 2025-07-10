import { Injectable } from '@nestjs/common';
import { UnifiedValidatorFactory } from '../validators/unified-validator.factory';
import { fileLogger } from '../utils/logger';
import { OpenAiValidationService } from './openai.service';

@Injectable()
export class ProductValidationService {
  constructor(private readonly openaiService: OpenAiValidationService) {}

  filterValid(products: any[], category: string): any[] {
    if (!products.length) return [];
    fileLogger.log(`Валидация ${products.length} продуктов для категории ${category}`);
    const validProducts: any[] = [];
    const validatorFactory = new UnifiedValidatorFactory(this.openaiService);
    
    for (const product of products) {
      let isValid = false;
      let reason = '';
      
      try {
        const result = validatorFactory.validateSingleProduct(product.query, product.name, category);
        isValid = result.isValid;
        reason = result.reason || '';
      } catch (error) {
        // Fallback: простая проверка
        isValid = (product.name || '').toUpperCase().includes((product.query || '').toUpperCase());
        reason = isValid ? 'Простая проверка: соответствует' : 'Простая проверка: не соответствует';
        fileLogger.log(`⚠️ Ошибка валидации для ${product.name}: ${error?.message || error}, используем fallback`);
      }
      
      if (isValid) {
        validProducts.push({ ...product, isValid, validationReason: reason });
        fileLogger.log(`✅ Прошел валидацию: ${product.name} (${product.source}, price: ${product.price}) - ${reason}`);
      } else {
        fileLogger.log(`❌ Не прошел валидацию: ${product.name} (price: ${product.price}) - ${reason} (${product.source})`);
      }
    }
    fileLogger.log(`Результат валидации: ${validProducts.length}/${products.length} продуктов прошли`);
    return validProducts;
  }
} 