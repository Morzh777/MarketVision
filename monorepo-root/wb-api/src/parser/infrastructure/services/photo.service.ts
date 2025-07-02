import { Injectable, Logger } from '@nestjs/common';
import { PhotoService } from '../../domain/interfaces/wb-api.interface';
import { Product } from '../../domain/interfaces/parser.interfaces';
// import { ProductFilterClient } from '../../../grpc-clients/product-filter.client';
import * as process from 'process';

@Injectable()
export class PhotoServiceImpl implements PhotoService {
  private readonly logger = new Logger(PhotoServiceImpl.name);
  
  private readonly CONFIG = {
    PHOTO_TIMEOUT: 2000,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    PRIMARY_BASKETS: [21, 22, 23, 24],
  };

  // gRPC клиент для централизованного кэширования фотографий
  // private grpcClient = new ProductFilterClient(
  //   process.env.PRODUCT_FILTER_SERVICE_URL || 
  //   process.env.GRPC_FILTER_HOST || 
  //   'localhost:50051'
  // );

  async getProductPhoto(product: Product, category: string): Promise<string | null> {
    const id = String(product.id);
    
    // 🧪 В test mode не ищем фото (тестовые ID некорректны)
    if (id.length < 6) {
      this.logger.debug(`📷 Test mode: пропускаем поиск фото для короткого ID ${id}`);
      return null;
    }
    
    // Ищем новое фото (БЕЗ кэширования)
    this.logger.debug(`📷 Ищем новое фото для ${id}...`);
    const photoUrl = await this.findPhotoUrl(id);
    
    if (photoUrl) {
      this.logger.log(`📷 Найдено фото для ${id}: ${photoUrl}`);
    } else {
      this.logger.debug(`📷 Фото не найдено для ${id}`);
    }
    
    return photoUrl;
  }

  private async checkPhotoUrl(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.CONFIG.PHOTO_TIMEOUT);
      const response = await fetch(url, { 
        method: 'GET',
        headers: { 'User-Agent': this.CONFIG.USER_AGENT },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  private async findPhotoUrl(id: string): Promise<string | null> {
    const vol = Math.floor(parseInt(id) / 100000).toString();
    const part = Math.floor(parseInt(id) / 1000).toString();
    const searchOrder = this.generateBasketSearchOrder();
    const batchSize = 5;
    
    for (let i = 0; i < searchOrder.length; i += batchSize) {
      const batch = searchOrder.slice(i, i + batchSize);
      const promises = batch.map(async (basket) => {
        const url = `https://basket-${basket}.wbbasket.ru/vol${vol}/part${part}/${id}/images/big/1.webp`;
        const exists = await this.checkPhotoUrl(url);
        return { basket, url, exists };
      });
      const results = await Promise.all(promises);
      const found = results.find(r => r.exists);
      if (found) {
        this.logger.log(`📷 Найдено фото для ${id}: ${found.url}`);
        return found.url;
      }
    }
    
    this.logger.debug(`📷 Фото не найдено для ${id}`);
    return null;
  }

  private generateBasketSearchOrder(): number[] {
    const min = 1;
    const max = 50;
    const start = 21;
    const order = [start];
    let left = start - 1;
    let right = start + 1;
    while (left >= min || right <= max) {
      if (left >= min) order.push(left--);
      if (right <= max) order.push(right++);
    }
    return order;
  }

  // Cleanup gRPC соединения
  onModuleDestroy() {
    // this.grpcClient.close();
  }
} 