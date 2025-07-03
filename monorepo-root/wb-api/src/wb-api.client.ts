import { Injectable, Logger } from '@nestjs/common';

// Упрощенные интерфейсы
interface Product {
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
  searchProducts(query: string, xsubject: number): Promise<Product[]>;
}

@Injectable()
export class WildberriesApiClientImpl implements WildberriesApiClient {
  private readonly logger = new Logger(WildberriesApiClientImpl.name);
  
  private readonly CONFIG = {
    WB_API_URL: 'https://search.wb.ru/exactmatch/ru/common/v13/search',
    API_TIMEOUT: 5000,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  async searchProducts(query: string, xsubject: number): Promise<Product[]> {
    const url = `${this.CONFIG.WB_API_URL}?ab_testid=pricefactor_2&appType=64&curr=rub&dest=-1185367&hide_dtype=13&lang=ru&page=1&query=${encodeURIComponent(query)}&resultset=catalog&sort=priceup&spp=30&suppressSpellcheck=false&xsubject=${xsubject}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': this.CONFIG.USER_AGENT },
      signal: AbortSignal.timeout(this.CONFIG.API_TIMEOUT),
    });
    
    if (!response.ok) {
      throw new Error(`WB API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data || !data.data || !Array.isArray(data.data.products)) {
      this.logger.warn(`Неожиданный ответ WB API: ${JSON.stringify(data)}`);
      return [];
    }
    
    return data.data.products;
  }
} 