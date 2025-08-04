import { Injectable } from '@nestjs/common';
import { fileLogger } from '../utils/logger';

@Injectable()
export class ProductGroupingService {
  constructor() {}

  groupAndSelectCheapest(products: any[], getModelKey: (product: any) => string, category: string = 'unknown'): any[] {
    if (!products.length) return [];
    // fileLogger.log(`Группировка ${products.length} продуктов...`);
    const groups = new Map<string, any[]>();
    for (const product of products) {
      const modelKey = getModelKey(product);
      if (!modelKey) continue;
      if (!groups.has(modelKey)) groups.set(modelKey, []);
      groups.get(modelKey)!.push(product);
    }
    const selectedProducts: any[] = [];
    for (const [modelKey, groupProducts] of groups) {
      if (!groupProducts.length) continue;
      
      // Сортируем по цене по возрастанию
      const sortedByPrice = [...groupProducts].sort((a, b) => a.price - b.price);
      
      // Простая статистика цен
      const prices = sortedByPrice.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      
      // Краткий лог по группе
      fileLogger.log(`📊 Группа "${modelKey}": ${groupProducts.length} товаров, цена ${minPrice}₽-${maxPrice}₽`);
      
      // Добавляем простую статистику ко всем товарам группы
      sortedByPrice.forEach(product => {
        product.marketStats = {
          min: minPrice,
          max: maxPrice,
          mean: avgPrice,
          median: avgPrice,
          iqr: [avgPrice, avgPrice]
        };
      });
      
      // Берем самый дешевый товар
      const cheapest = sortedByPrice[0];
      if (cheapest) {
        selectedProducts.push(cheapest);
      }
    }
    // fileLogger.log(`Группировка завершена: ${selectedProducts.length} уникальных товаров`);
    return selectedProducts;
  }
} 