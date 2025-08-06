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
} 