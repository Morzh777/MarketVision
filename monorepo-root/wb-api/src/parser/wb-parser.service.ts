import { Injectable, Logger, Inject } from '@nestjs/common';
import { WildberriesApiClientImpl } from '../wb-api.client';
import { RawProduct } from '../types/raw-product.interface';

interface WildberriesProduct {
  id: number;
  name: string;
  sizes: Array<{
    price?: {
      product: number;
    };
  }>;
  pics?: string;
}

interface WildberriesApiClient {
  searchProducts(query: string, xsubject: number): Promise<WildberriesProduct[]>;
}

@Injectable()
export class WbParserService {
  private readonly logger = new Logger(WbParserService.name);

  constructor(
    @Inject('WB_API_CLIENT') 
    private readonly wbApiClient: WildberriesApiClient = new WildberriesApiClientImpl()
  ) {}

  async parseProducts(query: string, category: string): Promise<RawProduct[]> {
    try {
      this.logger.log(`🔍 Парсинг WB: ${query} (${category})`);
      
      const xsubject = this.validateAndParseCategory(category);
      
      const products = await this.wbApiClient.searchProducts(query, xsubject);
      
      if (!products || products.length === 0) {
        this.logger.log(`⚠️ "${query}": товары не найдены`);
        return [];
      }

      const rawProducts = products.map(product => this.mapToRawProduct(product, category, query));

      this.logger.log(`✅ Найдено ${rawProducts.length} продуктов`);
      return rawProducts;

    } catch (error) {
      this.logger.error(`❌ Ошибка парсинга: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      return [];
    }
  }

  private validateAndParseCategory(category: string): number {
    const xsubject = parseInt(category, 10);
    
    if (isNaN(xsubject)) {
      throw new Error(`Неверный xsubject: ${category}. Должно быть числом.`);
    }
    
    return xsubject;
  }

  private mapToRawProduct(product: WildberriesProduct, category: string, query: string): RawProduct {
    return {
      id: product.id.toString(),
      name: product.name,
      price: this.extractProductPrice(product),
      image_url: this.buildProductImageUrl(product),
      product_url: `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`,
      category,
      source: 'wb',
      query
    };
  }

  private extractProductPrice(product: WildberriesProduct): number {
    if (!Array.isArray(product.sizes) || product.sizes.length === 0) {
      return 0;
    }
    
    const prices = product.sizes
      .map(size => size.price?.product)
      .filter((price): price is number => typeof price === 'number' && price > 0)
      .map(price => price / 100); // Конвертация в рубли
    
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  private buildProductImageUrl(product: WildberriesProduct): string {
    if (!product.pics) {
      return '';
    }
    return `https://images.wbstatic.net/c516x688/${product.pics}.jpg`;
  }
} 