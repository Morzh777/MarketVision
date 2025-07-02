import { WbApiClient } from '../api/wb-api.client';
import { BaseService } from './base.service';

export class MotherboardsService extends BaseService {
  constructor(wbApi: WbApiClient) {
    super(wbApi);
  }

  async getProducts() {
    const data = await this.wbApi.getMotherboards();
    // data — это массив SearchResult
    return this.mapApiResults(data);
  }


} 