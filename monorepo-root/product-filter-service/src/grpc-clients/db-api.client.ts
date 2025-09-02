import { BaseGrpcClient } from './base-grpc.client';

export class DbApiClient extends BaseGrpcClient<any> {
  constructor(serverAddress: string) {
    super('proto/raw-product.proto', 'RawProductService', serverAddress);
  }

  async batchCreateProducts(payload: { products: any[], market_stats?: any }): Promise<{ inserted: number }> {
    console.log('[TO DB-API] batchCreateProducts payload:', JSON.stringify(payload, null, 2));
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);
      this.client.BatchCreateProducts(payload, { deadline }, (error: any, response: any) => {
        if (error) {
          console.error('[FROM DB-API] Error:', error.message);
          reject(error);
        } else {
          console.log('[FROM DB-API] Success:', {
            inserted: response.inserted,
            history: response.history,
            products_count: payload.products.length,
            market_stats: payload.market_stats ? 'saved' : 'none'
          });
          resolve(response);
        }
      });
    });
  }

  async getCategoryConfig(categoryKey: string): Promise<any> {
    console.log('[TO DB-API] getCategoryConfig categoryKey:', categoryKey);
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);
      this.client.GetCategoryConfig({ categoryKey }, { deadline }, (error: any, response: any) => {
        if (error) {
          console.error('[FROM DB-API] Error:', error.message);
          reject(error);
        } else {
          console.log('[FROM DB-API] Success:', response);
          console.log('[FROM DB-API] Response category:', response.category);
          console.log('[FROM DB-API] Response category ozon_id:', response.category?.ozon_id);
          console.log('[FROM DB-API] Response category wb_id:', response.category?.wb_id);
          console.log('[FROM DB-API] Response keys:', Object.keys(response));
          console.log('[FROM DB-API] Response category keys:', response.category ? Object.keys(response.category) : 'no category');
          resolve(response);
        }
      });
    });
  }

  async getQueriesForCategory(categoryKey: string): Promise<any> {
    console.log('[TO DB-API] getQueriesForCategory categoryKey:', categoryKey);
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);
      this.client.GetQueriesForCategory({ categoryKey }, { deadline }, (error: any, response: any) => {
        if (error) {
          console.error('[FROM DB-API] Error:', error.message);
          reject(error);
        } else {
          console.log('[FROM DB-API] Success:', response);
          console.log('[FROM DB-API] Queries response:', response.queries);
          console.log('[FROM DB-API] First query platform_id:', response.queries?.[0]?.platform_id);
          resolve(response);
        }
      });
    });
  }

  async getAllCategories(): Promise<any> {
    console.log('[TO DB-API] getAllCategories');
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 10);
      this.client.GetAllCategories({}, { deadline }, (error: any, response: any) => {
        if (error) {
          console.error('[FROM DB-API] Error:', error.message);
          reject(error);
        } else {
          console.log('[FROM DB-API] Success:', response);
          resolve(response);
        }
      });
    });
  }
} 