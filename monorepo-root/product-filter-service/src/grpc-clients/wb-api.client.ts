import { BaseGrpcClient } from './base-grpc.client';

export class WbApiClient extends BaseGrpcClient<any> {
  private serverAddress: string;

  constructor(serverAddress: string) {
    super('proto/raw-product.proto', 'RawProductService', serverAddress);
    this.serverAddress = serverAddress;
  }

  async filterProducts(request: any): Promise<any> {
    // Добавляем токен аутентификации
    const authToken = process.env.WB_API_TOKEN;
    if (!authToken) {
      throw new Error('WB_API_TOKEN environment variable is not set');
    }
    
    const requestWithAuth = {
      query: request.query,
      category: request.category,
      platform_id: request.platform_id || request.extra?.platform_id,
      exactmodels: request.exactmodels,
      auth_token: authToken
    };
    
    console.log('📤 Отправляем запрос:', {
      query: requestWithAuth.query,
      category: requestWithAuth.category,
      platform_id: requestWithAuth.platform_id,
      exactmodels: requestWithAuth.exactmodels
    });

    return new Promise((resolve, reject) => {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + 30);
      
      console.log('🚀 Отправляем gRPC запрос на:', this.serverAddress);
      
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