import { BaseGrpcClient } from './base-grpc.client';

export class DbApiClient extends BaseGrpcClient<any> {
  constructor(serverAddress: string = 'localhost:50051') {
    super('proto/raw-product.proto', 'RawProductService', serverAddress);
  }

  async batchCreateProducts(products: any[]): Promise<{ inserted: number }> {
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);
      this.client.BatchCreateProducts({ products }, { deadline }, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
} 