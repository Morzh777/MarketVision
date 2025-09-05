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
  searchProducts(
    query: string,
    xsubject: number,
    exactmodels?: string,
  ): Promise<Product[]>;
}

@Injectable()
export class WildberriesApiClientImpl implements WildberriesApiClient {
  private readonly logger = new Logger(WildberriesApiClientImpl.name);

  private readonly CONFIG = {
    WB_API_URL: 'https://search.wb.ru/exactmatch/ru/common/v13/search',
    API_TIMEOUT: 5000,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  /**
   * Выполняет поиск товаров через API Wildberries
   *
   * @param query - Поисковый запрос для поиска товаров
   * @param xsubject - ID категории товаров в системе WB (например, 3690 для материнских плат)
   * @param exactmodels - Точные модели для фильтрации (опционально)
   * @returns Promise<Product[]> - Массив найденных товаров или пустой массив при ошибке
   *
   * @example
   * ```typescript
   * const products = await client.searchProducts("RTX 4090", 3690, "100973685");
   * console.log(`Найдено ${products.length} товаров`);
   * ```
   *
   * @throws {Error} При ошибке HTTP запроса или некорректном ответе API
   */
  async searchProducts(
    query: string,
    xsubject: number,
    exactmodels?: string,
  ): Promise<Product[]> {
    let url = `${this.CONFIG.WB_API_URL}?ab_testid=pricefactor_2&appType=64&curr=rub&dest=-1185367&hide_dtype=13&lang=ru&page=1&query=${encodeURIComponent(query)}&resultset=catalog&sort=priceup&spp=30&suppressSpellcheck=false&xsubject=${xsubject}`;

    // Добавляем exactmodels как есть из базы данных
    if (exactmodels) {
      url += `&${exactmodels}`;
    }

    this.logger.log(`[WB-API] FINAL URL: ${url}`);

    const response = await fetch(url, {
      headers: { 'User-Agent': this.CONFIG.USER_AGENT },
      signal: AbortSignal.timeout(this.CONFIG.API_TIMEOUT),
    });

    if (!response.ok) {
      throw new Error(`WB API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      data?: {
        products?: Product[];
      };
    };

    if (!data || !data.data || !Array.isArray(data.data.products)) {
      this.logger.warn(`Неожиданный ответ WB API: ${JSON.stringify(data)}`);
      return [];
    }

    return data.data.products;
  }
}
