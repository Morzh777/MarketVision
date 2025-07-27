import { testProductsData, mockDeals, recommendedPrice2024 } from '../testData';
import { priceHistoryMap } from '../testPriceHistoryData';
import type { Product, PriceHistory, Timeframe, Deal } from '../types/market';

export class ProductService {
  static getProducts(): Product[] {
    return testProductsData;
  }

  static getDeals(): Deal[] {
    return mockDeals;
  }

  static getPriceHistory(productId: string, timeframe: Timeframe): PriceHistory {
    return priceHistoryMap[productId]?.[timeframe] || [];
  }

  static getRecommendedPrice(productId: string): number | null {
    return recommendedPrice2024[productId] || null;
  }

  static findProductByName(name: string): Product | undefined {
    return this.getProducts().find((item) => item.name === name);
  }
} 