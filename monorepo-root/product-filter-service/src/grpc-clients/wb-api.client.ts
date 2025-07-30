import { BaseGrpcClient } from './base-grpc.client';

export class WbApiClient extends BaseGrpcClient<any> {
  constructor(serverAddress: string = process.env.WB_API_URL || 'localhost:3000') {
    super('proto/raw-product.proto', 'RawProductService', serverAddress);
  }

  async filterProducts(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);
      this.client.GetRawProducts(request, { deadline }, (error: any, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  }
} 