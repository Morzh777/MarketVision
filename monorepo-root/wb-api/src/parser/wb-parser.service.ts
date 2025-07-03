import { Injectable, Logger } from '@nestjs/common';
import { WildberriesApiClientImpl } from '../wb-api.client';
import { RawProduct } from '../types/raw-product.interface';

@Injectable()
export class WbParserService {
  private readonly logger = new Logger(WbParserService.name);
  private readonly wbApiClient = new WildberriesApiClientImpl();

  async parseProducts(query: string, category: string): Promise<RawProduct[]> {
    try {
      this.logger.log(`🔍 Парсинг WB: ${query} (${category})`);
      
      // Используем category как xsubject ID (например, "3690" для motherboards)
      const xsubject = parseInt(category, 10);
      
      if (isNaN(xsubject)) {
        this.logger.warn(`⚠️ Неверный xsubject: ${category}`);
        return [];
      }
      
      const products = await this.wbApiClient.searchProducts(query, xsubject);
      
      if (!products || products.length === 0) {
        this.logger.log(`⚠️ "${query}": товары не найдены`);
        return [];
      }

      const rawProducts = products.map(product => ({
        id: product.id.toString(),
        name: product.name,
        price: this.getProductPrice(product),
        image_url: this.getProductImageUrl(product),
        product_url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
        category,
        source: 'wb',
        query
      }));

      this.logger.log(`✅ Найдено ${rawProducts.length} продуктов`);
      return rawProducts;

    } catch (error) {
      this.logger.error(`❌ Ошибка парсинга: ${error.message}`);
      return [];
    }
  }

  private getProductPrice(product: any): number {
    if (!Array.isArray(product.sizes) || !product.sizes.length) {
      return 0;
    }
    
    const prices = product.sizes
      .map((s: any) => s.price?.product / 100)
      .filter((price: number) => price && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  private getProductImageUrl(product: any): string {
    if (!product.pics) {
      return '';
    }
    return `https://images.wbstatic.net/c516x688/${product.pics}.jpg`;
  }
} 