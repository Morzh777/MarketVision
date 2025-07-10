import { Injectable } from '@nestjs/common';
import { fileLogger } from '../utils/logger';
import { EnhancedPriceAnomalyService } from './enhanced-price-anomaly.service';

@Injectable()
export class ProductGroupingService {
  constructor(private readonly priceAnomalyService: EnhancedPriceAnomalyService) {}

  groupAndSelectCheapest(products: any[], getModelKey: (product: any) => string, category: string = 'unknown'): any[] {
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
      const prices = groupProducts.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      fileLogger.log(`Группа: ${modelKey} | товары: ${groupProducts.map(p => `[id:${p.id}, price:${p.price}, source:${p.source}, query:${p.query}]`).join(' ')} | min: ${minPrice}₽, max: ${maxPrice}₽, avg: ${avgPrice}₽`);
      if (!groupProducts.length) continue;
      // Сортируем по цене по возрастанию
      const sortedByPrice = [...groupProducts].sort((a, b) => a.price - b.price);
      // Проверка на аномалию цены с помощью нового сервиса
      const anomalyResult = this.priceAnomalyService.detectAnomalies(sortedByPrice, category);
      let anomalyIds = anomalyResult.anomalousProducts.map(a => a.id);
      // Если есть аномалии — помечаем их
      sortedByPrice.forEach(product => {
        if (anomalyIds.includes(product.id)) {
          product.toAI = true;
          product.reason = 'price-anomaly';
        }
      });
      // Новый best practice: если самый дешёвый валидный не-аксессуар — всегда включаем
      const cheapest = sortedByPrice[0];
      const { isAccessoryByCategory } = require('../utils/is-accessory');
      if (
        cheapest &&
        !isAccessoryByCategory(cheapest.name, category) &&
        (cheapest.validationReason?.includes('validated') || cheapest.isValid)
      ) {
        fileLogger.log(`[ProductGroupingService] 🚩 Включаю самый дешёвый валидный не-аксессуар: ${cheapest.name} (id:${cheapest.id}, price:${cheapest.price}, validationReason:${cheapest.validationReason}, category:${category})`);
        // Сброс флагов аномалии!
        cheapest.toAI = false;
        if (cheapest.reason === 'price-anomaly') delete cheapest.reason;
        selectedProducts.push(cheapest);
        continue;
      }
      // Фильтруем только не аномальные сначала
      let selected = null;
      for (const product of sortedByPrice) {
        // Если товар не аномалия — сразу возвращаем
        if (!product.toAI) {
          selected = product;
          break;
        }
      }
      // Если все аномальные — берём первый аномальный (он пойдёт в AI)
      if (!selected && sortedByPrice.length > 0) {
        selected = sortedByPrice[0];
      }
      if (selected) {
        selectedProducts.push(selected);
      }
    }
    fileLogger.log(`Группировка завершена: ${selectedProducts.length} уникальных товаров`);
    return selectedProducts;
  }
} 