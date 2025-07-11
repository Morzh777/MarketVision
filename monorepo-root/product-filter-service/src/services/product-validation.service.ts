import { Injectable } from '@nestjs/common';
import { UnifiedHybridValidator } from '../validation.product/unified-hybrid.validator';
import { groupAndValidateByQuery, ProductCategory } from '../validation.product/utils/validation-utils';

@Injectable()
export class ProductValidationService {
  constructor(private readonly validator: UnifiedHybridValidator) {}

  async validateProducts(products: any[], category: ProductCategory) {
    return groupAndValidateByQuery(this.validator, products, category);
  }

  async validateSingleProduct(query: string, productName: string, category: ProductCategory) {
    // Для одиночной валидации добавляем обязательные поля OpenAiProduct
    const [result] = await this.validator.validateBatch([
      { query, name: productName, id: 'single', price: 0 }
    ], category);
    return result;
  }
} 