import { WbApiClient } from '../api/wb-api.client';
import { BaseService } from './base.service';

export class VideocardsService extends BaseService {
  constructor(wbApi: WbApiClient) {
    super(wbApi);
  }

  async getProducts() {
    try {
      const data = await this.wbApi.getVideocards();
      return this.mapApiResults(data);
    } catch (error) {
      console.error('❌ Ошибка в VideocardsService.getProducts():', error);
      return [];
    }
  }


} 