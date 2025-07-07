import { Injectable } from '@nestjs/common';
import { fileLogger } from '../utils/logger';

@Injectable()
export class ProductGroupingService {
  groupAndSelectCheapest(products: any[], getModelKey: (product: any) => string): any[] {
    if (!products.length) return [];
    fileLogger.log(`Группировка ${products.length} продуктов...`);
    const groups = new Map<string, any[]>();
    for (const product of products) {
      const modelKey = getModelKey(product);
      if (!modelKey) continue;
      if (!groups.has(modelKey)) groups.set(modelKey, []);
      groups.get(modelKey)!.push(product);
    }
    const selectedProducts: any[] = [];
    for (const [modelKey, groupProducts] of groups) {
      // Логируем ключ и товары в группе
      fileLogger.log(`Группа: ${modelKey} | товары: ${groupProducts.map(p => `[id:${p.id}, price:${p.price}, source:${p.source}, query:${p.query}]`).join(' ')}`);
      if (!groupProducts.length) continue;
      if (groupProducts.length === 1) {
        selectedProducts.push(groupProducts[0]);
      } else {
        const cheapest = groupProducts.reduce((min, p) => p.price < min.price ? p : min);
        selectedProducts.push(cheapest);
      }
    }
    fileLogger.log(`Группировка завершена: ${selectedProducts.length} уникальных товаров`);
    return selectedProducts;
  }
} 