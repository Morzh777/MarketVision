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
    let norm = query.toLowerCase().trim();
    norm = norm.replace(/\s+/g, ' ').trim();
    norm = norm.replace(/rtx\s*(\d+)/i, 'rtx$1');
    norm = norm.replace(/(\d+)\s*k\s*f?/i, '$1k');
    norm = norm.replace(/(\d+)\s*x\s*(\d+)/i, '$1x$2');
    norm = norm.replace(/([a-z])\s*(\d+)/i, '$1$2');
    return norm;
  }
} 