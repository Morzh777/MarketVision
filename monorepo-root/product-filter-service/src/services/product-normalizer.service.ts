import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductNormalizerService {
  getModelKey(product: any): string {
    const query = product.query || '';
    if (query) {
      return this.normalizeQuery(query);
    }
    return null;
  }

  normalizeQuery(query: string): string {
    // Используем ту же логику, что и в валидаторах
    return query.toLowerCase().replace(/\s+/g, '');
  }
} 