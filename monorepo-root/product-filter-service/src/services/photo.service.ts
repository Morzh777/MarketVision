import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PhotoService {
  private readonly logger = new Logger(PhotoService.name);
  
  private readonly CONFIG = {
    PHOTO_TIMEOUT: 2000,
    USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  async findProductPhoto(productId: string): Promise<string | null> {
    const id = String(productId);
    
    // 🧪 В test mode не ищем фото (тестовые ID некорректны)
    if (id.length < 6) {
      this.logger.debug(`📷 Test mode: пропускаем поиск фото для короткого ID ${id}`);
      return null;
    }
    
    this.logger.debug(`📷 Ищем фото для ${id}...`);
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

  /**
   * Обрабатывает URL фото от WB API
   * Заменяет невалидные ссылки на рабочие
   */
  async processImageUrl(imageUrl: string): Promise<string> {
    try {
      // Если это уже валидная ссылка - возвращаем как есть
      if (imageUrl.includes('basket-') && imageUrl.includes('.wbbasket.ru')) {
        this.logger.debug(`📷 URL уже валидный: ${imageUrl}`);
        return imageUrl;
      }
      
      // Если это ссылка на images.wbstatic.net - пытаемся найти валидную
      if (imageUrl.includes('images.wbstatic.net')) {
        this.logger.debug(`📷 Обрабатываем WB static URL: ${imageUrl}`);
        
        // Извлекаем ID из URL
        const idMatch = imageUrl.match(/\/(\d+)\//);
        if (idMatch) {
          const productId = idMatch[1];
          const validUrl = await this.findPhotoUrl(productId);
          if (validUrl) {
            this.logger.log(`📷 Найдена валидная ссылка: ${validUrl}`);
            return validUrl;
          }
        }
      }
      
      // Если не удалось обработать - возвращаем оригинальный URL
      this.logger.warn(`📷 Не удалось обработать URL: ${imageUrl}`);
      return imageUrl;
      
    } catch (error) {
      this.logger.error(`📷 Ошибка обработки URL: ${error.message}`);
      return imageUrl;
    }
  }
} 