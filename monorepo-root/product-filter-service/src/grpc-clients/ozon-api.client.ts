import { BaseGrpcClient } from './base-grpc.client';
import { environmentConfig } from '../config/environment.config';

export class OzonApiClient extends BaseGrpcClient<any> {
  constructor(serverAddress: string = 'localhost:3002') {
    super('proto/raw-product.proto', 'RawProductService', serverAddress);
  }

  async filterProducts(request: any): Promise<any> {
    // Добавляем токен аутентификации
    const authToken = process.env.OZON_API_TOKEN;
    if (!authToken) {
      throw new Error('OZON_API_TOKEN environment variable is not set');
    }
    
    const requestWithAuth = {
      ...request,
      auth_token: authToken
    };
    
    console.log('📤 Отправляем запрос:', {
      query: requestWithAuth.query,
      category: requestWithAuth.category
    });

    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);
      
      console.log('🚀 Отправляем gRPC запрос на:', 'localhost:3002');
      
      this.client.GetRawProducts(requestWithAuth, { deadline }, (error: any, response: any) => {
        if (error) {
          console.log('❌ gRPC ошибка:', error.message, error.code);
          reject(error);
        } else {
          console.log('✅ gRPC ответ получен');
          resolve(response);
        }
      });
    });
  }
} 